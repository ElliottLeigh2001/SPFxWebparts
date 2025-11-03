export interface FamilyFormFieldsProps {
  amountOfKids: number;
  setAmountOfKids: (value: number) => void;
  ageChild1: string;
  setAgeChild1: (value: string) => void;
  ageChild2: string;
  setAgeChild2: (value: string) => void;
  ageChild3: string;
  setAgeChild3: (value: string) => void;
  disabled: boolean;
}