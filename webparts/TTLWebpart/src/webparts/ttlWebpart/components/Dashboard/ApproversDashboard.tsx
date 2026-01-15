import * as React from 'react';
import { useEffect, useState } from 'react';
import { IUserRequest, IUserRequestItem, IApprover, IBudget } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId, getApprovers, getSP, getBudgets } from '../../service/TTLService';
import BudgetRequestsPanel from '../Budget/BudgetRequestsPanel';
import DonutChart from '../Budget/DonutChart';
import { attachUrlHandlers, loadRequestDetails, goBack } from '../../Helpers/HelperFunctions';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from './TtlWebpart.module.scss';
import DashboardComponent from './DashboardComponent';
import { IApproversDashboardProps } from './DashboardProps';
import HeaderComponent from '../Header/HeaderComponent';
import budgetStyles from '../Budget/Budgets.module.scss'
import { TooltipHost, Icon } from '@fluentui/react';

const ApproversDashboard: React.FC<IApproversDashboardProps> = ({ context, onBack, loggedInUser, isApprover, isTeamCoach }) => {
  const [requests, setRequests] = useState<IUserRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<IUserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<IUserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<IUserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamCoachBudgets, setTeamCoachBudgets] = useState<IBudget[]>([]);
  const [teamBudget, setTeamBudget] = useState({
    totalBudget: 0,
    totalAvailable: 0
  });
  const [teamBudgetLoaded, setTeamBudgetLoaded] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<IBudget | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'approvedRequests'|'requests'|'budgetSharing'>('requests');
  const [isFromBudgetSharing, setIsFromBudgetSharing] = useState(false);

  useEffect(() => {
    const loadYears = async () => {
      try {
        const sp = getSP(context);
        const list = sp.web.lists.getByTitle('TTL_Budget');

        // Query distinct years
        const items = await list.items.select('Year').top(5000)();

        const years = Array.from(new Set(items.map(i => i.Year))).sort().reverse();

        setAvailableYears(years);
      } catch (e) {
        console.error("Error loading years:", e);
      }
    };
    loadYears();
    fetchData();
  }, [context]);

  // Get all requests for approvers and team coaches
  const fetchData = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Only get requests with the correct statuses for approver
      const requestData = await getRequestsData(context, "SubmissionDate desc");

      // Get all approvers to check if current user is a team coach
      const approversList = await getApprovers(context);

      // Build a set of approver IDs where the current user is a team coach
      const teamCoachForApproverIds = new Set<number>();
      if (isTeamCoach) {
        approversList.forEach((approver: IApprover) => {
          if (approver.TeamCoach?.EMail === loggedInUser.EMail) {
            teamCoachForApproverIds.add(approver.Id);
          }
        });
      }

      // Filter on requests meant for the approver or where user is team coach for the approver
      const filteredRequests = requestData
        .filter(req => 
          (req.ApproverID?.Title === loggedInUser.Title || 
          (isTeamCoach && req.ApproverID?.Id && teamCoachForApproverIds.has(req.ApproverID.Id))) && 
          (req.RequestStatus === 'Submitted' || req.RequestStatus === 'Resubmitted')
        )
      setRequests(filteredRequests as IUserRequest[]);

      const filteredApprovedRequests = requestData
        .filter(req => 
          (req.ApproverID?.Title === loggedInUser.Title || 
          (isTeamCoach && req.ApproverID?.Id && teamCoachForApproverIds.has(req.ApproverID.Id))) && 
          (req.RequestStatus === 'HR Processing' || req.RequestStatus === 'Completed' || req.RequestStatus === 'Booking' || req.RequestStatus === 'Awaiting CEO approval')
        )
      
        setApprovedRequests(filteredApprovedRequests);

      // Get items after an update in any child component to the UI always stays up to date
      const selectedId = requestId ?? (selectedRequest as any)?.Id;
      if (selectedId) {
        const refreshedItems = await getRequestItemsByRequestId(context, Number(selectedId));
        setRequestItems(refreshedItems);

        const refreshedRequest = filteredRequests.find(r => (r as any).ID === Number(selectedId));
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

  // Attach URL handlers that sync selection with ?view=approvers&requestId=...
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
    // Fetch budget data for the logged in user
    const fetchBudget = async () => {      
      if (isApprover || isTeamCoach) {
        const budgetsData = await getBudgets(context, selectedYear, false, loggedInUser.Email);
        setTeamCoachBudgets(budgetsData);
        
        const budgetForTeam = budgetsData.reduce(
          (totals, b) => {
            totals.totalBudget += b.Budget || 0;
            totals.totalAvailable += b.Availablebudget || 0;
            return totals;
          },
          { totalBudget: 0, totalAvailable: 0 }
        );
        
        setTeamBudget(budgetForTeam);
        setTeamBudgetLoaded(true);
      }   
    };
    
    fetchBudget();
  }, [context, selectedYear]);

  // Handle a click on a request
  const handleRequestClick = async (
    request: IUserRequest,
    pushState: boolean = true,
    fromBudgetSharing: boolean = false
  ) => {
    setIsFromBudgetSharing(fromBudgetSharing);

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

  // Handle status update and refresh the list and budget
  const handleStatusUpdate = async (): Promise<void> => {
    await fetchData();
    // Refresh budget after approval to reflect deductions
    const budgetsData = await getBudgets(context, selectedYear, false, loggedInUser.Email);
    setTeamCoachBudgets(budgetsData);
    
    const budgetForTeam = budgetsData.reduce(
      (totals, b) => {
        totals.totalBudget += b.Budget || 0;
        totals.totalAvailable += b.Availablebudget || 0;
        return totals;
      },
      { totalBudget: 0, totalAvailable: 0 }
    );
    
    setTeamBudget(budgetForTeam);
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
        isTeamCoach={isTeamCoach}
        isFromBudgetSharing={isFromBudgetSharing}
        onBack={() => handleBackClick(true)}
        onUpdate={handleStatusUpdate}
        context={context}
        error={error} 
        totalBudget={teamBudget.totalAvailable}
      />
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      <HeaderComponent view='Approver Dashboard'/>

      {(isApprover || isTeamCoach) && (
        <>
          <div className={budgetStyles.budgetCard}>
            <div className={budgetStyles.budgetYearWrapper}>
              <label>Budgets for</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {teamCoachBudgets && teamCoachBudgets.length > 0 ? (
              <>
                {teamBudgetLoaded && (
                  <div className={budgetStyles.budgetContainer} style={{marginBottom: '1rem'}}>
                    <div className={budgetStyles.budgetWrapper}>
                      <DonutChart
                        total={teamBudget.totalBudget}
                        available={teamBudget.totalAvailable}
                        size={100}
                        strokeWidth={10}
                      />
                      <div className={budgetStyles.budgetInfo}>
                        <h3 className={styles.noMargin}>{teamCoachBudgets[0].Team}</h3>
                        <div><strong>Total Budget:</strong> €{teamBudget.totalBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                        <div>
                          <strong>
                            Available{" "}
                            <TooltipHost content="This reflects the budget that remains after prices of completed and in-process requests have been subtracted.">
                              <Icon iconName="Info" styles={{ root: { cursor: 'pointer', fontSize: 12 } }} />
                            </TooltipHost>
                            :
                          </strong>{" "}
                          <span style={{ color: teamBudget.totalAvailable > 0 ? "#2f8183" : "#d83b01" }}>
                            €{teamBudget.totalAvailable.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div><strong>Used:</strong> €{(teamBudget.totalBudget - teamBudget.totalAvailable).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={budgetStyles.budgetContainer}>
                  {teamCoachBudgets.map((b) => {
                    const usedAmount = b.Budget - b.Availablebudget;

                    return (
                      <div
                        key={b.ID}
                        onClick={() => setSelectedBudget(b)}
                        role="button"
                        tabIndex={0}
                        className={budgetStyles.budgetWrapper}
                      >
                        <DonutChart
                          total={b.Budget}
                          available={b.Availablebudget}
                          size={100}
                          strokeWidth={10} 
                        />

                        <div className={budgetStyles.budgetInfo}>
                          <h3 className={styles.noMargin}>{b.TeamCoach?.Title}</h3>
                          <div><strong>Total Budget:</strong> €{b.Budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                          <div>
                            <strong>
                              Available{" "}
                              <TooltipHost content="This reflects the budget that remains after prices of completed and in-process requests have been subtracted.">
                                <Icon iconName="Info" styles={{ root: { cursor: 'pointer', fontSize: 12 } }} />
                              </TooltipHost>
                              :
                            </strong>{" "}
                            <span style={{ color: b.Availablebudget > 0 ? "#2f8183" : "#d83b01" }}>
                              €{b.Availablebudget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div><strong>Used:</strong> €{usedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p style={{justifySelf: 'center'}}>No budget data available for your team coaches in {selectedYear}.</p>
            )}
          </div>

          {selectedBudget && (
            <BudgetRequestsPanel
              context={context}
              budget={selectedBudget}
              onClose={() => setSelectedBudget(null)}
            />
          )}
        </>
      )}

      <div style={{marginTop: '3em'}} className={styles.tabContainer}>
        <div className={styles.tabButtonWrapper}>
            <div
              className={`${styles.activeBgHR} ${
                activeTab === 'approvedRequests'
                  ? styles.slideCenter
                  : activeTab === 'requests'
                  ? styles.slideLeft
                  : styles.slideRight
              }`}
            >
            </div>

          <button
            className={`${styles.tabButtonLeft} ${activeTab === 'requests' ? styles.activeTabText : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests
          </button>
          <button
            className={`${styles.tabButtonCenter} ${activeTab === 'approvedRequests' ? styles.activeTabText : ''}`}
            onClick={() => setActiveTab('approvedRequests')}
          >
            Approved
          </button>
          <button
            className={`${styles.tabButtonRight} ${activeTab === 'budgetSharing' ? styles.activeTabText : ''}`}
            onClick={() => setActiveTab('budgetSharing')}
          >
            Budget Sharing
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

      {activeTab === 'approvedRequests' && (
        <DashboardComponent
          context={context}
          onClick={(req) => handleRequestClick(req, true, false)}
          requests={approvedRequests}
          view="approvers"
        />
      )}

      {activeTab === 'requests' && (
        <DashboardComponent
          context={context}
          onClick={(req) => handleRequestClick(req, true, false)}
          requests={requests}
          view="approvers"
        />
      )}

      {activeTab === 'budgetSharing' && (
        <DashboardComponent
          context={context}
          onClick={(req) => handleRequestClick(req, true, true)}
          requests={requests.filter(
            r => r.BudgetSharing?.EMail === loggedInUser.Email
          )}
          view="approvers"
        />
      )}

      </div>
    </div>
  );
}

export default ApproversDashboard;