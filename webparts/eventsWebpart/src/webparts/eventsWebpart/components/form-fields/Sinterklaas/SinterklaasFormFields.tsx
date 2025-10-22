import * as React from 'react';
import styles from '../../EventsWebpart.module.scss';
import { KidData, SinterklaasFormFieldsProps } from './SinterklaasFormInterface';
import sinterklaasStyles from './Sinterklaas.module.scss'

export const SinterklaasFormFields: React.FC<SinterklaasFormFieldsProps> = ({
  amountOfKids,
  setAmountOfKids,
  kidsData,
  setKidsData,
  disabled
}) => {
  // Update kids data when amount changes
  React.useEffect(() => {
    if (amountOfKids > kidsData.length) {
      // Add new kid entries
      const newKids = [...kidsData];
      for (let i = kidsData.length; i < amountOfKids; i++) {
        newKids.push({
          nameChild: '',
          presentChoice: 'present',
          presentOption1: '',
          presentOption2: '',
          presentOption3: ''
        });
      }
      setKidsData(newKids);
    } else if (amountOfKids < kidsData.length) {
      // Remove extra kid entries
      setKidsData(kidsData.slice(0, amountOfKids));
    }
  }, [amountOfKids, kidsData.length]);

  // Logic to add the kids' data to the correct kid and fields
  const updateKidData = (index: number, field: keyof KidData, value: string) => {
    const newKidsData = [...kidsData];
    newKidsData[index] = {
      ...newKidsData[index],
      [field]: value
    };
    setKidsData(newKidsData);
  };

  return (
    <div>
      <label>
        Amount of kids *
        <br />
        <select
          value={amountOfKids}
          onChange={(e) => setAmountOfKids(Number(e.target.value))}
          disabled={disabled}
          required
        >
          {[0, 1, 2, 3].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </label>

      {kidsData.map((kid, index) => (
        <div key={index} className={sinterklaasStyles.kidContainer}>
          <h4>Child {index + 1}</h4>
          
          <label>
            Name child *
            <input
              type="text"
              value={kid.nameChild}
              onChange={(e) => updateKidData(index, 'nameChild', e.target.value)}
              disabled={disabled}
              className={styles.textInput}
              required
            />
          </label>
          <br />

          <label>
            Present / Donation *
            <br />
            <select
              value={kid.presentChoice}
              onChange={(e) => updateKidData(index, 'presentChoice', e.target.value as 'present' | 'donation')}
              disabled={disabled}
              style={{marginBottom: '10px'}}
              required
            >
              <option value="present">Present</option>
              <option value="donation">Donation</option>
            </select>
          </label>
          <br />
            <label>
            Present option 1 *
            <input
                type="text"
                value={kid.presentOption1}
                onChange={(e) => updateKidData(index, 'presentOption1', e.target.value)}
                disabled={disabled}
                className={styles.textInput}
                required
            />
            </label>
            <br />

            <label>
            Present option 2
            <input
                type="text"
                value={kid.presentOption2}
                onChange={(e) => updateKidData(index, 'presentOption2', e.target.value)}
                disabled={disabled}
                className={styles.textInput}
            />
            </label>
            <br />

            <label>
            Present option 3
            <input
                type="text"
                value={kid.presentOption3}
                onChange={(e) => updateKidData(index, 'presentOption3', e.target.value)}
                disabled={disabled}
                className={styles.textInput}
            />
            </label>
        </div>
      ))}
    </div>
  );
};