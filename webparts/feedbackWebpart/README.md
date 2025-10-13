# feedback-webpart

## Summary

 A simple SPFx webpart for submitting anonymous feedback. There is a form with one field where the user is prompted to suggest changes or give feedback to the HR team. To make this webpart anonymous, a Power Automate flow is ran on submit of the form. This flow makes sure that the creator of the flow (service account) always submits the feedback.

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
- in the command-line run:
  - ```npm install```
  - ```gulp serve```

To import into SharePoint site collection:
  - ```gulp bundle```
  - ```gulp package-solution```
  - Navigate to apps inside the SharePoint admin centre and import the sppkg file that is found in the sharepoint/solution folder
  - When added to your apps, you can use the webpart in any modern page on your site collection

## Features

- Able to fill in a feedback form
- On submit, a row is added to the feedback list in SharePoint, for HR to review
- On submit, a Power Automate flow is ran to make sure the form is handled anonymously

## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [Building for Microsoft teams](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/build-for-teams-overview)
- [Use Microsoft Graph in your solution](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/using-microsoft-graph-apis)
- [Publish SharePoint Framework applications to the Marketplace](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/publish-to-marketplace-overview)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Guidance, tooling, samples and open-source controls for your Microsoft 365 development
