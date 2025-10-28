import React, { useState } from 'react';
import { SportFormFields } from '../form-fields/Sport/SportFormField';
import { FoodFormFields } from '../form-fields/Food/FoodFormFields';
import { CarpoolingFormFields } from '../form-fields/Carpooling/CarpoolingFormFields';
import  { FamilyFormFields } from '../form-fields/Family/FamilyFormFields';
import { SinterklaasFormFields } from '../form-fields/Sinterklaas/SinterklaasFormFields';
import { PlusOneFormFields } from '../form-fields/PlusOne/PlusOneFormFields';
import modalStyles from './SignupModal.module.scss';
import { SignupModalProps } from './SignupModalInterface';

interface FormData {
  extraInfo: string;
  dietaryPrefs: string;
  plusOne: boolean;
  dietaryPrefsPlusOne: string;
  food: string;
  foodPlusOne: string;
  shirtSize: string;
  carpooling: string;
  departureFrom: string;
  amountOfKids: number;
  kidsData: [];
  ageChild1: number;
  ageChild2: number;
  ageChild3: number;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  event,
  onSubmit,
  onClose,
  loading
}) => {
  const [formData, setFormData] = useState<FormData>({
    extraInfo: '',
    dietaryPrefs: '',
    plusOne: false,
    dietaryPrefsPlusOne: '',
    food: '',
    foodPlusOne: '',
    shirtSize: '',
    carpooling: '',
    departureFrom: '',
    amountOfKids: 0,
    kidsData: [],
    ageChild1: 0,
    ageChild2: 0,
    ageChild3: 0,
  });

  // Change the form fields based on which kind of event was selected
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  // Reset form
  const handleClose = () => {
    onClose();
    setFormData({
      extraInfo: '',
      dietaryPrefs: '',
      plusOne: false,
      dietaryPrefsPlusOne: '',
      food: '',
      foodPlusOne: '',
      shirtSize: '',
      carpooling: '',
      departureFrom: '',
      amountOfKids: 0,
      kidsData: [],
      ageChild1: 0,
      ageChild2: 0,
      ageChild3: 0,
    });
  };

  return (
    <div className={modalStyles.modalOverlay}>
      <div className={modalStyles.modalContent}>
        <h3>Sign up for {event.Title}</h3>
        <form onSubmit={handleSubmit}>
          {event.EventTypes === 'Sport' && (
            <SportFormFields
              shirtSize={formData.shirtSize}
              setShirtSize={(value) => updateFormData('shirtSize', value)}
              disabled={loading}
            />
          )}

          {event.EventTypes === 'Sinterklaas' && (
            <SinterklaasFormFields
              amountOfKids={formData.amountOfKids || 0}
              setAmountOfKids={(value) => updateFormData('amountOfKids', value)}
              kidsData={formData.kidsData || []}
              setKidsData={(kidsData) => updateFormData('kidsData', kidsData)}
              disabled={loading}
            />
          )}

          {event.EventTypes === 'Family' && (
            <FamilyFormFields
              amountOfKids={formData.amountOfKids || 0}
              setAmountOfKids={(value) => updateFormData('amountOfKids', value)}
              ageChild1={formData.ageChild1}
              setAgeChild1={(value) => updateFormData('ageChild1', value)}
              ageChild2={formData.ageChild2}
              setAgeChild2={(value) => updateFormData('ageChild2', value)}
              ageChild3={formData.ageChild3}
              setAgeChild3={(value) => updateFormData('ageChild3', value)}
              disabled={loading}
            />
          )}

          {event.FoodEvent && (
            <FoodFormFields
              food={formData.food}
              setFood={(value) => updateFormData('food', value)}
              dietaryPrefs={formData.dietaryPrefs}
              setDietaryPrefs={(value) => updateFormData('dietaryPrefs', value)}
              disabled={loading}
            />
          )}

          {event.PlusOne && (
            <PlusOneFormFields
              plusOne={formData.plusOne}
              setPlusOne={(value) => updateFormData('plusOne', value)}
              dietaryPrefsPlusOne={formData.dietaryPrefsPlusOne}
              setDietaryPrefsPlusOne={(value) => updateFormData('dietaryPrefsPlusOne', value)}
              foodPlusOne={formData.foodPlusOne}
              setFoodPlusOne={(value) => updateFormData('foodPlusOne', value)}
              disabled={loading}
              showFoodFields={event.FoodEvent}
            />
          )}

          {event.Carpooling && (
            <CarpoolingFormFields
              carpooling={formData.carpooling}
              setCarpooling={(value) => updateFormData('carpooling', value)}
              departureFrom={formData.departureFrom}
              setDepartureFrom={(value) => updateFormData('departureFrom', value)}
              disabled={loading}
            />
          )}

          <label>
            Extra information
            <textarea
              value={formData.extraInfo}
              onChange={(e) => updateFormData('extraInfo', e.target.value)}
              disabled={loading}
            />
          </label>

          <div className={modalStyles.modalActions}>
            <button type="submit" className={modalStyles.submitButton} disabled={loading}>
              Submit
            </button>
            <button type="button" onClick={handleClose} className={modalStyles.cancelButton} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};