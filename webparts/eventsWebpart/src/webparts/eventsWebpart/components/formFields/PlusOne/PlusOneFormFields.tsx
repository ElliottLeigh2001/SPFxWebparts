import React from 'react';
import { FoodFormFields } from '../Food/FoodFormFields';
import styles from '../../EventsWebpart.module.scss';
import { PlusOneFormFieldsProps } from './PlusOneFormInterface';

export const PlusOneFormFields: React.FC<PlusOneFormFieldsProps> = ({
  plusOne,
  setPlusOne,
  dietaryPrefsPlusOne,
  setDietaryPrefsPlusOne,
  foodPlusOne,
  setFoodPlusOne,
  disabled,
  showFoodFields
}) => (
  <>
    <div className={styles.checkboxContainer}>
      <label>
        Are you bringing a +1?

        <input
          type="checkbox"
          id="plus-one"
          checked={plusOne}
          onChange={(e) => {
            const checked = e.target.checked;
            setPlusOne(checked);
            if (!checked) {
              setDietaryPrefsPlusOne('');
              setFoodPlusOne('');
            }
          }}
        />
      </label>
    </div>
    
    {plusOne && showFoodFields && (
      <FoodFormFields
        food={foodPlusOne}
        setFood={setFoodPlusOne}
        dietaryPrefs={dietaryPrefsPlusOne}
        setDietaryPrefs={setDietaryPrefsPlusOne}
        disabled={disabled}
        label="Food choice +1"
        prefix=" +1"
      />
    )}
  </>
);