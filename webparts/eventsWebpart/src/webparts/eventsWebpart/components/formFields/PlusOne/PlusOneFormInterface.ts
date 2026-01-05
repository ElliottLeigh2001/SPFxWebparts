export interface PlusOneFormFieldsProps {
  plusOne: boolean;
  setPlusOne: (value: boolean) => void;
  dietaryPrefsPlusOne: string;
  setDietaryPrefsPlusOne: (value: string) => void;
  foodPlusOne: string;
  setFoodPlusOne: (value: string) => void;
  disabled: boolean;
  showFoodFields: boolean;
}