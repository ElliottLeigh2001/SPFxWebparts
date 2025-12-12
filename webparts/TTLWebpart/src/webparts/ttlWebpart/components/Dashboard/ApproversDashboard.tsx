import * as React from 'react';
import { useEffect, useState } from 'react';
import { UserRequest, UserRequestItem, Approver, Budget } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId, getApprovers, getBudgetsForPracticeLead, getSP } from '../../service/TTLService';
import DonutChart from './DonutChart';
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
  const [teamCoachBudgets, setTeamCoachBudgets] = useState<Budget[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState<string[]>([]);


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
  }, [context]);

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
    // Fetch budget data for the logged in user
    const fetchBudget = async () => {      
    if (isApprover || isTeamCoach) {
        // Practice lead sees all their team coach budgets
        const budgetsData = await getBudgetsForPracticeLead(context, loggedInUser.Email, selectedYear);
        setTeamCoachBudgets(budgetsData);
      }   
    };
    
    fetchBudget();
  }, [context, selectedYear]);

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
        isTeamCoach={isTeamCoach}
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

        {(isApprover || isTeamCoach) && (
          <div className={styles.budgetCard}>
            <div style={{ marginBottom: 16, justifySelf: 'center' }}>
              <label style={{ marginRight: 8, fontWeight: 600}}>Budgets from</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ padding: 6, borderRadius: 4 }}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {teamCoachBudgets && teamCoachBudgets.length > 0 ? (
              <div style={{ display: "flex", gap: 20, justifyContent: 'center' }}>
                {teamCoachBudgets.map((b) => {
                  const usedAmount = b.Budget - b.Availablebudget;
                  const usedPercentage = b.Budget > 0 ? (usedAmount / b.Budget) * 100 : 0;

                  return (
                    <div
                      key={b.ID}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        padding: 20,
                        borderRadius: 3,
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        flexWrap: "wrap"
                      }}
                    >
                      <DonutChart
                        total={b.Budget}
                        available={b.Availablebudget}
                        size={100}
                        strokeWidth={10}
                        label={`${usedPercentage.toFixed(0)}%`}
                      />

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <h3 style={{ margin: 0 }}>{b.TeamCoach?.Title}</h3>

                        <div><strong>Total Budget:</strong> €{b.Budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>

                        <div>
                          <strong>Available:</strong>{" "}
                          <span style={{ color: b.Availablebudget > 0 ? "#107c10" : "#d83b01" }}>
                            €{b.Availablebudget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div><strong>Used:</strong> €{usedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No budget data available for your team coaches.</p>
            )}
          </div>
        )}

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