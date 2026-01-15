import { useState, useEffect } from 'react';
import styles from '../Dashboard/TtlWebpart.module.scss';
import newRequestStyles from './NewRequest.module.scss';
import requestDetailsStyles from '../RequestDetails/RequestDetails.module.scss'
import { createRequestWithItems, updateRequestWithCommentId } from '../../service/TTLService';
import { createComment } from '../../service/CommentService';
import { sendEmail } from '../../service/AutomateService';
import { calculateSoftwareLicenseCost, getUserAndManager } from '../../Helpers/HelperFunctions';
import SoftwareForm, { SoftwareFormHandle } from '../Forms/SoftwareForm';
import { IApprover } from '../../Interfaces/TTLInterfaces';
import ConfirmActionModal from '../Modals/ConfirmActionModal';
import * as React from 'react';
import { INewRequestProps } from './NewRequestProps';
import HeaderComponent from '../Header/HeaderComponent';

const NewRequestSoftware: React.FC<INewRequestProps> = ({ context, approvers, loggedInUser, onCancel, onSave }) => {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [project, setProject] = useState('');
  const [team, setTeam] = useState<string | undefined>(undefined);
  const [approver, setApprover] = useState<number | undefined>(undefined);
  const [allApprovers, setAllApprovers] = useState<IApprover[]>([]);
  const [teamCoach, setTeamCoach] = useState<{ id: number; title: string } | undefined>(undefined);
  const [titleError, setTitleError] = useState('');
  const [goalError, setGoalError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'send' | 'discard' | null>(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const softwareFormRef = React.useRef<SoftwareFormHandle | null>(null);
  const [softwareFormKey, setSoftwareFormKey] = useState(0);
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

  // Form validation
  const validate = (): boolean => {
    let valid = true;

    setTitleError('');
    setGoalError('');
    setProjectError('');

    if (!title.trim()) {
      setTitleError('Title is required');
      valid = false;
    }

    if (!goal.trim()) {
      setGoalError('Goal is required');
      valid = false;
    }

    if (title.length > 255) {
      setTitleError('Max length of title is 255 characters');
      valid = false;
    }

    if (project.length > 255) {
      setProjectError('Max length of title is 255 characters');
      valid = false;
    }

    return valid;
  };

  // On submit, create new items
  const handleSave = async (type: string, comment?: string) => {
    // Check general validation
    if (!validate()) return;

    // Get software item data and validate via the SoftwareForm ref
    const formResult = softwareFormRef.current?.getFormData();
    if (!formResult || !formResult.isValid || !formResult.item) return;

    const item = formResult.item;

    // Calculate the yearly cost of a software license based on license type, how many people need the license etc.
    const calculatedCost = calculateSoftwareLicenseCost({ 
      Cost: Number(item.Cost), 
      Licensing: item.Licensing, 
      LicenseType: item.LicenseType, 
      UsersLicense: item.UsersLicense 
    });

    let totalCost = Number(item.Cost);

    setIsSaving(true);
    setError(null);

    try {
      // Get the selected approver row
      const selectedApproverRow = allApprovers.find(a => a.Id === approver);
      
      if (!selectedApproverRow) {
        throw new Error('Selected approver not found');
      }

      const createdId = await createRequestWithItems(
        context,
        {
          Title: title,
          Goal: goal,
          Project: project,
          Team: team,
          ApproverID: approver,
          TeamCoachID: teamCoach?.id,
          TotalCost: calculatedCost,
        },
        [item],
        type
      );

      // If a comment was provided, create and link it to the new request
      if (comment && comment.trim()) {
        try {
          const commentObj = { Title: `Comment on Request ${createdId}`, Body: comment };
          const commentId = await createComment(context, commentObj, createdId);
          await updateRequestWithCommentId(context, createdId, commentId);
        } catch (err) {
          console.error('Failed to create or link comment for new request', err);
        }
      }

      // If sending for approval, trigger the Automate flow
      if (type === 'Submitted' && selectedApproverRow.PracticeLead?.EMail) {
        try {
          await sendEmail({
            emailType: "new request",
            requestId: createdId.toString(),
            title,
            approverEmail: selectedApproverRow.PracticeLead.EMail,
            approverTitle: selectedApproverRow.PracticeLead.Title ?? '',
            teamCoachEmail: selectedApproverRow.TeamCoach.EMail,
            teamCoachTitle: selectedApproverRow.TeamCoach.Title ?? '',
            authorEmail: loggedInUser.Email,
            authorName: loggedInUser.Title,
            directorTitle: selectedApproverRow.CEO?.Title ?? '',
            directorEmail: selectedApproverRow.CEO?.EMail ?? '',
            totalCost: totalCost.toString(),
            typeOfRequest: 'Software License'
          });
        } catch (err) {
          console.error('Email sending failed', err);
        }
      }

      // Clear general form and reset software form
      setTitle('');
      setGoal('');
      setProject('');
      setTeam('');
      setApprover(undefined);

      setSoftwareFormKey(prev => prev + 1);

      onSave();
    } catch (err) {
      console.error(err);
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
    <div className={styles.ttlForm}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />

      <div className={newRequestStyles.formHeader}>
        <h2 style={{color: '#055a57'}}>New Software License Request</h2>

        <div className={newRequestStyles.newRequestActions}>

          <button disabled={isSaving} onClick={() => { setConfirmAction('discard'); setConfirmOpen(true); } } className={`${styles.stdButton} ${newRequestStyles.buttonWidth}`}>
            Discard
          </button>
          
          <button onClick={() => { setConfirmAction('save'); setConfirmOpen(true); } } className={`${styles.stdButton} ${newRequestStyles.buttonWidth}`}>
            Draft
          </button>

          <button onClick={() => { setConfirmAction('send'); setConfirmOpen(true); } } className={`${styles.stdButton} ${newRequestStyles.buttonWidth}`}>
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
            <input value={title} onChange={e => setTitle(e.target.value)} className={titleError ? styles.invalid : ''} />
            {titleError && <div className={styles.validationError}>{titleError}</div>}
          </div>

          <div className={styles.formItem}>
            <label className={styles.formRowLabel}>Project</label>
            <input value={project} onChange={e => setProject(e.target.value)} className={projectError ? styles.invalid : ''} />
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
          <textarea 
            value={goal} 
            onChange={e => setGoal(e.target.value)} 
            style={{ width: '100%', padding: '0 0 50px 0', marginTop: '6px' }} 
            className={goalError ? styles.invalid : ''} 
          />
          {goalError && <div className={styles.validationError}>{goalError}</div>}
        </div>
      </div>
      
      <div className={requestDetailsStyles.items}>
          <div className={requestDetailsStyles.titleContainer}>
              <h3 className={requestDetailsStyles.panelHeader}>Software License Details</h3>      
          </div>
          <div>
            <SoftwareForm key={softwareFormKey} ref={softwareFormRef} context={context} onSave={() => { } } onCancel={() => { } } />
          </div>
      </div>
    </div>

      {error && <div style={{fontSize: 'small', fontWeight: 'bold', justifySelf: 'center'}} className={styles.validationError}>{error}</div>}

      <ConfirmActionModal
        isOpen={confirmOpen}
        action={confirmAction}
        isProcessing={confirmProcessing}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); } }
        onConfirm={async (comment) => {
          if (!confirmAction) return;
          setConfirmProcessing(true);

          try {
            if (confirmAction === 'discard') {
              onCancel();
              return;
            }

            if (confirmAction === 'save') {
              await handleSave('Draft', comment);
            } else if (confirmAction === 'send') {
              await handleSave('Submitted', comment);
            }
          } finally {
            setConfirmProcessing(false);
            setConfirmOpen(false);
            setConfirmAction(null);
          }
        } }
        />
    </div>
    </>
  );
};

export default NewRequestSoftware;