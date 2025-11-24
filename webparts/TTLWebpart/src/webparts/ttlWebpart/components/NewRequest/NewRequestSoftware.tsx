import { useState, useEffect } from 'react';
import styles from '../Dashboard/TtlWebpart.module.scss';
import newRequestStyles from './NewRequest.module.scss';
import { createRequestWithItems, getApproverById, getTeams } from '../../service/TTLService';
import { sendEmail } from '../../service/AutomateService';
import { calculateSoftwareLicenseCost } from '../../Helpers/HelperFunctions';
import SoftwareForm, { SoftwareFormHandle } from '../Forms/SoftwareForm';
import { Approver, Team } from '../../Interfaces/TTLInterfaces';
import ConfirmActionDialog from '../Modals/ConfirmActionDialog';
import * as React from 'react';
import { NewRequestProps } from './NewRequestProps';
import HeaderComponent from '../Header/HeaderComponent';

const NewRequestSoftware: React.FC<NewRequestProps> = ({ context, approvers, loggedInUser, onCancel, onSave }) => {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [project, setProject] = useState('');
  const [team, setTeam] = useState<number | ''>('');
  const [approver, setApprover] = useState<number | ''>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [allApprovers, setAllApprovers] = useState<Approver[]>([]);
  const [titleError, setTitleError] = useState('');
  const [goalError, setGoalError] = useState('');
  const [teamError, setTeamError] = useState('');
  const [approverError, setApproverError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'send' | 'discard' | null>(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  // software details are handled by SoftwareForm via imperative ref
  const softwareFormRef = React.useRef<SoftwareFormHandle | null>(null);
  const [softwareFormKey, setSoftwareFormKey] = useState(0);

  // Load Teams and Approvers
  useEffect(() => {
    const loadData = async () => {
      const approversWithoutCEO = approvers.filter((app: { TeamMember: any; }) => app.TeamMember);
      setAllApprovers(approversWithoutCEO);

      const fetchedTeams: Team[] = await getTeams(context);
      setTeams(fetchedTeams);
    };

    loadData();
  }, []);

  // Form validation
  const validate = (): boolean => {
    let valid = true;

    setTitleError('');
    setGoalError('');
    setTeamError('');
    setApproverError('');
    setProjectError('');

    if (!title.trim()) {
      setTitleError('Title is required');
      valid = false;
    }

    if (!goal.trim()) {
      setGoalError('Goal is required');
      valid = false;
    }

    if (!team) {
      setTeamError('Please select a team');
      valid = false;
    }

    if (!approver) {
      setApproverError('Please select an approver');
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
  const handleSave = async (type: string) => {
    // Check general validation
    if (!validate()) return;

    // Get software item data and validate via the SoftwareForm ref
    const formResult = softwareFormRef.current?.getFormData();
    if (!formResult || !formResult.isValid || !formResult.item) return;

    const item = formResult.item;

    // Calculate the yearly cost of a software license based on license type, how many people need the license etc.
    const calculatedCost = calculateSoftwareLicenseCost({ Cost: Number(item.Cost), Licensing: item.Licensing, LicenseType: item.LicenseType, UsersLicense: item.UsersLicense });

    let totalCost = Number(item.Cost);

    setIsSaving(true);
    setError(null);

    try {
      const createdId = await createRequestWithItems(
        context,
        {
          Title: title,
          Goal: goal,
          Project: project,
          TeamID: team,
          ApproverID: approver,
          TotalCost: calculatedCost,
        },
        [ item ],
        type
      );

      // If sending for approval, trigger the Automate flow
      if (type === 'Submitted') {
        const approverData = await getApproverById(context, Number(approver));
        const approverEmail = approverData?.TeamMember?.EMail;
        const approverTitle = approverData.TeamMember?.Title;

        sendEmail({
          emailType: "new request",
          requestId: createdId.toString(),
          title,
          approver: approverEmail,
          approverTitle,
          authorEmail: loggedInUser.Email,
          authorName: loggedInUser.Title,
          totalCost: totalCost.toString(),
          typeOfRequest: 'Software License'
        });
      }

      // Clear general form and reset software form
      setTitle('');
      setGoal('');
      setProject('');
      setTeam('');
      setApprover('');

      setSoftwareFormKey(prev => prev + 1);

      onSave();
    } catch (err) {
      console.error(err);
      setError('Failed to create request');
    } finally {
      setIsSaving(false);
    }
  };

  // software users handled inside SoftwareForm

  return (
    <>
    <HeaderComponent view="New Request" />
    <div className={styles.ttlForm}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />

      <div className={newRequestStyles.formHeader}>
        <h2>New Software License Request</h2>

        <div className={newRequestStyles.newRequestActions}>
          <button style={{ width: '171px' }} onClick={() => { setConfirmAction('save'); setConfirmOpen(true); } } className={styles.stdButton}>
            Draft
          </button>

          <button style={{ width: '171px' }} onClick={() => { setConfirmAction('send'); setConfirmOpen(true); } } className={styles.stdButton}>
            Send for approval
          </button>

          <button style={{ width: '171px' }} disabled={isSaving} onClick={() => { setConfirmAction('discard'); setConfirmOpen(true); } } className={styles.stdButton}>
            Discard
          </button>
        </div>
      </div>

      <h4>General Information</h4>

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
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Team *</label>
          <select value={team} onChange={e => setTeam(Number(e.target.value))} className={teamError ? styles.invalid : ''}>
            <option value="">-- Select Team --</option>
            {teams.map(t => <option key={t.Id} value={t.Id}>{t.Title}</option>)}
          </select>
          {teamError && <div className={styles.validationError}>{teamError}</div>}
        </div>

        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Approver *</label>
          <select value={approver} onChange={e => setApprover(Number(e.target.value))} className={approverError ? styles.invalid : ''}>
            <option value="">-- Select Approver --</option>
            {allApprovers.map(a => <option key={a.Id} value={a.Id}>{a.TeamMember?.Title}</option>)}
          </select>
          {approverError && <div className={styles.validationError}>{approverError}</div>}
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <label className={styles.formRowLabel}>Goal *</label>
        <textarea value={goal} onChange={e => setGoal(e.target.value)} style={{ width: '100%', padding: '0 0 50px 0', marginTop: '6px' }} className={goalError ? styles.invalid : ''} />
        {goalError && <div className={styles.validationError}>{goalError}</div>}
      </div>

      <h4>Software License Details</h4>

      <div>
        <SoftwareForm key={softwareFormKey} ref={softwareFormRef} context={context} onSave={() => { } } onCancel={() => { } } />
      </div>

      {error && <div className={styles.validationError}>{error}</div>}

      <ConfirmActionDialog
        isOpen={confirmOpen}
        action={confirmAction}
        isProcessing={confirmProcessing}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); } }
        onConfirm={async () => {
          if (!confirmAction) return;
          setConfirmProcessing(true);

          try {
            if (confirmAction === 'discard') {
              onCancel();
              return;
            }

            if (confirmAction === 'save') {
              await handleSave('Draft');
            } else if (confirmAction === 'send') {
              await handleSave('Submitted');
            }
          } finally {
            setConfirmProcessing(false);
            setConfirmOpen(false);
            setConfirmAction(null);
          }
        } } />
    </div>
    </>
  );
};

export default NewRequestSoftware;
