import * as React from 'react';
import { Modal } from '@fluentui/react';
import SoftwareForm from '../Forms/SoftwareForm';
import TrainingForm from '../Forms/TrainingForm';
import TravelForm from '../Forms/TravelForm';
import modalStyles from './Modals.module.scss';
import AccommodationForm from '../Forms/AccomodationForm';
import { IEditItemModalProps } from './ModalsProps';

const EditItemModal: React.FC<IEditItemModalProps> = ({ context, activeForm, activeFormName, editingItem, isUpdating, view, onSave, onCancel }) => {
  const getModalTitle = () => editingItem ? `Edit ${activeFormName}` : `Add ${activeFormName}`;

  return (
    <>
      <Modal
        isOpen={activeForm === 'software'}
        onDismiss={onCancel}
        isBlocking={false}
        containerClassName={modalStyles.modalContainer}
      >
        <div className={modalStyles.modalHeader}>
          <h3>{getModalTitle()}</h3>
          <button className={modalStyles.modalCloseButton} onClick={onCancel}>×</button>
        </div>
        <div className={modalStyles.modalBody}>
          <SoftwareForm
            context={context}
            onSave={onSave}
            onCancel={onCancel}
            initialData={editingItem}
            view={view}
          />
          {isUpdating && <div className={'loading'}>Updating...</div>}
        </div>
      </Modal>

      <Modal
        isOpen={activeForm === 'training'}
        onDismiss={onCancel}
        isBlocking={false}
        containerClassName={modalStyles.modalContainer}
      >
        <div className={modalStyles.modalHeader}>
          <h3>{getModalTitle()}</h3>
          <button className={modalStyles.modalCloseButton} onClick={onCancel}>×</button>
        </div>
        <div className={modalStyles.modalBody}>
          <TrainingForm
            context={context}
            onSave={onSave}
            onCancel={onCancel}
            initialData={editingItem}
            view={view}
          />
          {isUpdating && <div className={'loading'}>Updating...</div>}
        </div>
      </Modal>

      <Modal
        isOpen={activeForm === 'travel'}
        onDismiss={onCancel}
        isBlocking={false}
        containerClassName={modalStyles.modalContainer}
      >
        <div className={modalStyles.modalHeader}>
          <h3>{getModalTitle()}</h3>
          <button className={modalStyles.modalCloseButton} onClick={onCancel}>×</button>
        </div>
        <div className={modalStyles.modalBody}>
          <TravelForm
            context={context}
            onSave={onSave}
            onCancel={onCancel}
            initialData={editingItem}
            view={view}
          />
          {isUpdating && <div className={'loading'}>Updating...</div>}
        </div>
      </Modal>

      <Modal
        isOpen={activeForm === 'accommodation'}
        onDismiss={onCancel}
        isBlocking={false}
        containerClassName={modalStyles.modalContainer}
      >
        <div className={modalStyles.modalHeader}>
          <h3>{getModalTitle()}</h3>
          <button className={modalStyles.modalCloseButton} onClick={onCancel}>×</button>
        </div>
        <div className={modalStyles.modalBody}>
          <AccommodationForm
            context={context}
            onSave={onSave}
            onCancel={onCancel}
            initialData={editingItem}
            view={view}
          />
          {isUpdating && <div className={'loading'}>Updating...</div>}
        </div>
      </Modal>
    </>
  );
};

export default EditItemModal;
