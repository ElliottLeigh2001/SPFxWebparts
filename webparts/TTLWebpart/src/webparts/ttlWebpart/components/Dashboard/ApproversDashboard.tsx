import * as React from 'react';
import { useEffect, useState } from 'react';
import { UserRequest, UserRequestItem, Approver } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId, getApprovers } from '../../service/TTLService';
import { attachUrlHandlers, loadRequestDetails, goBack } from '../../Helpers/HelperFunctions';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from './TtlWebpart.module.scss';
import DashboardComponent from './DashboardComponent';
import { ApproversDashboardProps } from './DashboardProps';
import HeaderComponent from '../Header/HeaderComponent';

const ApproversDashboard: React.FC<ApproversDashboardProps> = ({ context, onBack, loggedInUser, isApprover, isTeamCoach }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all requests for approvers and team coaches
  const fetchData = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Only get requests with the correct statuses for approver
      const requestData = await getRequestsData(context, "SubmissionDate desc", "(RequestStatus eq 'Submitted' or RequestStatus eq 'Resubmitted')");

      // Get all approvers to check if current user is a team coach
      const approversList = await getApprovers(context);
      
      // Build a set of approver IDs where the current user is a team coach
      const teamCoachForApproverIds = new Set<number>();
      if (isTeamCoach) {
        approversList.forEach((approver: Approver) => {
          if (approver.TeamCoach?.Title === loggedInUser.Title) {
            teamCoachForApproverIds.add(approver.Id);
          }
        });
      }

      // Filter on requests meant for the approver or where user is team coach for the approver
      const filteredRequests = requestData
        .filter(req => 
          req.ApproverID?.Title === loggedInUser.Title || 
          (isTeamCoach && req.ApproverID?.Id && teamCoachForApproverIds.has(req.ApproverID.Id))
        )
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

  // Attach URL handlers that sync selection with `?view=approvers&requestId=...`
  useEffect(() => {
    return attachUrlHandlers({
      viewName: 'approvers',
      requests,
      selectedRequest,
      onRequestClick: handleRequestClick,
      onBackClick: handleBackClick
    });
  }, [requests, selectedRequest]);

  useEffect(() => {
    fetchData();
  }, [context]);

  // Handle a click on a request
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
      viewName: 'approvers'
    });
  };

  // Handle back navigation
  const handleBackClick = (pushState: boolean = true) => {
    goBack({ setSelectedRequest, setRequestItems, setError, pushState, viewName: 'approvers' });
  };

  // Handle status update and refresh the list
  const handleStatusUpdate = async (): Promise<void> => {
    await fetchData();
  };

  if (isLoading) {
    return (
      <div className={styles.ttlDashboard}>
        <HeaderComponent view='Approver Dashboard'/>
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
        isApprover={isApprover}
        onBack={() => handleBackClick(true)}
        onUpdate={handleStatusUpdate}
        context={context}
        error={error} 
      />
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      <HeaderComponent view='Approver Dashboard'/>
      
      {(isApprover || isTeamCoach) ? (
        <>

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