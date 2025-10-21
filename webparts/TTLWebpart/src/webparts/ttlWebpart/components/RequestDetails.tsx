import * as React from 'react';
import { UserRequest, UserRequestItem } from '../Interfaces/TTLInterfaces';
import styles from './TtlWebpart.module.scss';

interface RequestDetailsProps {
  request: UserRequest;
  items: UserRequestItem[];
  onBack: () => void;
  error?: string | null;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ request, items, onBack, error }) => {
  const getItemStatusStyling = (processed: string): string => {
    const statusMap: { [key: string]: string } = {
      'yes': styles.approved,
      'completed': styles.completed,
      'no': styles.pending,
      'pending': styles.pending,
      'in progress': styles.inprogress,
      'rejected': styles.rejected,
      'cancelled': styles.cancelled
    };
    const normalizedStatus = processed?.toLowerCase() || 'pending';
    return statusMap[normalizedStatus] || styles.pending;
  };

  return (
    <div className={styles.ttlDashboard}>
      <div className={styles.detailsHeader}>
        <button className={styles.backButton} onClick={onBack}>
           Back to Requests
        </button>
        <h1>Request Details: {request.Title}</h1>
        <div className={styles.requestSummary}>
          <span><strong>Status:</strong> {request.Status}</span>
          <span><strong>Total Cost:</strong> € {request.TotalCost}</span>
          <span><strong>Project:</strong> {request.Project}</span>
          <br />
          <span><strong>Goal:</strong> {request.Goal}</span>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.detailsTableContainer}>
        <h2>Request Items ({items.length})</h2>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Provider</th>
              <th>Location</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Request Type</th>
              <th>Cost</th>
              <th>Licensing</th>
              <th>License Type</th>
              <th>Users License</th>
              <th>Processed</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.ID}>
                  <td>{item.Title || 'N/A'}</td>
                  <td>{item.Provider || 'N/A'}</td>
                  <td>{item.Location || 'N/A'}</td>
                  <td>{item.StartDate ? new Date(item.StartDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{item.EndDate ? new Date(item.EndDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{item.RequestType}</td>
                  <td>€ {item.Cost || '0'}</td>
                  <td>{item.Licensing}</td>
                  <td>{item.LicenseType}</td>
                  <td>{item.UsersLicense}</td>
                  <td>
                    <span className={`${styles.status} ${getItemStatusStyling(item.Processed)}`}>
                      {item.Processed}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className={styles.noData}>
                  No request items found for this request
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestDetails;
