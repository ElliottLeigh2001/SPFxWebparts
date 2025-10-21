import * as React from 'react';
import { useState } from 'react';
import styles from '../TtlWebpart.module.scss';

interface TravelFormProps {
  onSave: (item: any) => void;
  onCancel: () => void;
}

const TravelForm: React.FC<TravelFormProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [cost, setCost] = useState('');
  const [attachments, setAttachments] = useState('');
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
  const s = date ? new Date(date) : null;

  if (s && s < new Date(today.toDateString())) {
    setDateError('Start date cannot be before today');
    valid = false;
  } else {
    setDateError('');
  }

  return valid;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ Title: title, Provider: provider, date: date, Cost: cost, Link: link, Attachments: attachments, RequestType: 'Travel' });
  };

  return (
    <div className={styles.ttlForm}>
      <h3>Travel</h3>
      
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
          <label className={styles.formRowLabel}>Date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          {dateError && <div className={styles.validationError}>{dateError}</div>}
      </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Link</label>
          <input value={link} onChange={e => setLink(e.target.value)} />
        </div>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Attachments</label>
          <input value={attachments} onChange={e => setAttachments(e.target.value)} />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.saveButton} onClick={handleSave}>Add Item</button>
        <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default TravelForm;
