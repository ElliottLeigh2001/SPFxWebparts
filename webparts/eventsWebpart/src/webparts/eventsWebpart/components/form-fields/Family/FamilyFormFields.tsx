import * as React from 'react';
import styles from '../../EventsWebpart.module.scss';
import { FamilyFormFieldsProps } from './FamilyFormInterface';
import familyStyles from './FamilyForm.module.scss'

export const FamilyFormFields: React.FC<FamilyFormFieldsProps> = ({
  amountOfKids,
  setAmountOfKids,
  ageChild1,
  setAgeChild1,
  ageChild2,
  setAgeChild2,
  ageChild3,
  setAgeChild3,
  disabled
}) => {
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

      {amountOfKids >= 1 && (
        <div className={familyStyles.kidAges}>
          <div>
            <label>
              Age child 1 *
              <input
                type="text"
                value={ageChild1}
                onChange={(e) => setAgeChild1(Number(e.target.value))}
                disabled={disabled}
                className={styles.textInput}
                required
              />
            </label>
          </div>
        {amountOfKids >= 2 && (
          <div>
            <label>
            Age child 2 *
            <input
              type="text"
              value={ageChild2}
              onChange={(e) => setAgeChild2(Number(e.target.value))}
              disabled={disabled}
              className={styles.textInput}
              required />
            </label>
          </div>
        )}
        {amountOfKids >= 3 && (
          <div>
            <label>
              Age child 3 *
              <input
                type="text"
                value={ageChild3}
                onChange={(e) => setAgeChild3(Number(e.target.value))}
                disabled={disabled}
                className={styles.textInput}
                required />
            </label>
          </div>
        )}
        </div>
      )}
    </div>
  );
};