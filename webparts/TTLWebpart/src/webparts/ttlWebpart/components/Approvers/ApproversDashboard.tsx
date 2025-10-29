import * as React from 'react';
import { useEffect, useState } from 'react';
import { UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId } from '../../service/TTLService';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from '../TtlWebpart.module.scss';
import { WebPartContext } from '@microsoft/sp-webpart-base';

interface ApproversProps {
  context: WebPartContext;
  onBack: () => void;
}

const ApproversDashboard: React.FC<ApproversProps> = ({ context, onBack }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const requestData = await getRequestsData(context);

      const filteredRequests = requestData
        .filter(req => req.RequestStatus === 'Sent for approval' || req.RequestStatus === 'Needs reapproval' );
      setRequests(filteredRequests as UserRequest[]);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load requests data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [context]);

  const handleRequestClick = async (request: UserRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const items = await getRequestItemsByRequestId(context, request.ID);
      setRequestItems(items);
      setSelectedRequest(request);

    } catch (error) {
      console.error('Error loading request details:', error);
      if (error.status === 404) {
        setError('This request no longer exists');
      } else {
        setError('Failed to load request details');
      }
      setRequestItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    setSelectedRequest(null);
    setRequestItems([]);
    setError(null);
  };

  // Handle status update and refresh the list
  const handleStatusUpdate = async (): Promise<void> => {
    await fetchRequests();
  };

  if (isLoading) {
    return (
      <div className={styles.ttlDashboard}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error && !selectedRequest) {
    return (
      <div className={styles.ttlDashboard}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <RequestDetails   
        request={selectedRequest}
        items={requestItems}
        view='approver'
        onBack={handleBackClick}
        onUpdate={handleStatusUpdate}
        context={context}
        error={error} 
      />
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      <div className={styles.header}>
        <button style={{position: 'absolute', left: '0'}} className={styles.stdButton} onClick={onBack}>← Back</button>
        <h1>Approver Dashboard</h1>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.requestsTable}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Requester</th>
              <th>Total Cost</th>
              <th>Project</th>
              <th>Team</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <tr 
                  key={request.ID} 
                  className={styles.requestRow}
                  onClick={() => handleRequestClick(request)}
                >
                  <td>{request.Title}</td>
                  <td>{request.Author?.Title || '/'}</td>
                  <td>€ {request.TotalCost || '0'}</td>
                  <td>{request.Project || '/'}</td>
                  <td>{request.TeamID?.Title || 'No team found'}</td>
                  <td>{request.RequestStatus || 'Sent for approval'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={styles.noData}>
                  No requests to approve. Check back later.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ApproversDashboard;