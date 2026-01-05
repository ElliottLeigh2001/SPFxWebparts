import { useState } from 'react';
import * as React from 'react';
import { UserRequest } from '../../Interfaces/TTLInterfaces';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { IEditRequestFormProps } from './RequestDetailsProps';

const EditRequestForm: React.FC<IEditRequestFormProps> = ({ context, request, onSave, onCancel }) => {
  const [title, setTitle] = useState(request.Title || '');
  const [goal, setGoal] = useState(request.Goal || '');
  const [project, setProject] = useState(request.Project || '');
  const [titleError, setTitleError] = useState('');
  const [goalError, setGoalError] = useState('');
  const [projectError, setProjectError] = useState('');

  // Form validation (empty fields, max character length)
  const validate = (): boolean => {
      let isValid = true;

      setTitleError('');
      setGoalError('');
      setProjectError('');

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

  // On submit, update the request
  const handleSave = (): void => {
    if (!validate()) return;

    const updatedRequest: UserRequest = {
      ...request,
      Title: title,
      Goal: goal,
      Project: project,
    };
    
    onSave(updatedRequest);
  };

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