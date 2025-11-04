import * as React from 'react';
import { Modal } from '@fluentui/react';
import newRequestStyles from './NewRequest.module.scss';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { useState } from 'react';

type ActionType = 'save' | 'send' | 'discard' | 'approve' | 'reapprove' | 'deny' | 'completed';

interface Props {
  isOpen: boolean;
  action: ActionType | null;
  isProcessing?: boolean;
  onCancel: () => void;
  onConfirm: (comment?: string) => void;
}

const titles: Record<ActionType, string> = {
  save: 'Confirm Save',
  send: 'Confirm Send',
  discard: 'Confirm Discard',
  approve: 'Confirm Approval',
  reapprove: 'Confirm Reapprove',
  deny: 'Confirm Denial',
  completed: 'Confirm Booking'
};

const messages: Record<ActionType, string> = {
  save: 'Are you sure you want to save this request? You still can edit it later but it will not be sent for approval.',
  send: 'Are you sure you want to send this request for approval? This will notify approvers and you will not be able to edit this request.',
  discard: 'Are you sure you want to discard this request? This cannot be undone.',
  approve: 'Are you sure you want to approve this request?',
  reapprove: 'Are you sure you want to send this request for reapproval?',
  deny: 'Are you sure you want to deny this request?',
  completed: 'Are you sure you want to mark this request as booked?'
};

const ConfirmActionDialog: React.FC<Props> = ({ isOpen, action, isProcessing, onCancel, onConfirm }) => {
  const [comment, setComment] = useState('')
  if (!action) return null;

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onCancel}
      isBlocking={true}
      containerClassName={newRequestStyles.modalContainer}
    >
      <div className={newRequestStyles.modalHeader}>
        <h3>{titles[action]}</h3>
        <button className={newRequestStyles.modalCloseButton} onClick={onCancel}>×</button>
      </div>
      <div className={newRequestStyles.confirmationBody}>
        <p>{messages[action]}</p>
        {(action === 'deny' || action === 'reapprove') && (
          <>
            <label>Add a comment (optional)</label>
            <textarea name="comment" id="comment" value={comment} onChange={e => setComment(e.target.value)}></textarea>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 25 }}>
          <button className={styles.saveButton} onClick={() => onConfirm(comment)} disabled={isProcessing}>
            Confirm
          </button>
          <button className={styles.cancelButton} onClick={onCancel} disabled={isProcessing}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmActionDialog;
