import React from 'react';
import { FoodFormFieldsProps } from './FoodFormInterface';

export const FoodFormFields: React.FC<FoodFormFieldsProps> = ({
  food,
  setFood,
  dietaryPrefs,
  setDietaryPrefs,
  disabled,
  label = "Food choice",
  prefix = ""
}) => (
  <div>
    <label>
      {label} *
      <br/>
      <select
        value={food}
        onChange={(e) => setFood(e.target.value)}
        disabled={disabled}
        required
      >
        <option value="">-- Select an option --</option>
        <option value="Meat/Fish">Meat/Fish</option>
        <option value="Veggie">Veggie</option>
        <option value="Vegan">Vegan</option>
      </select>
    </label>
    <br/>
    <label>
      Dietary preferences / allergies{prefix}
      <textarea
        value={dietaryPrefs}
        onChange={(e) => setDietaryPrefs(e.target.value)}
        disabled={disabled}
      />
    </label>
  </div>
);