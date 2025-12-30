import * as React from 'react';
import { useEffect, useState } from 'react';
import { UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId } from '../../service/TTLService';
import { attachUrlHandlers, loadRequestDetails, goBack } from '../../Helpers/HelperFunctions';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from './TtlWebpart.module.scss';
import DashboardComponent from './DashboardComponent';
import { DirectorDashboardProps } from './DashboardProps';
import HeaderComponent from '../Header/HeaderComponent';

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ context, onBack, isCEO }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get requests data from SharePoint
  const fetchRequests = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get requests with certain statuses
      const requestData = await getRequestsData(context, "SubmissionDate desc", "(RequestStatus eq 'Submitted' or RequestStatus eq 'Resubmitted' or RequestStatus eq 'Awaiting CEO approval')")

      // Only show requests where the total cost exceeds 5000 euro
      const filteredCEORequests = requestData
        .filter((req) => Number(req.TotalCost) > 5000 && !req.ApprovedByCEO)
      setRequests(filteredCEORequests as UserRequest[])

      const selectedId = requestId ?? (selectedRequest as any)?.Id;
      if (selectedId) {
        const refreshedItems = await getRequestItemsByRequestId(context, Number(selectedId));
        setRequestItems(refreshedItems);

      const refreshedRequest = filteredCEORequests.find(r => (r as any).ID === Number(selectedId));
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

  // Attach URL handlers that sync selection with `?view=director&requestId=...`
  useEffect(() => {
    return attachUrlHandlers({
      viewName: 'director',
      requests,
      selectedRequest,
      onRequestClick: handleRequestClick,
      onBackClick: handleBackClick
    });
  }, [requests, selectedRequest]);

  useEffect(() => {
    fetchRequests();
  }, [context]);

  // Handle request click and load details
  const handleRequestClick = async (request: UserRequest, pushState: boolean = true) => {
    await loadRequestDetails({
      context,
      request,
      getRequestItemsByRequestId,
      setIsLoading,
      setError,
      setRequestItems,
      setSelectedRequest,
      pushState,
      viewName: 'director'
    });
  };

  // Handle back navigation
  const handleBackClick = (pushState: boolean = true) => {
    goBack({ setSelectedRequest, setRequestItems, setError, pushState, viewName: 'director' });
  };

  // Handle status update and refresh the list
  const handleStatusUpdate = async (): Promise<void> => {
    await fetchRequests();
  };

  if (isLoading) {
    return (
      <div className={styles.ttlDashboard}>
        <HeaderComponent view='Director Dashboard'/>
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
        view='director'
        onBack={() => handleBackClick(true)}
        onUpdate={handleStatusUpdate}
        context={context}
        error={error} 
        isCEO={isCEO}
      />
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      {isCEO ? (
        <>
        <HeaderComponent view='Director Dashboard'/>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          <DashboardComponent
            context={context}
            onClick={handleRequestClick}
            requests={requests}
            view="director"
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

export default DirectorDashboard;