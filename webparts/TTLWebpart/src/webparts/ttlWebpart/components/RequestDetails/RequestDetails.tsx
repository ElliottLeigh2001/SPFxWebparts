import { useState, useEffect } from 'react';
import EditRequestForm from './EditRequestForm';
import { updateRequestItem, deleteRequestWithItems, updateRequest, deleteRequestItem, recalcAndUpdateRequestTotal, createRequestItemForExistingRequest, updateRequestStatus, getApproverById, updateRequestDeadline, updateTeamCoachApproval, getBudgetforApprover, deductFromBudget, getApprovers } from '../../service/TTLService';
import RequestItemsList from './RequestItemsList';
import { UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { Modal } from '@fluentui/react';
import styles from '../Dashboard/TtlWebpart.module.scss';
import requestDetailsStyles from './RequestDetails.module.scss';
import * as React from 'react';
import ConfirmActionDialog from '../Modals/ConfirmActionDialog';
import { sendEmail } from '../../service/AutomateService';
import { formatDate, getRequestStatusStyling } from '../../Helpers/HelperFunctions';
import CommentsSection from './CommentsSection';
import AddItemModal from '../Modals/AddItemModal';
import ConfirmDeleteDialog from '../Modals/ConfirmDeleteDialog';
import EditItemModal from '../Modals/EditItemModal';
import { createComment } from '../../service/CommentService';
import { TTLComment } from '../../Interfaces/TTLCommentInterface';
import { RequestDetailsProps } from './RequestDetailsProps';
import HeaderComponent from '../Header/HeaderComponent';

const RequestDetails: React.FC<RequestDetailsProps> = ({ request, items, view, HRTab, onBack, onUpdate, error, context, isCEO, isApprover, isTeamCoach }) => {
  const [editingItem, setEditingItem] = useState<UserRequestItem | undefined>(undefined);
  const [editingRequest, setEditingRequest] = useState<boolean>(false);
  const [activeForm, setActiveForm] = useState<'software'|'training'|'travel'|'accommodation'|null>(null);
  const [activeFormName, setActiveFormName] = useState<'training'|'travel'|'accommodation'|null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<UserRequestItem | null>(null);
  const [displayedItems, setDisplayedItems] = useState<UserRequestItem[]>(items || []);
  const [displayedRequest, setDisplayedRequest] = useState<UserRequest>(request);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [showConfirmActionDialog, setShowConfirmActionDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve'|'deny'|'send'|'reapprove'|'completed'|null>(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [changedByHR, setChangedByHR] = useState(false);
  const [typeOfRequest, setTypeOfRequest] = useState('');
  const [deadlineWarning, setDeadlineWarning] = useState(false);

  // Set the items to display after an update, deletion, add...
  useEffect(() => {
    setDisplayedItems(items || []);
  }, [items]);

  // Check if the request is of type software or training/travel
  // This state is used in the Power Automate flow
  useEffect(() => {
    if (items[0].RequestType === 'Software') {
      setTypeOfRequest('Software License');
    } else {
      setTypeOfRequest('Training / Travel')
    }
    if (request.DeadlineDate) {
      if (new Date(request.DeadlineDate) < new Date()) {
        setDeadlineWarning(true);
      }
    }
    console.log(deadlineWarning);
  }, []);

  // If the request was changed by HR, set the state accordingly
  useEffect(() => {
    setDisplayedRequest(request);
    const changed = sessionStorage.getItem(`changedByHR${request.ID}`) === "true";
    setChangedByHR(changed);
  }, [request]);

  const handleEditItem = (item: UserRequestItem): void => {
    setEditingItem(item);
    setActiveForm(item.RequestType?.toLowerCase() as any);
    setActiveFormName(item.RequestType?.toLowerCase() as any);
  };

  // Function to add a requestitem to a request
  const handleAddItem = async (newItem: UserRequestItem): Promise<void> => {
    setIsAdding(true);
    setActionError(null);

    try {
      // Create the new item in SharePoint
      const newItemId = await createRequestItemForExistingRequest(context, request.ID!, newItem);
      
      // Add the new item to local state with the returned ID
      const itemWithId = { ...newItem, ID: newItemId };
      setDisplayedItems(prev => [...prev, itemWithId]);
      
      // Recalculate and update total cost
      try {
        const newTotal = await recalcAndUpdateRequestTotal(context, request.ID!);
        setDisplayedRequest(prev => ({ ...prev, TotalCost: String(newTotal) }));
      } catch (err) {
        console.error('Error recalculating total after adding item:', err);
      }
      
      // Refresh parent component
      onUpdate();
      
    } catch (error) {
      console.error('Error adding item:', error);
      setActionError('Failed to add item');
    } finally {
      setIsAdding(false);
    }
  };

  // Function for changing the request status
  const updateRequestApprover = async (type: string, updateApprovedByCEO: boolean, refreshParent: boolean): Promise<void> => {
    if (!request.ID) return;
    setIsUpdatingStatus(true);
    setStatusActionError(null);
    setIsProcessing(true);

    // If the request is Submitted for the first time, set the submissionDate
    let submissionDate: any;
    if (type === "Submitted") {
      submissionDate = new Date();
    } else {
      submissionDate = undefined;
    }
    
    try {
      // Send the API call so update the status
      await updateRequestStatus(context, request.ID, type, submissionDate, updateApprovedByCEO);
      
      // Show success message or update local state
      setDisplayedRequest(prev => ({ 
        ...prev, 
        RequestStatus: type,
        SubmissionDate: submissionDate || undefined,
      }));
      
      // Refresh parent component

      if (refreshParent && onUpdate) onUpdate();

    } catch (error) {
      console.error('Error approving request:', error);
      setStatusActionError('Failed to approve request');
    } finally {
      setIsUpdatingStatus(false);
      setIsProcessing(false);
    }
  };

  // Update request item
  const handleUpdateItem = async (updatedItem: UserRequestItem): Promise<void> => {
    if (!editingItem?.ID) return;

    setIsUpdating(true);
    setIsProcessing(true);
    setActionError(null);

    try {
      // Send the API call to update the request item
      await updateRequestItem(context, editingItem.ID, updatedItem);

      // If in HR view and cost was changed, mark as changed by HR
      if (view === 'HR' && updatedItem.Cost !== editingItem.Cost?.toString()) {
        setChangedByHR(true);
        // Store changedByHR for this request in the sessionStorage
        // Requests with this can be sent for reapproval by HR
        // It's stored here so it's maintained between refreshes
        sessionStorage.setItem(`changedByHR${request.ID}`, "true")
      }

      // Optimistically update local list so UI reflects change immediately
      const newDisplayed = displayedItems.map(i => i.ID === editingItem.ID ? { ...i, ...updatedItem, ID: editingItem.ID } : i);
      setDisplayedItems(newDisplayed);
      // Recalculate and persist total cost
      try {
        const rid = (displayedRequest && (displayedRequest.ID || (displayedRequest as any).Id)) || (request && (request.ID || (request as any).Id));
        if (rid) {
          // Recalculate total cost of request
          const newTotal = await recalcAndUpdateRequestTotal(context, Number(rid));
          setDisplayedRequest(prev => ({ ...prev, TotalCost: String(newTotal) }));
          onUpdate();
        }
      } catch (err) {
        console.error('Error recalculating total after update:', err);
      }
      // Recalculate and persist the deadline date (closest / earliest StartDate)
      try {
        const rid = (displayedRequest && (displayedRequest.ID || (displayedRequest as any).Id)) || (request && (request.ID || (request as any).Id));
        if (rid) {
          // Find earliest valid StartDate among items
          const dates = newDisplayed.map(it => new Date(it.StartDate as any))

          if (dates.length > 0) {
            const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
            // Update DeadlineDate in SharePoint
            try {
              await updateRequestDeadline(context, Number(rid), earliest);
            } catch (err) {
              console.error('Error updating request deadline:', err);
            }
          } else {
            // No valid dates —> clear DeadlineDate
            try {
              await updateRequestDeadline(context, Number(rid), null);
            } catch (err) {
              console.error('Error clearing request deadline:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error recalculating deadline after update:', err);
      }
      setEditingItem(undefined);
      setActiveForm(null);

    } catch (error) {
      console.error('Error updating item:', error);
      setActionError('Failed to update item');
    } finally {
      setIsUpdating(false);
      setIsProcessing(false);
    }
  };

  // Function to handle updates to the request (not the items in the request)
  const handleUpdateRequest = async (updatedRequest: UserRequest): Promise<void> => {
    if (!request.ID) return;

    setIsUpdating(true);
    setIsProcessing(true);
    setActionError(null);

    try {
      // Send the API call to update the request
      await updateRequest(context, request.ID, updatedRequest);
      // Update local displayed request so UI updates immediately
      setDisplayedRequest(prev => ({ ...prev, ...updatedRequest }));
      setEditingRequest(false);
      // Refresh items in the dashboard
      onUpdate();
    } catch (error) {
      console.error('Error updating request:', error);
      setActionError('Failed to update request');
    } finally {
      setIsUpdating(false);
      setIsProcessing(false);
    }
  };

  // Function for deleting an entire request with its linked requestitems
  const handleDeleteRequest = async (): Promise<void> => {
    if (!request.ID) return;

    setIsDeleting(true);
    setIsProcessing(true);
    setActionError(null);

    try {
      // Get all request items linked to the request
      const itemIds = items.filter(item => item.ID).map(item => item.ID!) as number[];
      // Send an API call to delete the request with its items
      await deleteRequestWithItems(context, request.ID, itemIds);

    } catch {
      setActionError('Failed to delete request');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setIsProcessing(false);
      // After processing finished, navigate back if deletion succeeded
      // (we navigate here to ensure caller UI doesn't flash while operations are in-flight)
      onBack();
    }
  };

  // Function for adding comments to a request
  // commentText is the text that is filled into the texarea in the confirmActionDialog
  const handleAddComment = async (commentText: string) => {
    if (!commentText.trim()) return;

    try {
      const comment: TTLComment = {
        Title: `Comment on Request ${request.ID}`,
        Body: commentText,
      };

      // Send API call to add the comment
      await createComment(context, comment, request.ID);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Show confirmation dialog when the delete icon is pressed
  const handleDeleteItem = (requestItem: UserRequestItem): void =>  {
    setSelectedItemToDelete(requestItem);
    setShowDeleteConfirm(true);
  }

  // Perform the deletion after confirmation
  const performDeleteItem = async (): Promise<void> => {
    if (!selectedItemToDelete?.ID) return;

    setIsDeleting(true);
    setIsProcessing(true);
    setActionError(null);
    try {
      // Send API call to delete the request item
      await deleteRequestItem(context, selectedItemToDelete.ID!);
      // Remove from list in this component to reflect action in UI
      setDisplayedItems(prev => prev.filter(i => i.ID !== selectedItemToDelete.ID));
      // Recalculate total cost
      try {
        const rid = (displayedRequest && (displayedRequest.ID || (displayedRequest as any).Id)) || (request && (request.ID || (request as any).Id));
        if (rid) {
          const newTotal = await recalcAndUpdateRequestTotal(context, Number(rid));
          setDisplayedRequest(prev => ({ ...prev, TotalCost: String(newTotal) }));
        }
      } catch (err) {
        console.error('Error recalculating total after delete:', err);
      }
      // Refresh items in the dashboard
      onUpdate();
    } catch (error) {
      console.error('Error deleting item:', error);
      setActionError('Failed to delete item');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setSelectedItemToDelete(null);
      setIsProcessing(false);
    }
  }

  // Close all modals when exiting out of one
  const closeModal = (): void => {
    setShowAddModal(false);
    setActiveForm(null);
    setEditingRequest(false);

    setTimeout(() => {
      setActiveFormName(null);
      setEditingItem(undefined);
    }, 1000)
  };

  return (
    <>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
    <div>
      {isProcessing && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{textAlign: 'center'}}>
            <i className="fa fa-spinner fa-spin" style={{fontSize: 36, marginBottom: 12}}></i>
            <div>Processing…</div>
          </div>
        </div>
      )}
      <HeaderComponent view={request.Title}/>
      {!isUpdatingStatus ? (
        <>
          <div style={{display: 'flex', justifySelf: 'center', width: '96%'}}>
            {isApprover && !isTeamCoach && (
              <>
                {request.TeamCoachApproval ? (
                  <>
                  {request.TeamCoachApproval === 'Approve' ? (
                    <p>Team Coach approves</p>
                  ) : (
                    <p>Team Coach disapproves</p>
                  )}
                  </>
                ) : (
                  <p>Team coach has not yet reviewed</p>
                )}
              </>
            )}
          </div>

          <div className={requestDetailsStyles.detailsContainer}>
              <div className={requestDetailsStyles.details}>
                <div className={requestDetailsStyles.titleContainer}>
                  <h3 className={requestDetailsStyles.panelHeader}>Details</h3>
                  {view === 'myView' && (request.RequestStatus === 'Draft' || request.RequestStatus === 'Rejected') && (
                    <button
                      className={requestDetailsStyles.iconButton}
                      onClick={() => setEditingRequest(true)}
                      title="Edit"
                    >
                      <i className="fa fa-pencil" aria-hidden="true"></i>
                    </button>
                  )}
                </div>
                {view !== 'myView' && (
                  <span><strong>Requester:</strong> {request.Author?.Title || '/'}</span>
                )}
                <span><strong>Approver:</strong> {request.ApproverID?.Title || '/'}</span>
                {displayedItems[0].RequestType !== 'Software' ? (
                  <span><strong>Total Cost:</strong> € {displayedRequest.TotalCost}</span>
                ) : (
                  <>
                    {displayedItems[0].Licensing === 'One-time' ? (
                      <span><strong>Total Cost (one-time):</strong> € {displayedRequest.TotalCost}</span>
                    ) : (

                      <span><strong>Total Cost (yearly):</strong> € {displayedRequest.TotalCost}</span>
                    )}
                  </>
                )}
                <span><strong>Project:</strong> {displayedRequest.Project || '/'}</span>
                <span><strong>Team:</strong> {displayedRequest.Team || '/'}</span>
                <span><strong>Submission Date:</strong> {formatDate(displayedRequest.SubmissionDate) || '/'}</span>
                {view === 'HR' && (
                  <span><strong>Deadline Date:</strong> {formatDate(displayedRequest.DeadlineDate) || '/'}</span>
                )}
                <span><strong>Status:</strong> <span style={{ marginLeft: '0' }} className={`${styles.status} ${getRequestStatusStyling(request.RequestStatus)}`}>{displayedRequest.RequestStatus}</span></span>
                <span><strong>Goal:</strong> {displayedRequest.Goal}</span>
              </div>

              <div className={requestDetailsStyles.items}>
                <div className={requestDetailsStyles.titleContainer}>
                  <h3 className={requestDetailsStyles.panelHeader}>Items ({displayedItems.length})</h3>
                </div>
                <RequestItemsList
                  items={displayedItems}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onAdd={() => setShowAddModal(true)}
                  showActions={((displayedRequest.RequestStatus === 'Draft' || displayedRequest.RequestStatus === 'Rejected') ||
                    (view === 'HR' && displayedRequest.RequestStatus === 'HR Processing'))}
                  view={view}
                  request={displayedRequest}
                  context={context}
                  onDocumentUploaded={() => onUpdate()} />
              </div>
            </div>
          </>
      ) : (
        <p>loading...</p>
      )}

      {(error || actionError) && (
        <div className={styles.error}>
          <p>{error || actionError}</p>
        </div>
      )}

      <Modal
        isOpen={editingRequest}
        onDismiss={closeModal}
        isBlocking={false}
        containerClassName={requestDetailsStyles.modalContainer}
      >
        <div className={requestDetailsStyles.modalHeader}>
          <h3>Edit Request</h3>
          <button className={requestDetailsStyles.modalCloseButton} onClick={closeModal}>×</button>
        </div>
        <div className={requestDetailsStyles.modalBody}>
          <EditRequestForm
            context={context}
            request={request}
            onSave={handleUpdateRequest}
            onCancel={closeModal} />
        </div>
      </Modal>

      <EditItemModal
        context={context}
        activeForm={activeForm}
        activeFormName={activeFormName}
        editingItem={editingItem}
        isUpdating={isUpdating}
        onSave={handleUpdateItem}
        onCancel={closeModal}
        view={view}
      />

      <AddItemModal
        context={context}
        isOpen={showAddModal}
        isUpdating={isAdding}
        onSave={handleAddItem}
        onCancel={() => setShowAddModal(false)}
      />

      <ConfirmDeleteDialog
        isOpen={showDeleteConfirm}
        isDeleting={isDeleting}
        itemName={selectedItemToDelete?.Title || null}
        onCancel={() => { setShowDeleteConfirm(false); setSelectedItemToDelete(null); }}
        onConfirmItemDelete={performDeleteItem}
        onConfirmRequestDelete={handleDeleteRequest}
      />

      <ConfirmActionDialog
          isOpen={showConfirmActionDialog}
          action={confirmAction}
          isProcessing={confirmProcessing}
          onCancel={() => { setShowConfirmActionDialog(false); setConfirmAction(null); }}
          onConfirm={async (comment) => {
            if (!confirmAction) return;
            setConfirmProcessing(true);
            setIsProcessing(true);
            let success = false;
            try {
                // If a request is approved
                if (confirmAction === 'approve') {
                  // Add comment to request if one was provided
                  if (comment) {
                    await handleAddComment(comment)
                  }
                  // If the approver is the director (or CEO)
                  if (isCEO) {
                    // If the other approver (practice lead) has already approved
                    if (request.RequestStatus === 'Awaiting CEO approval') {
                      // Send to HR
                      await updateRequestApprover('HR Processing', true, true);
                      // Send an email to HR to notify them that they need to approve next
                      await sendEmail({emailType: 'HR', requestId: request.ID.toString(), title: request.Title, totalCost: request.TotalCost.toString(), authorEmail: request.Author?.EMail, authorName: request.Author?.Title, approverTitle: request.ApproverID?.Title, typeOfRequest: typeOfRequest})
                      // If the other approver (practice lead) has not yet approved,
                      // don't send to HR yet, but set the approvedByCEO column to true
                    } else if (request.RequestStatus === 'Submitted') {
                      await updateRequestApprover('Submitted', true, true);
                      // Do the same for reapprovals
                    } else if (request.RequestStatus === 'Resubmitted') {
                      await updateRequestApprover('Resubmitted', true, true)
                    }
                  }
                  // If the approver is a practice lead
                  else if (view === 'approvers' || view === 'deliveryDirector') {
                    // Define nextStatus used to determine the next status 
                    // The status is based on price or if the director has already approved
                    let nextStatus;
                    // If the total cost exceeds 5000 euro (so director approval is also needed)
                    if (Number(request.TotalCost) > 5000) {
                      // If the director has already approved, send to HR, otherwise wait for director approval
                      nextStatus = request.ApprovedByCEO ? 'HR Processing' : 'Awaiting CEO approval';
                    } else {
                      // If total cost is lower than 5000 euro (no director approval needed), just send straight to HR
                      nextStatus = 'HR Processing'
                    }
                    // Update status
                    await updateRequestApprover(nextStatus, false, true);
                    
                    // Send an email to HR to notify them that they need to approve next
                    // This step only happens if all required approvers have approved
                    if (nextStatus === 'HR Processing') {
                      await sendEmail({emailType: 'HR', requestId: request.ID.toString(), title: request.Title, authorEmail: request.Author?.EMail, authorName: request.Author?.Title, approverTitle: request.ApproverID?.Title, typeOfRequest: typeOfRequest,})
                    } 
                  }
                  // If the approver is HR and they approve, set status to HR Processing
                  else if (view === 'HR') {
                    await updateRequestApprover('HR Processing', false, true)
                  }
                }
                // If a request is denied
                else if (confirmAction === 'deny') {
                  // Update status
                  await updateRequestApprover('Rejected', false, true);
                  // Add comment (it's required upon denial)
                  await handleAddComment(comment!)
                  // Inform requester that their request has been denied
                  await sendEmail({emailType: "deny", title: request.Title, authorEmail: request.Author?.EMail, authorName: request.Author?.Title, comment: comment, typeOfRequest: typeOfRequest})
                }
                // When the requester sends their request for approval
                else if (confirmAction === 'send') {
                  // Update status
                  await updateRequestApprover('Submitted', false, false)
                  // Get data from the approver so it can be included in the email
                  const approverData = await getApproverById(context, Number(request.ApproverID?.Id));
                  const approverEmail = approverData?.PracticeLead?.EMail;
                  const approverTitle = approverData?.PracticeLead?.Title;
                  // Send an email to the approver, HR and director if the price exceeds 5000 euro (handled by Power Automate flow)
                  await sendEmail({ emailType: "new request", requestId: request.ID.toString(), title: request.Title, totalCost: request.TotalCost.toString(), authorEmail: request.Author?.EMail, authorName: request.Author?.Title, approverEmail: approverEmail, approverTitle: approverTitle, typeOfRequest: typeOfRequest});
                }
                // If the request is sent for reapproval by HR
                else if (confirmAction === 'reapprove') {
                  // Add comment (it's required upon reapproval)
                  await handleAddComment(comment!)
                  // Update status
                  await updateRequestApprover('Resubmitted', false, true)
                  // Get data from the approver so it can be included in the email
                  const approverData = await getApproverById(context, Number(request.ApproverID?.Id));
                  const approverEmail = approverData?.PracticeLead?.EMail;
                  const approverTitle = approverData?.PracticeLead?.Title;
                  // Send email to approver that they need to reapprove the request
                  await sendEmail({ emailType: "reapprove", requestId: request.ID.toString(), title: request.Title, totalCost: request.TotalCost.toString(), authorEmail: request.Author?.EMail, authorName: request.Author?.Title, approverEmail: approverEmail, approverTitle: approverTitle, typeOfRequest: typeOfRequest});
                }
                // If HR had booked the request and marked it as completed
                else if (confirmAction === 'completed') {
                  // Update status
                  await updateRequestApprover('Completed', false, false)
                  
                  // Deduct the cost from the team coach's budget
                  if (request.ApproverID?.Id && request.TotalCost) {
                    try {
                      const approversList = await getApprovers(context);
                      const approver = approversList.find(a => a.Id === request.ApproverID?.Id);
                      
                      if (approver?.TeamCoach?.EMail) {
                        const budget = await getBudgetforApprover(context, approver.TeamCoach.EMail, new Date().getFullYear().toString());
                        if (budget) {
                          await deductFromBudget(context, budget.ID, Number(request.TotalCost));
                        }
                      }
                    } catch (budgetError) {
                      console.error('Error deducting from budget:', budgetError);
                      // Don't fail the request completion due to budget error
                    }
                  }
                }
              success = true;
            } finally {
              setConfirmProcessing(false);
              setIsProcessing(false);
              setShowConfirmActionDialog(false);
              setConfirmAction(null);
              sessionStorage.removeItem(`changedByHR${request.ID}`)
              if (success) {
                // Navigate back after successful action
                onBack();
              }
            }
          }}
        />
    </div>
      <div className={styles.newRequestButtonContainer}>
        {isTeamCoach && !isApprover && (
          <div style={{display: 'flex', gap: '20px'}}>
            <button onClick={() => {
              setDisplayedRequest(prev => ({ ...prev, TeamCoachApproval: 'Disapprove' }));
              updateTeamCoachApproval(context, request.ID, 'Disapprove');
            }} 
              className={`${displayedRequest.TeamCoachApproval === 'Disapprove' ? 
              requestDetailsStyles.approveButton : 
              requestDetailsStyles.declineButton}`}>
              {`${displayedRequest.TeamCoachApproval === 'Disapprove' ? 'Disapproved' : 'Disapprove'}`}
            </button>
            <button onClick={() => {
              setDisplayedRequest(prev => ({ ...prev, TeamCoachApproval: 'Approve' }));
              updateTeamCoachApproval(context, request.ID, 'Approve');
            }}  
              className={`${displayedRequest.TeamCoachApproval === 'Approve' ? 
              requestDetailsStyles.approveButton : 
              requestDetailsStyles.declineButton}`}>
                {`${displayedRequest.TeamCoachApproval === 'Approve' ? 'Approved' : 'Approve'}`}
            </button>
          </div>
        )}
        {((view === 'approvers' && isApprover) || view === 'director' || view === 'deliveryDirector') && (
          <div style={{display: 'flex', gap: '20px'}}>
            <button 
              onClick={() => {setConfirmAction('deny'); setShowConfirmActionDialog(true)}}
              className={requestDetailsStyles.declineButton}
              disabled={isUpdatingStatus}
            >
              Deny
            </button>
          <button
            onClick={() => {
              setConfirmAction('approve');
              setShowConfirmActionDialog(true);
            }}
            className={requestDetailsStyles.approveButton}
            disabled={isUpdatingStatus}
          >
          Approve
          </button>
            {statusActionError && (
              <p>{statusActionError}</p>
            )}
          </div>
        )}
        {view === 'HR' && request.RequestStatus === 'HR Processing' && (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            {deadlineWarning && (
              <p style={{ color: 'red', fontWeight: '600', textDecoration: 'underline' }}>WARNING: The deadline for this request has already passed</p>
            )}
            <button
              onClick={() => {
                if (changedByHR) {
                  setConfirmAction('reapprove');
                } else {
                  setConfirmAction('completed');
                }
                setShowConfirmActionDialog(true);
              } }
              disabled={isUpdatingStatus}
              className={styles.stdButton}
              style={{ width: '176px' }}
            >
              {changedByHR ? 'Reapprove' : 'Mark as completed'}
            </button>
          </div>
        )} 
      </div>

      <div className={requestDetailsStyles.detailsActions}>
        {(displayedRequest.RequestStatus === 'Draft' || displayedRequest.RequestStatus === 'Rejected') && view === 'myView' && (
          <>
            <button
              className={styles.stdButton}
              onClick={() => { setConfirmAction('send'); setShowConfirmActionDialog(true); } }
              style={{width: '171px'}}
            >
              Send for approval
            </button>
        
          <button
            className={styles.stdButton}
            onClick={() => setShowDeleteConfirm(true)}
            style={{width: '171px'}}
          >
            Discard
          </button>
          </>
        )}
      </div>
      
      <CommentsSection
        requestId={request.ID}
        context={context}
      />
    </>
  );
};

export default RequestDetails;