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
  onRequestClick: (request: UserRequest) => void;
}

const BudgetRequestsPanel: React.FC<Props> = ({ context, budget, onClose, onRequestClick }) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
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

        // Filter requests where the ApproverID lookup references one of the approver ids
        const filtered = allRequests.filter(r => {
          const approverId = (r as any).ApproverID?.Id || (r as any).ApproverID?.Id === 0 ? (r as any).ApproverID.Id : undefined;
          if (!approverId) return false;
          if (!approverIdsForCoach.has(approverId)) return false;

          // If budget.Year is provided, filter by submission year
          if (budget.Year && (r.SubmissionDate || (r as any).SubmissionDate)) {
            const sub = r.SubmissionDate ? new Date(r.SubmissionDate as any) : new Date((r as any).SubmissionDate);
            if (String(sub.getFullYear()) !== String(budget.Year)) return false;
          }

          return true;
        });

        setRequests(filtered);
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
          <button onClick={onClose}>Close</button>
        </div>

        {isLoading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}

        {!isLoading && !error && (
          <div>
            {requests.length === 0 ? (
              <div>No requests found for this team coach and year.</div>
            ) : (
              <table className={budgetStyles.budgetDetailsTable}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Requester</th>
                    <th>Submission Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={(r as any).ID || (r as any).Id}>
                      <td>{r.Title}</td>
                      <td>{r.Author?.Title || (r as any).Author?.Title}</td>
                      <td>{r.SubmissionDate ? new Date(r.SubmissionDate as any).toLocaleDateString() : ''}</td>
                      <td>€{Number(r.TotalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td>{r.RequestStatus}</td>
                      <td>
                        <button onClick={() => onRequestClick(r)}>View</button>
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
