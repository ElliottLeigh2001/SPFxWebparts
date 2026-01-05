import * as React from 'react';
import styles from '../../EventsWebpart.module.scss';
import { FamilyFormFieldsProps } from './FamilyFormInterface';

export const FamilyFormFields: React.FC<FamilyFormFieldsProps> = ({
  amountOfKids,
  setAmountOfKids,
  ageChild1,
  setAgeChild1,
  ageChild2,
  setAgeChild2,
  ageChild3,
  setAgeChild3,
  ageChild4,
  setAgeChild4,
  ageChild5,
  setAgeChild5,
  disabled
}) => {
  return (
    <div>
      <label>
        Number of children *
        <br/>
        <select
          value={amountOfKids}
          onChange={(e) => setAmountOfKids(Number(e.target.value))}
          disabled={disabled}
          required
        >
          {[0, 1, 2, 3, 4, 5].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </label>

      {amountOfKids >= 1 && (
        <div>
          <div>
            <label>
              Age child 1 *
              <br/>
              <input
                type="text"
                value={ageChild1}
                onChange={(e) => setAgeChild1(e.target.value)}
                disabled={disabled}
                className={styles.textInput}
                required
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </label>
          </div>
        {amountOfKids >= 2 && (
          <div>
            <label>
            Age child 2 *
            <br/>
            <input
              type="text"
              value={ageChild2}
              onChange={(e) => setAgeChild2(e.target.value)}
              disabled={disabled}
              className={styles.textInput}
              required
              pattern="[0-9]*"
              inputMode="numeric"
            />
            </label>
          </div>
        )}
        {amountOfKids >= 3 && (
          <div>
            <label>
              Age child 3 *
              <br/>
              <input
                type="text"
                value={ageChild3}
                onChange={(e) => setAgeChild3(e.target.value)}
                disabled={disabled}
                className={styles.textInput}
                required
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </label>
          </div>
        )}
        {amountOfKids >= 4 && (
          <div>
            <label>
              Age child 4 *
              <br/>
              <input
                type="text"
                value={ageChild4}
                onChange={(e) => setAgeChild4(e.target.value)}
                disabled={disabled}
                className={styles.textInput}
                required
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </label>
          </div>
        )}
        {amountOfKids >= 5 && (
          <div>
            <label>
              Age child 5 *
              <br/>
              <input
                type="text"
                value={ageChild5}
                onChange={(e) => setAgeChild5(e.target.value)}
                disabled={disabled}
                className={styles.textInput}
                required
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </label>
          </div>
        )}
        </div>
      )}
    </div>
  );
};