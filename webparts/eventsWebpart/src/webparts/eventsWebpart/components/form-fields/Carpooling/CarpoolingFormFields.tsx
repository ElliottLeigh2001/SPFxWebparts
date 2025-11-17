import React from 'react';
import { CarpoolingFormFieldsProps } from './CarpoolingFormInterface';
import carpoolStyles from './CarpoolingForm.module.scss';

export const CarpoolingFormFields: React.FC<CarpoolingFormFieldsProps> = ({
  carpooling,
  setCarpooling,
  departureFrom,
  setDepartureFrom,
  disabled
}) => (
  <>
    <label>
      Carpooling *
      <br/>
    
      <select
        value={carpooling}
        onChange={(e) => setCarpooling(e.target.value)}
        disabled={disabled}
        required
      >
        <option value="">-- Select an option --</option>
        <option value="I would like someone to give me a lift">I would like someone to give me a lift</option>
        <option value="I will drive for my colleagues">I will drive for my colleagues</option>
        <option value="Not interested in carpooling">Not interested in carpooling</option>
      </select>
    </label>
    {(carpooling === "I would like someone to give me a lift" || carpooling === "I will drive for my colleagues") && (
      <>
        <label>
          Departure from *
          <br/>
          <input
            type="text"
            value={departureFrom}
            onChange={(e) => setDepartureFrom(e.target.value)}
            disabled={disabled}
            className={carpoolStyles.departureFrom}
            required
          />
        </label>
        
      </>
    )}
  </>
);