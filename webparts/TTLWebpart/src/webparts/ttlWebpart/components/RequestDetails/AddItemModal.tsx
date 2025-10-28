import * as React from 'react';
import { Modal } from '@fluentui/react';
import SoftwareForm from '../Forms/SoftwareForm';
import TrainingForm from '../Forms/TrainingForm';
import TravelForm from '../Forms/TravelForm';
import AccomodationForm from '../Forms/AccomodationForm';
import requestDetailsStyles from './RequestDetails.module.scss';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { useState, useEffect } from 'react';
import newRequestStyles from '../NewRequest/NewRequest.module.scss'

interface Props {
  context: WebPartContext;
  isOpen: boolean;
  isUpdating: boolean;
  onSave: (item: UserRequestItem) => Promise<void>;
  onCancel: () => void;
}

const AddItemModal: React.FC<Props> = ({ context, isOpen, isUpdating, onSave, onCancel }) => {
  const [activeForm, setActiveForm] = useState<'software' | 'training' | 'travel' | 'accomodation' | null>(null);

  // Reset form selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveForm(null);
    }
  }, [isOpen]);

  const handleFormSave = async (item: UserRequestItem): Promise<void> => {
    await onSave(item);
    // Close the modal after successful save
    onCancel();
  };

  const handleFormCancel = (): void => {
    setActiveForm(null);
  };

  const renderFormSelection = (): JSX.Element => (
    <div className={requestDetailsStyles.modalBody}>
      <div className={requestDetailsStyles.formSelection}>
        <button 
          className={requestDetailsStyles.formSelectionButton} 
          onClick={() => setActiveForm('software')}
        >
          Add Software
        </button>
        <button 
          className={requestDetailsStyles.formSelectionButton} 
          onClick={() => setActiveForm('training')}
        >
          Add Training
        </button>
        <button 
          className={requestDetailsStyles.formSelectionButton} 
          onClick={() => setActiveForm('travel')}
        >
          Add Travel
        </button>
        <button 
          className={requestDetailsStyles.formSelectionButton} 
          onClick={() => setActiveForm('accomodation')}
        >
          Add Accommodation
        </button>
      </div>
    </div>
  );

  const renderForm = (): JSX.Element => {
    switch (activeForm) {
      case 'software':
        return (
          <div className={newRequestStyles.modalBody}>
            <SoftwareForm
                context={context}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
                initialData={undefined}
            />
          </div>
        );
      case 'training':
        return (
          <div className={newRequestStyles.modalBody}>
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
          <div className={newRequestStyles.modalBody}>
            <TravelForm
                context={context}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
                initialData={undefined}
            />
          </div>
        );
      case 'accomodation':
        return (
          <div className={newRequestStyles.modalBody}>
            <AccomodationForm
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
      containerClassName={requestDetailsStyles.modalContainer}
    >
      <div className={requestDetailsStyles.modalHeader}>
        <h3>{getModalTitle()}</h3>
        <button 
          className={requestDetailsStyles.modalCloseButton} 
          onClick={onCancel}
        >
        ×
        </button>
      </div>
      
      {renderForm()}
      
      {isUpdating && <div className={requestDetailsStyles.loading}>Adding Item...</div>}
    </Modal>
  );
};

export default AddItemModal;