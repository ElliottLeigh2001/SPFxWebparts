import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from '../TtlWebpart.module.scss';
import { IPeoplePickerContext, PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { FormProps } from './FormProps';
import { validateCost, validateLink } from '../../service/FormService';

const SoftwareForm: React.FC<FormProps> = ({ context, onSave, onCancel, initialData, view }) => {
  const [title, setTitle] = useState(initialData?.Title || '');
  const [provider, setProvider] = useState(initialData?.Provider || '');
  const [cost, setCost] = useState(initialData?.Cost || '');
  const [licensing, setLicensing] = useState(initialData?.Licensing || 'Monthly');
  const [licenseType, setLicenseType] = useState(initialData?.LicenseType || 'Group');
  const [usersLicense, setUsersLicense] = useState<any[]>(initialData?.UsersLicense || []);
  const [initialUsers, setInitialUsers] = useState<string[]>([]);
  const [link, setLink] = useState(initialData?.Link || '');
  const [titleError, setTitleError] = useState('');
  const [providerError, setProviderError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [costError, setCostError] = useState('');
  const [usersLicenseError, setUsersLicenseError] = useState('');

  const peoplePickerContext: IPeoplePickerContext = {
    absoluteUrl: context.pageContext.web.absoluteUrl,
    msGraphClientFactory: context.msGraphClientFactory,
    spHttpClient: context.spHttpClient
  };

  useEffect(() => {
    if (initialData?.UsersLicense && initialData.UsersLicense.length > 0) {
      const defaultUsers = initialData.UsersLicense.map(
        (u: any) => u.loginName || u.text || u.id
      );
      setInitialUsers(defaultUsers);
    }
  }, [initialData]);

  
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.Title || '');
      setProvider(initialData.Provider || '');
      setCost(initialData.Cost || '');
      setLicensing(initialData.Licensing || 'Monthly');
      setLicenseType(initialData.LicenseType || 'Group');
      setUsersLicense(initialData.UsersLicense || []);
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

    if (usersLicense.length === 0) {
      setUsersLicenseError('Who will be using this license is required');
      valid = false;
    } else {
      setUsersLicenseError('');
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

  const handleUsersChange = (items: any[]) => {
    const users = items.map(user => ({
      id: user.id,
      loginName: user.loginName,
      text: user.text || user.displayName || user.loginName
    }));
    setUsersLicense(users);
  };

  const handleSave = (): void => {
    if (view === 'HR') {
      if (!validateHR()) return;
      onSave({ Title: title, Provider: provider, Cost: cost, Licensing: licensing, LicenseType: licenseType, UsersLicense: usersLicense, Link: link, RequestType: 'Software' });
    }
    if (!validate()) return;
    onSave({ Title: title, Provider: provider, Cost: cost, Licensing: licensing, LicenseType: licenseType, UsersLicense: usersLicense, Link: link, RequestType: 'Software' });
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
          </div><div className={styles.formRow}>
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
            </div><div className={styles.formRow}>
              <div className={styles.formItem}>
                <label className={styles.formRowLabel}>Who will be using this license? *</label>
                <PeoplePicker
                  context={peoplePickerContext}
                  personSelectionLimit={10}
                  showtooltip={true}
                  required={true}
                  principalTypes={[PrincipalType.User, PrincipalType.SharePointGroup, PrincipalType.SecurityGroup]}
                  resolveDelay={500}
                  defaultSelectedUsers={initialUsers}
                  onChange={handleUsersChange}
                />
                {usersLicenseError && <div className={styles.validationError}>{usersLicenseError}</div>}
              </div>
              <div className={styles.formItem}>
                <label className={styles.formRowLabel}>Link *</label>
                <input style={{ height: '25px' }} value={link} onChange={e => setLink(e.target.value)} />
                {linkError && <div className={styles.validationError}>{linkError}</div>}
              </div>
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

export default SoftwareForm;
