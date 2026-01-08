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

// Get current user via PnP SP
export const getCurrentUser = async (context: WebPartContext): Promise<any> => {
  const sp = getSP(context);
  return await sp.web.currentUser();
};

// Check if the current user is signed up for an event
export const isUserSignedUp = async (context: WebPartContext, eventId: number): Promise<boolean> => {
  const sp = getSP(context);
  const currentUser = await sp.web.currentUser();
  const attendee = await sp.web.lists
    .getByTitle("Subscriptions")
    .items
    .filter(`EventId eq ${eventId} and AttendeeId eq ${currentUser.Id}`)
    .select("Id")();
  return attendee.length > 0;
};

// Fetch attendees for an event
export const getAttendeesForEvent = async (context: WebPartContext, eventId: number): Promise<any[]> => {
  const sp = getSP(context);
  const items = await sp.web.lists
    .getByTitle("Subscriptions")
    .items
    .filter(`EventId eq ${eventId}`)
    .select("Id", "Carpooling", "DepartureFrom", "Attendee/Id", "Attendee/Title")
    .expand("Attendee")();
  return items;
};

// Delete all subscriptions for the current user for a given event. Returns number deleted.
export const deleteUserSubscriptionsForEvent = async (context: WebPartContext, eventId: number): Promise<number> => {
  const sp = getSP(context);
  const currentUser = await sp.web.currentUser();
  const attendeeItems = await sp.web.lists
    .getByTitle("Subscriptions")
    .items
    .filter(`EventId eq ${eventId} and AttendeeId eq ${currentUser.Id}`)
    .select("Id")();

  for (const item of attendeeItems) {
    await sp.web.lists.getByTitle("Subscriptions").items.getById(item.Id).delete();
  }

  return attendeeItems.length;
};

// Add a subscription item to the Subscriptions list
export const addSubscriptionItem = async (context: WebPartContext, item: any): Promise<any> => {
  const sp = getSP(context);
  return await sp.web.lists.getByTitle("Subscriptions").items.add(item);
};

// Fetch events from SharePoint list HR_Events
export const getListData = async (
  context: WebPartContext
): Promise<EventItem[]> => {
  const sp = getSP(context);

  const items = await sp.web.lists
    .getByTitle("HR_Events")
    .items.select(
      "Id",
      "Title",
      "Image0",
      "StartTime",
      "EndTime",
      "FoodEvent",
      "Beschrijving",
      "Location",
      "Signinlink",
      "EventTypes",
      "SignupDeadline",
      "PlusOne",
      "Carpooling"
    )
    .orderBy("StartTime", true)(); // true = ascending

  return items as EventItem[];
};
  
// Fetch subscriptions for current user
export const getMySubscriptions = async (
  context: WebPartContext
): Promise<number[]> => {
  const sp = getSP(context);

  const currentUserId = context.pageContext.legacyPageContext.userId;

  const subs = await sp.web.lists
    .getByTitle("Subscriptions")
    .items.select(
      "EventId",
      "Attendee/Id"
    )
    .expand("Attendee")
    .filter(`Attendee/Id eq ${currentUserId}`)();

  // Extract Event lookup IDs
  const eventIds = subs
    .map((s) => s.EventId as number)
    .filter((id) => id != null);

  return eventIds;
};