import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Approver, Team, UserRequest, UserRequestItem } from "../Interfaces/TTLInterfaces";

let sp: SPFI;
export const getSP = (context: WebPartContext): SPFI => {
  if (!sp) {
    sp = spfi(context.pageContext.web.absoluteUrl).using(SPFx(context));
  }
  return sp;
};

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

export const getRequestsData = async (context: WebPartContext): Promise<UserRequest[]> => {
    try {
        const response = await context.spHttpClient.get(
            `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_Requests')/items?$select=Id,Title,TotalCost,Goal,Project,RequestStatus,OData__Comments,Author/Id,Author/Title,Author/EMail,RequestItemID/Id,ApproverID/Id,ApproverID/Title,TeamID/Id,TeamID/Title&$expand=RequestItemID,Author,ApproverID,TeamID`,
            SPHttpClient.configurations.v1
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.value as UserRequest[];
    } catch (error) {
        console.error('Error fetching requests data:', error);
        return [];
    }
};

const mapSharePointItemToUserRequestItem = (sharePointItem: any): UserRequestItem => {
    let usersLicenseValue = '/';

    if (sharePointItem.UsersLicense) {
        usersLicenseValue = sharePointItem.UsersLicense
            .map((user: any) => user.Title || user.Name || `User ${user.Id}`)
            .filter(Boolean)
            .join(', ');
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
        UsersLicense: [usersLicenseValue],
        Processed: sharePointItem.Processed || false,
        ChangedByHR: sharePointItem.ChangedByHR || false
    };
};

export const getRequestItemsByRequestId = async (context: WebPartContext, requestId: number): Promise<UserRequestItem[]> => {
    // First get the request to find linked item IDs
    const requestResponse = await context.spHttpClient.get(
        `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_Requests')/items(${requestId})?$select=RequestItemID/Id&$expand=RequestItemID`,
        SPHttpClient.configurations.v1
    );
    
    if (!requestResponse.ok) {
        throw new Error(`HTTP error! status: ${requestResponse.status}`);
    }
    
    const requestData = await requestResponse.json();
    const requestItemIds = requestData.RequestItemID?.map((item: { Id: any; }) => item.Id) || [];
    
    if (requestItemIds.length === 0) {
        return [];
    }

    // Build a filter to get all items at once
    const filter = requestItemIds.map((id: any) => `Id eq ${id}`).join(' or ');
    
    // Get all items with user expansion in one call. Include UsersLicense expanded fields
    const requestUrl = `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_RequestItem')/items?$filter=${encodeURIComponent(filter)}&$select=*,UsersLicense/Id,UsersLicense/Title&$expand=UsersLicense`;
    const response = await context.spHttpClient.get(requestUrl, SPHttpClient.configurations.v1);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const items = data.value.map((item: UserRequestItem) => mapSharePointItemToUserRequestItem(item));
    
    return items;
};

// Create a request item in the TTL_RequestItem list
export const createRequestItem = async (context: WebPartContext, item: UserRequestItem): Promise<number> => {
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

  const addResult = await list.items.add(listItemData);

    const maybeId = (addResult && (addResult.data?.Id ?? addResult.data?.ID ?? addResult.data?.id ?? addResult.Id ?? addResult.ID)) as number | undefined;
    if (!maybeId) {
        console.warn('createRequestItem: unexpected add result shape, returning 0', addResult);
        return 0;
    }
    return maybeId;
};

// Create a request in TTL_Requests and attach request items (by creating items and setting lookup)
export const createRequestWithItems = async (context: WebPartContext, request: any, items: any[], type: string): Promise<number> => {
    const sp = getSP(context);
    const requestsList = sp.web.lists.getByTitle('TTL_Requests');

    // Create the main request
    const reqAdd = await requestsList.items.add({
        Title: request.Title || '',
        Goal: request.Goal || '',
        Project: request.Project || '',
        TeamIDId: Number(request.TeamID) || null,
        ApproverIDId: Number(request.ApproverID) || null,
        RequestStatus: type || 'Saved',
        TotalCost: request.TotalCost || 0
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

  const maybeId = (addResult && (addResult.data?.Id ?? addResult.data?.ID ?? addResult.data?.id ?? addResult.Id ?? addResult.ID)) as number | undefined;
  if (!maybeId) {
    console.warn('createRequestItemForExistingRequest: unexpected add result shape, returning 0', addResult);
    return 0;
  }

  await updateRequestWithItemId(context, requestId, maybeId);
  return maybeId;
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
        TotalCost: requestData.TotalCost || 0
    };

    // Handle TeamID - it's an object with Id property
    if (requestData.TeamID?.Id) {
        updateData.TeamIDId = requestData.TeamID.Id;
    } else {
        updateData.TeamIDId = null;
    }

    // Handle ApproverID - it's an object with Id property
    if (requestData.ApproverID?.Id) {
        updateData.ApproverIDId = requestData.ApproverID.Id;
    } else {
        updateData.ApproverIDId = null;
    }

    await list.items.getById(requestId).update(updateData);
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

    await list.items.getById(itemId).update(listItemData);
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
        })) : []
    };
};

// Recalculate and update the total cost for a request
export const recalcAndUpdateRequestTotal = async (
  context: WebPartContext, 
  requestId: number
): Promise<number> => {
  const sp = getSP(context);
  
  try {
    // Get all items for this request
    const items = await getRequestItemsByRequestId(context, requestId);
    
    // Calculate total cost
    let totalCost = 0;
    for (const item of items) {
      const costValue = typeof item.Cost === 'string' 
        ? parseFloat(item.Cost.replace(/[^0-9.-]+/g, '')) 
        : Number(item.Cost);
      if (!isNaN(costValue)) {
        totalCost += costValue;
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

export const getApprovers = async (context: WebPartContext): Promise<Approver[]> => {
    try {
        const response: SPHttpClientResponse = await context.spHttpClient.get(
            `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_Approver')/items?$select=Id,TeamMember/Title,TeamMember/Id,BackUp/Title,BackUp/Id&$expand=TeamMember,BackUp`,
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

export const getApproverById = async (
  context: WebPartContext, 
  approverId: number,
): Promise<any> => {
  const sp = getSP(context);
  const approversList = sp.web.lists.getByTitle('TTL_Approver');

  try {
    const res = await approversList.items.getById(approverId).select('TeamMember/EMail').expand('TeamMember')();

    return res;

  } catch (error) {
    console.error('Error updating RequestItemID field:', error);
  }
};

export const getTeams = async (context: WebPartContext): Promise<Team[]> => {
    try {
        const response: SPHttpClientResponse = await context.spHttpClient.get(
            `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_Team')/items?$select=Id,Coach/Title,Coach/Id,Title&$expand=Coach`,
            SPHttpClient.configurations.v1
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.value as Team[];
    } catch (error) {
        console.error('Error fetching requests data:', error);
        return [];
    }
}

const getUserIds = async (sp: SPFI, users: any[]): Promise<number[]> => {
  const ids: number[] = [];
  
  for (const u of users) {
    try {
      // Check if we have a valid loginName
      let userIdentifier = u.loginName || u.principalName || u.email || u.key;
      
      // If we have an ID but no loginName, we might need to get the user details first
      if (!userIdentifier && u.id) {
        console.warn("User has ID but no loginName:", u);
        continue; // Skip this user or implement fallback logic
      }
      
      const ensured = await sp.web.ensureUser(userIdentifier);
      ids.push(ensured.Id);
      
    } catch (err) {
      console.error("Error ensuring user:", u, err);
      // Continue with other users instead of failing the entire operation
    }
  }
  
  return ids;
};


// FOR APPROVERS AND HR
export const updateRequestStatus = async (
  context: WebPartContext, 
  requestId: number, 
  requestStatus: string,
  comment: any,
): Promise<void> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_Requests');
  
  await list.items.getById(requestId).update({
    RequestStatus: requestStatus,
    OData__Comments: comment
  });
};
