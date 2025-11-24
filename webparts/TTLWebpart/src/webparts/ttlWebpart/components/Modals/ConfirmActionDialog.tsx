import * as React from 'react';
import { Modal } from '@fluentui/react';
import newRequestStyles from '../NewRequest/NewRequest.module.scss';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { useState } from 'react';
import { ConfirmActionDialogProps, messages, titles } from './ModalsProps';

const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({ isOpen, action, isProcessing, onCancel, onConfirm }) => {
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('');
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
            <label>Add a comment *</label>
            <textarea name="comment" id="comment" value={comment} onChange={e => setComment(e.target.value)} required></textarea>
            {commentError && <div className={styles.validationError}>{commentError}</div>}
          </>
        )}
        {(action === 'approve') && (
          <>
            <label>Add a comment (optional)</label>
            <textarea name="comment" id="comment" value={comment} onChange={e => setComment(e.target.value)} className={commentError ? styles.invalid : ''}></textarea>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 25 }}>
          <button className={styles.cancelButton} onClick={onCancel} disabled={isProcessing}>Cancel</button>
          <button
            className={styles.saveButton}
            onClick={() => {
              if ((action === 'deny' || action === 'reapprove') && !comment.trim()) {
                setCommentError('Please enter a comment')
                return;
              }

              onConfirm(comment);
            }}
            disabled={isProcessing}
          >
            Confirm
          </button>

        </div>
      </div>
    </Modal>
  );
};

export default ConfirmActionDialog;
