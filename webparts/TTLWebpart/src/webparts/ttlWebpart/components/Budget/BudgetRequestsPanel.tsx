import * as React from 'react';
import { useEffect, useState } from 'react';
import { IApprover } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getApprovers } from '../../service/TTLService';
import budgetStyles from './Budgets.module.scss';
import { formatDate } from '../../Helpers/HelperFunctions';
import { IBudgetProps, IRequestsByRequester } from './BudgetProps';

const BudgetRequestsPanel: React.FC<IBudgetProps> = ({ context, budget, onClose }) => {
  const [groupedRequests, setGroupedRequests] = useState<IRequestsByRequester[]>([]);
  const [expandedRequesters, setExpandedRequesters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [allRequests, approvers] = await Promise.all([
          getRequestsData(context),
          getApprovers(context)
        ]);

        const approverIdsForCoach = new Set<number>();
        approvers.forEach((ap: IApprover) => {
          if (
            ap.TeamCoach?.Title === budget.TeamCoach?.Title ||
            ap.TeamCoach?.EMail === budget.TeamCoach?.EMail
          ) {
            approverIdsForCoach.add(ap.Id);
          }
        });

        const filtered = allRequests.filter(r => {
          const approverId = r.ApproverID?.Id ?? undefined;
          if (!approverId) return false;
          if (!approverIdsForCoach.has(approverId)) return false;

          if (budget.Year && r.SubmissionDate) {
            const sub = new Date(r.SubmissionDate as any);
            if (String(sub.getFullYear()) !== String(budget.Year)) return false;
          }

          return r.RequestStatus === 'Completed' || r.RequestStatus === 'HR Processing';
        });

        const groupedMap = new Map<string, IRequestsByRequester>();
        filtered.forEach(r => {
          const requesterName = r.Author?.Title ?? 'Unknown';
          const cost = Number(r.TotalCost || 0);

          if (!groupedMap.has(requesterName)) {
            groupedMap.set(requesterName, {
              requester: requesterName,
              totalCost: 0,
              requests: []
            });
          }

          const entry = groupedMap.get(requesterName)!;
          entry.totalCost += cost;
          entry.requests.push(r);
        });

        setGroupedRequests(Array.from(groupedMap.values()));
      } catch (e) {
        console.error('Error loading budget requests:', e);
        setError('Failed to load requests for this budget');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [context, budget]);

  const toggleRequester = (requester: string) => {
    const newSet = new Set(expandedRequesters);
    newSet.has(requester) ? newSet.delete(requester) : newSet.add(requester);
    setExpandedRequesters(newSet);
  };

  return (
    <div className={budgetStyles.budgetDetailsWrapper}>
      <div className={budgetStyles.budgetDetailsContainer}>
        <div className={budgetStyles.budgetDetailsTitleWrapper}>
          <h3 style={{ margin: 0 }}>
            Requests for {budget.TeamCoach?.Title} — {budget.Year}
          </h3>
          <button className={budgetStyles.closeButton} onClick={onClose}>✕</button>
        </div>

        {isLoading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}

        {!isLoading && !error && (
          <div>
            {groupedRequests.length === 0 ? (
              <div>No completed requests found for this team coach and year.</div>
            ) : (
              <table className={budgetStyles.budgetDetailsTable}>
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Number of Requests</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>

                <tbody>
                  {groupedRequests.map(group => (
                    <React.Fragment key={group.requester}>
                      <tr
                        onClick={() => toggleRequester(group.requester)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <i
                            className={`fa fa-chevron-${expandedRequesters.has(group.requester) ? 'down' : 'right'}`}
                            style={{ marginRight: '8px' }}
                          ></i>
                          {group.requester}
                        </td>
                        <td>{group.requests.length}</td>
                        <td>
                          €{group.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>

                      {expandedRequesters.has(group.requester) && (
                        <tr>
                          <td colSpan={3}>
                            <table className={budgetStyles.innerTable}>
                              <thead>
                                <tr>
                                  <th>Request Title</th>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th>Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.requests.map(req => (
                                  <tr key={req.ID}>
                                    <td>{req.Title}</td>
                                    <td>{formatDate(req.DeadlineDate)}</td>
                                    <td>{req.RequestStatus}</td> 
                                    <td>
                                      €
                                      {Number(req.TotalCost || 0).toLocaleString('en-US', {
                                        minimumFractionDigits: 2
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetRequestsPanel;