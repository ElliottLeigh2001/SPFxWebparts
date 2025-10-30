import * as React from 'react';
import { useEffect, useState } from 'react';
import { UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId } from '../../service/TTLService';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from '../TtlWebpart.module.scss';
import { WebPartContext } from '@microsoft/sp-webpart-base';

interface HRProps {
  context: WebPartContext;
  onBack: () => void;
}

const HRDashboard: React.FC<HRProps> = ({ context, onBack }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const requestData = await getRequestsData(context);

      const filteredRequests = requestData
        .filter(req => req.RequestStatus === 'In process by HR');
      setRequests(filteredRequests as UserRequest[]);

      const selectedId = requestId ?? (selectedRequest as any)?.Id;
      if (selectedId) {
        const refreshedItems = await getRequestItemsByRequestId(context, Number(selectedId));
        setRequestItems(refreshedItems);

        const refreshedRequest = filteredRequests.find(r => (r as any).ID === Number(selectedId));
        if (refreshedRequest) {
          setSelectedRequest(refreshedRequest as UserRequest);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load requests data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL changes for request selection
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const requestId = params.get("requestId");
      const view = params.get("view");

      // Only handle if we're in HR view and have a requestId
      if (view === "HR" && requestId && requests.length > 0) {
        const request = requests.find(req => req.ID === parseInt(requestId));
        if (request && (!selectedRequest || selectedRequest.ID !== request.ID)) {
          handleRequestClick(request, false); // Don't push state to avoid infinite loop
        }
      } else if (view === "HR" && !requestId && selectedRequest) {
        // URL changed to have no requestId, but we have a selected request - go back to HR list
        handleBackClick(false); // Don't push state
      }
    };

    // Check URL on initial load
    handleUrlChange();

    // Listen for URL changes (back/forward buttons)
    window.addEventListener("popstate", handleUrlChange);
    
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, [requests, selectedRequest]);

  // Also check URL when requests change
  useEffect(() => {
    if (requests.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const requestId = params.get("requestId");
      const view = params.get("view");
      
      if (view === "HR" && requestId) {
        const request = requests.find(req => req.ID === parseInt(requestId));
        if (request && (!selectedRequest || selectedRequest.ID !== request.ID)) {
          handleRequestClick(request, false);
        }
      }
    }
  }, [requests]);

  useEffect(() => {
    fetchRequests();
  }, [context]);

  const handleRequestClick = async (request: UserRequest, pushState: boolean = true) => {
    try {
      setIsLoading(true);
      setError(null);

      const items = await getRequestItemsByRequestId(context, request.ID);
      setRequestItems(items);
      setSelectedRequest(request);

      // Update URL for HR request details
      if (pushState) {
        window.history.pushState({}, "", `?view=HR&requestId=${request.ID}`);
      }

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

  const handleBackClick = (pushState: boolean = true) => {
    setSelectedRequest(null);
    setRequestItems([]);
    setError(null);
    
    // Update URL back to HR dashboard (without requestId)
    if (pushState) {
      window.history.pushState({}, "", `?view=HR`);
    }
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
        view='HR'
        onBack={() => handleBackClick(true)}
        onUpdate={handleStatusUpdate}
        context={context}
        error={error} 
      />
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      <div className={styles.header}>
        <button style={{position: 'absolute', left: '20px', top: '20px'}} className={styles.stdButton} onClick={onBack}>← Back</button>
        <h1>HR Dashboard</h1>
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
              <th>Approver</th>
              <th>Total Cost</th>
              <th>Project</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <tr 
                  key={request.ID} 
                  className={styles.requestRow}
                  onClick={() => handleRequestClick(request, true)}
                >
                  <td>{request.Title}</td>
                  <td>{request.Author?.Title || '/'}</td>
                  <td>{request.ApproverID?.Title || 'No approver found'}</td>
                  <td>€ {request.TotalCost || '0'}</td>
                  <td>{request.Project || 'No project found'}</td>
                  <td>{request.TeamID?.Title || 'No team found'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.noData}>
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

export default HRDashboard;