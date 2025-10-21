import * as React from 'react';
import { useState } from 'react';
import styles from '../TtlWebpart.module.scss';

interface TrainingFormProps {
  onSave: (item: any) => void;
  onCancel: () => void;
}

const TrainingForm: React.FC<TrainingFormProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [provider, setProvider] = useState('');
  const [link, setLink] = useState('');
  const [titleError, setTitleError] = useState('');
  const [providerError, setProviderError] = useState('');
  const [costError, setCostError] = useState('');
  const [dateError, setDateError] = useState('');

const validate = () => {
  let valid = true;

  if (!title) {
    setTitleError('Title is required');
    valid = false;
  } else {
    setTitleError('');
  }

  if (!provider) {
    setProviderError('Provider is required');
    valid = false;
  } else {
    setProviderError('');
  }

  const costValue = parseFloat(cost.replace(/[^0-9.-]+/g, ''));
  if (isNaN(costValue)) {
    setCostError('Cost must be a number');
    valid = false;
  } else {
    setCostError('');
  }

  const today = new Date();
  const s = startDate ? new Date(startDate) : null;
  const e = endDate ? new Date(endDate) : null;
  if (s && s < new Date(today.toDateString())) {
    setDateError('Start date cannot be before today');
    valid = false;
  } else if (s && e && e < s) {
    setDateError('End date cannot be before start date');
    valid = false;
  } else {
    setDateError('');
  }

  return valid;
};

  const handleSave = () => {
    if (!validate()) return;
    onSave({ Title: title, Provider: provider, Location: location, StartDate: startDate, EndDate: endDate, Cost: cost, Link: link, RequestType: 'Training' });
  };

  return (
    <div className={styles.ttlForm}>
      <h3>Training</h3>
      
      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={!title ? 'invalid' : ''} />
          {titleError && <div className={styles.validationError}>{titleError}</div>}
        </div>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Provider *</label>
          <input value={provider} onChange={e => setProvider(e.target.value)} className={!provider ? 'invalid' : ''} />
          {providerError && <div className={styles.validationError}>{providerError}</div>}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Cost *</label>
          <input value={cost} onChange={e => setCost(e.target.value)} className={isNaN(Number(cost)) ? 'invalid' : ''} />
          {costError && <div className={styles.validationError}>{costError}</div>}
        </div>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Address</label>
          <input value={location} onChange={e => setLocation(e.target.value)} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Start Date *</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          {dateError && <div className={styles.validationError}>{dateError}</div>}
        </div>
      </div>

        <div>
          <label className={styles.formRowLabel}>Link</label>
          <input value={link} onChange={e => setLink(e.target.value)} style={{width: '100%', marginBottom: '18px', marginTop: '6px'}}/>
        </div>

      <div className={styles.formActions}>
        <button className={styles.saveButton} onClick={handleSave}>Add Item</button>
        <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default TrainingForm;
