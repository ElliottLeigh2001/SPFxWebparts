# events-webpart

## Summary

A React based SPFx webpart designed to streamline the process of signing in and out for company events. For each event type, unique form fields will be visible and are to be filled in (optionally or mandatory.)

## Versions used

![version](https://img.shields.io/badge/SPFx-1.21.1-green.svg)
![version](https://img.shields.io/badge/node-1.21.1-green.svg)
![version](https://img.shields.io/badge/react-17.0.1-green.svg)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)


## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder
- In the command-line run:
  - ```npm install```
  - ```gulp serve```

To import into SharePoint site collection:
  - ```gulp bundle```
  - ```gulp package-solution```
  - Navigate to apps inside the SharePoint admin centre and import the sppkg file that is found in the sharepoint/solution folder
  - When added to your apps, you can use the webpart in any modern page on your site collection

## Features

- Shows all events from the HR_Event list
- When an event is clicked, you see extra details and a button to sign in / out
- When signing in, a form appears with fields specific for that type of event
- When submitted, the person is added to the list of subscriptions for the event
- When signing out, the user is asked to confirm their decision, after which they are removed from the list
- hr-be owners and hr-be members have the extra option of adding an event, which takes them to the list in SharePoint


## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [Building for Microsoft teams](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/build-for-teams-overview)
- [Use Microsoft Graph in your solution](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/using-microsoft-graph-apis)
- [Publish SharePoint Framework applications to the Marketplace](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/publish-to-marketplace-overview)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Guidance, tooling, samples and open-source controls for your Microsoft 365 development
