import * as React from 'react';
import { useEffect, useState } from 'react';
import { UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId } from '../../service/TTLService';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from './TtlWebpart.module.scss';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import DashboardComponent from './DashboardComponent';

interface ApproversProps {
  context: WebPartContext;
  onBack: () => void;
  loggedInUser: any;
  isApprover: boolean;
}

const ApproversDashboard: React.FC<ApproversProps> = ({ context, onBack, loggedInUser, isApprover }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all requests for approvers
  const fetchData = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      // Only get requests with the correct statuses for approver
      const requestData = await getRequestsData(context, "(RequestStatus eq 'Sent for approval' or RequestStatus eq 'Needs reapproval')");

      // Filter on requests meant for the approver
      const filteredRequests = requestData
        .filter(req => req.ApproverID?.Title === loggedInUser.Title)
      setRequests(filteredRequests as UserRequest[]);

      // Get items after an update in any child component to the UI always stays up to date
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

      // Only handle if we're in approvers view and have a requestId
      if (view === "approvers" && requestId && requests.length > 0) {
        const request = requests.find(req => req.ID === parseInt(requestId));
        if (request && (!selectedRequest || selectedRequest.ID !== request.ID)) {
          handleRequestClick(request, false); // Don't push state to avoid infinite loop
        }
      } else if (view === "approvers" && !requestId && selectedRequest) {
        // URL changed to have no requestId, but we have a selected request - go back to approvers list
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
      
      if (view === "approvers" && requestId) {
        const request = requests.find(req => req.ID === parseInt(requestId));
        if (request && (!selectedRequest || selectedRequest.ID !== request.ID)) {
          handleRequestClick(request, false);
        }
      }
    }
  }, [requests]);

  useEffect(() => {
    fetchData();
  }, [context]);

  const handleRequestClick = async (request: UserRequest, pushState: boolean = true) => {
    try {
      setIsLoading(true);
      setError(null);

      const items = await getRequestItemsByRequestId(context, request.ID);
      setRequestItems(items);
      setSelectedRequest(request);

      // Update URL for approvers request details
      if (pushState) {
        window.history.pushState({}, "", `?view=approvers&requestId=${request.ID}`);
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
    
    // Update URL back to approvers dashboard (without requestId)
    if (pushState) {
      window.history.pushState({}, "", `?view=approvers`);
    }
  };

  // Handle status update and refresh the list
  const handleStatusUpdate = async (): Promise<void> => {
    await fetchData();
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
        view='approvers'
        onBack={() => handleBackClick(true)}
        onUpdate={handleStatusUpdate}
        context={context}
        error={error} 
      />
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      {isApprover ? (
        <>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>Back</button>
          <h1 style={{fontSize: '30px'}}>Approver Dashboard</h1>
        </div>
  
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}
  
        <DashboardComponent
          onClick={handleRequestClick}
          requests={requests}
          view='approvers'
        />
      </>
      ) : (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <h2>You don't have the correct permissions to access to this page</h2>
        </div>
      )}
    </div>
  );
}

export default ApproversDashboard;