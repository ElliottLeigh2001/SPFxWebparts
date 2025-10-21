import { WebPartContext } from '@microsoft/sp-webpart-base';
import * as React from 'react';
import SoftwareForm from './Forms/SoftwareForm';
import TrainingForm from './Forms/TrainingForm';
import TravelForm from './Forms/TravelForm';
import { createRequestWithItems } from '../service/TTLService';
import { UserRequestItem } from '../Interfaces/TTLInterfaces';
import { useState } from 'react';
import AccomodationForm from './Forms/AccomodationForm';
import styles from './TtlWebpart.module.scss';

const NewRequestForm: React.FC<{ context: WebPartContext; onCancel: () => void; onSaved?: () => void; }> = ({ context, onCancel, onSaved }) => {
    const [title, setTitle] = useState('');
    const [goal, setGoal] = useState('');
    const [project, setProject] = useState('');
    const [team, setTeam] = useState(1);
    const [approver, setApprover] = useState(1);
    const [items, setItems] = useState<UserRequestItem[]>([]);
    const [activeForm, setActiveForm] = useState<'software'|'training'|'travel'|'accomodation'|null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [titleError, setTitleError] = useState('');
    const [goalError, setGoalError] = useState('');
    const [error, setError] = useState<string | null>(null);

    const validate = () => {
        if (!title) setTitleError('Title is required');
        if (!goal) setGoalError('Goal is required');
        return titleError.length === 0 && goalError.length === 0;
    };

    const addItem = (item: UserRequestItem) => {
        setItems(prev => [...prev, item]);
        setActiveForm(null);
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!validate()) return;
        let totalCost = 0;
        setIsSaving(true);
        setError(null);
        setTitleError('');
        setGoalError('');
        for (const it of items) {
            totalCost += Number(it.Cost);
        }
        try {
            await createRequestWithItems(context, { Title: title, Goal: goal, Project: project, TeamID: team, ApproverID: approver, TotalCost: totalCost }, items);
            if (onSaved) onSaved();
        } catch {
            setError('Failed to create request');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.ttlForm}>
            <h2>New Request</h2>

            <div className={styles.formRow}>
                <div className={styles.formItem}>
                    <label className={styles.formRowLabel}>Title *</label>
                    <input className={!title ? 'invalid' : ''} value={title} onChange={e => setTitle(e.target.value)} required/>
                    {titleError && <div className={styles.validationError}>{titleError}</div>}
                </div>
                <div className={styles.formItem}>
                    <label className={styles.formRowLabel}>Project </label>
                    <input value={project} onChange={e => setProject(e.target.value)} required/>
                </div>
            </div>

            <div>
                <label className={styles.formRowLabel}>Goal *</label>
                <input value={goal} onChange={e => setGoal(e.target.value)} style={{width: '100%', marginBottom: '18px', marginTop: '6px'}}/>
                {goalError && <div className={styles.validationError}>{goalError}</div>}
            </div>

            <div className={styles.formRow}>
                <div className={styles.formItem}>
                    <label className={styles.formRowLabel}>Team *</label>
                    <select name="team" id="team" value={team} onChange={e => setTeam(Number(e.target.value))} required>
                        <option value="1">Power Platform</option>
                        <option value="2">SharePoint</option>
                        <option value="3">M365</option>
                        <option value="4">CX</option>
                    </select>
                </div>
                <div className={styles.formItem}>
                    <label className={styles.formRowLabel}>Approver *</label>
                    <select name="approver" id="approver" value={approver} onChange={e => setApprover(Number(e.target.value))} required>
                        <option value="1">Lennert Verwimp</option>
                        <option value="2">Barry Dhoine</option>
                    </select>
                </div>
            </div>

            <div className={styles.formActions}>
                <button className={styles.stdButton} onClick={() => setActiveForm('software')}>Add Software</button>
                <button className={styles.stdButton} onClick={() => setActiveForm('training')}>Add Training</button>
                <button className={styles.stdButton} onClick={() => setActiveForm('travel')}>Add Travel</button>
                <button className={styles.stdButton} onClick={() => setActiveForm('accomodation')}>Add Accomodation</button>
            </div>

            {activeForm === 'software' && (
                <SoftwareForm onSave={addItem} onCancel={() => setActiveForm(null)} />
            )}

            {activeForm === 'training' && (
                <TrainingForm onSave={addItem} onCancel={() => setActiveForm(null)} />
            )}

            {activeForm === 'travel' && (
                <TravelForm onSave={addItem} onCancel={() => setActiveForm(null)} />
            )}

            {activeForm === 'accomodation' && (
                <AccomodationForm onSave={addItem} onCancel={() => setActiveForm(null)} />
            )}

            <h3>Items ({items.length})</h3>
            <ul>
                {items.map((it, idx) => (
                    <li key={idx}>
                        {it.Title} - {it.RequestType} - {it.Cost}
                        <button onClick={() => removeItem(idx)}>Remove</button>
                    </li>
                ))}
            </ul>

            {error && <div className={styles.validationError}>{error}</div>}

            <div className={styles.formActions}>
                <button className={styles.saveButton} disabled={isSaving || items.length === 0} onClick={handleSave}>Save Request</button>
                <button className={styles.cancelButton} disabled={isSaving} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

export default NewRequestForm;