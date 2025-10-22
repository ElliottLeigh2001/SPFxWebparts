export interface CarpoolingFormFieldsProps {
  carpooling: string;
  setCarpooling: (value: string) => void;
  departureFrom: string;
  setDepartureFrom: (value: string) => void;
  disabled: boolean;
}