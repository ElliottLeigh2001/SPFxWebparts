import * as React from 'react';
import TrainingForm from '../Forms/TrainingForm';
import TravelForm from '../Forms/TravelForm';
import { createRequestWithItems, getApproverById, getTeams } from '../../service/TTLService';
import { Approver, Team, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { useEffect, useState } from 'react';
import ConfirmActionDialog from '../Modals/ConfirmActionDialog';
import styles from '../Dashboard/TtlWebpart.module.scss';
import newRequestStyles from './NewRequest.module.scss'
import { Modal } from '@fluentui/react';
import { sendEmail } from '../../service/AutomateService';
import AccommodationForm from '../Forms/AccomodationForm';
import { NewRequestProps } from './NewRequestProps';

const NewRequestTrainingTravel: React.FC<NewRequestProps> = ({ context, onCancel, onSave, approvers, loggedInUser }) => {
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('');
    const [project, setProject] = useState('');
    const [team, setTeam] = useState<number | ''>('');
    const [approver, setApprover] = useState<number | ''>('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [allApprovers, setAllApprovers] = useState<Approver[]>([]);
    const [items, setItems] = useState<UserRequestItem[]>([]);
    const [activeForm, setActiveForm] = useState<'training'|'travel'|'accommodation'|null>(null);
    const [activeFormName, setActiveFormName] = useState<'training'|'travel'|'accommodation'|null>(null);
    const [editingItem, setEditingItem] = useState<UserRequestItem | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'save'|'send'|'discard'|null>(null);
    const [confirmProcessing, setConfirmProcessing] = useState(false);
    const [titleError, setTitleError] = useState('');
    const [goalError, setGoalError] = useState('');
    const [teamError, setTeamError] = useState('');
    const [approverError, setApproverError] = useState('');
    const [projectError, setProjectError] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [nextItemId, setNextItemId] = useState(1);
    const [isReturnJourney, setIsReturnJourney] = useState(false);

    useEffect(() => {
        const getApproversandTeams = async (): Promise<void> => {
            const approversWithoutCEO = approvers.filter(app => app.TeamMember)
            setAllApprovers(approversWithoutCEO)
            const allTeams: Team[] = await getTeams(context)
            setTeams(allTeams);
        }
        getApproversandTeams();
    }, [])

    const validate = (): boolean => {
        let isValid = true;

        setTitleError('');
        setGoalError('');
        setError(null);

        if (!title.trim()) {
            setTitleError('Title is required');
            isValid = false;
        } 
        
        if (!goal.trim()) {
            setGoalError('Goal is required');
            isValid = false;
        }
        if (!team) {
            setTeamError('Please select a team');
            isValid = false;
        }
        if (!approver) {
            setApproverError('Please select an approver');
            isValid = false;
        }
        
        if (title.length > 255) {
            setTitleError('Max length of title is 255 characters')
            isValid = false;
        }

        if (project.length > 255) {
            setProjectError('Max length of title is 255 characters')
            isValid = false;
        }
        
        return isValid;
    };

    const addItem = (item: UserRequestItem): void => {
        const newItem = {
            ...item,
            ID: nextItemId
        };
        setItems(prev => [...prev, newItem]);
        setNextItemId(prev => prev + 1);
        setActiveForm(null);
    };

    const updateItem = (updatedItem: UserRequestItem): void => {
        setItems(prev => prev.map(item => 
            item.ID === updatedItem.ID ? updatedItem : item
        ));
        setEditingItem(undefined);
        setActiveForm(null);
    };

    const editItem = async (index: number): Promise<void> => {
        const item = items[index];
        setEditingItem(item);
        setActiveForm(item.RequestType?.toLowerCase() as any);
    };

    const removeItem = (index: number): void => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async (type: string): Promise<void> => {
        if (!validate()) return;
        let totalCost = 0;
        setIsSaving(true);
        setError(null);
        setTitleError('');
        setGoalError('');
        
        totalCost = costSum();
        
        try {
            const requestId = await createRequestWithItems(context, { 
                Title: title, 
                Goal: goal, 
                Project: project, 
                TeamID: team, 
                ApproverID: approver, 
                TotalCost: totalCost
            }, items, type);

            if (type === 'Sent for approval') {
                const approverData = await getApproverById(context, Number(approver));
                const approverEmail = approverData?.TeamMember?.EMail;
                const approverTitle = approverData.TeamMember?.Title;
                sendEmail({ emailType: "new request", requestId: requestId.toString(), title: title, approver: approverEmail, approverTitle: approverTitle, author: loggedInUser.Email, totalCost: totalCost.toString() });
            }
            
            // Call the parent's onSave to refresh the dashboard
            onSave();
            
        } catch (error) {
            console.error('Error creating request:', error);
            setError('Failed to create request');
        } finally {
            setIsSaving(false);
        }
    };

    const closeModal = (): void => {
        setEditingItem(undefined);
        setActiveFormName(null);
        setActiveForm(null);
        setIsReturnJourney(false);
    };

    const handleFormSave = (item: UserRequestItem, nextForms?: Array<{type: 'travel' | 'accommodation', data?: any}>): void => {
        if (editingItem) {
            updateItem({ ...item, ID: editingItem.ID });
        } else {
            addItem(item);
        }

        // If there are next forms in the sequence, open the first one
        if (nextForms && nextForms.length > 0) {
            const nextForm = nextForms[0];

            // Travel form
            if (nextForm.type === 'travel') {
                // If it's return journey, don't set editing item
                if (nextForm.data?.isReturnJourney) {
                    setIsReturnJourney(true);
                    setEditingItem(undefined);
                } else {
                    setIsReturnJourney(false);
                    setEditingItem(nextForm.data ?? undefined);
                }

                setActiveForm('travel');
                setActiveFormName('travel');
            }

            // Accommodation form
            if (nextForm.type === 'accommodation') {
                setIsReturnJourney(false);
                setEditingItem(nextForm.data ?? undefined);
                setActiveForm('accommodation');
                setActiveFormName('accommodation');
            }

        } else {
            setEditingItem(undefined);
            setActiveForm(null);
            setActiveFormName(null);
            setIsReturnJourney(false);
        }
    };

    const getModalTitle = (): string => {
        if (editingItem) {
            return `Edit ${activeFormName}`;
        }
        else if (isReturnJourney) {
            return `Add return journey`; 
        }
        return `Add ${activeFormName}`;
    };

    const costSum = (): number => {
        let totalCost = 0;

        for (const it of items) {
            totalCost += Number(it.Cost);
        }
        return totalCost;
    }

    const disabled = isSaving || items.length === 0
    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
            <div className={styles.ttlForm}>
                <div className={styles.formHeader}>
                    <h2>New Training / Travel Request</h2>
                    <div className={newRequestStyles.newRequestActions}>
                        <button
                            className={newRequestStyles.iconButton}
                            disabled={disabled}
                            onClick={() => { setConfirmAction('save'); setConfirmOpen(true); }}
                            title={disabled ? "Add an item to your request before saving" : "Save"}
                        >
                            <i className="fa fa-bookmark-o" aria-hidden="true"></i>
                        </button>

                        <button
                            className={newRequestStyles.iconButton}
                            disabled={disabled}
                            onClick={() => { setConfirmAction('send'); setConfirmOpen(true); }}
                            title={disabled ? "Add an item to your request before sending" : "Send for approval"}
                        >
                            <i className="fa fa-paper-plane" aria-hidden="true"></i>
                        </button>

                        <button
                            className={newRequestStyles.iconButton}
                            disabled={isSaving}
                            onClick={() => { setConfirmAction('discard'); setConfirmOpen(true); }}
                            title="Discard"
                        >
                            <i className="fa fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>

                <h4>General Information</h4>

                <div className={styles.formRow}>
                    <div className={styles.formItem}>
                        <label className={styles.formRowLabel}>Title *</label>
                        <input className={titleError ? styles.invalid : ''} value={title} onChange={e => setTitle(e.target.value)} required />
                        {titleError && <div className={styles.validationError}>{titleError}</div>}
                    </div>
                    <div className={styles.formItem}>
                        <label className={styles.formRowLabel}>Project </label>
                        <input className={projectError ? styles.invalid : ''} value={project} onChange={e => setProject(e.target.value)} required />
                        {projectError && <div className={styles.validationError}>{projectError}</div>}
                    </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                    <label className={styles.formRowLabel}>Goal *</label>
                    <textarea value={goal} onChange={e => setGoal(e.target.value)} style={{ width: '99%', marginTop: '6px' }} />
                    {goalError && <div className={styles.validationError}>{goalError}</div>}
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formItem}>
                        <label className={styles.formRowLabel}>Team *</label>
                        <select
                            name="team"
                            id="team"
                            value={team}
                            onChange={e => setTeam(Number(e.target.value))}
                            required
                        >
                            <option value="">-- Select team --</option>
                            {teams.map((a: any) => (
                                <option key={a.Id} value={a.Id}>
                                    {a.Title}
                                </option>
                            ))}
                        </select>
                        {teamError && <div className={styles.validationError}>{teamError}</div>}
                    </div>
                    <div className={styles.formItem}>
                        <label className={styles.formRowLabel}>Approver *</label>
                        <select
                            name="approver"
                            id="approver"
                            value={approver}
                            onChange={e => setApprover(Number(e.target.value))}
                            required
                        >
                            <option value="">-- Select Approver --</option>
                            {allApprovers.map((a: any) => (
                                <option key={a.Id} value={a.Id}>
                                    {a.TeamMember?.Title}
                                </option>
                            ))}
                        </select>
                        {approverError && <div className={styles.validationError}>{approverError}</div>}
                    </div>
                </div>

                <h4 style={{marginTop: "3em"}}>Add items to your request</h4>

                <div className={newRequestStyles.addButtons}>
                    <button className={styles.stdButton} onClick={() => {setActiveForm('training'); setActiveFormName('training')}}>Add Training Item</button>
                    <button className={styles.stdButton} onClick={() => {setActiveForm('travel'); setActiveFormName('travel')}}>Add Travel Item</button>
                    <button className={styles.stdButton} onClick={() => {setActiveForm('accommodation'); setActiveFormName('accommodation')}}>Add Accommodation Item</button>
                </div>

                <Modal
                    isOpen={activeForm === 'training'}
                    onDismiss={closeModal}
                    isBlocking={false}
                    containerClassName={newRequestStyles.modalContainer}
                >
                    <div className={newRequestStyles.modalHeader}>
                        <h3>{getModalTitle()}</h3>
                        <button className={newRequestStyles.modalCloseButton} onClick={closeModal}>×</button>
                    </div>
                    <div className={newRequestStyles.modalBody}>
                        <TrainingForm 
                            context={context} 
                            onSave={handleFormSave} 
                            onCancel={closeModal} 
                            initialData={editingItem}
                        />
                    </div>
                </Modal>

                <Modal
                    isOpen={activeForm === 'travel'}
                    onDismiss={closeModal}
                    isBlocking={false}
                    containerClassName={newRequestStyles.modalContainer}
                >
                    <div className={newRequestStyles.modalHeader}>
                        <h3>{getModalTitle()}</h3>
                        <button className={newRequestStyles.modalCloseButton} onClick={closeModal}>×</button>
                    </div>
                    <div className={newRequestStyles.modalBody}>
                        <TravelForm 
                            context={context} 
                            onSave={handleFormSave} 
                            onCancel={closeModal} 
                            initialData={editingItem}
                            isReturnJourney={isReturnJourney}
                        />
                    </div>
                </Modal>

                <Modal
                    isOpen={activeForm === 'accommodation'}
                    onDismiss={closeModal}
                    isBlocking={false}
                    containerClassName={newRequestStyles.modalContainer}
                >
                    <div className={newRequestStyles.modalHeader}>
                        <h3>{getModalTitle()}</h3>
                        <button className={newRequestStyles.modalCloseButton} onClick={closeModal}>×</button>
                    </div>
                    <div className={newRequestStyles.modalBody}>
                        <AccommodationForm 
                            context={context} 
                            onSave={handleFormSave} 
                            onCancel={closeModal} 
                            initialData={editingItem}
                        />
                    </div>
                </Modal>

                {items.length > 0 && (
                  <>
                    <h3>Shopping Basket (€{costSum()})</h3><table className={newRequestStyles.itemsTable}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Cost</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={idx}>
                                    <td>{it.Title}</td>
                                    <td>{it.RequestType}</td>
                                    <td>€ {it.Cost}</td>
                                    <td>
                                        <div className={newRequestStyles.itemActions}>
                                            <i
                                                className="fa fa-pencil"
                                                style={{ marginRight: '8px' }}
                                                onClick={() => editItem(idx)} />
                                            <i
                                                className="fa fa-trash-o"
                                                style={{ marginLeft: '8px' }}
                                                onClick={() => removeItem(idx)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </>
                )}

                {error && <div className={styles.validationError}>{error}</div>}

                <ConfirmActionDialog
                    isOpen={confirmOpen}
                    action={confirmAction}
                    isProcessing={confirmProcessing}
                    onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
                    onConfirm={async () => {
                        if (!confirmAction) return;
                        setConfirmProcessing(true);
                        try {
                            if (confirmAction === 'save') {
                                await handleSave('Saved');
                            } else if (confirmAction === 'send') {
                                await handleSave('Sent for approval');
                            } else if (confirmAction === 'discard') {
                                onCancel();
                            }
                        } finally {
                            setConfirmProcessing(false);
                            setConfirmOpen(false);
                            setConfirmAction(null);
                        }
                    }}
                />

            </div>
        </>
    );
}

export default NewRequestTrainingTravel;