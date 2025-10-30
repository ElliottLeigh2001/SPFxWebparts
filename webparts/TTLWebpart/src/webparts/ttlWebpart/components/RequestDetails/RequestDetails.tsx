import { WebPartContext } from '@microsoft/sp-webpart-base';
import { useState, useEffect } from 'react';
import EditRequestForm from './EditRequestForm';
import { updateRequestItem, deleteRequestWithItems, updateRequest, deleteRequestItem, recalcAndUpdateRequestTotal, createRequestItemForExistingRequest, updateRequestStatus, getApproverById } from '../../service/TTLService';
import RequestItemsList from './RequestItemsList';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import EditItemModal from './EditItemModal';
import { UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { Modal } from '@fluentui/react';
import styles from '../TtlWebpart.module.scss';
import requestDetailsStyles from './RequestDetails.module.scss';
import * as React from 'react';
import AddItemModal from './AddItemModal';
import ConfirmActionDialog from '../NewRequest/ConfirmActionDialog';
import { sendEmail } from '../../service/AutomateService';

interface RequestDetailsProps {
  request: UserRequest;
  items: UserRequestItem[];
  view: 'myView' | 'approvers' | 'HR';
  onBack: () => void;
  onUpdate: () => void;
  error?: string | null;
  context: WebPartContext;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ 
  request, 
  items, 
  view,
  onBack, 
  onUpdate, 
  error, 
  context 
}) => {
  const [editingItem, setEditingItem] = useState<UserRequestItem | undefined>(undefined);
  const [editingRequest, setEditingRequest] = useState<boolean>(false);
  const [activeForm, setActiveForm] = useState<'software'|'training'|'travel'|'accomodation'|null>(null);
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
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [showConfirmActionDialog, setShowConfirmActionDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve'|'deny'|'send'|'reapprove'|null>(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [changedByHR, setChangedByHR] = useState(false);


  useEffect(() => {
    setDisplayedItems(items || []);
  }, [items]);

  useEffect(() => {
    setDisplayedRequest(request);
    const changed = sessionStorage.getItem(`changedByHR${request.ID}`) === "true";
    setChangedByHR(changed);
  }, [request]);

  const handleEditItem = (item: UserRequestItem): void => {
    setEditingItem(item);
    setActiveForm(item.RequestType?.toLowerCase() as any);
  };

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

    // Approve request function
  const updateRequestApprover = async (type: string, comment?: string): Promise<void> => {
    if (!request.ID) return;
    
    setIsUpdatingStatus(true);
    setStatusActionError(null);
    
    try {
      await updateRequestStatus(context, request.ID, type, comment);
      
      // Show success message or update local state
      setDisplayedRequest(prev => ({ ...prev, RequestStatus: type }));
      
      // Refresh parent component
      if (onUpdate) onUpdate();
      
      // Optionally navigate back after a short delay
      setTimeout(() => {
        onBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error approving request:', error);
      setStatusActionError('Failed to approve request');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateItem = async (updatedItem: UserRequestItem): Promise<void> => {
    if (!editingItem?.ID) return;

    setIsUpdating(true);
    setActionError(null);

    try {
      await updateRequestItem(context, editingItem.ID, updatedItem);

      if (view === 'HR' && updatedItem.Cost !== editingItem.Cost?.toString()) {
        setChangedByHR(true);
        sessionStorage.setItem(`changedByHR${request.ID}`, "true")
      }

      // Optimistically update local list so UI reflects change immediately
      setDisplayedItems(prev => prev.map(i => i.ID === editingItem.ID ? { ...i, ...updatedItem, ID: editingItem.ID } : i));
      // Recalculate and persist total cost
      try {
        const rid = (displayedRequest && (displayedRequest.ID || (displayedRequest as any).Id)) || (request && (request.ID || (request as any).Id));
        if (rid) {
          const newTotal = await recalcAndUpdateRequestTotal(context, Number(rid));
          setDisplayedRequest(prev => ({ ...prev, TotalCost: String(newTotal) }));
          onUpdate();
        }
      } catch (err) {
        console.error('Error recalculating total after update:', err);
      }
      setEditingItem(undefined);
      setActiveForm(null);

    } catch (error) {
      console.error('Error updating item:', error);
      setActionError('Failed to update item');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRequest = async (updatedRequest: UserRequest): Promise<void> => {
    if (!request.ID) return;

    setIsUpdating(true);
    setActionError(null);

    try {
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
    }
  };

  const handleDeleteRequest = async (): Promise<void> => {
    if (!request.ID) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      const itemIds = items.filter(item => item.ID).map(item => item.ID!) as number[];
      await deleteRequestWithItems(context, request.ID, itemIds);
      
      // Navigate back after successful deletion and refresh parent component
      onBack();
    } catch {
      setActionError('Failed to delete request');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
    setActionError(null);
    try {
      await deleteRequestItem(context, selectedItemToDelete.ID!);
      // Remove from list in this component to reflect action in UI
      setDisplayedItems(prev => prev.filter(i => i.ID !== selectedItemToDelete.ID));
      // Recalculate and persist total cost
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
    }
  }

  const closeModal = (): void => {
    setActiveForm(null);
    setEditingItem(undefined);
    setEditingRequest(false);
    setShowAddModal(false);
  };

  const showComment = (): void => {
    setShowCommentBox(prev => !prev);
  };

  return (
    <>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
    <div className={styles.ttlDashboard} onClick={() => {showCommentBox === true && showComment()}}>
      <div className={requestDetailsStyles.detailsHeader}>
        <div style={{position: 'absolute', left: '20px'}}>
          <button className={requestDetailsStyles.backButton} onClick={onBack}>
            ← Back
          </button>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px'}}>
          <h1>Request Details: {displayedRequest.Title}</h1>
        </div>
        <>
          <div className={requestDetailsStyles.detailsActions}>
            {request.OData__Comments && (

              <div className={requestDetailsStyles.commentWrapper}>
                <button
                  className={showCommentBox ? requestDetailsStyles.filledIconButton : requestDetailsStyles.iconButton}
                  onClick={() => {showCommentBox === false && showComment()}}
                  title="View comment"
                >
                  <i className="fa fa-comment" aria-hidden="true"></i>
                </button>

                {showCommentBox && (
                  <div className={requestDetailsStyles.commentBox}>
                    <p style={{fontSize: '18px'}}><strong>Comment:</strong></p>
                    <p className={requestDetailsStyles.commentPlaceholder}>
                      {request.OData__Comments}
                    </p>
                  </div>
                )}
              </div>
            )}
        {(displayedRequest.RequestStatus === 'Saved') && (
          <>
            <button
              className={requestDetailsStyles.iconButton}
              onClick={() => { setConfirmAction('send'); setShowConfirmActionDialog(true); } }
              title="Send for approval"
            >
              <i className="fa fa-paper-plane" aria-hidden="true"></i>
            </button>
            <button
              className={requestDetailsStyles.iconButton}
              onClick={() => setEditingRequest(true)}
              title="Edit"
            >
                <i className="fa fa-pencil" aria-hidden="true"></i>
            </button>
            </>
        )}
        {(displayedRequest.RequestStatus === 'Saved'  || displayedRequest.RequestStatus === 'Declined') && (
          <button
            className={requestDetailsStyles.iconButton}
            onClick={() => setShowDeleteConfirm(true)}
            title="Discard"
          >
            <i className="fa fa-trash" aria-hidden="true"></i>
          </button>
        )}
        </div>
      </>

        <div className={requestDetailsStyles.requestSummary}>
            {view !== 'myView' && (
              <span><strong>Requester:</strong> {request.Author?.Title || '/'}</span>
            )}
            {view === 'HR' && (
              <span><strong>Approver:</strong> {request.ApproverID?.Title || '/'}</span>
            )}
          <span><strong>Status:</strong> {displayedRequest.RequestStatus}</span>
          <span><strong>Total Cost:</strong> € {displayedRequest.TotalCost}</span>
          <span><strong>Project:</strong> {displayedRequest.Project}</span>
          <span><strong>Goal:</strong> {displayedRequest.Goal}</span>
        </div>
      </div>

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
          {isUpdating && <div className={styles.loading}>Updating...</div>}
        </div>
      </Modal>

      <EditItemModal
        context={context}
        activeForm={activeForm}
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

      <RequestItemsList
        items={displayedItems}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        showActions={(displayedRequest.RequestStatus === 'Saved' || view === 'HR')}
        requestRequestStatus={displayedRequest.RequestStatus}
      />

      <ConfirmActionDialog
          isOpen={showConfirmActionDialog}
          action={confirmAction}
          isProcessing={confirmProcessing}
          onCancel={() => { setShowConfirmActionDialog(false); setConfirmAction(null); }}
          onConfirm={async (comment) => {
              if (!confirmAction) return;
              setConfirmProcessing(true);
              try {
                  if (confirmAction === 'approve') {
                    if (view === 'approvers') {
                      await updateRequestApprover('In process by HR');
                      await sendEmail({emailType: 'HR', requestId: request.ID.toString(), title: request.Title, author: request.Author?.EMail, approver: request.ApproverID?.Title})
                    }
                    else if (view === 'HR') {
                      await updateRequestApprover('Approved')
                      await sendEmail({emailType: 'approved', title: request.Title, author: request.Author?.EMail, approver: request.ApproverID?.Title})
                    }
                  } 
                  else if (confirmAction === 'deny') {
                    await updateRequestApprover('Declined', comment);
                    await sendEmail({emailType: "deny", title: request.Title, author: request.Author?.EMail, comment: comment})
                  }
                  else if (confirmAction === 'send') {
                    await updateRequestApprover('Sent for approval')
                    const approverData = await getApproverById(context, Number(request.ApproverID?.Id));
                    const approverEmail = approverData?.TeamMember?.EMail;
                    const approverTitle = approverData?.TeamMember?.Title;
                    await sendEmail({ emailType: "new request", requestId: request.ID.toString(), title: request.Title, author: request.Author?.EMail, approver: approverEmail, approverTitle: approverTitle });
                  }
                  else if (confirmAction === 'reapprove') {
                    await updateRequestApprover('Needs reapproval', comment)
                  }
              } finally {
                  setConfirmProcessing(false);
                  setShowConfirmActionDialog(false);
                  setConfirmAction(null);
                  sessionStorage.removeItem(`changedByHR${request.ID}`)
              }
          }}
      />
    </div>
      <div className={styles.newRequestButtonContainer}>
        {view === 'myView' && request.RequestStatus === 'Saved' && (
          <button onClick={() => setShowAddModal(true)} className={styles.stdButton}>Add item</button>
        )}
        {view !== 'myView' && (

          <div style={{display: 'flex', gap: '20px'}}>
          <button
            onClick={() => {
              if (changedByHR) {
                setConfirmAction('reapprove');
              } else {
                setConfirmAction('approve');
              }
              setShowConfirmActionDialog(true);
            }}
            className={requestDetailsStyles.approveButton}
            disabled={isUpdatingStatus}
          >
          {changedByHR ? 'Reapprove' : 'Approve'}
          </button>
            <button 
              onClick={() => {setConfirmAction('deny'); setShowConfirmActionDialog(true)}}
              className={requestDetailsStyles.declineButton}
              disabled={isUpdatingStatus}
            >
              Deny
            </button>
            {statusActionError && (
              <p>{statusActionError}</p>
            )}
          </div>
        )} 
      </div>
    </>
  );
};

export default RequestDetails;