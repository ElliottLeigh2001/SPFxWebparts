import * as React from 'react';
import { useState } from 'react';
import styles from '../TtlWebpart.module.scss';

interface SoftwareFormProps {
  onSave: (item: any) => void;
  onCancel: () => void;
}

const SoftwareForm: React.FC<SoftwareFormProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [cost, setCost] = useState('');
  const [licensing, setLicensing] = useState('Monthly');
  const [licenseType, setLicenseType] = useState('Group');
  const [usersLicense, setUsersLicense] = useState('');
  const [link, setLink] = useState('');
  const [titleError, setTitleError] = useState('');
  const [providerError, setProviderError] = useState('');
  const [costError, setCostError] = useState('');

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

    return valid;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ Title: title, Provider: provider, Cost: cost, Licensing: licensing, LicenseType: licenseType, UsersLicense: usersLicense, Link: link, RequestType: 'Software' });
  };

  return (
    <div className={styles.ttlForm}>
      <h3>Software</h3>

      <div className={styles.formRow}>
        <div className={styles.formItemShort}>
          <label className={styles.formRowLabel}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={!title ? 'invalid' : ''} />
          {titleError && <div className={styles.validationError}>{titleError}</div>}
        </div>
        <div className={styles.formItemShort}>
          <label className={styles.formRowLabel}>Provider *</label>
          <input value={provider} onChange={e => setProvider(e.target.value)} className={!provider ? 'invalid' : ''} />
          {providerError && <div className={styles.validationError}>{providerError}</div>}
        </div>
        <div className={styles.formItemShort}>
          <label className={styles.formRowLabel}>Cost *</label>
          <input value={cost} onChange={e => setCost(e.target.value)} className={isNaN(Number(cost)) ? 'invalid' : ''} />
          {costError && <div className={styles.validationError}>{costError}</div>}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Billing *</label>
          <select name="Licensing" id="Licensing" value={licensing} onChange={e => setLicensing(e.target.value)}>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
            <option value="One-time">One-time</option>
          </select>
        </div>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>License Type *</label>
          <select name="LicenseType" id="LicenseType" value={licenseType} onChange={e => setLicenseType(e.target.value)}>
            <option value="Group">Group</option>
            <option value="Individual">Individual</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Who will be using this license? *</label>
          <input value={usersLicense} onChange={e => setUsersLicense(e.target.value)} />
        </div>
        <div className={styles.formItem}>
          <label className={styles.formRowLabel}>Link</label>
          <input value={link} onChange={e => setLink(e.target.value)} />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.saveButton} onClick={handleSave}>Add Item</button>
        <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default SoftwareForm;
