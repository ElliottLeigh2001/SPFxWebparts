import * as React from 'react';
import { useEffect, useState } from 'react';
import { UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId } from '../../service/TTLService';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from './TtlWebpart.module.scss';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import DashboardComponent from './DashboardComponent';

interface HRProps {
  context: WebPartContext;
  onBack: () => void;
  isHR: boolean;
}

const HRDashboard: React.FC<HRProps> = ({ context, onBack, isHR }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'awaitingApproval' | 'toApprove' | 'approved'>('toApprove');

  const fetchRequests = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Only get requests from the past 2 years
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 730);
      const isoDate = pastDate.toISOString();

      const requestData = await getRequestsData(context, "SubmissionDate desc", `(SubmissionDate ge datetime'${isoDate}')`);


      setRequests(requestData as UserRequest[]);

      const selectedId = requestId ?? (selectedRequest as any)?.Id;
      if (selectedId) {
        const refreshedItems = await getRequestItemsByRequestId(context, Number(selectedId));
        setRequestItems(refreshedItems);

        const refreshedRequest = requestData.find(r => (r as any).ID === Number(selectedId));
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
    setActiveTab('approved')
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

  let filteredRequests = requests.filter(req => {
    if (activeTab === 'toApprove') {
      return req.RequestStatus === 'In process by HR';
    } else if (activeTab === 'awaitingApproval') {
      return (
        req.RequestStatus === 'Sent for approval' ||
        req.RequestStatus === 'Awaiting CEO approval' ||
        req.RequestStatus === 'Needs reapproval'
      );
    } else {
      return req.RequestStatus === 'Booking' || req.RequestStatus === 'Completed';
    }
  });

  if (activeTab === 'approved') {
    filteredRequests = filteredRequests.sort((a, b) => {
      const order: Record<string, number>  = {
        'Booking': 1,
        'Completed': 2,
      };
      return order[a.RequestStatus] - order[b.RequestStatus];
    });
  }


  return (
    <div className={styles.ttlDashboard}>
      {isHR ? (
        <>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>Back</button>
          <h1 style={{ fontSize: '30px' }}>HR Dashboard</h1>
        </div>
        <div className={styles.tabContainer}>
          <div className={styles.tabButtonWrapper}>
            <div
              className={`${styles.activeBg} ${
                activeTab === 'awaitingApproval'
                  ? styles.slideLeft
                  : activeTab === 'toApprove'
                  ? styles.slideCenter
                  : styles.slideRight
              }`}
            ></div>

            <button
              className={`${styles.tabButtonAwaiting} ${activeTab === 'awaitingApproval' ? styles.activeTabText : ''}`}
              onClick={() => setActiveTab('awaitingApproval')}
            >
              Awaiting Approval
            </button>

            <button
              className={`${styles.tabButtonToApprove} ${activeTab === 'toApprove' ? styles.activeTabText : ''}`}
              onClick={() => setActiveTab('toApprove')}
            >
              To Approve
            </button>

            <button
              className={`${styles.tabButtonApproved} ${activeTab === 'approved' ? styles.activeTabText : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved
            </button>
          </div>
        </div>

        {error && <div className={styles.error}><p>{error}</p></div>}
  
        <DashboardComponent
          onClick={handleRequestClick}
          requests={filteredRequests}
          view='HR'
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

export default HRDashboard;