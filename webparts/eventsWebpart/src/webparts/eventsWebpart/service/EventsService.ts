import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { EventItem } from "../EventsInterfaces";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp/presets/all';

let sp: SPFI | undefined;

export const getSP = (context: WebPartContext): SPFI => {
  if (!sp) {
    sp = spfi(context.pageContext.web.absoluteUrl).using(SPFx(context));
  }
  return sp;
};

// Gets the groups of the logged in user
export const getUserGroups = async (context: WebPartContext): Promise<any> => {
    try {
        const response = await context.spHttpClient.get(
        `${context.pageContext.web.absoluteUrl}/_api/web/currentuser?$expand=groups`,
        SPHttpClient.configurations.v1
        );
        const data = await response.json();
        // If the user is a member or owner of the site, they can make a new event
        const userGroups =
        data.Groups?.map((grp: any) => grp.Title.toLowerCase()) || [];
        const canAddEvents = userGroups.some((group: string) =>
        ["hr-be members", "hr-be owners"].some((role) =>
            group.includes(role)
        )
        );
        return canAddEvents;
    } catch (err) {
        console.error("Error checking group membership:", err);
    }
};

// Fetch events from SharePoint list HR_Events
export const getListData = async (context: WebPartContext): Promise<EventItem[]> => {
    const response: SPHttpClientResponse = await context.spHttpClient.get(
      `${context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('HR_Events')/items?$select=Id,Title,Image0,StartTime,EndTime,FoodEvent,Beschrijving,Location,Signinlink,EventTypes,SignupDeadline,PlusOne,Carpooling&$orderby=StartTime asc`,
      SPHttpClient.configurations.v1
    );
    const data = await response.json();
    return data.value as EventItem[];
  };
  
// Fetch subscriptions for current user
export const getMySubscriptions = async (context: WebPartContext): Promise<number[]> => {
  // get current user's ID
  const currentUserId = context.pageContext.legacyPageContext.userId;
  // call the Subscriptions list
  const subsResponse: SPHttpClientResponse = await context.spHttpClient.get(
    `${context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('Subscriptions')/items?` +
      `$select=EventId,Attendee/Id&$expand=Attendee&$filter=Attendee/Id eq ${currentUserId}`,
    SPHttpClient.configurations.v1
  );
  const subsData = await subsResponse.json();
  const subs: any[] = subsData.value;

  // extract the event IDs
  const eventIds = subs
    .map((s) => {
      // Note: we assume EventId is the lookup id for the Event
      return s.EventId as number;
    })
    .filter((id) => id != null);
  return eventIds;
};