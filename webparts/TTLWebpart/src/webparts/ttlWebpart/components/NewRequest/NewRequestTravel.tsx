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
import { NewRequestProps } from './NewRequestProps';
import HeaderComponent from '../Header/HeaderComponent';

const NewRequestTravel: React.FC<NewRequestProps> = ({ context, onCancel, onSave, approvers, loggedInUser }) => {
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('');
    const [project, setProject] = useState('');
    const [team, setTeam] = useState<string | ''>('');
    const [teamId, setTeamId] = useState<number | ''>('');
    const [approver, setApprover] = useState<number | ''>('');
    const [allApprovers, setAllApprovers] = useState<Approver[]>([]);
    const trainingFormRef = useRef<any>(null);
    const travelFormRef = useRef<any>(null);
    const accommodationFormRef = useRef<any>(null);
    const [showInlineTraining, setShowInlineTraining] = useState(false);
    const [showInlineReturnTravel, setShowInlineReturnTravel] = useState(false);
    const [showInlineAccommodation, setShowInlineAccommodation] = useState(false);
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

    // Get approvers and teams from SharePoint
    useEffect(() => {
        const getApprovers = async (): Promise<void> => {
            const approversWithoutCEO = approvers.filter(app => app.TeamMember)
            setAllApprovers(approversWithoutCEO)
        }
        getApprovers();
    }, [])

  // Auto-select approver when team changes
  useEffect(() => {
      if (!teamId || allApprovers.length === 0) return;

      const approverForTeam = allApprovers.find(a => a.Id === teamId);

      if (approverForTeam) {
          setApprover(approverForTeam.Id);
          setApproverError('');
      }
  }, [teamId, allApprovers]);

    // Form validation (empty fields, max characters)
    const validate = (): boolean => {
        let isValid = true;

        setTitleError('');
        setGoalError('');
        setTeamError('');
        setApproverError('');
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

    const collectAllItems = async (): Promise<UserRequestItem[] | null> => {
        let collected: UserRequestItem[] = [];

        // 1. TRAINING
        const t = await trainingFormRef.current?.getFormData();
        if (!t?.isValid) return null;
        collected.push(t.item);

        // If no travel needed → return training item only
        if (!t.includeTravel) return collected;

        // 2. TRAVEL
        const tr = await travelFormRef.current?.getFormData();
        if (!tr?.isValid) return null;
        collected.push(tr.item);

        // 3. ACCOMMODATION
        if (tr.includeAccommodation) {
            const ac = await accommodationFormRef.current?.getFormData();
            if (!ac?.isValid) return null;
            collected.push(ac.item);
        }

        // 4. RETURN JOURNEY TRAVEL
        if (tr.includeReturnJourney) {
            const ret = await travelFormRef.current?.getReturnJourneyData?.();
            if (ret?.isValid) collected.push(ret.item);
        }

        return collected;
    };

    // On submit of the request, save it
    const handleSave = async (type: string): Promise<void> => {
        // Validate main form
        if (!validate()) return;

        // Collect inline items
        const collectedItems = await collectAllItems();
        if (!collectedItems) return; // Validation failed inside inline forms

        let totalCost = collectedItems.reduce((sum, x) => sum + Number(x.Cost || 0), 0);

        setIsSaving(true);
        setError(null);

        try {
            const requestId = await createRequestWithItems(
                context,
                {
                    Title: title,
                    Goal: goal,
                    Project: project,
                    TeamID: team,
                    ApproverID: approver,
                    TotalCost: totalCost
                },
                collectedItems,
                type
            );

            if (type === 'Submitted') {
                const approverData = await getApproverById(context, Number(approver));
                const approverEmail = approverData?.TeamMember?.EMail;
                const approverTitle = approverData.TeamMember?.Title;
                sendEmail({ emailType: "new request", requestId: requestId.toString(), title: title, approver: approverEmail, approverTitle: approverTitle, authorEmail: loggedInUser.Email, authorName: loggedInUser.Title, totalCost: totalCost.toString(), typeOfRequest: 'Training / Travel'});
            }

            onSave();

        } catch (err) {
            setError('Failed to create request');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <HeaderComponent view="New Request"/>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
            <div className={styles.ttlForm}>
                <div className={newRequestStyles.formHeader}>
                    <h2 style={{color: '#055a57'}}>New Travel Request</h2>
                    <div className={newRequestStyles.newRequestActions}>
                        <button
                            className={styles.stdButton}
                            style={{width: '171px'}}
                            onClick={() => { setConfirmAction('save'); setConfirmOpen(true); }}
                        >
                            Draft
                        </button>

                        <button
                            className={styles.stdButton}
                            style={{width: '171px'}}
                            onClick={() => { setConfirmAction('send'); setConfirmOpen(true); }}
                        >
                            Send for approval
                        </button>

                        <button
                            className={styles.stdButton}
                            style={{width: '171px'}}
                            disabled={isSaving}
                            onClick={() => { setConfirmAction('discard'); setConfirmOpen(true); }}
                            title="Discard"
                        >
                            Discard
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
                            <div className={styles.formItem}>
                                <label className={styles.formRowLabel}>Team *</label>
                                <select
                                    value={teamId}
                                    onChange={e => {
                                        const id = Number(e.target.value);
                                        setTeamId(id);

                                        // Find the team object so we can store its name
                                        const sel = allApprovers.find(a => a.Id === id);
                                        if (sel) setTeam(sel.Team0 ?? '');
                                    }}
                                >
                                    <option value="">-- Select team --</option>
                                    {allApprovers.map(a => (
                                        <option key={a.Id} value={a.Id}>
                                            {a.Team0}
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
                                    className={approverError ? styles.invalid : ''}
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

                            <TravelForm ref={travelFormRef} travelRequest={true} context={context} inline={true} initialData={undefined}
                                onToggleIncludeTraining={(v: boolean) => setShowInlineTraining(v)}
                                onToggleIncludeAccommodation={(v: boolean) => setShowInlineAccommodation(v)}
                                onToggleIncludeReturnJourney={(v: boolean) => setShowInlineReturnTravel(v)}
                            />

                            {showInlineTraining && (
                                <div style={{ marginTop: '18px' }}>
                                    <TrainingForm 
                                        ref={trainingFormRef}
                                        showCheckbox={false}
                                        context={context} 
                                        initialData={undefined}
                                        inline={true}
                                        onToggleIncludeTravel={(v: boolean) => setShowInlineTraining(v)}
                                    />
                                </div>
                            )}

                            {showInlineReturnTravel && (
                                <div style={{ marginTop: '18px' }}>
                                    <TravelForm ref={travelFormRef} returning={true} context={context} inline={true} initialData={undefined}/>
                                </div>
                            )}

                            {showInlineAccommodation && (
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

export default NewRequestTravel;