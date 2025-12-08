import { useState, useEffect } from 'react';
import * as React from 'react';
import { UserRequest, Approver } from '../../Interfaces/TTLInterfaces';
import { getApprovers } from '../../service/TTLService';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { EditRequestFormProps } from './RequestDetailsProps';


const EditRequestForm: React.FC<EditRequestFormProps> = ({ context, request, onSave, onCancel }) => {
  const [title, setTitle] = useState(request.Title || '');
  const [goal, setGoal] = useState(request.Goal || '');
  const [project, setProject] = useState(request.Project || '');
  const [team, setTeam] = useState<string>(request.Team || '');
  const [teamId, setTeamId] = useState<number | ''>('');
  const [approver, setApprover] = useState<number | ''>(request.ApproverID?.Id || '');
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [titleError, setTitleError] = useState('');
  const [goalError, setGoalError] = useState('');
  const [teamError, setTeamError] = useState('');
  const [approverError, setApproverError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Get data 
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const approversData = await getApprovers(context)

        const approversWithoutCEO = approversData.filter(app => app.PracticeLead)
        setApprovers(approversWithoutCEO);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [context]);

  // Auto-select approver when team changes
  useEffect(() => {
    if (!request.Team || approvers.length === 0) return;

    const matching = approvers.find(a => a.Team0 === request.Team);
    if (matching) {
      setTeamId(matching.Id);
    }
  }, [approvers, request.Team]);

  useEffect(() => {
  if (!teamId) return;
  setApprover(teamId);
  setApproverError('');
  }, [teamId]);

  // Form validation (empty fields, max character length)
  const validate = (): boolean => {
      let isValid = true;

      setTitleError('');
      setGoalError('');
      setProjectError('');
      setTeamError('');
      setApproverError('');

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

  // On submit, update the request
  const handleSave = (): void => {
    if (!validate()) return;

    const updatedRequest: UserRequest = {
      ...request,
      Title: title,
      Goal: goal,
      Project: project,
      Team: team,
      ApproverID: approver ? { Id: approver as number } : undefined
    };
    
    onSave(updatedRequest);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label>Title *</label>
          <input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className={titleError ? styles.invalid : ''}
          />
          {titleError && <div className={styles.validationError}>{titleError}</div>}
        </div>
        <div className={styles.formItem}>
          <label>Project</label>
          <input value={project} onChange={e => setProject(e.target.value)} className={titleError ? styles.invalid : ''}/>
          {projectError && <div className={styles.validationError}>{projectError}</div>}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label>Team *</label>
          <select
              value={teamId}
              onChange={e => {
                  const id = Number(e.target.value);
                  setTeamId(id);

                  // Find the team object so we can store its name
                  const sel = approvers.find(a => a.Id === id);
                  if (sel) setTeam(sel.Team0 ?? '');
              }}
          >
              <option value="">-- Select team --</option>
              {approvers.map(a => (
                  <option key={a.Id} value={a.Id}>
                      {a.Team0}
                  </option>
              ))}
          </select>

          {teamError && <div className={styles.validationError}>{teamError}</div>}
        </div>
        <div className={styles.formItem}>
          <label>Approver *</label>
          <select
            value={approver}
            onChange={e => setApprover(Number(e.target.value))}
            className={approverError ? styles.invalid : ''}
          >
            <option value="">-- Select Approver --</option>
            {approvers.map((approverItem) => (
              <option key={approverItem.Id} value={approverItem.Id}>
                {approverItem.PracticeLead?.Title}
              </option>
            ))}
          </select>
          {approverError && <div className={styles.validationError}>{approverError}</div>}
        </div>
      </div>

      <label>Goal *</label>
      <textarea 
        value={goal} 
        onChange={e => setGoal(e.target.value)} 
        className={goalError ? styles.invalid : ''}
        style={{ width: '100%', padding: '0 0 50px 0', marginTop: '6px' }}
      />
      {goalError && <div className={styles.validationError}>{goalError}</div>}

      <div className={styles.formActions}>
        <button className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button className={styles.saveButton} onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default EditRequestForm;