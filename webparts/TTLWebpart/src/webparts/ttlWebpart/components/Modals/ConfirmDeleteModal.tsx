import * as React from 'react';
import { Modal } from '@fluentui/react';
import requestDetailsStyles from '../RequestDetails/RequestDetails.module.scss'
import modalStyles from './Modals.module.scss';
import { IConfirmDeleteModalProps } from './ModalsProps';

const ConfirmDeleteModal: React.FC<IConfirmDeleteModalProps> = ({ isOpen, isDeleting, itemName, onCancel, onConfirmItemDelete, onConfirmRequestDelete }) => {
  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onCancel}
      isBlocking={true}
      containerClassName={modalStyles.modalContainer}
    >
      <div className={modalStyles.modalHeader}>
        <h3>Confirm Delete</h3>
        <button className={modalStyles.modalCloseButton} onClick={onCancel}>×</button>
      </div>
      <div className={modalStyles.modalBody}>
        {itemName ? (
          <>
            <p>Are you sure you want to delete the item "{itemName}"? This action cannot be undone.</p>
            <div className={modalStyles.modalActions}>
              <button
                className={requestDetailsStyles.cancelButton}
                onClick={onCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={requestDetailsStyles.deleteButton}
                onClick={onConfirmItemDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Are you sure you want to delete this request and all its items? This action cannot be undone.</p>
            <div className={modalStyles.modalActions}>
              <button
                className={requestDetailsStyles.deleteButton}
                onClick={onConfirmRequestDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
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

export default ConfirmDeleteModal;
