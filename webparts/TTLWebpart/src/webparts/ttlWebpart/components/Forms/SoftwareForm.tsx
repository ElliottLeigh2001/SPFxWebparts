import * as React from 'react';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { IPeoplePickerContext, PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { FormProps } from './FormProps';
import { validateCost, validateLink } from '../../Helpers/HelperFunctions';
import { UserRequestItem } from '../../Interfaces/TTLInterfaces';

export interface SoftwareFormHandle {
  getFormData: () => { isValid: boolean; item?: UserRequestItem };
}

const SoftwareForm = forwardRef<SoftwareFormHandle, FormProps>(({ context, onSave, onCancel, initialData, view }, ref) => {
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
  const [isLoading, setIsLoading] = useState(false)

  const peoplePickerContext: IPeoplePickerContext = {
    absoluteUrl: context.pageContext.web.absoluteUrl,
    msGraphClientFactory: context.msGraphClientFactory,
    spHttpClient: context.spHttpClient
  };

  useEffect(() => {
    if (initialData?.UsersLicense?.length! > 0) {
      const parsedUsers = initialData?.UsersLicense!.map((u: any) => ({
        id: u.Id,
        loginName: u.EMail,
        text: u.Title
      }));
      setInitialUsers(parsedUsers!.map(u => u.loginName));
      setUsersLicense(parsedUsers!);
    }
  }, [initialData]);

  const validate = (): boolean => {
    let valid = true;

    setTitleError('');
    setProviderError('');
    setLinkError('');
    setCostError('');
    setUsersLicenseError('');

    if (!title) {
      setTitleError('Title is required');
      valid = false;
    }

    if (!provider) {
      setProviderError('Provider is required');
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

    if (usersLicense.length === 0) {
      setUsersLicenseError('Who will be using this license is required');
      valid = false;
    }

    if (title.length > 255) {
        setTitleError('Max length of title is 255 characters')
        valid = false;
    }

    if (provider.length > 255) {
        setProviderError('Max length of provider is 255 characters')
        valid = false;
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

  const getFormData = () => {
    if (view === 'HR') {
      if (!validateHR()) return { isValid: false };
      return { isValid: true, item: { Title: title, Provider: provider, Cost: cost, Licensing: licensing, LicenseType: licenseType, UsersLicense: usersLicense, Link: link, RequestType: 'Software' } };
    }
    if (!validate()) return { isValid: false };
    return { isValid: true, item: { Title: title, Provider: provider, Cost: cost, Licensing: licensing, LicenseType: licenseType, UsersLicense: usersLicense, Link: link, RequestType: 'Software' } };
  }

  useImperativeHandle(ref, () => ({ getFormData }));

  const handleSave = (): void => {
    if (isLoading) return;
    setIsLoading(true);

    if (view === 'HR') {
      if (!validateHR()) {
        setIsLoading(false);
        return;
      }
      onSave && onSave({ Title: title, Provider: provider, Cost: cost, Licensing: licensing, LicenseType: licenseType, UsersLicense: usersLicense, Link: link, RequestType: 'Software' });
      setIsLoading(false);
      return;
    }
    if (!validate()) {
      setIsLoading(false);
      return;
    }
    onSave && onSave({ Title: title, Provider: provider, Cost: cost, Licensing: licensing, LicenseType: licenseType, UsersLicense: usersLicense, Link: link, RequestType: 'Software' });
    setIsLoading(false);
  };

  return (
    <div>
      {view === 'HR' ? (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
          <label className={styles.formRowLabel}>Cost per license (€)*</label>
          <input style={{width: '50%'}} value={cost} onChange={e => setCost(e.target.value)} className={costError ? styles.invalid : ''} />
          {costError && <div className={styles.validationError}>{costError}</div>}
        </div>
      ) : (
        <>
        <div className={styles.formRow}>
            <div className={styles.formItemShort}>
              <label className={styles.formRowLabel}>Name of license *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={titleError ? styles.invalid : ''} />
              {titleError && <div className={styles.validationError}>{titleError}</div>}
            </div>
            <div className={styles.formItemShort}>
              <label className={styles.formRowLabel}>Provider *</label>
              <input value={provider} onChange={e => setProvider(e.target.value)} className={providerError ? styles.invalid : ''} />
              {providerError && <div className={styles.validationError}>{providerError}</div>}
            </div>
            <div className={styles.formItemShort}>
              <label className={styles.formRowLabel}>Cost (€)*</label>
              <input value={cost} onChange={e => setCost(e.target.value)} className={costError ? styles.invalid : ''} />
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
                  <option value="Group">One grouped bill</option>
                  <option value="Individual">One bill per individual</option>
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formItem}>
                <label className={styles.formRowLabel}>Who will be using this license? *</label>
                <div className={usersLicenseError ? styles.invalid : ''}>
                  <PeoplePicker
                    context={peoplePickerContext}
                    personSelectionLimit={10}
                    showtooltip={true}
                    required={true}
                    principalTypes={[PrincipalType.User, PrincipalType.SharePointGroup, PrincipalType.SecurityGroup]}
                    resolveDelay={500}
                    defaultSelectedUsers={initialUsers}
                    onChange={handleUsersChange}
                    styles={{input: styles.peoplePicker}}
                  />
                </div>
                {usersLicenseError && <div className={styles.validationError}>{usersLicenseError}</div>}
              </div>
              <div className={styles.formItem}>
                <label className={styles.formRowLabel}>Link *</label>
                <input style={{ height: '25px' }} value={link} onChange={e => setLink(e.target.value)} className={linkError ? styles.invalid : ''}/>
                {linkError && <div className={styles.validationError}>{linkError}</div>}
              </div>
            </div>
          </>
      )}

      {!ref && (
        <div className={styles.formActions}>
          <button className={styles.cancelButton} onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button className={styles.saveButton} onClick={handleSave} disabled={isLoading}>{initialData ? 'Edit' : 'Add'}</button>
        </div>
      )}
    </div>
  );
});

export default SoftwareForm;
