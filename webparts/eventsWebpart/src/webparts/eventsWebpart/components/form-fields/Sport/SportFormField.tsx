import React from 'react';
import { SportFormFieldsProps } from './SportFormInterface';

export const SportFormFields: React.FC<SportFormFieldsProps> = ({
  shirtSize,
  setShirtSize,
  disabled
}) => (
  <label>
    Shirt size *
    <br/>
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
);