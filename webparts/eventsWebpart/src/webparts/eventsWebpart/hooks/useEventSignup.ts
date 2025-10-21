import { useState, useEffect } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { EventItem } from '../EventsInterfaces';
import { getSP } from '../components/EventDetails';
import { KidData } from '../components/form-fields/SinterklaasFormFields';

interface SignupFormData {
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
  kidsData: KidData[];
  ageChild1: number;
  ageChild2: number;
  ageChild3: number;
}

export const useEventSignup = (context: WebPartContext, event: EventItem) => {
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);


  useEffect(() => {
    const checkSignup = async (): Promise<void> => {
      try {
        setCheckingStatus(true);
        const sp = getSP(context);
        const currentUser = await sp.web.currentUser();
        const attendee = await sp.web.lists
          .getByTitle("Subscriptions")
          .items
          .filter(`EventId eq ${event.Id} and AttendeeId eq ${currentUser.Id}`)
          .select("Id")();

        setIsSignedUp(attendee.length > 0);
      } catch (err) {
        console.error("Error checking signup:", err);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkSignup();
  }, [context, event]);

  const showNotification = (type: 'success' | 'error', message: string): void => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Remove any row where the user is the author
  const handleSignOut = async (): Promise<void> => {
    if (!event) return;

    const confirmSignOut = confirm(`Are you sure you want to sign out of "${event.Title}"?`);
    if (!confirmSignOut) return;
    
    setLoading(true);
    try {
      const sp = getSP(context);
      const currentUser = await sp.web.currentUser();

      const attendeeItems = await sp.web.lists
        .getByTitle("Subscriptions")
        .items
        .filter(`EventId eq ${event.Id} and AttendeeId eq ${currentUser.Id}`)
        .select("Id")();

      if (attendeeItems.length === 0) {
        showNotification('error', 'You are not signed up for this event.');
        setIsSignedUp(false);
        return;
      }

    // Delete ALL rows for this event and user
    for (const item of attendeeItems) {
      await sp.web.lists.getByTitle("Subscriptions").items.getById(item.Id).delete();
    }
    
    setIsSignedUp(false);
    showNotification('success', 'You have successfully signed out.');
  } catch {
    showNotification('error', 'Could not remove your signup. Refresh and try again.');
  } finally {
    setLoading(false);
  }
  };

const handleSubmit = async (formData: SignupFormData): Promise<void> => {
  setLoading(true);
  try {
    const sp = getSP(context);
    const currentUser = await sp.web.currentUser();

    // For Sinterklaas events, create one row per kid
    if (event.EventType === 'Sinterklaas') {
      const kids = formData.kidsData || [];

      for (const kid of kids) {
        await sp.web.lists.getByTitle("Subscriptions").items.add({
          Title: event.Title,
          AttendeeId: currentUser.Id,
          EventId: event.Id,
          ExtraInfo: formData.extraInfo,
          nameChild: kid.nameChild,
          presentChoice: kid.presentChoice,
          presentOption1: kid.presentOption1,
          presentOption2: kid.presentOption2,
          presentOption3: kid.presentOption3,
        });
      }
      
      // If no kids but it's a Sinterklaas event, still create one row for the attendee
      if (kids.length === 0) {
        await sp.web.lists.getByTitle("Subscriptions").items.add({
          Title: event.Title,
          AttendeeId: currentUser.Id,
          EventId: event.Id,
          ExtraInfo: formData.extraInfo,
          nameChild: "",
          presentChoice: "",
          presentOption1: "",
          presentOption2: "",
          presentOption3: "",
          DietaryPreference: "",
          PlusOne: false,
          DietaryPreferencePlusOne: "",
          Food: "",
          FoodPlusOne: "",
          ShirtSize: "",
          Carpooling: "",
          DepartureFrom: "",
        });
      }
    } else {
      // For non-Sinterklaas events, create single row
      const submitData: any = {
        Title: event.Title,
        AttendeeId: currentUser.Id,
        EventId: event.Id,
        ExtraInfo: formData.extraInfo,
        DietaryPreference: event.FoodEvent ? formData.dietaryPrefs : "",
        PlusOne: formData.plusOne,
        DietaryPreferencePlusOne: event.PlusOne ? formData.dietaryPrefsPlusOne : "",
        Food: formData.food,
        FoodPlusOne: event.PlusOne ? formData.foodPlusOne : "",
        ShirtSize: event.EventType === 'Sport' ? formData.shirtSize : "",
        Carpooling: event.Carpooling ? formData.carpooling : "",
        DepartureFrom: event.Carpooling? formData.departureFrom : "",
        nameChild: "",
        presentChoice: "",
        presentOption1: "",
        presentOption2: "",
        presentOption3: "",
      };

      if (event.EventType === 'Family') {
        submitData.amountOfChildren = formData.amountOfKids;
        submitData.ageChild1 = formData.ageChild1;
        submitData.ageChild2 = formData.ageChild2;
        submitData.ageChild3 = formData.ageChild3;
      }

      await sp.web.lists.getByTitle("Subscriptions").items.add(submitData);
    }

    setIsSignedUp(true);
    showNotification('success', 'You\'ve been successfully signed up for this event!');
  } catch (err) {
    console.error("Error signing up:", err);
    showNotification('error', 'There was an error signing up. Refresh and try again.');
  } finally {
    setLoading(false);
  }
};

  return {
    isSignedUp,
    loading,
    checkingStatus,
    notification,
    showNotification,
    handleSignOut,
    handleSubmit,
    setIsSignedUp
  };
};