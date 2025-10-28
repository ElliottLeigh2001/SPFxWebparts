import * as React from 'react';
import { UserRequestItem } from '../../Interfaces/TTLInterfaces';
import requestDetailsStyles from './RequestDetails.module.scss';
import styles from '../TtlWebpart.module.scss';

interface Props {
  items: UserRequestItem[];
  onEdit: (item: UserRequestItem) => void;
  onDelete: (item: UserRequestItem) => void;
  showActions: boolean;
  requestRequestStatus: string | undefined;
}

// const getItemRequestStatusStyling = (processed: boolean): string => {
//   if (processed === true) {
//     return styles.processedByHR
//   }
//   return styles.inProcessByHR;
// };

const getUsersLicenseDisplay = (usersLicense: any[] | undefined): string => {
if (!usersLicense || !Array.isArray(usersLicense) || usersLicense.length === 0) {
    return '/';
}

return usersLicense.length > 0 ? usersLicense.join(', ') : '/';
};

const RequestItemsList: React.FC<Props> = ({ items, onEdit, onDelete, showActions, requestRequestStatus }) => {


  return (
    <div className={requestDetailsStyles.detailsTableContainer}>
      <h2>Request Items ({items.length})</h2>
      <table className={requestDetailsStyles.detailsTable}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Provider</th>
            <th>Request Type</th>
            <th>Location</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Cost</th>
            <th>Licensing</th>
            <th>License Type</th>
            <th>Users License</th>
            <th>Link</th>
            <th>Attachment</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map(item => (
            <tr key={item.ID}>
                <td>{item.Title || '/'}</td>
                <td>{item.Provider || '/'}</td>
                <td>{item.RequestType}</td>
                <td>{item.Location || '/'}</td>
                <td>{item.StartDate ? new Date(item.StartDate).toLocaleDateString() : '/'}</td>
                <td>{item.OData__EndDate ? new Date(item.OData__EndDate).toLocaleDateString() : '/'}</td>
                <td>€ {item.Cost || '0'}</td>
                <td>{item.Licensing || '/'}</td>
                <td>{item.LicenseType || '/'}</td>
                <td>{getUsersLicenseDisplay(item.UsersLicense!)}</td>
                <td>
                  {item.Link ? (
                    <a
                      href={item.Link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.Link}
                      className={requestDetailsStyles.linkCell}
                    >
                      {item.Link.length > 30 ? `${item.Link.substring(0, 30)}...` : item.Link}
                    </a>
                  ) : (
                    '/'
                  )}
                </td>
                <td>{item.Attachments || '/'}</td>
                {showActions && (
                    <td>
                      <i
                          className="fa fa-pencil"
                          style={{ fontSize: '24px', color: 'green', cursor: 'pointer', marginRight: '8px' }}
                          onClick={() => onEdit(item)}
                      />
                    {requestRequestStatus === 'Saved' && (
                      <i
                          className="fa fa-trash-o"
                          style={{ fontSize: '24px', color: 'red', cursor: 'pointer', marginLeft: '8px' }}
                          onClick={() => onDelete(item)}
                      />
                    )}
                    </td>
                )}
                </tr>
            ))
          ) : (
            <tr>
              <td colSpan={(requestRequestStatus === 'Saved'|| requestRequestStatus === 'Needs reapproval') ? 12 : 11} className={styles.noData}>
                No request items found for this request
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestItemsList;
