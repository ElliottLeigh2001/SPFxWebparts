import * as React from 'react';
import { useState, forwardRef, useImperativeHandle } from 'react';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { FormProps } from './FormProps';
import { formatEditingDate, validateCost, validateLink } from '../../Helpers/HelperFunctions';
import { UserRequestItem } from '../../Interfaces/TTLInterfaces';

export type TravelFormHandle = {
  getFormData: () => { isValid: boolean; item?: UserRequestItem; includeAccommodation?: boolean; includeReturnJourney?: boolean }
}

const TravelForm = forwardRef<TravelFormHandle, FormProps & { isReturnJourney?: boolean, onSave?: (item: UserRequestItem, nextForms?: Array<{type: 'travel' | 'accommodation', data?: any}>) => void, inline?: boolean, onToggleIncludeAccommodation?: (v: boolean) => void, onToggleIncludeReturnJourney?: (v: boolean) => void }>((props, ref) => {
  const { onSave, onCancel, initialData, view, returning, inline, onToggleIncludeAccommodation, onToggleIncludeReturnJourney } = props;
  
  const [title, setTitle] = useState(initialData?.Title || '');
  const [date, setDate] = useState(formatEditingDate(initialData?.StartDate) || '');
  const [location, setLocation] = useState(initialData?.Location || '');
  const [cost, setCost] = useState(initialData?.Cost || '');
  const [provider, setProvider] = useState(initialData?.Provider || '');
  const [link, setLink] = useState(initialData?.Link || '');
  const [titleError, setTitleError] = useState('');
  const [providerError, setProviderError] = useState('');
  const [costError, setCostError] = useState('');
  const [dateError, setDateError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isLoading, setIsLoading] = useState(false)
  const [includeAccommodation, setIncludeAccommodation] = useState(false);
  const [includeReturnJourney, setIncludeReturnJourney] = useState(false);
  
  // Form validation
  const validate = (): boolean => {
    let valid = true;

    setTitleError('');
    setProviderError('');
    setLinkError('');
    setDateError('');
    setLocationError('');
    setCostError('');

    if (!title) {
      setTitleError('Title is required');
      valid = false;
    }

    if (!provider) {
      setProviderError('Provider is required');
      valid = false;
    }

    if (!location) {
      setLocationError('Location is required');
      valid = false;
    }

    if (!date || date === '-' || date === '—') {
      setDateError('Date is required');
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

    if (date) {
      const today = new Date();
      const s = date ? new Date(date) : null;
  
      if (s && s < new Date(today.toDateString())) {
        setDateError('Start date cannot be before today');
        valid = false;
      }
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
      const result: { isValid: boolean; item?: UserRequestItem; includeAccommodation?: boolean; includeReturnJourney?: boolean } = { isValid: false };
      const valid = validate();
      if (!valid) return result;
      result.isValid = true;
      result.item = { Title: title, Provider: provider, Location: location, StartDate: date, Cost: cost, Link: link, RequestType: 'Travel' } as any;
      result.includeAccommodation = includeAccommodation;
      result.includeReturnJourney = includeReturnJourney;
      return result;
    }
  }));

  const handleSave = (): void => {
    if (isLoading) return;
    setIsLoading(true);

    let nextForms: Array<{type: 'travel' | 'accommodation', data?: any}> = [];

    // If return journey is checked, add another travel form first
    if (includeReturnJourney) {
      nextForms.push({ type: 'travel', data: { isReturnJourney: true } });
      setIncludeReturnJourney(false);
    }

    // If accommodation is checked, add accommodation form
    if (includeAccommodation) {
        nextForms.push({ type: 'accommodation' });
    }

    if (view === 'HR') {
      if (!validateHR()) {
        setIsLoading(false);
        return;
      }
      onSave({ Title: title, Provider: provider, Location: location, StartDate: date, Cost: cost, Link: link, RequestType: 'Travel' }, nextForms);
      setIsLoading(false);
    }
    if (!validate()) {
      setIsLoading(false);
      return;
    }
    onSave({ Title: title, Provider: provider, Location: location, StartDate: date, Cost: cost, Link: link, RequestType: 'Travel' }, nextForms);
    setIsLoading(false);
    setTitle('');
    setProvider('');
    setLink('');
    setDate('');
    setLocation('');
    setCost('');
  };

  return (
    <div>
      {view === 'HR' ? (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
          <label className={styles.formRowLabel}>Cost (€)*</label>
          <input style={{width: '50%'}} value={cost} onChange={e => setCost(e.target.value)} className={isNaN(Number(cost)) ? styles.invalid : ''} />
          {costError && <div className={styles.validationError}>{costError}</div>}
        </div>
      ) : (
      <>
        {ref && returning ? (
          <h4>Travel details - Return Journey</h4>
        ) : (
          <h4>Travel details</h4>
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
            <label className={styles.formRowLabel}>Location *</label>
            <input value={location} onChange={e => setLocation(e.target.value)} className={locationError ? styles.invalid : ''}/>
            {locationError && <div className={styles.validationError}>{locationError}</div>}
          </div>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Cost (€)*</label>
              <input value={cost} onChange={e => setCost(e.target.value)} className={costError ? styles.invalid : ''}/>
              {costError && <div className={styles.validationError}>{costError}</div>}
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={dateError ? styles.invalid : ''}/>
              {dateError && <div className={styles.validationError}>{dateError}</div>}
            </div>
            <div className={styles.formItem}>
              <label className={styles.formRowLabel}>Link *</label>
              <input value={link} onChange={e => setLink(e.target.value)} className={linkError ? styles.invalid : ''}/>
              {linkError && <div className={styles.validationError}>{linkError}</div>}
            </div>
          </div>

          {!returning && !initialData && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={includeReturnJourney} 
                    onChange={e => { setIncludeReturnJourney(e.target.checked); if (onToggleIncludeReturnJourney) onToggleIncludeReturnJourney(e.target.checked); }} 
                  />
                  I want to add a return journey
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={includeAccommodation} 
                    onChange={e => { setIncludeAccommodation(e.target.checked); if (onToggleIncludeAccommodation) onToggleIncludeAccommodation(e.target.checked); }} 
                  />
                  I want to add an accommodation for this travel
                </label>
              </div>
            </div>
          )}
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

export default TravelForm as any;
