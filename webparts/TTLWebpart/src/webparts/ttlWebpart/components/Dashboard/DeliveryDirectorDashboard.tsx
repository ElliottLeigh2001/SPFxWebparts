import * as React from 'react';
import { useEffect, useState } from 'react';
import { IBudget, IUserRequest, IUserRequestItem } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getRequestItemsByRequestId, getSP, getBudgets } from '../../service/TTLService';
import { attachUrlHandlers, loadRequestDetails, goBack } from '../../Helpers/HelperFunctions';
import RequestDetails from '../RequestDetails/RequestDetails';
import styles from './TtlWebpart.module.scss';
import budgetStyles from '../Budget/Budgets.module.scss'
import DashboardComponent from './DashboardComponent';
import { IDeliveryDirectorDashboardProps } from './DashboardProps';
import HeaderComponent from '../Header/HeaderComponent';
import { TooltipHost, Icon } from '@fluentui/react';
import BudgetRequestsPanel from '../Budget/BudgetRequestsPanel';
import DonutChart from '../Budget/DonutChart';

const DeliveryDirectorDashboard: React.FC<IDeliveryDirectorDashboardProps> = ({ context, onBack, isDeliveryDirector }) => {
  const [requests, setRequests] = useState<IUserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<IUserRequest | null>(null);
  const [requestItems, setRequestItems] = useState<IUserRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamCoachBudgets, setTeamCoachBudgets] = useState<IBudget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<IBudget | null>(null);
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
    fetchData();
  }, [context]);

    useEffect(() => {
      // Fetch budget data for the logged in user
      const fetchBudget = async () => {      
        const budgetsData = await getBudgets(context, selectedYear, true);
        setTeamCoachBudgets(budgetsData);  
      };
      
      fetchBudget();
    }, [context, selectedYear]);

  // Get all requests for the delivery director
  const fetchData = async (requestId?: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Only get requests with the correct statuses for approver
      const requestData = await getRequestsData(context, "SubmissionDate desc", "(RequestStatus eq 'Submitted' or RequestStatus eq 'Resubmitted')");

      setRequests(requestData as IUserRequest[]);

      // Get items after an update in any child component to the UI always stays up to date
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

  // Attach URL handlers that sync selection with `?view=approvers&requestId=...`
  useEffect(() => {
    return attachUrlHandlers({
      viewName: 'deliveryDirector',
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
      viewName: 'deliveryDirector'
    });
  };

  // Handle back navigation
  const handleBackClick = (pushState: boolean = true) => {
    goBack({ setSelectedRequest, setRequestItems, setError, pushState, viewName: 'deliveryDirector' });
  };

  // Handle status update and refresh the list and budget
  const handleStatusUpdate = async (): Promise<void> => {
    await fetchData();
    // Refresh budget after approval to reflect deductions
    const budgetsData = await getBudgets(context, selectedYear, true);
    setTeamCoachBudgets(budgetsData);
  };

  if (isLoading) {
    return (
      <div className={styles.ttlDashboard}>
        <HeaderComponent view='Delivery Director Dashboard'/>
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
        view='deliveryDirector'
        onBack={() => handleBackClick(true)}
        onUpdate={handleStatusUpdate}
        context={context}
        error={error} 
      />
    );
  }

  return (
    <div className={styles.ttlDashboard}>
      <HeaderComponent view='Delivery Director Dashboard'/>
      
      {(isDeliveryDirector) ? (
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
                        <h3 style={{ margin: 0 }}>{b.TeamCoach?.Title}</h3>
                        <div><strong>Total Budget:</strong> €{b.Budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                        <div>
                          <strong>
                            Available{" "}
                            <TooltipHost content="Budget including completed, booked, and in-process requests. 
                            This reflects budget that is already used or temporarily held by pending requests.">
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
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}
  
        <DashboardComponent
          context={context}
          onClick={handleRequestClick}
          requests={requests}
          view='deliveryDirector'
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

export default DeliveryDirectorDashboard;