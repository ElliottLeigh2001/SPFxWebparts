export interface FamilyFormFieldsProps {
  amountOfKids: number;
  setAmountOfKids: (value: number) => void;
  ageChild1: number;
  setAgeChild1: (value: number) => void;
  ageChild2: number;
  setAgeChild2: (value: number) => void;
  ageChild3: number;
  setAgeChild3: (value: number) => void;
  disabled: boolean;
}