import React, { useState } from 'react';
import { SportFormFieldsProps } from './SportFormInterface';
import styles from '../../EventsWebpart.module.scss';

export const SportFormFields: React.FC<SportFormFieldsProps> = ({
  shirtSize,
  setShirtSize,
  disabled
}) => {
  const [hasShirt, setHasShirt] = useState(false);

  return (
    <>
      <div className={styles.checkboxContainer}>
        <label htmlFor="shirt">
          Do you need an AmeXio sport shirt?
          <input
            type="checkbox"
            id="shirt"
            checked={hasShirt}
            onChange={(e) => setHasShirt(e.target.checked)}
            disabled={disabled}
          />
        </label>
      </div>

      {hasShirt && (
        <label>
          Shirt size *
          
          <select
            value={shirtSize}
            onChange={(e) => setShirtSize(e.target.value)}
            disabled={disabled}
            required
          >
            <option value="">-- Select an option --</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
        </label>
      )}
    </>
  );
};
