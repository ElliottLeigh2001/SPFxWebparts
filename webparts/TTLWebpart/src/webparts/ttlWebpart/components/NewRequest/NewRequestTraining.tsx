import * as React from 'react';
import TrainingForm from '../Forms/TrainingForm';
import TravelForm from '../Forms/TravelForm';
import { createRequestWithItems, getApproverById } from '../../service/TTLService';
import { Approver, UserRequestItem } from '../../Interfaces/TTLInterfaces';
import { useEffect, useState, useRef } from 'react';
import ConfirmActionDialog from '../Modals/ConfirmActionDialog';
import styles from '../Dashboard/TtlWebpart.module.scss';
import requestDetailsStyles from '../RequestDetails/RequestDetails.module.scss'
import newRequestStyles from './NewRequest.module.scss'
import { sendEmail } from '../../service/AutomateService';
import AccommodationForm from '../Forms/AccomodationForm';
import { INewRequestProps } from './NewRequestProps';
import HeaderComponent from '../Header/HeaderComponent';
import { getUserAndManager } from '../../Helpers/HelperFunctions';

const NewRequestTraining: React.FC<INewRequestProps> = ({ context, onCancel, onSave, approvers, loggedInUser }) => {
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('');
    const [project, setProject] = useState('');
    const [team, setTeam] = useState<string | undefined>(undefined);
    const [approver, setApprover] = useState<number | undefined>(undefined);
    const [allApprovers, setAllApprovers] = useState<Approver[]>([]);
    const [teamCoach, setTeamCoach] = useState<{ id: number; title: string } | undefined>(undefined);
    const trainingFormRef = useRef<any>(null);
    const travelFormRef = useRef<any>(null);
    const accommodationFormRef = useRef<any>(null);
    const [showInlineTravel, setShowInlineTravel] = useState(false);
    const [showInlineReturnTravel, setShowInlineReturnTravel] = useState(false);
    const [showInlineAccommodation, setShowInlineAccommodation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'save' | 'send' | 'discard' | null>(null);
    const [confirmProcessing, setConfirmProcessing] = useState(false);
    const [titleError, setTitleError] = useState('');
    const [goalError, setGoalError] = useState('');
    const [projectError, setProjectError] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load Teams and Approvers
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const approversWithoutCEO = approvers.filter(app => app.PracticeLead);
                setAllApprovers(approversWithoutCEO);

                // Get user's manager (team coach) and populate initial data
                const userAndManager = await getUserAndManager(approversWithoutCEO, context);
                setTeamCoach(userAndManager?.teamCoach);
                setApprover(userAndManager?.approver);
                setTeam(userAndManager?.team);
            } catch (err) {
                console.error("Error loading data:", err);
                setError('Failed to load user data');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [approvers]);

    // Form validation (empty fields, max characters)
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

    const handleTrainingToggle = (v: boolean) => {
        if (v) {
            setShowInlineTravel(true)
        }
        else {
            setShowInlineTravel(false);
            setShowInlineAccommodation(false);
            setShowInlineReturnTravel(false);
        }
    }

    const collectAllItems = async (): Promise<UserRequestItem[] | null> => {
        let collected: UserRequestItem[] = [];

        // 1. Training
        const t = await trainingFormRef.current?.getFormData();
        if (!t?.isValid) return null;
        collected.push(t.item);

        // If no travel needed → return training item only
        if (!t.includeTravel) return collected;

        // 2. Travel
        const tr = await travelFormRef.current?.getFormData();
        if (!tr?.isValid) return null;
        collected.push(tr.item);

        // 3. Accommodation
        if (tr.includeAccommodation) {
            const ac = await accommodationFormRef.current?.getFormData();
            if (!ac?.isValid) return null;
            collected.push(ac.item);
        }

        // 4. Return journey travel
        if (tr.includeReturnJourney) {
            const ret = await travelFormRef.current?.getReturnJourneyData?.();
            if (ret?.isValid) collected.push(ret.item);
        }

        return collected;
    };

    // On submit of the request, save it
    const handleSave = async (type: string): Promise<void> => {

        // Collect inline items
        const collectedItems = await collectAllItems();
        // Validate all forms
        if (!validate() || !collectedItems) return;


        let totalCost = collectedItems.reduce((sum, x) => sum + Number(x.Cost || 0), 0);
        const earliest = collectedItems.reduce(
        (min, item) => new Date(item.StartDate!) < new Date(min.StartDate!) ? item : min
        );
        
        setIsSaving(true);
        setError(null);

        try {
            const requestId = await createRequestWithItems(
                context,
                {
                    Title: title,
                    Goal: goal,
                    Project: project,
                    Team: team,
                    ApproverID: approver,
                    DeadlineDate: earliest.StartDate,
                    TotalCost: totalCost
                },
                collectedItems,
                type
            );

            if (type === 'Submitted') {
                const approverData = await getApproverById(context, Number(approver));
                const approverEmail = approverData?.PracticeLead?.EMail;
                const approverTitle = approverData.PracticeLead?.Title;
                const directorEmail = approverData.CEO?.Email;
                const directorTitle = approverData.CEO?.Title
                sendEmail({ 
                    emailType: "new request", 
                    requestId: requestId.toString(), 
                    title: title, 
                    approverEmail: approverEmail,
                    approverTitle: approverTitle,
                    directorTitle: directorTitle,
                    directorEmail: directorEmail, 
                    authorEmail: loggedInUser.Email, 
                    authorName: loggedInUser.Title, 
                    totalCost: totalCost.toString(), 
                    typeOfRequest: 'Training' 
                });
            }

            onSave();

        } catch (err) {
            setError('An error occured. Refresh and check your dashboard, the request may have been created anyway.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <HeaderComponent view="New Request" />
                <div className={styles.ttlForm}>
                    <div className={newRequestStyles.newRequestContainer}>
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            Loading...
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <HeaderComponent view="New Request" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
            <div className={styles.ttlForm}>
                <div className={newRequestStyles.formHeader}>
                    <h2 style={{ color: '#055a57' }}>New Training Request</h2>
                    <div className={newRequestStyles.newRequestActions}>
                        <button
                            className={styles.stdButton}
                            style={{ width: '171px' }}
                            disabled={isSaving}
                            onClick={() => { setConfirmAction('discard'); setConfirmOpen(true); }}
                            title="Discard"
                        >
                            Discard
                        </button>
                        
                        <button
                            className={styles.stdButton}
                            style={{ width: '171px' }}
                            onClick={() => { setConfirmAction('save'); setConfirmOpen(true); }}
                        >
                            Draft
                        </button>

                        <button
                            className={styles.stdButton}
                            style={{ width: '171px' }}
                            onClick={() => { setConfirmAction('send'); setConfirmOpen(true); }}
                        >
                            Send for approval
                        </button>

                    </div>
                </div>

                <div className={newRequestStyles.newRequestContainer}>
                    <div className={requestDetailsStyles.details}>
                        <div className={requestDetailsStyles.titleContainer}>
                            <h3 className={requestDetailsStyles.panelHeader}>General Information</h3>
                        </div>

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

                        <div className={styles.formRow}>
                            <div className={styles.formItemShort}>
                                <label className={styles.formRowLabel}>Team Coach</label>
                                <div className={newRequestStyles.unchangeable}>
                                    {teamCoach ? teamCoach.title : 'Loading...'}
                                </div>
                            </div>

                            <div className={styles.formItemShort}>
                                <label className={styles.formRowLabel}>Team</label>
                                <div className={newRequestStyles.unchangeable}>
                                    {team ? team : 'Loading'}
                                </div>
                            </div>

                            <div className={styles.formItemShort}>
                                <label className={styles.formRowLabel}>Approver</label>
                                <div className={newRequestStyles.unchangeable}>
                                    {approver
                                        ? allApprovers.find(a => a.Id === approver)?.PracticeLead?.Title
                                        : 'Loading'}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                            <label className={styles.formRowLabel}>Goal *</label>
                            <textarea value={goal} onChange={e => setGoal(e.target.value)} className={goalError ? styles.invalid : ''} style={{ width: '100%', padding: '0 0 50px 0', marginTop: '6px' }} />
                            {goalError && <div className={styles.validationError}>{goalError}</div>}
                        </div>

                    </div>

                    <div className={requestDetailsStyles.items}>
                        <div className={requestDetailsStyles.titleContainer}>
                            <h3 className={requestDetailsStyles.panelHeader}>Items</h3>
                        </div>
                        <div>
                            <TrainingForm
                                ref={trainingFormRef}
                                context={context}
                                initialData={undefined}
                                showCheckbox={true}
                                inline={true}
                                onToggleIncludeTravel={(v: boolean) => handleTrainingToggle(v)}
                            />

                            {showInlineTravel && (
                                <div style={{ marginTop: '18px' }}>
                                    <TravelForm ref={travelFormRef} context={context} inline={true} initialData={undefined}
                                        onToggleIncludeAccommodation={(v: boolean) => setShowInlineAccommodation(v)}
                                        onToggleIncludeReturnJourney={(v: boolean) => setShowInlineReturnTravel(v)}
                                    />
                                </div>
                            )}

                            {showInlineReturnTravel && showInlineTravel && (
                                <div style={{ marginTop: '18px' }}>
                                    <TravelForm ref={travelFormRef} returning={true} context={context} inline={true} initialData={undefined} />
                                </div>
                            )}

                            {showInlineAccommodation && showInlineTravel && (
                                <div style={{ marginTop: '18px' }}>
                                    <AccommodationForm ref={accommodationFormRef} context={context} inline={true} initialData={undefined} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>


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
                                await handleSave('Draft');
                            } else if (confirmAction === 'send') {
                                await handleSave('Submitted');
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

export default NewRequestTraining;