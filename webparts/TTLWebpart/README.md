# TTLWebpart

## Summary

This SPFx webpart is an extensive "application" to manage requests concerning trainings, travels, accomodations and software licenses. Each user has their own
dashboard where thye can visualise, add, update and delete requests. Once a request is created, the user can either 'save' their request so they can edit it later, or they can
send it for approval. At this point, the request isn't editable and it goes to the dashboard of the approver that was selected during the process of making the request.
The approver can either approve or deny any requests in their dashboard (and provide a comment on denial). If approved, HR members can in their turn approve or deny requests in their
dashboard. They can also provide a comment and edit the cost of an item. If any cost was changed, they need to be sent for reapproval (and once again need to be approved by the approver). Only when both the approver and HR have approved the request, will the appropriate costs be paid. 
There is also an exception when the total cost of a request exceeds 5000 EUR. In this case, the managing director of the company will also need to approve or deny the request in his own dashboard. A Power Automate flow is connected to this webpart to send out emails to the appropriate people at multiple stages of the process, shown below.

New request is created (> 5000 EUR): the approver and HR are both informed of the new creation.
New request is created (< 5000 EUR): the approver, HR and managing director are informed of the new creation.
Request is declined: the requester is informed of the decision.
Request is approved by approver: HR is informed that a request requires their approval.
Request is approved by all required approvers: requester is informed that their request is approved and will be booked.

## Versions used

![version](https://img.shields.io/badge/SPFx-1.21.1-green.svg)
![version](https://img.shields.io/badge/node-1.21.1-green.svg)
![version](https://img.shields.io/badge/react-17.0.1-green.svg)

## Extra packages

- pnp/sp version 4.16.0 is used to easily retrieve data from and add to SharePoint lists
- pnp/spfx-controls-react version 3.22.0 is used for the people picker

## Files explanation

- TTLService.ts: service file for maintaining CRUD operations to SharePoint lists
- AutomateService.ts: service file for sending data to the Power Automate flow
- TTLInterfaces.ts: interface file for maintaining types
- HelperFunctions.ts: file with functions that are used in multiple components

- TtlDashboard.tsx: Dashboard that shows the requests of the logged in user
- ApproversDashboard.tsx: Dashboard that shows requests that are 'sent for approval' or 'sent for reapproval' and are attached to the logged in approver (only visible for approvers)
- HRDashboard.tsx: Dashboard that shows requests that are 'in process by HR'
- DirectorDashboard.tsx: Dashboard that shows requests that are 'sent for approval' and exceed 5000 EUR
- DashboardComponent.tsx: Component that contains the table with requests, tailored for each type of dashboard

- NewRequest.tsx: Component for adding new requests and managing request items to that request (trainings, tavels, accomodations and software licenses)
- AccomodationForm.tsx: Form to add an accomodation to a request
- Software.tsx: Form to add a software license to a request
- TrainingForm.tsx: Form to add a training to a request
- TravelForm.tsx: Form to add a travel to a request

- RequestDetails.tsx: When a request is created, this component contains all information from that item. Actions can be taken based on the status of that specific request (CRUD operations, approvals etc.)
- RequestItemsList.tsx: Component inside the RequestDetails that shows each request item
- AddItemModal.tsx: Modal for adding a request item to a request in the details page (only possible when request status is 'saved')
- ConfirmDeleteDialog.tsx: Dialog for deleting whole requests or individual request items
- EditItemModal.tsx: Modal for editing requests
- EditRequestForm.tsx: Modal for editing details about the request like: approver, title, goal etc.

- ConfirmActionDialog.tsx: Dialog to confirm actions like deleting items, sending requests for approval, approving requests etc.


***Each component also has an interface and scss file for modularity and readability***

## Setup

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

- Managing your own requests on your dashboard 
  - Filtering
  - Sorting
- Getting request details (your dashboard)
  - Performing CRUD operations
  - Sending for approval / saving
  - Viewing comments
- Adding new requests with specific request items
- Approval system with multiple steps
- Dashboards for the managing director, approvers and HR
  - Filtering
  - Sorting
- Getting request details (managing director, approvers and HR)
  - Approving / denying requests
  - Adding comments
- Email flows to inform people on their requests

