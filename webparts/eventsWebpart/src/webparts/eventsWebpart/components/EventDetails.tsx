import * as React from 'react';
import { useEffect, useState } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import styles from './EventsWebpart.module.scss';
import { LocationFilled } from "@fluentui/react-icons";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import { EventItem } from '../EventsInterfaces';

let sp: SPFI;
export const getSP = (context: WebPartContext): SPFI => {
  if (!sp) {
    sp = spfi(context.pageContext.web.absoluteUrl).using(SPFx(context));
  }
  return sp;
};

const EventDetails: React.FC<{ context: WebPartContext; event: EventItem; onBack: () => void; }> = ({ context, event, onBack }) => {
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [extraInfo, setExtraInfo] = useState('');
  const [dietaryPrefs, setDietaryPrefs] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

const formatDate = (startTime: string, endTime: string): string => {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const pad = (num: number): string => (num < 10 ? '0' + num : num.toString());

  if (startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()) {
    // Same day
    return `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} from ${pad(startDate.getHours())}:${pad(startDate.getMinutes())} to ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
  } else {
    // Different days
    return `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()} ${pad(startDate.getHours())}:${pad(startDate.getMinutes())} - ${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)}/${endDate.getFullYear()} ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
  }
};

  // Check if current user is already signed up
  useEffect(() => {
    const checkSignup = async (): Promise<void> => {
      try {
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
      }
    };
    checkSignup();
  }, [context, event]);

  const showNotification = (type: 'success' | 'error', message: string): void => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSignUp = async (): Promise<void> => setShowModal(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    setLoading(true)
    e.preventDefault();
    try {
      const sp = getSP(context);
      const currentUser = await sp.web.currentUser();

      await sp.web.lists.getByTitle("Subscriptions").items.add({
        Title: event.Title,
        AttendeeId: currentUser.Id,
        EventId: event.Id,
        ExtraInfo: extraInfo,
        DietaryPreference: event.FoodEvent ? dietaryPrefs : "",
      });

      setIsSignedUp(true);
      setShowModal(false);
      setExtraInfo('');
      setDietaryPrefs('');
      showNotification('success', 'You’ve been successfully signed up for this event!')
      setLoading(false)
    } catch (err) {
      console.error("Error signing up:", err);
      showNotification('error', 'There was an error signing up. Refresh and try again.')
      setLoading(false)
    }
  };

  const handleSignOut = async (): Promise<void> => {
    if (!event) return;

    const confirmSignOut = confirm(`Are you sure you want to sign out of "${event.Title}"?`);
    if (!confirmSignOut) return;
    try {
      const sp = getSP(context);
      const currentUser = await sp.web.currentUser();

      // Query the current attendee record before deletion
      const attendeeItems = await sp.web.lists
        .getByTitle("Subscriptions")
        .items
        .filter(`EventId eq ${event.Id} and AttendeeId eq ${currentUser.Id}`)
        .select("Id")();

      if (attendeeItems.length === 0) {
        showNotification('error', 'You are not signed up for this event.')
        setIsSignedUp(false);
        return;
      }

      // Delete from list
      const attendeeId = attendeeItems[0].Id;
      await sp.web.lists.getByTitle("Subscriptions").items.getById(attendeeId).delete();
      setIsSignedUp(false);
      showNotification('success', 'You have successfully signed out.')
    } catch {
      showNotification('error', 'Could not remove your signup. Refresh and try again.')
    }
  };

  // Get relevant info out of JSON objects
  const locationData = event.Location ? JSON.parse(event.Location) : null;
  const locationName = locationData?.DisplayName || "Unknown location";
  const imageData = event.Image0 ? JSON.parse(event.Image0) : null;
  const imageUrl = imageData
    ? `${context.pageContext.web.absoluteUrl}/Lists/HR_Events/Attachments/${event.Id}/${imageData.fileName}`
    : undefined;

  return (
    <div className={styles.detailsContainer}>
      <button onClick={onBack} className={styles.backButton}>← Back</button>
      {imageUrl && <img src={imageUrl} alt={event.Title} className={styles.detailsImage} />}
      <h2>{event.Title}</h2>
      <p>{formatDate(event.StartTime, event.EndTime)}</p>
      <div><LocationFilled /> {locationName}</div>
      <p style={{ color: 'green' }}>{event.FoodEvent ? 'Food Event' : ''}</p>
      {event.Beschrijving && <p className={styles.description}>{event.Beschrijving}</p>}

      {isSignedUp ? (
        <button className={styles.signOutButton} onClick={handleSignOut}>Sign Out</button>
      ) : (
        <button className={styles.signUpButton} onClick={handleSignUp}>Sign Up</button>
      )}
      {notification && (
      <div className={`${styles.notification} ${notification.type === 'success' ? styles.success : styles.error}`}>
        {notification.message}
      </div>
    )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Sign up for {event.Title}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Extra information (optional):
                <textarea
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  disabled={loading}
                />
              </label>
              {event.FoodEvent && (
                <label>
                  Dietary preferences / allergies (optional):
                  <textarea
                    value={dietaryPrefs}
                    onChange={(e) => setDietaryPrefs(e.target.value)}
                    disabled={loading}
                  />
                </label>
              )}
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton} disabled={loading}>Submit</button>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton} disabled={loading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;