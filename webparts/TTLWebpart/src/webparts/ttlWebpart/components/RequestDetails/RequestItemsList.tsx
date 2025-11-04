import * as React from 'react';
import { UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import requestDetailsStyles from './RequestDetails.module.scss';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { formatDate } from '../../Helpers/HelperFunctions';

interface Props {
  items: UserRequestItem[];
  onEdit: (item: UserRequestItem) => void;
  onDelete: (item: UserRequestItem) => void;
  onAdd: () => void;
  showActions: boolean;
  request: UserRequest;
  view: "approvers" | "myView" | "HR" | "director"
}


const RequestItemsList: React.FC<Props> = ({ items, onEdit, onDelete, onAdd, showActions, request, view }) => {
  const getUsersLicenseDisplay = (usersLicense: any[] | undefined): string => {
    if (!usersLicense || !Array.isArray(usersLicense) || usersLicense.length === 0) {
        return '/';
    }
  
    return usersLicense.length > 0 ? usersLicense.join(', ') : '/';
  };
  
  const getTypeIcon = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'Software': 'fa-solid fa-computer fa-lg',
      'Training': 'fa-solid fa-user-graduate fa-lg',
      'Travel': 'fa-solid fa-plane-departure fa-lg',
      'Accomodation': 'fa-solid fa-bed fa-lg'
    };
  
    return typeMap[type]|| 'fa-solid fa-question';
  
  }
  
  const getRequestTypeColor = (type: string): string => {
    const colorMap: { [key: string]: string } = {
      'Software': '#e3f2fd',
      'Training': '#f3e5f5',
      'Travel': '#e8f5e8',
      'Accommodation': '#ffc0c0ff'
    };
    return colorMap[type] || '#f5f5f5';
  };

  const renderItemCard = (item: UserRequestItem) => {
    return (
      <div 
        key={item.ID} 
        className={requestDetailsStyles.requestCard}
        style={{ backgroundColor: getRequestTypeColor(item.RequestType!) }}
      >
        <div className={requestDetailsStyles.cardHeader}>
          <div className={requestDetailsStyles.cardTitle}>
            <i className={`${getTypeIcon(item.RequestType!)} ${requestDetailsStyles.typeIcon}`}></i>
            <h3>{item.Title}</h3>
          </div>
          {showActions && (
            <div className={requestDetailsStyles.cardActions}>
              <i className="fa fa-pencil" onClick={() => onEdit(item)} />
              {request.RequestStatus === 'Saved' && (
                <i className="fa fa-trash-o" onClick={() => onDelete(item)} />
              )}
            </div>
          )}
        </div>

        <div className={requestDetailsStyles.cardContent}>
          <div className={requestDetailsStyles.fieldGroup}>
            <span className={requestDetailsStyles.fieldLabel}>Cost:</span>
            <span className={requestDetailsStyles.fieldValue}>€ {item.Cost || '0'}</span>
          </div>

          {item.Provider && (
            <div className={requestDetailsStyles.fieldGroup}>
              <span className={requestDetailsStyles.fieldLabel}>Provider:</span>
              <span className={requestDetailsStyles.fieldValue}>{item.Provider}</span>
            </div>
          )}

          {item.RequestType === 'Software' && (
            <>
              {item.Licensing && (
                <div className={requestDetailsStyles.fieldGroup}>
                  <span className={requestDetailsStyles.fieldLabel}>Licensing:</span>
                  <span className={requestDetailsStyles.fieldValue}>{item.Licensing}</span>
                </div>
              )}
              {item.LicenseType && (
                <div className={requestDetailsStyles.fieldGroup}>
                  <span className={requestDetailsStyles.fieldLabel}>License Type:</span>
                  <span className={requestDetailsStyles.fieldValue}>{item.LicenseType}</span>
                </div>
              )}
              {item.UsersLicense && item.UsersLicense.length > 0 && (
                <div className={requestDetailsStyles.fieldGroup}>
                  <span className={requestDetailsStyles.fieldLabel}>Users:</span>
                  <span className={requestDetailsStyles.fieldValue}>{getUsersLicenseDisplay(item.UsersLicense)}</span>
                </div>
              )}
            </>
          )}

          {item.RequestType !== 'Software' && (
            <>
              {item.Location && (
                <div className={requestDetailsStyles.fieldGroup}>
                  <span className={requestDetailsStyles.fieldLabel}>Location:</span>
                  <span className={requestDetailsStyles.fieldValue}>{item.Location}</span>
                </div>
              )}
              {item.StartDate && (
                <div className={requestDetailsStyles.fieldGroup}>
                  <span className={requestDetailsStyles.fieldLabel}>Start Date:</span>
                  <span className={requestDetailsStyles.fieldValue}>{formatDate(new Date(item.StartDate))}</span>
                </div>
              )}
              {item.OData__EndDate && (
                <div className={requestDetailsStyles.fieldGroup}>
                  <span className={requestDetailsStyles.fieldLabel}>End Date:</span>
                  <span className={requestDetailsStyles.fieldValue}>{formatDate(new Date(item.OData__EndDate))}</span>
                </div>
              )}
            </>
          )}

          {item.Link && (
            <div className={requestDetailsStyles.fieldGroup}>
              <span className={requestDetailsStyles.fieldLabel}>Link:</span>
              <a href={item.Link} target="_blank" rel="noopener noreferrer" className={requestDetailsStyles.link}>
                {item.Link.length > 40 ? `${item.Link.substring(0, 40)}...` : item.Link}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>        
      <div className={requestDetailsStyles.requestCardsContainer}>
        <h2 style={{ textAlign: 'center' }}>Request Items ({items.length})</h2>
        <div className={requestDetailsStyles.cardsGrid}>
          {items.length > 0 ? (
            items.map(renderItemCard)
          ) : (
            <div className={styles.noData}>
              No request items found for this request
            </div>
          )}
          {view === 'myView' && request.RequestStatus === 'Saved' && (
            <div className={requestDetailsStyles.addButtonContainer}>
              <button onClick={onAdd} className={requestDetailsStyles.addButton} title="Add new request item">
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RequestItemsList;
