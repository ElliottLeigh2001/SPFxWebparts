import * as React from 'react';
import { Modal } from '@fluentui/react';
import TrainingForm from '../Forms/TrainingForm';
import TravelForm from '../Forms/TravelForm';
import requestDetailsStyles from '../RequestDetails/RequestDetails.module.scss'
import modalStyles from './Modals.module.scss';
import { IUserRequestItem } from '../../Interfaces/TTLInterfaces';
import { useState, useEffect } from 'react';
import AccommodationForm from '../Forms/AccomodationForm';
import { AddItemModalProps } from './ModalsProps';

const AddItemModal: React.FC<AddItemModalProps> = ({ context, isOpen, onSave, onCancel }) => {
  const [activeForm, setActiveForm] = useState<'training' | 'travel' | 'accommodation' | null>(null);

  // Reset form selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveForm(null);
    }
  }, [isOpen]);

  const handleFormSave = async (item: IUserRequestItem): Promise<void> => {
    await onSave(item);
    // Close the modal after successful save
    onCancel();
  };

  const handleFormCancel = (): void => {
    setActiveForm(null);
  };

  // Render a form based on the chosen item 
  const renderFormSelection = (): JSX.Element => (
    <div className={modalStyles.modalBody}>
      <div className={requestDetailsStyles.formSelection}>
        <button 
          className={requestDetailsStyles.formSelectionButton} 
          onClick={() => setActiveForm('training')}
        >
          Training
        </button>
        <button 
          className={requestDetailsStyles.formSelectionButton} 
          onClick={() => setActiveForm('travel')}
        >
          Travel
        </button>
        <button 
          className={requestDetailsStyles.formSelectionButton} 
          onClick={() => setActiveForm('accommodation')}
        >
          Accommodation
        </button>
      </div>
    </div>
  );

  const renderForm = (): JSX.Element => {
    switch (activeForm) {
      case 'training':
        return (
          <div className={modalStyles.modalBody}>
            <TrainingForm
                context={context}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
                initialData={undefined}
            />
          </div>
        );
      case 'travel':
        return (
          <div className={modalStyles.modalBody}>
            <TravelForm
                context={context}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
                initialData={undefined}
            />
          </div>
        );
      case 'accommodation':
        return (
          <div className={modalStyles.modalBody}>
            <AccommodationForm
                context={context}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
                initialData={undefined}
            />
          </div>
        );
      default:
        return renderFormSelection();
    }
  };

  const getModalTitle = (): string => {
    if (activeForm) {
      return `Add ${activeForm.charAt(0).toUpperCase() + activeForm.slice(1)}`;
    }
    return 'Add New Item';
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onCancel}
      isBlocking={false}
      containerClassName={modalStyles.modalContainer}
    >
      <div className={modalStyles.modalHeader}>
        <h3>{getModalTitle()}</h3>
        <button 
          className={modalStyles.modalCloseButton} 
          onClick={onCancel}
        >
        ×
        </button>
      </div>
      
      {renderForm()}
      
    </Modal>
  );
};

export default AddItemModal;