import * as React from 'react';
import { useEffect, useState } from 'react';
import { getRequestsData, getLoggedInUser, getRequestItemsByRequestId, getApprovers, checkHR } from '../../service/TTLService';
import styles from './TtlWebpart.module.scss';
import { Approver, UserRequest, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import RequestDetails from '../RequestDetails/RequestDetails';
import ApproversDashboard from './ApproversDashboard';
import HRDashboard from './HRDashboard';
import DashboardComponent from './DashboardComponent';
import DirectorDashboard from './DirectorDashboard';
import ChooseNewRequest from '../NewRequest/ChooseNewRequest';
import { ITtlWebpartProps } from './DashboardProps';
import HeaderComponent from '../Header/HeaderComponent';

const TTLDashboard: React.FC<ITtlWebpartProps> = ({ context }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>();
  const [allApprovers, setAllApprovers] = useState<Approver[]>([]);
  const [newRequest, setNewRequest] = useState<boolean>(false);
  const [requestItems, setRequestItems] = useState<UserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showApproversDashboad, setShowApproverDashboard] = useState(false);
  const [showHRDashboad, setShowHRDashboard] = useState(false);
  const [showDirectorDashboad, setShowDirectorDashboard] = useState(false);
  const [isCEO, setIsCEO] = useState<boolean>(false);
  const [isHR, setIsHR] = useState(false);
  const [isApprover, setIsApprover] = useState(false);

  // Get data from SharePoint lists
  const fetchData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user request data, the logged in user, all approvers and check if the user is a member of HR
      const [requestData, user, approvers, HR] = await Promise.all([
        getRequestsData(context, "Id desc"),
        getLoggedInUser(context),
        getApprovers(context),
        checkHR(context)
      ]);

      // Filter requests to only show requests from the logged in user
      const filteredRequests = requestData.filter(req => req.Author?.Id === user?.Id);
      setRequests(filteredRequests as UserRequest[]);
      setLoggedInUser(user);

      // Filter list on only approvers
      const _approvers = approvers.filter(app => app.TeamMember);
      // Get the director from the approvers list
      const boss = approvers.filter(app => app.CEO);

      // Check if the user is an approver
      setIsApprover(_approvers.some(app => app.TeamMember.EMail === user?.Email))
      setAllApprovers(_approvers);
      // Check if the user is the director
      setIsCEO(boss.some(boss => boss.CEO.EMail === user?.Email));
      // Check if the person is from HR
      setIsHR(HR);

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

  // Handle URL changes for all views
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const requestId = params.get("requestId");
      const view = params.get("view");

      // If we have both view and requestId, handle the specific dashboard with request
      if (view && requestId) {
        if (view === "approvers") {
          setShowApproverDashboard(true);
          // The ApproversDashboard will handle the requestId internally
        } else if (view === "HR") {
          setShowHRDashboard(true);
          // The HRDashboard will handle the requestId internally
        } else if (view === 'director') {
          setShowDirectorDashboard(true)
        }
      } 
      // Handle individual parameters
      else if (requestId) {
        // This is for personal request details
        setSelectedRequest(null);
        setRequestItems([]);
        setNewRequest(false);
        setShowApproverDashboard(false);
        setShowHRDashboard(false);
        setShowDirectorDashboard(false)
        
        if (requests.length > 0) {
          const request = requests.find(req => req.ID === parseInt(requestId));
          if (request) {
            handleRequestClick(request);
          }
        }
      } else if (view === "approvers") {
        setShowApproverDashboard(true);
        setSelectedRequest(null);
        setRequestItems([]);
        setNewRequest(false);
        setShowHRDashboard(false);
      } else if (view === "HR") {
        setShowHRDashboard(true);
        setSelectedRequest(null);
        setRequestItems([]);
        setNewRequest(false);
        setShowApproverDashboard(false);
      } else if (view === "director") {
        setShowDirectorDashboard(true);
        setSelectedRequest(null);
        setRequestItems([]);
        setNewRequest(false);
        setShowApproverDashboard(false);
      } else if (view === "new") {
        setNewRequest(true);
        setSelectedRequest(null);
        setRequestItems([]);
        setShowApproverDashboard(false);
        setShowHRDashboard(false);
      } else {
        // Default case - show main dashboard
        setSelectedRequest(null);
        setRequestItems([]);
        setNewRequest(false);
        setShowApproverDashboard(false);
        setShowHRDashboard(false);
        setShowDirectorDashboard(false);
      }
    };

    // Check URL on initial load
    handleUrlChange();

    // Listen for URL changes (back/forward buttons)
    window.addEventListener("popstate", handleUrlChange);
    
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, [requests]);

  // Also check URL when requests change
  useEffect(() => {
    if (requests.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const requestId = params.get("requestId");
      const view = params.get("view");
      
      // Only handle personal requests here, dashboard requests are handled by their components
      if (requestId && !view) {
        const request = requests.find(req => req.ID === parseInt(requestId));
        if (request && (!selectedRequest || selectedRequest.ID !== request.ID)) {
          handleRequestClick(request);
        }
      }
    }
  }, [requests]);

  // Fetch data again on a trigger
  useEffect(() => {
    fetchData();
  }, [context, refreshTrigger]);

  // Function to handle clicks on a request
  const handleRequestClick = async (request: UserRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all request items associated with a request and set them as a state
      const items = await getRequestItemsByRequestId(context, request.ID);
      setRequestItems(items);
      setSelectedRequest(request);
      // Update URL for request details
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

  // On back, reset states
  const handleBackClick = () => {
    setSelectedRequest(null);
    setRequestItems([]);
    setShowApproverDashboard(false);
    setShowHRDashboard(false);
    setShowDirectorDashboard(false)
    setNewRequest(false);
    setError(null);
    setRefreshTrigger(prev => prev + 1);
    // Reset to main dashboard URL
    window.history.pushState({}, "", window.location.pathname);
  };

  const handleNewRequestSave = () => {
    setNewRequest(false);
    // Refresh the list after creating a new request
    setRefreshTrigger(prev => prev + 1);
    // Return to main dashboard URL
    window.history.pushState({}, "", window.location.pathname);
  };

  // Set states based on which view is clicked (approvers, HR, director, new)
  const handleViewClick = (view: string) => {
    setSelectedRequest(null);
    setRequestItems([]);
    setNewRequest(false);
    setShowApproverDashboard(false);
    setShowHRDashboard(false);
    setShowDirectorDashboard(false)

    switch(view) {
      case 'new':
        setNewRequest(true);
        break;
      case 'approvers':
        setShowApproverDashboard(true);
        break;
      case 'HR':
        setShowHRDashboard(true);
        break;
      case 'director':
        setShowDirectorDashboard(true);
        break;
    }
    // Push the url to include the appropriate view
    window.history.pushState({}, "", `?view=${view}`);
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
      <ChooseNewRequest
        context={context}
        onSave={handleNewRequestSave}
        onCancel={handleBackClick}
        approvers={allApprovers}
        loggedInUser={loggedInUser}
      />
    );
  }

  if (showApproversDashboad) {
    return (
      <ApproversDashboard context={context} onBack={handleBackClick} loggedInUser={loggedInUser} isApprover={isApprover}/>
    );
  }

  if (showHRDashboad) {
    return (
      <HRDashboard 
        context={context} 
        onBack={handleBackClick} 
        isHR={isHR} 
        isCEO={isCEO}
        allApprovers={allApprovers}
        loggedInUser={loggedInUser}
        onViewClick={handleViewClick}
        />
    );
  }

  if (showDirectorDashboad) {
    return (
      <DirectorDashboard context={context} onBack={handleBackClick} isCEO={isCEO} loggedInUser={loggedInUser}/>
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      <HeaderComponent
        view='My Requests'
        isHR={isHR}
        isCEO={isCEO}
        allApprovers={allApprovers}
        loggedInUser={loggedInUser}
        onViewClick={handleViewClick}
      />

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <DashboardComponent
        onClick={handleRequestClick}
        requests={requests}
        view='myView'
      />

      <div className={styles.newRequestButtonContainer}>
        <button className={styles.stdButton} onClick={() => handleViewClick('new')}>Make New Request</button>
      </div>
    </div>
  );
}

export default TTLDashboard;