import { WebPartContext } from '@microsoft/sp-webpart-base';
import * as React from 'react';
import SoftwareForm from '../Forms/SoftwareForm';
import TrainingForm from '../Forms/TrainingForm';
import TravelForm from '../Forms/TravelForm';
import { createRequestWithItems, getApproverById, getTeams } from '../../service/TTLService';
import { Approver, Team, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { useEffect, useState } from 'react';
import AccomodationForm from '../Forms/AccomodationForm';
import ConfirmActionDialog from './ConfirmActionDialog';
import styles from '../TtlWebpart.module.scss';
import newRequestStyles from './NewRequest.module.scss'
import { Modal } from '@fluentui/react';
import { sendEmail } from '../../service/AutomateService';

const NewRequestForm: React.FC<{ context: WebPartContext; onCancel: () => void; onSave: () => void; approvers: Approver[]; loggedInUser: any}> = ({ 
    context, 
    onCancel, 
    onSave, 
    approvers, 
    loggedInUser 
}) => {
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('');
    const [project, setProject] = useState('');
    const [team, setTeam] = useState<number | ''>('');
    const [approver, setApprover] = useState<number | ''>('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [allApprovers, setAllApprovers] = useState<Approver[]>([]);
    const [items, setItems] = useState<UserRequestItem[]>([]);
    const [activeForm, setActiveForm] = useState<'software'|'training'|'travel'|'accomodation'|'actions'|null>(null);
    const [editingItem, setEditingItem] = useState<UserRequestItem | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'save'|'send'|'discard'|null>(null);
    const [confirmProcessing, setConfirmProcessing] = useState(false);
    const [titleError, setTitleError] = useState('');
    const [goalError, setGoalError] = useState('');
    const [teamError, setTeamError] = useState('');
    const [approverError, setApproverError] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [nextItemId, setNextItemId] = useState(1);

    useEffect(() => {
        const getApproversandTeams = async (): Promise<void> => {
            setAllApprovers(approvers)
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
        
        for (const it of items) {
            totalCost += Number(it.Cost);
        }
        
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
                sendEmail({ emailType: "new request", requestId: requestId.toString(), title: title, approver: approverEmail, approverTitle: approverTitle, author: loggedInUser.Email });
            }
            
            // Reset form after successful save
            setTitle('');
            setGoal('');
            setProject('');
            setTeam('');
            setApprover('');
            setItems([]);
            setNextItemId(1);
            
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
        setActiveForm(null);
    };

    const handleFormSave = (item: UserRequestItem): void => {
        if (editingItem) {
            updateItem({ ...item, ID: editingItem.ID });
        } else {
            addItem(item);
        }
    };

    const getModalTitle = (): string => {
        if (editingItem) {
            return `Edit ${activeForm}`;
        }
        return `Add ${activeForm}`;
    };

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
            <div className={styles.ttlForm}>
                <div className={styles.formHeader}>
                    <h2>New Request</h2>
                    <div className={newRequestStyles.newRequestActions}>
                        <button
                            className={newRequestStyles.iconButton}
                            disabled={isSaving || items.length === 0}
                            onClick={() => { setConfirmAction('save'); setConfirmOpen(true); }}
                            title="Save"
                        >
                            <i className="fa fa-bookmark-o" aria-hidden="true"></i>
                        </button>

                        <button
                            className={newRequestStyles.iconButton}
                            disabled={isSaving || items.length === 0}
                            onClick={() => { setConfirmAction('send'); setConfirmOpen(true); }}
                            title="Send for approval"
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

                <div className={styles.formRow}>
                    <div className={styles.formItem}>
                        <label className={styles.formRowLabel}>Title *</label>
                        <input className={!title ? 'invalid' : ''} value={title} onChange={e => setTitle(e.target.value)} required />
                        {titleError && <div className={styles.validationError}>{titleError}</div>}
                    </div>
                    <div className={styles.formItem}>
                        <label className={styles.formRowLabel}>Project </label>
                        <input value={project} onChange={e => setProject(e.target.value)} required />
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

                <div className={styles.formActions}>
                    <button className={styles.stdButton} onClick={() => setActiveForm('software')}>Add Software</button>
                    <button className={styles.stdButton} onClick={() => setActiveForm('training')}>Add Training</button>
                    <button className={styles.stdButton} onClick={() => setActiveForm('travel')}>Add Travel</button>
                    <button className={styles.stdButton} onClick={() => setActiveForm('accomodation')}>Add Accomodation</button>
                </div>

                <Modal
                    isOpen={activeForm === 'software'}
                    onDismiss={closeModal}
                    isBlocking={false}
                    containerClassName={newRequestStyles.modalContainer}
                >
                    <div className={newRequestStyles.modalHeader}>
                        <h3>{getModalTitle()}</h3>
                        <button className={newRequestStyles.modalCloseButton} onClick={closeModal}>×</button>
                    </div>
                    <div className={newRequestStyles.modalBody}>
                        <SoftwareForm 
                            context={context} 
                            onSave={handleFormSave} 
                            onCancel={closeModal} 
                            initialData={editingItem}
                        />
                    </div>
                </Modal>

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
                        />
                    </div>
                </Modal>

                <Modal
                    isOpen={activeForm === 'accomodation'}
                    onDismiss={closeModal}
                    isBlocking={false}
                    containerClassName={newRequestStyles.modalContainer}
                >
                    <div className={newRequestStyles.modalHeader}>
                        <h3>{getModalTitle()}</h3>
                        <button className={newRequestStyles.modalCloseButton} onClick={closeModal}>×</button>
                    </div>
                    <div className={newRequestStyles.modalBody}>
                        <AccomodationForm 
                            context={context} 
                            onSave={handleFormSave} 
                            onCancel={closeModal} 
                            initialData={editingItem}
                        />
                    </div>
                </Modal>

                <Modal
                    isOpen={activeForm === 'actions'}
                    onDismiss={closeModal}
                    isBlocking={false}
                    containerClassName={newRequestStyles.modalContainer}
                >
                    <div className={newRequestStyles.modalHeader}>
                        <h3>{getModalTitle()}</h3>
                        <button className={newRequestStyles.modalCloseButton} onClick={closeModal}>×</button>
                    </div>
                    <div className={newRequestStyles.modalBody}>
                        <AccomodationForm 
                            context={context} 
                            onSave={handleFormSave} 
                            onCancel={closeModal} 
                            initialData={editingItem}
                        />
                    </div>
                </Modal>

                <h3>Items ({items.length})</h3>
                <table className={newRequestStyles.itemsTable}>
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
                            <td>{it.Cost}</td>
                            <td>
                                <i
                                    className="fa fa-pencil"
                                    style={{ fontSize: '24px', color: 'green', cursor: 'pointer', marginRight: '8px' }}
                                    onClick={() => editItem(idx)}
                                />
                                <i
                                    className="fa fa-trash-o"
                                    style={{ fontSize: '24px', color: 'red', cursor: 'pointer', marginLeft: '8px' }}
                                    onClick={() => removeItem(idx)}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

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

export default NewRequestForm;