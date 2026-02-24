import * as React from 'react';
import { useEffect, useState } from 'react';
import { Modal } from '@fluentui/react';
import { IBudgetSharingItem, IApprover } from '../../Interfaces/TTLInterfaces';
import { getBudgetSharingItems, getApprovers, addBudgetSharing, denyBudgetSharing, deductFromBudget, addToBudget, getBudgetforApprover, getSP } from '../../service/TTLService';
import budgetStyles from './Budgets.module.scss';
import modalStyles from '../Modals/Modals.module.scss';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { IBudgetSharingProps } from './BudgetProps';

interface SelectedBudgetAllocation {
  teamCoachId: number;
  teamCoachTitle: string;
  teamCoachEmail: string;
  amount: number;
}

const BudgetSharing: React.FC<IBudgetSharingProps> = ({ context, loggedInUser, isApprover, teamCoachBudgets, selectedYear }) => {
  const [items, setItems] = useState<IBudgetSharingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [availableApprovers, setAvailableApprovers] = useState<{ Id: number; Title: string; EMail: string }[]>([]);
  const [selectedApproverId, setSelectedApproverId] = useState<number | ''>('');
  const [selectedTeamCoachId, setSelectedTeamCoachId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptingItem, setAcceptingItem] = useState<IBudgetSharingItem | null>(null);
  const [selectedBudgets, setSelectedBudgets] = useState<SelectedBudgetAllocation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [denyingItem, setDenyingItem] = useState<IBudgetSharingItem | null>(null);

  const userEmail = loggedInUser?.Email?.toLowerCase() || loggedInUser?.UserPrincipalName?.toLowerCase();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sharingItems = await getBudgetSharingItems(context, userEmail);
      setItems(sharingItems);
    } catch (e) {
      console.error('Error loading budget sharing:', e);
      setError('Failed to load budget sharing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) loadData();
  }, [context, userEmail]);

  // Load available approvers when create form opens
  useEffect(() => {
    if (!showCreateForm) return;

    const loadApprovers = async () => {
      const approversList = await getApprovers(context);
      // Get unique practice leads (excluding current user)
      const seen = new Set<string>();
      const uniqueApprovers: { Id: number; Title: string; EMail: string }[] = [];

      approversList.forEach((ap: IApprover) => {
        const email = ap.PracticeLead?.EMail?.toLowerCase();
        if (email && email !== userEmail && !seen.has(email)) {
          seen.add(email);
          uniqueApprovers.push({
            Id: ap.PracticeLead.Id!,
            Title: ap.PracticeLead.Title!,
            EMail: ap.PracticeLead.EMail!,
          });
        }
      });

      setAvailableApprovers(uniqueApprovers);
    };

    loadApprovers();
  }, [showCreateForm]);

  const handleCreate = async () => {
    if (!selectedApproverId || !selectedTeamCoachId || !amount || Number(amount) <= 0) return;

    try {
      setIsSubmitting(true);
      await addBudgetSharing(context, loggedInUser.Id, Number(selectedApproverId), Number(selectedTeamCoachId), Number(amount));
      setShowCreateForm(false);
      setSelectedApproverId('');
      setSelectedTeamCoachId('');
      setAmount('');
      await loadData();
    } catch (e) {
      console.error('Error creating budget sharing request:', e);
      setError('Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!acceptingItem || selectedBudgets.length === 0) return;

    try {
      setIsProcessing(true);

      // Validate total equals requested amount
      const totalAllocated = selectedBudgets.reduce((sum, b) => sum + b.amount, 0);
      if (totalAllocated !== acceptingItem.Amount) {
        setError(`Total allocated (€${totalAllocated.toLocaleString("en-US", { minimumFractionDigits: 2 })}) must equal requested amount (€${acceptingItem.Amount.toLocaleString("en-US", { minimumFractionDigits: 2 })})`);
        setIsProcessing(false);
        return;
      }

      // Update the sharing item status
      const sp = getSP(context);
      const list = sp.web.lists.getByTitle('TTL_BudgetSharing');
      await list.items.getById(acceptingItem.ID).update({
        Status: 'Accepted',
      });

      // Deduct from each selected approver budget
      for (const selectedBudget of selectedBudgets) {
        const approverBudget = await getBudgetforApprover(context, selectedBudget.teamCoachEmail, selectedYear);
        if (approverBudget) {
          await deductFromBudget(context, approverBudget.ID, selectedBudget.amount);
        }
      }

      // Add to requester budget
      const requesterBudget = await getBudgetforApprover(context, acceptingItem.RequesterTeamCoach?.EMail || '', selectedYear);
      if (requesterBudget) {
        await addToBudget(context, requesterBudget.ID, acceptingItem.Amount);
      }

      setAcceptingItem(null);
      setSelectedBudgets([]);
      setError(null);
      await loadData();
    } catch (e) {
      console.error('Error accepting budget sharing:', e);
      setError('Failed to accept request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!denyingItem) return;

    try {
      setIsProcessing(true);
      await denyBudgetSharing(context, denyingItem.ID);
      setDenyingItem(null);
      setError(null);
      await loadData();
    } catch (e) {
      console.error('Error denying budget sharing:', e);
      setError('Failed to deny request');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleBudgetSelection = (teamCoachId: number, teamCoachTitle: string, teamCoachEmail: string, maxAmount: number) => {
    setSelectedBudgets(prev => {
      const existing = prev.find(b => b.teamCoachId === teamCoachId);
      if (existing) {
        return prev.filter(b => b.teamCoachId !== teamCoachId);
      } else {
        return [...prev, { teamCoachId, teamCoachTitle, teamCoachEmail, amount: 0 }];
      }
    });
  };

  const updateBudgetAmount = (teamCoachId: number, newAmount: number) => {
    setSelectedBudgets(prev =>
      prev.map(b =>
        b.teamCoachId === teamCoachId ? { ...b, amount: newAmount } : b
      )
    );
  };

  const incoming = items.filter(i => i.Approver?.EMail?.toLowerCase() === userEmail && i.Status === 'Pending');
  const outgoing = items.filter(i => i.Requester?.EMail?.toLowerCase() === userEmail);

  if (isLoading) {
    return <div className={budgetStyles.center}>Loading...</div>;
  }

  return (
    <div style={{marginTop: '70px', width: '96%', justifySelf: 'center'}}>
      {error && (
        <div className={styles.error}><p>{error}</p></div>
      )}

      {isApprover && (
        <div style={{ margin: '24px 0', width: '96%' }}>
          {!showCreateForm ? (
            <button className={budgetStyles.selectBudget} onClick={() => setShowCreateForm(true)}>
              Request Budget
            </button>
          ) : (
            <div className={budgetStyles.budgetSharingForm}>
              <h3 style={{ margin: '0 0 12px 0' }}>Request Budget from Another Approver</h3>
              <div className={budgetStyles.budgetSharingFormRow}>
                <label>Approver</label>
                <select value={selectedApproverId} onChange={e => setSelectedApproverId(Number(e.target.value) || '')}>
                  <option value="">Select an approver...</option>
                  {availableApprovers.map(ap => (
                    <option key={ap.Id} value={ap.Id}>{ap.Title}</option>
                  ))}
                </select>
              </div>
              <div className={budgetStyles.budgetSharingFormRow}>
                <label>Your Team Coach (receives budget)</label>
                <select value={selectedTeamCoachId} onChange={e => setSelectedTeamCoachId(Number(e.target.value) || '')}>
                  <option value="">Select a team coach...</option>
                  {teamCoachBudgets.map(b => (
                    <option key={b.TeamCoach?.Id} value={b.TeamCoach?.Id}>
                      {b.TeamCoach?.Title} (Available: €{b.Availablebudget.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{maxWidth: '380px !important'}}className={budgetStyles.budgetSharingFormRow}>
                <label>Amount (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className={styles.cancelButton} onClick={() => { setShowCreateForm(false); setSelectedApproverId(''); setSelectedTeamCoachId(''); setAmount(''); }}>
                  Cancel
                </button>
                <button
                  className={budgetStyles.selectBudget}
                  onClick={handleCreate}
                  disabled={isSubmitting || !selectedApproverId || !selectedTeamCoachId || !amount || Number(amount) <= 0}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isApprover && (
        <div className={budgetStyles.budgetSharingSection}>
          <h3>Incoming Requests</h3>
          {incoming.length === 0 ? (
            <p className={budgetStyles.paragraph}>No pending budget requests.</p>
          ) : (
            <div className={styles.tableContainer}>
              <div className={styles.tableWrapper}>
                <table className={budgetStyles.budgetDetailsTable}>
                  <thead>
                    <tr>
                      <th style={{width: '25%'}}>Requester</th>
                      <th style={{width: '25%'}}>Their Team Coach</th>
                      <th style={{width: '25%'}}>Amount</th>
                      <th style={{width: '25%'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incoming.map(item => (
                      <tr key={item.ID} className={budgetStyles.requestRowBudget}>
                        <td>{item.Requester?.Title}</td>
                        <td>{item.RequesterTeamCoach?.Title}</td>
                        <td>€{item.Amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className={styles.cancelButton}
                              onClick={() => setDenyingItem(item)}
                              disabled={isProcessing}
                            >
                              Deny
                            </button>
                            <button
                              className={budgetStyles.selectBudget}
                              onClick={() => { setAcceptingItem(item); setSelectedBudgets([]); }}
                              disabled={isProcessing}
                            >
                              Accept
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={budgetStyles.budgetSharingSection}>
        <h3>Your Requests</h3>
        {outgoing.length === 0 ? (
          <p className={budgetStyles.paragraph}>You haven't made any budget requests.</p>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={budgetStyles.budgetDetailsTable}>
                <thead>
                  <tr>
                    <th style={{width: '25%'}}>Approver</th>
                    <th style={{width: '25%'}}>Your Team Coach</th>
                    <th style={{width: '25%'}}>Amount</th>
                    <th style={{width: '25%'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoing.map(item => (
                    <tr key={item.ID} className={budgetStyles.requestRowBudget}>
                      <td>{item.Approver?.Title}</td>
                      <td>{item.RequesterTeamCoach?.Title}</td>
                      <td>€{item.Amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`${budgetStyles.statusBadge} ${
                          item.Status === 'Accepted' ? budgetStyles.statusAccepted :
                          item.Status === 'Denied' ? budgetStyles.statusDenied :
                          budgetStyles.statusPending
                        }`}>
                          {item.Status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {acceptingItem && (
        <Modal
          isOpen={true}
          onDismiss={() => { setAcceptingItem(null); setSelectedBudgets([]); }}
          isBlocking={true}
          containerClassName={modalStyles.modalContainer}
        >
          <div className={modalStyles.modalHeader}>
            <h3>Accept Budget Request</h3>
            <button className={modalStyles.modalCloseButton} onClick={() => { setAcceptingItem(null); setSelectedBudgets([]); }}>×</button>
          </div>
          <div className={modalStyles.modalBody}>
            <p>
              <strong>{acceptingItem.Requester?.Title}</strong> is requesting{' '}
              <strong>€{acceptingItem.Amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>{' '}
              for team coach <strong>{acceptingItem.RequesterTeamCoach?.Title}</strong>.
            </p>
            <p style={{ marginBottom: 12 }}>Select which of your budgets to use (total must equal the requested amount):</p>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 4, padding: 12 }}>
              {teamCoachBudgets.map(b => {
                const isSelected = selectedBudgets.some(sb => sb.teamCoachId === b.TeamCoach?.Id);
                const selectedBudget = selectedBudgets.find(sb => sb.teamCoachId === b.TeamCoach?.Id);
                
                return (
                  <div key={b.TeamCoach?.Id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBudgetSelection(b.TeamCoach?.Id!, b.TeamCoach?.Title!, b.TeamCoach?.EMail!, b.Availablebudget)}
                        style={{ marginRight: 8, cursor: 'pointer' }}
                      />
                      <span>
                        <strong>{b.TeamCoach?.Title}</strong> (Available: €{b.Availablebudget.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                      </span>
                    </label>
                    {isSelected && (
                      <div style={{ marginLeft: 28 }}>
                        <label style={{ fontSize: '0.9em', marginRight: 8 }}>Amount to allocate (€):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max={b.Availablebudget}
                          value={selectedBudget?.amount || 0}
                          onChange={e => updateBudgetAmount(b.TeamCoach?.Id!, Math.min(Number(e.target.value), b.Availablebudget))}
                          style={{ width: '120px', padding: 6 }}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ fontSize: '0.95em', marginBottom: 4 }}>
                <strong>Total allocated:</strong> €{selectedBudgets.reduce((sum, b) => sum + b.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.95em', color: selectedBudgets.reduce((sum, b) => sum + b.amount, 0) === acceptingItem.Amount ? '#107c10' : '#d13438' }}>
                <strong>Required amount:</strong> €{acceptingItem.Amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 25 }}>
              <button className={styles.cancelButton} onClick={() => { setAcceptingItem(null); setSelectedBudgets([]); }} disabled={isProcessing}>
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleAccept}
                disabled={isProcessing || selectedBudgets.length === 0 || selectedBudgets.reduce((sum, b) => sum + b.amount, 0) !== acceptingItem.Amount}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}

      {denyingItem && (
        <Modal
          isOpen={true}
          onDismiss={() => setDenyingItem(null)}
          isBlocking={true}
          containerClassName={modalStyles.modalContainer}
        >
          <div className={modalStyles.modalHeader}>
            <h3>Deny Budget Request</h3>
            <button className={modalStyles.modalCloseButton} onClick={() => setDenyingItem(null)}>×</button>
          </div>
          <div className={modalStyles.modalBody}>
            <p>
              Are you sure you want to deny the budget request from <strong>{denyingItem.Requester?.Title}</strong> for{' '}
              <strong>€{denyingItem.Amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>?
            </p>
            <p style={{ color: '#605e5c', fontSize: '0.9em', marginTop: 12 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 25 }}>
              <button className={styles.saveButton} onClick={() => setDenyingItem(null)} disabled={isProcessing}>
                Cancel
              </button>
              <button
                className={styles.cancelButton}
                onClick={handleDeny}
                disabled={isProcessing}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BudgetSharing;
