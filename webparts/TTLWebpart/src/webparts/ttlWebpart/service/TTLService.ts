import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { UserRequest, UserRequestItem } from "../Interfaces/TTLInterfaces";

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
        const response: SPHttpClientResponse = await context.spHttpClient.get(
            `${context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('TTL_Requests')/items?$select=Id,Title,TotalCost,Goal,Project,Status,Author/Id,RequestItemID/Id&$expand=RequestItemID,Author`,
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
    let usersLicenseValue = 'N/A';

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
        EndDate: sharePointItem.EndDate || '',
        RequestType: sharePointItem.RequestType || '',
        Cost: sharePointItem.Cost || '',
        Licensing: sharePointItem.Licensing || '',
        LicenseType: sharePointItem.LicenseType || '',
        UsersLicense: usersLicenseValue,
        Processed: sharePointItem.Processed || '',
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
    const items = data.value.map((item: any) => mapSharePointItemToUserRequestItem(item));

    return items;
};

// Create a request in TTL_Requests and attach request items (by creating items and setting lookup)
export const createRequestWithItems = async (context: WebPartContext, request: any, items: any[]): Promise<number> => {
    const sp = getSP(context);
    const requestsList = sp.web.lists.getByTitle('TTL_Requests');

    // Create the main request
    const reqAdd = await requestsList.items.add({
        Title: request.Title || '',
        Goal: request.Goal || '',
        Project: request.Project || '',
        TeamID: Number(request.TeamID) || null,
        ApproverIDId: Number(request.ApproverID) || null,
        Status: request.Status || 'Unsaved',
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

// Create a request item in the TTL_RequestItem list
export const createRequestItem = async (context: WebPartContext, item: any): Promise<number> => {
    const sp = getSP(context);
    const list = sp.web.lists.getByTitle('TTL_RequestItem');
    const addResult = await list.items.add({
        Title: item.Title || '',
        Provider: item.Provider || '',
        Location: item.Location || '',
        Link: item.Link || '',
        StartDate: item.StartDate || null,
        EndDate: item.EndDate || null,
        RequestType: item.RequestType || '',
        Cost: item.Cost || '',
        Licensing: item.Licensing || '',
        LicenseType: item.LicenseType || '',
    });
    // PnPjs add result shapes can vary; extract Id defensively
    const maybeId = (addResult && (addResult.data?.Id ?? addResult.data?.ID ?? addResult.data?.id ?? addResult.Id ?? addResult.ID)) as number | undefined;
    if (!maybeId) {
        console.warn('createRequestItem: unexpected add result shape, returning 0', addResult);
        return 0;
    }
    return maybeId;
};

