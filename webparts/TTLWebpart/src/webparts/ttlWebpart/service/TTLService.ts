import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Approver, UserRequest, UserRequestItem, Budget } from "../Interfaces/TTLInterfaces";
import { calculateSoftwareLicenseCost } from "../Helpers/HelperFunctions";

// Define spfi for CRUD operations to lists
let sp: SPFI;
export const getSP = (context: WebPartContext): SPFI => {
  if (!sp) {
    sp = spfi(context.pageContext.web.absoluteUrl).using(SPFx(context));
  }
  return sp;
};

export const loadUserProfile = async (context: WebPartContext) => {
  const url = `${context.pageContext.web.absoluteUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  const profile = await response.json();

  const job = getProp(profile, "SPS-JobTitle");
  const dept = getProp(profile, "SPS-Department");

  const managerArray =
    profile.ExtendedManagers && profile.ExtendedManagers.length > 0
      ? profile.ExtendedManagers
      : null;

  const manager = managerArray[managerArray.length - 1]

  return {
    name: profile.DisplayName,
    email: profile.Email,
    title: job,
    department: dept,
    managerAccount: manager
  };
}

const getProp = (profile: any, key: string) => {
  const prop = profile.UserProfileProperties.find((p: { Key: string; }) => p.Key === key);
  return prop ? prop.Value : "";
}

export const getManager = async (context: WebPartContext, accountName: string) => {
  const encoded = encodeURIComponent(accountName);
  const url = `${context.pageContext.web.absoluteUrl}/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName='${encoded}')`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  const profile = await response.json();

  return {
    name: profile.DisplayName,
    email: profile.Email
  };
}

// Gets the data of the logged in user
export const getLoggedInUser = async (context: WebPartContext) => {
  try {
    const sp = getSP(context)
    const currentUser = await sp.web.currentUser();
    return currentUser;
  }
  catch {
    console.error('Could not find user')
    return undefined
  }
}

// Gets the groups of the logged in user
export const checkHR = async (context: WebPartContext): Promise<boolean> => {
  const response = await context.spHttpClient.get(
    `${context.pageContext.web.absoluteUrl}/_api/web/currentuser?$expand=groups`,
    SPHttpClient.configurations.v1
  );
  const data = await response.json();
  // If the user is a member of the site, they can see the HR dashboard button
  const userGroups =
    data.Groups?.map((grp: any) => grp.Title.toLowerCase()) || [];
  const isHR = userGroups.some((group: string) =>
    ["hr-be members", "hr-be owners"].some((role) =>
      group.includes(role)
    )
  );
  return isHR
};

// Get data of requests (including data from lookups)
export const getRequestsData = async (
  context: WebPartContext,
  orderBy?: string,
  filter?: string
): Promise<UserRequest[]> => {
  try {
    // Base query
    let apiUrl = `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_Requests')/items?$select=Id,Title,TotalCost,Goal,Project,SubmissionDate,ApprovedByCEO,RequestStatus,DeadlineDate,TeamCoachApproval,Author/Id,Author/Title,Author/EMail,RequestItemID/Id,ApproverID/Id,ApproverID/Title,Team&$expand=RequestItemID,Author,ApproverID`;

    // Add optional $orderby if provided
    if (orderBy) {
      apiUrl += `&$orderby=${encodeURIComponent(orderBy)}`;
    }
    // Add optional $filter if provided
    if (filter) {
      apiUrl += `&$filter=${encodeURIComponent(filter)}`;
    }

    const response = await context.spHttpClient.get(apiUrl, SPHttpClient.configurations.v1);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value as UserRequest[];
  } catch (error) {
    console.error("Error fetching requests data:", error);
    return [];
  }
};

// Map SharePoint item to UserRequestItem interface
const mapSharePointItemToUserRequestItem = (sharePointItem: any): UserRequestItem => {
  let usersLicense: any[] = [];

  if (sharePointItem.UsersLicense) {
    usersLicense = sharePointItem.UsersLicense.map((user: any) => ({
      Id: user.Id,
      Title: user.Title,
      EMail: user.EMail,
    }));
  }

  return {
    ID: sharePointItem.Id,
    Title: sharePointItem.Title || '',
    Provider: sharePointItem.Provider || '',
    Location: sharePointItem.Location || '',
    Link: sharePointItem.Link || sharePointItem.URL || '',
    StartDate: sharePointItem.StartDate || '',
    OData__EndDate: sharePointItem.OData__EndDate || '',
    RequestType: sharePointItem.RequestType || '',
    Cost: sharePointItem.Cost || '',
    Licensing: sharePointItem.Licensing || '',
    LicenseType: sharePointItem.LicenseType || '',
    UsersLicense: usersLicense,
    DocumentID: sharePointItem.DocumentID ? { Id: sharePointItem.DocumentID.Id, url: sharePointItem.DocumentID.url } : undefined,
    Processed: sharePointItem.Processed || false,
    ChangedByHR: sharePointItem.ChangedByHR || false,
  };
};

// Get all request items for a given request ID
export const getRequestItemsByRequestId = async (context: WebPartContext, requestId: number): Promise<UserRequestItem[]> => {
  // First get the request to find linked item IDs
  const requestResponse = await context.spHttpClient.get(
    `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_Requests')/items(${requestId})?$select=RequestItemID/Id&$expand=RequestItemID`,
    SPHttpClient.configurations.v1
  );

  if (!requestResponse.ok) {
    throw new Error(`HTTP error! status: ${requestResponse.status}`);
  }

  // Extract item IDs
  const requestData = await requestResponse.json();
  const requestItemIds = requestData.RequestItemID?.map((item: { Id: any; }) => item.Id) || [];

  if (requestItemIds.length === 0) {
    return [];
  }

  // Build a filter to get all items at once
  const filter = requestItemIds.map((id: any) => `Id eq ${id}`).join(' or ');

  // Get all items with user expansion in one call. Include UsersLicense expanded fields
  const requestUrl = `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_RequestItem')/items?$filter=${encodeURIComponent(filter)}&$select=*,UsersLicense/Id,UsersLicense/Title,UsersLicense/EMail,DocumentID/Id,DocumentID/Title&$expand=UsersLicense,DocumentID`;
  const response = await context.spHttpClient.get(requestUrl, SPHttpClient.configurations.v1);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const items = data.value.map((item: UserRequestItem) => mapSharePointItemToUserRequestItem(item));

  return items;
};

export const getDocumentGuidForRequestItem = async (
  context: WebPartContext,
  requestItemId: number
): Promise<string | null> => {
  const sp = getSP(context);

  // Get the lookup id from the request item
  const reqItem: any = await sp.web.lists
    .getByTitle('TTL_RequestItem')
    .items.getById(requestItemId)
    .select('DocumentID/Id')
    .expand('DocumentID')();

  const docId = reqItem?.DocumentID?.Id;
  if (!docId) return null;

  // Get the actual document's URL from TTL_Documents
  const docItem: any = await sp.web.lists
    .getByTitle('TTL_Documents')
    .items.getById(docId)
    .select('url')();

  return docItem?.url || null;
};

// Create a request item in the TTL_RequestItem list
export const createRequestItem = async (context: WebPartContext, item: UserRequestItem): Promise<number> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_RequestItem');

  // Ensure user IDs for UsersLicense field
  const userIds = await getUserIds(sp, item.UsersLicense || []);

  const listItemData: any = {
    Title: item.Title || '',
    Provider: item.Provider || '',
    Location: item.Location || '',
    Link: item.Link || '',
    StartDate: item.StartDate || null,
    OData__EndDate: item.OData__EndDate || null,
    RequestType: item.RequestType || '',
    Cost: item.Cost || '',
    Licensing: item.Licensing || '',
    LicenseType: item.LicenseType || '',
  };

  if (userIds.length > 0) {
    listItemData.UsersLicenseId = userIds;
  }

  const addResult = await list.items.add(listItemData);
  return addResult.Id
};

// Create a request in TTL_Requests and attach request items (by creating items and setting lookup)
export const createRequestWithItems = async (context: WebPartContext, request: any, items: any[], type: string): Promise<number> => {
  const sp = getSP(context);
  const requestsList = sp.web.lists.getByTitle('TTL_Requests');
  let submissionDate;
  if (type === 'Submitted') {
    submissionDate = new Date();
  } else {
    submissionDate = null;
  }

  // Create the main request
  const reqAdd = await requestsList.items.add({
    Title: request.Title || '',
    Goal: request.Goal || '',
    Project: request.Project || '',
    Team: request.Team || null,
    ApproverIDId: Number(request.ApproverID) || null,
    RequestStatus: type || 'Draft',
    TotalCost: request.TotalCost || 0,
    SubmissionDate: submissionDate,
    DeadlineDate: request.DeadlineDate,
  });

  const requestId = (reqAdd && (reqAdd.Id ?? reqAdd.ID)) as number | undefined;
  if (!requestId) {
    throw new Error('Failed to create request');
  }

  // For each item, create the item and then update it to set the lookup to the parent request
  const createdItemIds: number[] = [];
  for (const it of items) {
    const itemId = await createRequestItem(context, it);
    createdItemIds.push(itemId);

    await sp.web.lists.getByTitle('TTL_RequestItem').items.getById(itemId).update({
      RequestIDId: requestId
    });
  }

  // Update the main request with the linked items (if using a multi-lookup from request to items)
  try {
    const updateUrl = requestsList.items.getById(requestId);
    await updateUrl.update({ RequestItemIDId: createdItemIds });

  } catch (e) {
    console.warn('Could not update request with item references', e);
  }
  return requestId;
};

// Create a request item for an existing request
export const createRequestItemForExistingRequest = async (
  context: WebPartContext,
  requestId: number,
  item: UserRequestItem
): Promise<number> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_RequestItem');
  const userIds = await getUserIds(sp, item.UsersLicense || []);

  const listItemData: any = {
    Title: item.Title || '',
    Provider: item.Provider || '',
    Location: item.Location || '',
    Link: item.Link || '',
    StartDate: item.StartDate || null,
    OData__EndDate: item.OData__EndDate || null,
    RequestType: item.RequestType || '',
    Cost: item.Cost || '',
    Licensing: item.Licensing || '',
    LicenseType: item.LicenseType || '',
    RequestIDId: requestId,
  };

  if (userIds.length > 0) {
    listItemData.UsersLicenseId = userIds;
  }

  const addResult = await list.items.add(listItemData);
  const finalId = addResult.Id
  await updateRequestWithItemId(context, requestId, finalId);
  return finalId;
};

// Update the RequestItemID field in TTL_Requests with a new item ID
export const updateRequestWithItemId = async (
  context: WebPartContext,
  requestId: number,
  newItemId: number
): Promise<void> => {
  const sp = getSP(context);
  const requestsList = sp.web.lists.getByTitle('TTL_Requests');

  try {
    // First, get the current request to see existing item IDs
    const currentRequest = await requestsList.items.getById(requestId).select('RequestItemID/Id').expand('RequestItemID')();

    // Extract existing item IDs
    const existingItemIds = currentRequest.RequestItemID
      ? currentRequest.RequestItemID.map((item: any) => item.Id)
      : [];

    // Add the new item ID to the array
    const updatedItemIds = [...existingItemIds, newItemId];

    // Update the RequestItemID field with the complete array
    await requestsList.items.getById(requestId).update({
      RequestItemIDId: updatedItemIds
    });

  } catch (error) {
    console.error('Error updating RequestItemID field:', error);
    // Don't throw the error here - we don't want to fail the entire creation
    // because of the reverse lookup update
  }
};

// Update the main request in TTL_Requests
export const updateRequest = async (context: WebPartContext, requestId: number, requestData: UserRequest): Promise<void> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_Requests');

  const updateData: any = {
    Title: requestData.Title || '',
    Goal: requestData.Goal || '',
    Project: requestData.Project || '',
    TotalCost: requestData.TotalCost || 0,
  };

  // Handle Team - it's an object with Id property
  if (requestData.Team) {
    updateData.Team = requestData.Team;
  } else {
    updateData.Team = null;
  }

  // Handle ApproverID - it's an object with Id property
  if (requestData.ApproverID?.Id) {
    updateData.ApproverIDId = requestData.ApproverID.Id;
  } else {
    updateData.ApproverIDId = null;
  }

  await list.items.getById(requestId).update(updateData);
};

// Update only the DeadlineDate field for a request
export const updateRequestDeadline = async (
  context: WebPartContext,
  requestId: number,
  deadlineDate: string | Date | null
): Promise<void> => {
  const sp = getSP(context);
  const requestsList = sp.web.lists.getByTitle('TTL_Requests');

  try {
    await requestsList.items.getById(requestId).update({
      DeadlineDate: deadlineDate || null
    });
  } catch (error) {
    console.error('Error updating DeadlineDate for request:', error);
    throw error;
  }
};

// Update a request item in the TTL_RequestItem list
export const updateRequestItem = async (context: WebPartContext, itemId: number, item: UserRequestItem): Promise<void> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_RequestItem');
  const userIds = await getUserIds(sp, item.UsersLicense || []);

  const listItemData: any = {
    Title: item.Title || '',
    Provider: item.Provider || '',
    Location: item.Location || '',
    Link: item.Link || '',
    StartDate: item.StartDate || null,
    OData__EndDate: item.OData__EndDate || null,
    RequestType: item.RequestType || '',
    Cost: item.Cost || '',
    Licensing: item.Licensing || '',
    LicenseType: item.LicenseType || '',
  };

  if (userIds.length > 0) {
    listItemData.UsersLicenseId = userIds;
  }

  try {
    await list.items.getById(itemId).update(listItemData, "*");
  } catch (error: any) {
    if (error?.data?.responseBody?.value?.includes("Save Conflict") ||
      error?.message?.includes("Save Conflict")) {
      console.warn("SharePoint reported a false Save Conflict — item updated anyway.");
    } else {
      throw error;
    }
  }
};

// Get a single request item by ID
export const getRequestItem = async (context: WebPartContext, itemId: number): Promise<UserRequestItem> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_RequestItem');

  const item = await list.items.getById(itemId).select(
    'ID', 'Title', 'Provider', 'Location', 'Link', 'StartDate', 'OData__EndDate',
    'RequestType', 'Cost', 'Licensing', 'LicenseType', 'UsersLicense/Id', 'UsersLicense/Title', 'UsersLicense/LoginName'
  ).expand('UsersLicense')();

  return {
    ID: item.Id,
    Title: item.Title,
    Provider: item.Provider,
    Location: item.Location,
    Link: item.Link,
    StartDate: item.StartDate,
    OData__EndDate: item.OData__EndDate,
    RequestType: item.RequestType,
    Cost: item.Cost,
    Licensing: item.Licensing,
    LicenseType: item.LicenseType,
    UsersLicense: item.UsersLicense ? item.UsersLicense.map((user: any) => ({
      id: user.Id,
      title: user.Title,
      loginName: user.LoginName
    })) : [],
  };
};

// Recalculate and update the total cost for a request
export const recalcAndUpdateRequestTotal = async (
  context: WebPartContext,
  requestId: number,
): Promise<number> => {
  const sp = getSP(context);

  try {
    // Get all items for this request
    const items = await getRequestItemsByRequestId(context, requestId);

    // Calculate total cost
    let totalCost = 0;
    for (const item of items) {
      // If it's a software request
      if (items[0].RequestType === 'Software') {
        // Perform calculation for the yearly cost of the software license
        totalCost += calculateSoftwareLicenseCost({ Cost: Number(item.Cost), Licensing: item.Licensing, LicenseType: item.LicenseType, UsersLicense: item.UsersLicense })
      } else {
        // Otherwise just add up the costs
        totalCost += Number(item.Cost)
      }
    }

    // Update the request with the new total
    const requestsList = sp.web.lists.getByTitle('TTL_Requests');
    await requestsList.items.getById(requestId).update({
      TotalCost: totalCost
    });

    return totalCost;
  } catch (error) {
    console.error('Error recalculating total cost:', error);
    throw error;
  }
};

// Delete a request item from the TTL_RequestItem list
export const deleteRequestItem = async (context: WebPartContext, itemId: number): Promise<void> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_RequestItem');
  await list.items.getById(itemId).delete();
};

// Delete a request and all its items
export const deleteRequestWithItems = async (context: WebPartContext, requestId: number, itemIds: number[]): Promise<void> => {
  const sp = getSP(context);

  // First delete all associated items
  for (const itemId of itemIds) {
    try {
      await deleteRequestItem(context, itemId);
    } catch (error) {
      console.error(`Error deleting item ${itemId}:`, error);
    }
  }

  // Then delete the main request
  const requestsList = sp.web.lists.getByTitle('TTL_Requests');
  await requestsList.items.getById(requestId).delete();
};

// Get all approvers from the approvers list in SharePoint
export const getApprovers = async (context: WebPartContext): Promise<Approver[]> => {
  try {
    const response: SPHttpClientResponse = await context.spHttpClient.get(
      `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_Approver')/items?$select=Id,TeamCoach/Title,TeamCoach/Id,TeamCoach/EMail,PracticeLead/Title,PracticeLead/Id,PracticeLead/EMail,DeliveryDirector/Title,DeliveryDirector/Id,DeliveryDirector/EMail,CEO/Id,CEO/Title,CEO/EMail,Team0&$expand=TeamCoach,PracticeLead,DeliveryDirector,CEO`,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value as Approver[];
  } catch (error) {
    console.error('Error fetching requests data:', error);
    return [];
  }
}

// Get an approver from their id
export const getApproverById = async (
  context: WebPartContext,
  approverId: number,
): Promise<any> => {
  const sp = getSP(context);
  const approversList = sp.web.lists.getByTitle('TTL_Approver');

  try {
    const res = await approversList.items.getById(approverId).select('PracticeLead/EMail, PracticeLead/Title, TeamCoach/EMail, TeamCoach/Title').expand('PracticeLead, TeamCoach')();

    return res;

  } catch (error) {
    console.error('Error updating RequestItemID field:', error);
  }
};

const getUserIds = async (sp: SPFI, users: any[]): Promise<number[]> => {
  const ids: number[] = [];

  for (const u of users) {
    try {
      // Check if we have a valid loginName
      let userIdentifier = u.loginName || u.principalName || u.email || u.key;

      const ensured = await sp.web.ensureUser(userIdentifier);
      ids.push(ensured.Id);

    } catch (err) {
      console.error("Error ensuring user:", u, err);
      // Continue with other users instead of failing the entire operation
    }
  }

  return ids;
};

export const getBudgetforApprover = async (context: WebPartContext, teamCoachEmail: string, year: string): Promise<Budget | null> => {
  try {
    const sp = getSP(context);
    const list = sp.web.lists.getByTitle('TTL_Budget');

    const budgets: any[] = await list.items
      .select('*,TeamCoach/EMail,TeamCoach/Title')
      .expand('TeamCoach')
      .filter(`TeamCoach/EMail eq '${teamCoachEmail}' and Year eq '${year}'`)();

    if (budgets && budgets.length > 0) {
      const b = budgets[0];
      return {
        ID: b.Id,
        Title: b.Title,
        TeamCoach: {
          Id: b.TeamCoach?.Id,
          Title: b.TeamCoach?.Title,
          EMail: b.TeamCoach?.EMail
        },
        Team: b.Team,
        Budget: b.Budget || 0,
        Availablebudget: b.Availablebudget || 0,
        PendingBudget: b.PendingBudget || 0,
        Year: b.Year
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching budget for approver:', error);
    return null;
  }
};

// Get all budgets for team coaches under a specific practice lead
export const getBudgets = async (context: WebPartContext, year: string, isDeliveryDirector: boolean, loggedInEmail?: string): Promise<Budget[]> => {
  try {
    const sp = getSP(context);
    const approversList = sp.web.lists.getByTitle('TTL_Approver');
    let approvers: any[] = [];

    // If delivery director, return all approvers' team coaches
    if (isDeliveryDirector) {
      approvers = await approversList.items
        .select('*,TeamCoach/Id,TeamCoach/EMail,TeamCoach/Title')
        .expand('TeamCoach')();
    } else {
      // Load approvers with both TeamCoach and PracticeLead
      const allApprovers = await approversList.items
        .select('*,TeamCoach/Id,TeamCoach/EMail,TeamCoach/Title,PracticeLead/Id,PracticeLead/EMail,PracticeLead/Title')
        .expand('TeamCoach,PracticeLead')();

      if (!allApprovers || !allApprovers.length) return [];

      // If the caller email corresponds to a team coach,
      // then find all practice leads that this team coach is associated with and gather all team coaches
      // for those practice leads (i.e., "everyone who they share a practicelead with"). Also include the practice lead email.
      if (loggedInEmail && allApprovers.some(a => a.TeamCoach?.EMail === loggedInEmail)) {
        // practice lead that this team coach works under
        const loggedInEmails = Array.from(new Set(
          allApprovers
            .filter(a => a.TeamCoach?.EMail === loggedInEmail)
            .map(a => a.PracticeLead?.EMail)
            .filter((e): e is string => !!e)
        ));

        if (!loggedInEmails.length) return [];

        // approvers under the practice lead
        approvers = allApprovers.filter(a => loggedInEmails.includes(a.PracticeLead?.EMail));

        // also ensure practice lead email is included in the email list later
        loggedInEmails.forEach(pl => approvers.push({ TeamCoach: { EMail: pl }, _isPracticeLeadMarker: true }));
      } else if (loggedInEmail) {
        // standard practice lead flow: approvers where PracticeLead == loggedInEmail
        approvers = allApprovers.filter(a => a.PracticeLead?.EMail === loggedInEmail);
      } else {
        return [];
      }
    }

    if (!approvers.length) return [];

    const teamCoachEmails = Array.from(new Set(
      approvers
        .map(a => a.TeamCoach?.EMail)
        .filter((email): email is string => !!email)
    ));

    if (loggedInEmail) teamCoachEmails.push(loggedInEmail);

    if (!teamCoachEmails.length) return [];

    const budgetList = sp.web.lists.getByTitle('TTL_Budget');
    const filterConditions = teamCoachEmails
      .map(email => `(TeamCoach/EMail eq '${email}' and Year eq '${year}')`)
      .join(' or ');

    const budgets: any[] = await budgetList.items
      .select('*,TeamCoach/Id,TeamCoach/EMail,TeamCoach/Title')
      .expand('TeamCoach')
      .filter(filterConditions)();

    return budgets.map(b => ({
      ID: b.Id,
      Title: b.Title,
      TeamCoach: {
        Id: b.TeamCoach?.Id,
        Title: b.TeamCoach?.Title,
        EMail: b.TeamCoach?.EMail
      },
      Team: b.Team,
      Budget: b.Budget || 0,
      Availablebudget: b.Availablebudget || 0,
      PendingBudget: b.PendingBudget || 0,
      Year: b.Year
    }));
  } catch (error) {
    console.error('Error fetching budgets for practice lead:', error);
    return [];
  }
};

// Deduct an amount from a team coach's available budget
export const deductFromBudget = async (context: WebPartContext, budgetId: number, amount: number): Promise<void> => {
  try {
    const sp = getSP(context);
    const budgetList = sp.web.lists.getByTitle('TTL_Budget');

    // Get current budget
    const budget: any = await budgetList.items.getById(budgetId).select('Availablebudget')();
    const newAvailableBudget = budget.Availablebudget - amount;

    // Update the available budget
    await budgetList.items.getById(budgetId).update({
      Availablebudget: newAvailableBudget
    });
  } catch (error) {
    console.error('Error deducting from budget:', error);
    // Don't throw - we don't want budget deduction to fail the entire request completion
  }
}

// Add an amount to a team coach's budget
export const addToBudget = async (context: WebPartContext, budgetId: number, amount: number): Promise<void> => {
  try {
    const sp = getSP(context);
    const budgetList = sp.web.lists.getByTitle('TTL_Budget');

    // Get current budget
    const budget: any = await budgetList.items.getById(budgetId).select('Availablebudget')();
    const newAvailableBudget = budget.Availablebudget + amount;

    // Update the available budget
    await budgetList.items.getById(budgetId).update({
      Availablebudget: newAvailableBudget
    });
  } catch (error) {
    console.error('Error deducting from budget:', error);
    // Don't throw - we don't want budget deduction to fail the entire request completion
  }
}

// Update the status of a request
// Also add a comment to the request if one was provided
export const updateRequestStatus = async (
  context: WebPartContext,
  requestId: number,
  requestStatus: string,
  submissionDate?: Date,
  setApprovedByCEO?: boolean,
): Promise<void> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_Requests');

  // First update the request status
  await list.items.getById(requestId).update({
    RequestStatus: requestStatus,
    SubmissionDate: submissionDate,
    ApprovedByCEO: setApprovedByCEO
  });
};

export const updateTeamCoachApproval = async (context: WebPartContext, requestId: number, decision: string) => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_Requests');

  await list.items.getById(requestId).update({TeamCoachApproval: decision})
}
