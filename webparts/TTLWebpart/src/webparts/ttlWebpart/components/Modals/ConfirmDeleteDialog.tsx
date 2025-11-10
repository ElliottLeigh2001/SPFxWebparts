import * as React from 'react';
import { Modal } from '@fluentui/react';
import requestDetailsStyles from '../RequestDetails/RequestDetails.module.scss'

interface Props {
  isOpen: boolean;
  isDeleting: boolean;
  itemName?: string | null;
  onCancel: () => void;
  onConfirmItemDelete: () => void;
  onConfirmRequestDelete: () => void;
}

const ConfirmDeleteDialog: React.FC<Props> = ({ isOpen, isDeleting, itemName, onCancel, onConfirmItemDelete, onConfirmRequestDelete }) => {
  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onCancel}
      isBlocking={true}
      containerClassName={requestDetailsStyles.modalContainer}
    >
      <div className={requestDetailsStyles.modalHeader}>
        <h3>Confirm Delete</h3>
        <button className={requestDetailsStyles.modalCloseButton} onClick={onCancel}>×</button>
      </div>
      <div className={requestDetailsStyles.modalBody}>
        {itemName ? (
          <>
            <p>Are you sure you want to delete the item "{itemName}"? This action cannot be undone.</p>
            <div className={requestDetailsStyles.modalActions}>
              <button
                className={requestDetailsStyles.deleteButton}
                onClick={onConfirmItemDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                className={requestDetailsStyles.cancelButton}
                onClick={onCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Are you sure you want to delete this request and all its items? This action cannot be undone.</p>
            <div className={requestDetailsStyles.modalActions}>
              <button
                className={requestDetailsStyles.deleteButton}
                onClick={onConfirmRequestDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                className={requestDetailsStyles.cancelButton}
                onClick={onCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmDeleteDialog;
