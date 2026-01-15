import * as React from 'react';
import { Modal, Spinner, SpinnerSize } from '@fluentui/react';
import styles from '../Dashboard/TtlWebpart.module.scss';
import modalStyles from '../Modals/Modals.module.scss';
import budgetStyles from './Budgets.module.scss';
import { IBudgetSharingModalProps } from './BudgetProps';
import { IBudget } from '../../Interfaces/TTLInterfaces';
import { getAllBudgetsForYear } from '../../service/TTLService';
import { useState, useEffect } from 'react';

const BudgetSharingModal: React.FC<IBudgetSharingModalProps> = ({ context, isOpen, totalCost, onSelectBudget, onCancel }) => {
  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBudgets();
    }
  }, [isOpen]);

  const loadBudgets = async () => {
    setIsLoading(true);
    try {
      const year = new Date().getFullYear().toString();
      const allBudgets = await getAllBudgetsForYear(context, year, totalCost);
      setBudgets(allBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBudget = (budget: IBudget) => {
    onSelectBudget(budget);
    setSelectedBudgetId(null);
    setBudgets([]);
  };

  const handleCancel = () => {
    setSelectedBudgetId(null);
    setBudgets([]);
    onCancel();
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={handleCancel}
      isBlocking={false}
      containerClassName={modalStyles.modalContainer}
    >
      <div className={modalStyles.modalHeader}>
        <h3>Request Budget from Another Team</h3>
        <button 
          className={modalStyles.modalCloseButton} 
          onClick={handleCancel}
        >
        ×
        </button>
      </div>

      <div className={budgetStyles.budgetSharingBody}>
        {isLoading ? (
          <div className={budgetStyles.center}>
            <Spinner size={SpinnerSize.medium} label="Loading budgets..." />
          </div>
        ) : budgets.length === 0 ? (
          <div className={budgetStyles.center}>
            <p>No budgets available for the current year.</p>
          </div>
        ) : (
          <div>
            <p className={budgetStyles.paragraph}>
              Select a team's budget to request additional funds:
            </p>
            <div className={budgetStyles.budgetSharingContainer}>
            {budgets.map((budget) => {
              const isSelected = selectedBudgetId === budget.ID;

              return (
                <div
                  key={budget.ID}
                  className={`${budgetStyles.budgetSharingCard} ${
                    isSelected ? budgetStyles.budgetSharingCardSelected : ''
                  }`}
                  onClick={() => setSelectedBudgetId(budget.ID)}
                  onDoubleClick={() => handleSelectBudget(budget)}
                >
                  <div className={budgetStyles.budgetSharingTeam}>
                    <strong className={budgetStyles.teamName}>{budget.Team}</strong>
                    {budget.TeamCoach?.Title && (
                      <span className={budgetStyles.teamCoach}>
                        ({budget.TeamCoach.Title})
                      </span>
                    )}
                  </div>

                  <div className={budgetStyles.budgetSharingAmounts}>
                    <div>
                      <div className={budgetStyles.amountLabel}>Available Budget</div>
                      <div className={budgetStyles.availableAmount}>
                        €{budget.Availablebudget.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className={budgetStyles.amountLabel}>Total Budget</div>
                      <div className={budgetStyles.totalAmount}>
                        €{budget.Budget.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      <div className={budgetStyles.budgetSharingActions}>
        <button
          onClick={handleCancel}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const selected = budgets.find(b => b.ID === selectedBudgetId);
            if (selected) {
              handleSelectBudget(selected);
            }
          }}
          className={`${budgetStyles.selectBudget} ${
            selectedBudgetId === null ? budgetStyles.selectBudgetDisabled : ''
          }`}
          disabled={selectedBudgetId === null}
        >
          Select Budget
        </button>
      </div>
    </Modal>
  );
};

export default BudgetSharingModal;