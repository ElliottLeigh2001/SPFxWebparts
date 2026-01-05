import * as React from 'react';
import { useState, forwardRef, useImperativeHandle } from 'react';
import styles from '../Dashboard/TtlWebpart.module.scss';
import formStyles from './Forms.module.scss';
import { IFormProps } from './FormProps';
import { formatEditingDate, validateCost, validateLink } from '../../Helpers/HelperFunctions';

export type AccommodationFormHandle = {
  getFormData: () => { isValid: boolean; item?: any }
}

const AccommodationForm = forwardRef<AccommodationFormHandle, IFormProps & { inline?: boolean }>((props, ref) => {
  const { onSave, onCancel, initialData, view, inline } = props;
  const [title, setTitle] = useState(initialData?.Title || '');
  const [location, setLocation] = useState(initialData?.Location || '');
  const [cost, setCost] = useState(initialData?.Cost || '');
  const [startDate, setStartDate] = useState(formatEditingDate(initialData?.StartDate) || '');
  const [endDate, setOData__EndDate] = useState(formatEditingDate(initialData?.OData__EndDate) || '');
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
  const [isLoading, setIsLoading] = useState(false)

  // Form validation
  const validate = (): boolean => {
    let valid = true;
    
    setEndDateError('');
    setStartDateError('');
    setTitleError('');
    setProviderError('');
    setLinkError('');
    setDateError('');
    setLocationError('');

    if (!title) {
      setTitleError('Title is required');
      valid = false;
    } 

    if (!provider) {
      setProviderError('Provider is required');
      valid = false;
    } 

    if (!startDate || startDate === '-' || startDate === '—') {
      setStartDateError('Start date is required');
      valid = false;
    }
    if (!endDate || endDate === '-' || endDate === '—') {
      setEndDateError('End date is required');
      valid = false;
    }

    if (!link) {
      setLinkError('Link is required');
      valid = false;
    } else if (!validateLink(link)) {
      setLinkError('Link must be a url (ex. https://www.google.com)');
      valid = false;
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
    }

    if (title.length > 255) {
        setTitleError('Max length of title is 255 characters')
        valid = false;
    }

    if (location.length > 255) {
        setLocationError('Max length of address is 255 characters')
        valid = false;
    }

    if (provider.length > 255) {
        setProviderError('Max length of provider is 255 characters')
        valid = false;
    }

    return valid;
  };

  // If HR is editing the item, only the cost can be changed (so only validate the cost)
  const validateHR = (): boolean => {
    let valid = true;

    const costValidation = validateCost(cost);
      if (!costValidation.isValid) {
        setCostError(costValidation.error);
        valid = false;
      }
      return valid;
  }

  useImperativeHandle(ref, () => ({
    getFormData: () => {
      const result: { isValid: boolean; item?: any } = { isValid: false };
      const valid = validate();
      if (!valid) return result;
      result.isValid = true;
      result.item = { Title: title, Provider: provider, Location: location, StartDate: startDate, OData__EndDate: endDate, Cost: cost, Link: link, RequestType: 'Accommodation' };
      return result;
    }
  }));

  const handleSave = (): void => {
    if (isLoading) return;
    setIsLoading(true);

    if (view === 'HR') {
      if (!validateHR()) {
        setIsLoading(false);
        return;
      }
      onSave({ Title: title, Provider: provider, Location: location, StartDate: startDate, OData__EndDate: endDate, Cost: cost, Link: link, RequestType: 'Accommodation' });
      setIsLoading(false);
    }

    if (!validate()) {
      setIsLoading(false);
      return;
    }
    onSave({ Title: title, Provider: provider, Location: location, StartDate: startDate, OData__EndDate: endDate, Cost: cost, Link: link, RequestType: 'Accommodation' });
    setIsLoading(false)
  };

  return (
    <div>
      {view === 'HR' ? (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
          <label className={styles.formRowLabel}>Cost (€)*</label>
          <input style={{width: '50%'}} value={cost} onChange={e => setCost(e.target.value)} className={isNaN(Number(cost)) ? 'invalid' : ''} />
          {costError && <div className={styles.validationError}>{costError}</div>}
        </div>
      ) : (
      <>
        {ref && (
          <div className={formStyles.cardHeader}>
            <div className={formStyles.cardTitle}>
              <h3>Accommodation details</h3>
            </div>
          </div>
        )}
        <div className={styles.formRow}>
          <div className={styles.formItem}>
            <label className={styles.formRowLabel}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={titleError ? styles.invalid : ''} />
            {titleError && <div className={styles.validationError}>{titleError}</div>}
          </div>
          <div className={styles.formItem}>
            <label className={styles.formRowLabel}>Provider *</label>
            <input value={provider} onChange={e => setProvider(e.target.value)} className={providerError ? styles.invalid : ''} />
            {providerError && <div className={styles.validationError}>{providerError}</div>}
          </div>
        </div>
        <div className={styles.formRow}>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Cost (€)*</label>
              <input value={cost} onChange={e => setCost(e.target.value)} className={costError ? styles.invalid : ''} />
              {costError && <div className={styles.validationError}>{costError}</div>}
            </div>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} className={locationError ? styles.invalid : ''}/>
              {locationError && <div className={styles.validationError}>{locationError}</div>}
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Start Date *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={startDateError ? styles.invalid : ''}/>
              {dateError && <div className={styles.validationError}>{dateError}</div>}
              {startDateError && <div className={styles.validationError}>{startDateError}</div>}
            </div>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>End Date *</label>
              <input type="date" value={endDate} onChange={e => setOData__EndDate(e.target.value)} className={endDateError ? styles.invalid : ''}/>
              {endDateError && <div className={styles.validationError}>{endDateError}</div>}
            </div>
          </div>
          <div>
            <label className={styles.formRowLabel}>Link *</label>
            <input value={link} onChange={e => setLink(e.target.value)} style={{ width: '100%', marginTop: '6px',  padding: '0 0 5px 0' }} className={linkError ? styles.invalid : ''}/>
            {linkError && <div className={styles.validationError}>{linkError}</div>}
          </div>
        </>
      )}

      {(!inline || initialData) && (
        <div className={styles.formActions}>
          <button className={styles.cancelButton} onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button className={styles.saveButton} onClick={handleSave} disabled={isLoading}>{initialData ? 'Edit' : 'Add'}</button>
        </div>
      )}
    </div>
  );
});

export default AccommodationForm as any;
