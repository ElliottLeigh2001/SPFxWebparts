import * as React from 'react';
import type { ITtlWebpartProps } from './ITtlWebpartProps';
import { useEffect, useState } from 'react';
import { getRequestsData, getLoggedInUser, getRequestItemsByRequestId } from '../service/TTLService';
import styles from './TtlWebpart.module.scss';
import { UserRequest, UserRequestItem } from '../Interfaces/TTLInterfaces';
import RequestDetails from './RequestDetails/RequestDetails';
import NewRequestForm from './NewRequest/NewRequest';
import ApproversDashboard from './Approvers/ApproversDashboard';
import HRDashboard from './HR/HRDashboard';

const TTLDashboard: React.FC<ITtlWebpartProps> = ({ context }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>();
  const [newRequest, setNewRequest] = useState<boolean>(false);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showApproversDashboad, setShowApproverDashboard] = useState(false);
  const [showHRDashboad, setShowHRDashboard] = useState(false);

  const getRequestStatusStyling = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'Saved': styles.saved,
      'Unsaved': styles.saved,
      'Sent for approval': styles.sentForApproval,
      'In Process By HR': styles.inProcessByHR,
      'Needs reapproval': styles.needsReapproval,
      'Processed by HR': styles.processedByHR,
      'Declined': styles.declined,
      'Cancelled': styles.declined
    };

    return statusMap[status] || styles.inProcessByHR;
  };

  const fetchRequests = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const [requestData, user] = await Promise.all([
        getRequestsData(context),
        getLoggedInUser(context)
      ]);
      // Only show the requests that the user made
      const filteredRequests = requestData
        .filter(req => req.Author?.Id === user?.Id)
      setRequests(filteredRequests as UserRequest[]);
      setLoggedInUser(user);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load requests data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh both the requests list and the currently selected request + items
  const refreshSelectedRequest = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      // reload requests
      const requestData = await getRequestsData(context)

      const filteredRequests = requestData
        .filter(req => req.Author?.Id === loggedInUser?.Id)
      setRequests(filteredRequests as UserRequest[]);

      // if a request is selected, refresh its data and items
      const selectedId = requestId ?? (selectedRequest as any)?.Id;
      if (selectedId) {
        const refreshedItems = await getRequestItemsByRequestId(context, Number(selectedId));
        setRequestItems(refreshedItems);

        const refreshedRequest = filteredRequests.find(r => (r as any).ID === Number(selectedId));
        if (refreshedRequest) {
          setSelectedRequest(refreshedRequest as UserRequest);
        }
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh request data');
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
  const handleUrlChange = () => {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");

    if (requestId && requests.length > 0) {
      const request = requests.find(req => req.ID === parseInt(requestId));
      if (request && (!selectedRequest || selectedRequest.ID !== request.ID)) {
        handleRequestClick(request);
      }
    } else if (!requestId && selectedRequest) {
      // URL changed to have no requestId, but we have a selected request - go back to dashboard
      setSelectedRequest(null);
      setRequestItems([]);
      setError(null);
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
    
    if (requestId) {
      const request = requests.find(req => req.ID === parseInt(requestId));
      if (request && (!selectedRequest || selectedRequest.ID !== request.ID)) {
        handleRequestClick(request);
      }
    }
  }
}, [requests]);

  useEffect(() => {
    fetchRequests();
  }, [context, refreshTrigger]);

  const handleRequestClick = async (request: UserRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const items = await getRequestItemsByRequestId(context, request.ID);
      setRequestItems(items);
      setSelectedRequest(request);
      window.history.pushState({}, "", `?requestId=${request.ID}`);
    } catch (error) {
      console.error('Error loading request details:', error);
      if (error.status === 404) {
        setError('This request no longer exists');
        // Force refresh the main list
        setRefreshTrigger(prev => prev + 1);
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
    setShowApproverDashboard(false)
    setShowHRDashboard(false)
    setError(null);
    setRefreshTrigger(prev => prev + 1);
    window.history.pushState({}, "", window.location.pathname);
  };

  const handleNewRequestSave = () => {
    setNewRequest(false);
    // Refresh the list after creating a new request
    setRefreshTrigger(prev => prev + 1);
  }

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
        view='myView'
        onBack={handleBackClick}
        onUpdate={refreshSelectedRequest}
        context={context}
        error={error} 
      />
    );
  }
  
  if (newRequest) {
    return (
      <NewRequestForm 
        onSave={handleNewRequestSave} 
        context={context} 
        onCancel={() => setNewRequest(false)} 
      />
    );
  }

  if (showApproversDashboad) {
    return (
      <ApproversDashboard context={context} onBack={handleBackClick}/>
    )
  }

  if (showHRDashboad) {
    return (
      <HRDashboard context={context} onBack={handleBackClick}/>
    )
  }

  return (
    <div className={styles.ttlDashboard}>
      <div className={styles.header}>
        <h1>My Requests</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => setShowApproverDashboard(true)} className={styles.stdButton}>Approver</button>
          <button onClick={() => setShowHRDashboard(true)} className={styles.stdButton}>HR</button>
        </div>
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
                  <td>{request.Project || '/'}</td>
                  <td>€ {request.TotalCost || '0'}</td>
                  <td>
                    <span className={`${styles.status} ${getRequestStatusStyling(request.RequestStatus)}`}>
                      {request.RequestStatus || 'Pending'}
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