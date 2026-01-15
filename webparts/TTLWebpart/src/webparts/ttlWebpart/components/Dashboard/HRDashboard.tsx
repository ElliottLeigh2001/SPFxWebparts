import * as React from 'react';
import { useEffect, useState } from 'react';
import { IUserRequest, IUserRequestItem } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId } from '../../service/TTLService';
import { attachUrlHandlers, loadRequestDetails, goBack } from '../../Helpers/HelperFunctions';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from './TtlWebpart.module.scss';
import DashboardComponent from './DashboardComponent';
import { IHRDashboardProps } from './DashboardProps';
import HeaderComponent from '../Header/HeaderComponent';

const HRDashboard: React.FC<IHRDashboardProps> = ({ context, onBack, isHR }) => {
  const [requests, setRequests] = useState<IUserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<IUserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<IUserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'awaitingApproval' | 'allRequests' | 'approved'>('approved');

  // Get requests data
  const fetchRequests = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Only get requests from the past 2 years and set the state
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 730);
      const isoDate = pastDate.toISOString();
      const requestData = await getRequestsData(context, "SubmissionDate desc", `(SubmissionDate ge datetime'${isoDate}')`);
      setRequests(requestData as IUserRequest[]);

      const selectedId = requestId ?? (selectedRequest as any)?.Id;
      if (selectedId) {
        const refreshedItems = await getRequestItemsByRequestId(context, Number(selectedId));
        setRequestItems(refreshedItems);

        const refreshedRequest = requestData.find(r => (r as any).ID === Number(selectedId));
        if (refreshedRequest) {
          setSelectedRequest(refreshedRequest as IUserRequest);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load requests data');
    } finally {
      setIsLoading(false);
    }
  };

  // Attach URL handlers that sync selection with `?view=HR&requestId=...`
  useEffect(() => {
    return attachUrlHandlers({
      viewName: 'HR',
      requests,
      selectedRequest,
      onRequestClick: handleRequestClick,
      onBackClick: handleBackClick
    });
  }, [requests, selectedRequest]);

  useEffect(() => {
    fetchRequests();
  }, [context]);

  // Handle a click on a request
  const handleRequestClick = async (request: IUserRequest, pushState: boolean = true) => {
    await loadRequestDetails({
      context,
      request,
      getRequestItemsByRequestId,
      setIsLoading,
      setError,
      setRequestItems,
      setSelectedRequest,
      pushState,
      viewName: 'HR'
    });
  };

  // Handle back navigation
  const handleBackClick = (pushState: boolean = true) => {
    goBack({ setSelectedRequest, setRequestItems, setError, pushState, viewName: 'HR' });
  };

  if (isLoading) {
    return (
      <div className={styles.ttlDashboard}>
        <HeaderComponent view='HR Dashboard'/>
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
        HRTab={activeTab}
        onBack={() => handleBackClick(true)}
        onUpdate={fetchRequests}
        context={context}
        error={error} 
      />
    );
  }

  let filteredRequests = requests.filter(req => {
    if (activeTab === 'allRequests') {
      return requests;
    } else if (activeTab === 'awaitingApproval') {
      return (
        req.RequestStatus === 'Submitted' ||
        req.RequestStatus === 'Awaiting CEO approval' ||
        req.RequestStatus === 'Resubmitted'
      );
    } else {
      return req.RequestStatus === 'HR Processing' || req.RequestStatus === 'Completed';
    }
  });

  if (activeTab === 'approved') {
    filteredRequests = filteredRequests.sort((a, b) => {
      const order: Record<string, number>  = {
        'HR Processing': 1,
        'Completed': 2,
      };
      return order[a.RequestStatus] - order[b.RequestStatus];
    });
  }

  return (
    <div className={styles.ttlDashboard}>
      {isHR ? (
        <>
        <HeaderComponent view='HR Dashboard'/>
        <div className={styles.tabContainer}>
          <div className={styles.tabButtonWrapper}>
            <div
              className={`${styles.activeBgHR} ${
                activeTab === 'awaitingApproval'
                  ? styles.slideCenter
                  : activeTab === 'allRequests'
                  ? styles.slideLeft
                  : styles.slideRight
              }`}
            >
            </div>

            <button
              className={`${styles.tabButtonLeft} ${activeTab === 'allRequests' ? styles.activeTabText : ''}`}
              onClick={() => setActiveTab('allRequests')}
            >
              All Requests
            </button>

            <button
              className={`${styles.tabButtonCenter} ${activeTab === 'awaitingApproval' ? styles.activeTabText : ''}`}
              onClick={() => setActiveTab('awaitingApproval')}
            >
              Awaiting Approval
            </button>

            <button
              className={`${styles.tabButtonRight} ${activeTab === 'approved' ? styles.activeTabText : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved
            </button>
          </div>
        </div>

        {error && <div className={styles.error}><p>{error}</p></div>}
  
        <DashboardComponent
          context={context}
          onClick={handleRequestClick}
          requests={filteredRequests}
          view='HR'
        />
        </>
      ) : (
        <div className={styles.flexCenter}>
          <h2>You don't have the correct permissions to access to this page</h2>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;