// import { WebPartContext } from '@microsoft/sp-webpart-base';

// // Helper to call Microsoft Graph presence endpoint for a user (could maybe be used in the future)

// export const getUserPresence = async (context: WebPartContext, userIdOrUpn: string): Promise<any> => {
//   if (!context || !context.msGraphClientFactory) {
//     throw new Error('Missing msGraphClientFactory on context');
//   }

//   try {
//   // request the v3 client (MSGraphClient v3)
//   const client = await context.msGraphClientFactory.getClient('3');
//     // use the user identifier (UPN or id) directly in the path
//     const res = await client.api(`/users/${encodeURIComponent(userIdOrUpn)}/presence`).get();
//     return res;
//   } catch (err) {
//     console.error('Error fetching user presence from Graph', err);
//     return undefined;
//   }
// };
