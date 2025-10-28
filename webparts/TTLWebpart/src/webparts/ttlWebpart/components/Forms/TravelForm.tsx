import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from '../TtlWebpart.module.scss';
import { FormProps } from './FormProps';
import { validateCost, validateLink } from '../../service/FormService';

const TravelForm: React.FC<FormProps> = ({ onSave, onCancel, initialData }) => {
  const [title, setTitle] = useState(initialData?.Title || '');
  const [date, setDate] = useState(initialData?.StartDate || '');
  const [cost, setCost] = useState(initialData?.Cost || '');
  const [attachments, setAttachments] = useState(initialData?.Attachments || '');
  const [provider, setProvider] = useState(initialData?.Provider || '');
  const [link, setLink] = useState(initialData?.Link || '');
  const [titleError, setTitleError] = useState('');
  const [providerError, setProviderError] = useState('');
  const [costError, setCostError] = useState('');
  const [dateError, setDateError] = useState('');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.Title || '');
      setProvider(initialData.Provider || '');
      setCost(initialData.Cost || '');
      setDate(initialData.StartDate || '');
      setAttachments(initialData.Attachments || '');
      setLink(initialData.Link || '');
    }
    }, [initialData]);

  const validate = (): boolean => {
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

    if (!link) {
      setLinkError('Link is required');
      valid = false;
    } else if (!validateLink(link)) {
      setLinkError('Link must be a url (ex. https://www.google.com)');
      valid = false;
    } else {
      setLinkError('');
    }

  const costValidation = validateCost(cost);
    if (!costValidation.isValid) {
      setCostError(costValidation.error);
      valid = false;
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

  const handleSave = (): void => {
    if (!validate()) return;
    onSave({ Title: title, Provider: provider, StartDate: date, Cost: cost, Link: link, Attachments: attachments, RequestType: 'Travel' });
  };

  return (
    <div>
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
          <label className={styles.formRowLabel}>Link *</label>
          <input value={link} onChange={e => setLink(e.target.value)} />
          {linkError && <div className={styles.validationError}>{linkError}</div>}
        </div>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Attachments</label>
          <input value={attachments} onChange={e => setAttachments(e.target.value)} />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.saveButton} onClick={handleSave}>{initialData ? 'Edit Item' : 'Add Item'}</button>
        <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default TravelForm;
