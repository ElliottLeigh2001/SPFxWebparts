import * as React from 'react';
import { useEffect, useState } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { UserRequest, Approver, Budget } from '../../Interfaces/TTLInterfaces';
import { getRequestsData, getApprovers } from '../../service/TTLService';
import budgetStyles from './Budgets.module.scss'

interface Props {
  context: WebPartContext;
  budget: Budget;
  onClose: () => void;
}

interface RequestsByRequester {
  requester: string;
  totalCost: number;
  requests: UserRequest[];
}


const BudgetRequestsPanel: React.FC<Props> = ({ context, budget, onClose }) => {
  const [groupedRequests, setGroupedRequests] = useState<RequestsByRequester[]>([]);
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

        // Find approver ids that are associated with this team coach
        const approverIdsForCoach = new Set<number>();
        approvers.forEach((ap: Approver) => {
          if (ap.TeamCoach?.Title === budget.TeamCoach?.Title || ap.TeamCoach?.EMail === budget.TeamCoach?.EMail) {
            approverIdsForCoach.add(ap.Id);
          }
        });

        // Filter completed requests where the ApproverID lookup references one of the approver ids
        const filtered = allRequests.filter(r => {
          const approverId = r.ApproverID?.Id || r.ApproverID?.Id === 0 ? r.ApproverID.Id : undefined;
          if (!approverId) return false;
          if (!approverIdsForCoach.has(approverId)) return false;

          // If budget.Year is provided, filter by submission year
          if (budget.Year && (r.SubmissionDate || (r as any).SubmissionDate)) {
            const sub = r.SubmissionDate ? new Date(r.SubmissionDate as any) : new Date((r as any).SubmissionDate);
            if (String(sub.getFullYear()) !== String(budget.Year)) return false;
          }

          if (r.RequestStatus !== 'Completed') return false;

          return true;
        });

        const groupedMap = new Map<string, RequestsByRequester>();

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

        const groupedArray = Array.from(groupedMap.values());

        setGroupedRequests(groupedArray as any);

      } catch (e) {
        console.error('Error loading budget requests:', e);
        setError('Failed to load requests for this budget');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [context, budget]);

  return (
    <div className={budgetStyles.budgetDetailsWrapper}>
      <div className={budgetStyles.budgetDetailsContainer}>
        <div className={budgetStyles.budgetDetailsTitleWrapper}>
          <h3 style={{ margin: 0 }}>Requests for {budget.TeamCoach?.Title} — {budget.Year}</h3>
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
                    <tr key={group.requester}>
                      <td>{group.requester}</td>
                      <td>{group.requests.length}</td>
                      <td>
                        €{group.totalCost.toLocaleString('en-US', {
                          minimumFractionDigits: 2
                        })}
                      </td>
                    </tr>
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
