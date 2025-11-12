import { useState, useEffect } from 'react';
import { IPeoplePickerContext, PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import styles from '../Dashboard/TtlWebpart.module.scss';
import newRequestStyles from './NewRequest.module.scss';
import { createRequestWithItems, getApproverById, getTeams } from '../../service/TTLService';
import { sendEmail } from '../../service/AutomateService';
import { calculateSoftwareLicenseCost, validateCost, validateLink } from '../../Helpers/HelperFunctions';
import { Approver, Team } from '../../Interfaces/TTLInterfaces';
import ConfirmActionDialog from '../Modals/ConfirmActionDialog';
import * as React from 'react';
import { NewRequestProps } from './NewRequestProps';

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

  // Software Details State
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [cost, setCost] = useState('');
  const [licensing, setLicensing] = useState('Monthly');
  const [licenseType, setLicenseType] = useState('Group');
  const [usersLicense, setUsersLicense] = useState<any[]>([]);
  const [link, setLink] = useState('');

  const [nameError, setNameError] = useState('');
  const [providerError, setProviderError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [costError, setCostError] = useState('');
  const [usersLicenseError, setUsersLicenseError] = useState('');

  const peoplePickerContext: IPeoplePickerContext = {
    absoluteUrl: context.pageContext.web.absoluteUrl,
    msGraphClientFactory: context.msGraphClientFactory,
    spHttpClient: context.spHttpClient
  };

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

  const validate = (): boolean => {
    let valid = true;

    setTitleError('');
    setGoalError('');
    setTeamError('');
    setApproverError('');
    setProjectError('');
    setNameError('');
    setProviderError('');
    setLinkError('');
    setCostError('');
    setUsersLicenseError('');

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

    if (!name) {
      setNameError('Name is required');
      valid = false;
    }

    if (!provider) {
      setProviderError('Provider is required');
      valid = false;
    }

    if (!link) {
      setLinkError('Link is required');
      valid = false;
    } else if (!validateLink(link)) {
      setLinkError('Link must be a valid url (ex. https://www.google.com)');
      valid = false;
    }

    const costValidation = validateCost(cost);
    if (!costValidation.isValid) {
      setCostError(costValidation.error);
      valid = false;
    }

    if (usersLicense.length === 0) {
      setUsersLicenseError('Who will be using this license is required');
      valid = false;
    }

    if (name.length > 255) {
      setNameError('Max length of title is 255 characters');
      valid = false;
    }

    if (provider.length > 255) {
      setProviderError('Max length of provider is 255 characters');
      valid = false;
    }

    return valid;
  };

  const handleSave = async (type: string) => {
    if (!validate()) return;

    const calculatedCost = calculateSoftwareLicenseCost({Cost: Number(cost), Licensing: licensing, LicenseType: licenseType, UsersLicense: usersLicense})

    let totalCost = Number(cost);

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
        [
          {
            Title: name,
            Provider: provider,
            Cost: cost,
            Licensing: licensing,
            LicenseType: licenseType,
            UsersLicense: usersLicense,
            Link: link,
            RequestType: 'Software'
          }
        ],
        type
      );

      if (type === 'Sent for approval') {
        const approverData = await getApproverById(context, Number(approver));
        const approverEmail = approverData?.TeamMember?.EMail;
        const approverTitle = approverData.TeamMember?.Title;

        sendEmail({
          emailType: "new request",
          requestId: createdId.toString(),
          title,
          approver: approverEmail,
          approverTitle,
          author: loggedInUser.Email,
          totalCost: totalCost.toString()
        });
      }

      setTitle('');
      setGoal('');
      setProject('');
      setTeam('');
      setApprover('');

      setName('');
      setProvider('');
      setCost('');
      setLicensing('Monthly');
      setLicenseType('Group');
      setUsersLicense([]);
      setLink('');

      onSave();
    } catch (err) {
      console.error(err);
      setError('Failed to create request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsersChange = (items: any[]) => {
    const users = items.map(user => ({
      id: user.id,
      loginName: user.loginName,
      text: user.text || user.displayName || user.loginName
    }));

    setUsersLicense(users);
  };

  return (
    <div className={styles.ttlForm}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />

      <div className={styles.formHeader}>
        <h2>New Software License Request</h2>

        <div className={newRequestStyles.newRequestActions}>
          <button onClick={() => { setConfirmAction('save'); setConfirmOpen(true); }} className={newRequestStyles.iconButton}>
            <i className="fa fa-bookmark-o"></i>
          </button>

          <button onClick={() => { setConfirmAction('send'); setConfirmOpen(true); }} className={newRequestStyles.iconButton}>
            <i className="fa fa-paper-plane"></i>
          </button>

          <button disabled={isSaving} onClick={() => { setConfirmAction('discard'); setConfirmOpen(true); }} className={newRequestStyles.iconButton}>
            <i className="fa fa-trash"></i>
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

      <div style={{ marginBottom: '18px' }}>
        <label className={styles.formRowLabel}>Goal *</label>
        <textarea value={goal} onChange={e => setGoal(e.target.value)} style={{ width: '99%', marginTop: '6px' }} className={goalError ? styles.invalid : ''}/>
        {goalError && <div className={styles.validationError}>{goalError}</div>}
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

      <h4>Software License Details</h4>

      <div className={styles.formRow}>
        <div className={styles.formItemShort}>
          <label className={styles.formRowLabel}>Name of license *</label>
          <input value={name} onChange={e => setName(e.target.value)} className={nameError ? styles.invalid : ''} />
          {nameError && <div className={styles.validationError}>{nameError}</div>}
        </div>

        <div className={styles.formItemShort}>
          <label className={styles.formRowLabel}>Provider *</label>
          <input value={provider} onChange={e => setProvider(e.target.value)} className={providerError ? styles.invalid : ''} />
          {providerError && <div className={styles.validationError}>{providerError}</div>}
        </div>

        <div className={styles.formItemShort}>
          <label className={styles.formRowLabel}>Cost (€)*</label>
          <input value={cost} onChange={e => setCost(e.target.value)} className={costError ? styles.invalid : ''} />
          {costError && <div className={styles.validationError}>{costError}</div>}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Billing *</label>
          <select value={licensing} onChange={e => setLicensing(e.target.value)}>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
            <option value="One-time">One-time</option>
          </select>
        </div>

        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>License Type *</label>
          <select value={licenseType} onChange={e => setLicenseType(e.target.value)}>
            <option value="Group">Group</option>
            <option value="Individual">Individual</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Who will be using this license? *</label>
          <div className={usersLicenseError ? styles.invalid : ''}>
            <PeoplePicker
              context={peoplePickerContext}
              personSelectionLimit={10}
              showtooltip={true}
              principalTypes={[PrincipalType.User, PrincipalType.SharePointGroup, PrincipalType.SecurityGroup]}
              resolveDelay={500}
              defaultSelectedUsers={[]}
              onChange={handleUsersChange}
            />
          </div>
          {usersLicenseError && <div className={styles.validationError}>{usersLicenseError}</div>}
        </div>

        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Link *</label>
          <input value={link} onChange={e => setLink(e.target.value)} className={linkError ? styles.invalid : ''} />
          {linkError && <div className={styles.validationError}>{linkError}</div>}
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
            if (confirmAction === 'discard') {
              onCancel();
              return;
            }

            if (confirmAction === 'save') {
              await handleSave('Saved');
            } else if (confirmAction === 'send') {
              await handleSave('Sent for approval');
            }
          } finally {
            setConfirmProcessing(false);
            setConfirmOpen(false);
            setConfirmAction(null);
          }
        }}
      />
    </div>
  );
};

export default NewRequestSoftware;
