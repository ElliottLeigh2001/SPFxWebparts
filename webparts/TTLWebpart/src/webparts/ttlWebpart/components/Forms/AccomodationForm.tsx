import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from '../TtlWebpart.module.scss';
import { FormProps } from './FormProps';
import { validateCost, validateLink } from '../../Helpers/HelperFunctions';

const AccomodationForm: React.FC<FormProps> = ({ onSave, onCancel, initialData, view }) => {
  const [title, setTitle] = useState(initialData?.Title || '');
  const [location, setLocation] = useState(initialData?.Location || '');
  const [cost, setCost] = useState(initialData?.Cost || '');
  const [startDate, setStartDate] = useState(initialData?.StartDate || '');
  const [endDate, setOData__EndDate] = useState(initialData?.OData__EndDate || '');
  const [provider, setProvider] = useState(initialData?.Provider || '');
  const [link, setLink] = useState(initialData?.Link || '');
  const [titleError, setTitleError] = useState('');
  const [providerError, setProviderError] = useState('');
  const [costError, setCostError] = useState('');
  const [dateError, setDateError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.Title || '');
      setProvider(initialData.Provider || '');
      setCost(initialData.Cost || '');
      setLocation(initialData.Location || '');
      setStartDate(initialData.StartDate || '');
      setOData__EndDate(initialData.OData__EndDate || '');
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

    if (!location) {
      setLocationError('Address is required');
      valid = false;
    } else {
      setLocationError('');
    }

    if (!startDate) {
      setStartDateError('Start date is required');
      valid = false;
    } else {
      setStartDateError('');
    }

    if (!endDate) {
      setEndDateError('End date is required');
      valid = false;
    } else {
      setEndDateError('');
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

const validateHR = (): boolean => {
  let valid = true;

  const costValidation = validateCost(cost);
    if (!costValidation.isValid) {
      setCostError(costValidation.error);
      valid = false;
    }
    return valid;
}

  const handleSave = (): void => {
    if (view === 'HR') {
      if (!validateHR()) return;
      onSave({ Title: title, Provider: provider, Location: location, StartDate: startDate, OData__EndDate: endDate, Cost: cost, Link: link, RequestType: 'Accomodation' });
    }
    if (!validate()) return;
    onSave({ Title: title, Provider: provider, Location: location, StartDate: startDate, OData__EndDate: endDate, Cost: cost, Link: link, RequestType: 'Accomodation' });
  };

  return (
    <div>
      {view === 'HR' ? (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
          <label className={styles.formRowLabel}>Cost</label>
          <input style={{width: '50%'}} value={cost} onChange={e => setCost(e.target.value)} className={isNaN(Number(cost)) ? 'invalid' : ''} />
          {costError && <div className={styles.validationError}>{costError}</div>}
        </div>
      ) : (
      <>
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
        </div><div className={styles.formRow}>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Cost *</label>
              <input value={cost} onChange={e => setCost(e.target.value)} className={isNaN(Number(cost)) ? 'invalid' : ''} />
              {costError && <div className={styles.validationError}>{costError}</div>}
            </div>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Address *</label>
              <input value={location} onChange={e => setLocation(e.target.value)} />
              {locationError && <div className={styles.validationError}>{locationError}</div>}
            </div>
          </div><div className={styles.formRow}>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Start Date *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              {dateError && <div className={styles.validationError}>{dateError}</div>}
              {startDateError && <div className={styles.validationError}>{startDateError}</div>}
            </div>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>End Date *</label>
              <input type="date" value={endDate} onChange={e => setOData__EndDate(e.target.value)} />
              {endDateError && <div className={styles.validationError}>{endDateError}</div>}
            </div>
          </div><div>
            <label className={styles.formRowLabel}>Link *</label>
            <input value={link} onChange={e => setLink(e.target.value)} style={{ width: '100%', marginTop: '6px' }} />
            {linkError && <div className={styles.validationError}>{linkError}</div>}
          </div>
        </>
      )}

      <div className={styles.formActions}>
        <button className={styles.saveButton} onClick={handleSave}>{initialData ? 'Edit Item' : 'Add Item'}</button>
        <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default AccomodationForm;
