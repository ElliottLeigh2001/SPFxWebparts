import * as React from 'react';
import type { ITtlWebpartProps } from './ITtlWebpartProps';
import { useEffect, useState } from 'react';
import { getRequestsData, getLoggedInUser, getRequestItemsByRequestId } from '../service/TTLService';
import styles from './TtlWebpart.module.scss';
import { UserRequest, UserRequestItem } from '../Interfaces/TTLInterfaces';
import RequestDetails from './RequestDetails';
import NewRequestForm from './NewRequest';

const TTLDashboard: React.FC<ITtlWebpartProps> = ({ context }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [newRequest, setNewRequest] = useState<boolean>(false);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusStyling = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'approved': styles.approved,
      'completed': styles.completed,
      'pending': styles.pending,
      'in progress': styles.inprogress,
      'rejected': styles.rejected,
      'cancelled': styles.cancelled,
      'draft': styles.draft
    };
    
    const normalizedStatus = status?.toLowerCase() || 'pending';
    return statusMap[normalizedStatus] || styles.pending;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [requestData, user] = await Promise.all([
          getRequestsData(context),
          getLoggedInUser(context)
        ]);
        const filteredRequests = requestData.filter(req => req.Author.Id === user?.Id);
        setRequests(filteredRequests);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load requests data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [context]);

  const handleRequestClick = async (request: UserRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const items = await getRequestItemsByRequestId(context, request.ID);

      setRequestItems(items);
      setSelectedRequest(request);
      
      if (items.length === 0) {
        setError('No request items found for this request');
      }
    } catch {
      setError('Failed to load request details');
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
      <RequestDetails request={selectedRequest} items={requestItems} onBack={handleBackClick} error={error} />
    );
  }
  
  if (newRequest) {
    return (
      <NewRequestForm context={context} onCancel={() => setNewRequest(false)} />
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      <div className={styles.header}>
        <h1>My Requests</h1>
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
              <th>Project</th>
              <th>Total Cost</th>
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
                  <td>{request.Project || 'N/A'}</td>
                  <td>€ {request.TotalCost || '0'}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusStyling(request.Status)}`}>
                      {request.Status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={styles.noData}>
                  You don't have any requests yet. Click "Make New Request" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.newRequestButtonContainer}>
        <button className={styles.stdButton} onClick={() => setNewRequest(true)}>Make New Request</button>
      </div>
    </div>
  );
}

export default TTLDashboard;