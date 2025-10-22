export interface FoodFormFieldsProps {
  food: string;
  setFood: (value: string) => void;
  dietaryPrefs: string;
  setDietaryPrefs: (value: string) => void;
  disabled: boolean;
  label?: string;
  prefix?: string;
}