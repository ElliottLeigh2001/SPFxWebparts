import * as React from 'react';
import { useEffect, useState } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import styles from './EventsWebpart.module.scss';
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import { EventItem } from '../EventsInterfaces';
import { SignupModal } from './SignupModal';
import { formatDate, formatSingleDate } from '../utils/dateUtils';
import { useEventSignup } from '../hooks/useEventSignup';

let sp: SPFI;
export const getSP = (context: WebPartContext): SPFI => {
  if (!sp) {
    sp = spfi(context.pageContext.web.absoluteUrl).using(SPFx(context));
  }
  return sp;
};

const EventDetails: React.FC<{ context: WebPartContext; event: EventItem; onBack: () => void; }> = ({ context, event, onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const {
    isSignedUp,
    loading,
    notification,
    checkingStatus,
    handleSignOut,
    handleSubmit,
  } = useEventSignup(context, event);

  // Extract image from object
  const imageData = event.Image0 ? JSON.parse(event.Image0) : null;
  const imageUrl = imageData
    ? `${context.pageContext.web.absoluteUrl}/Lists/HR_Events/Attachments/${event.Id}/${imageData.fileName}`
    : undefined;

  // Sign up deadline logic (you can still sign up on the day of the deadline)
  const today = new Date();
  const signupDeadlineDate = new Date(event.SignupDeadline);
  signupDeadlineDate.setDate(signupDeadlineDate.getDate() + 1);

  const canSignUp = signupDeadlineDate >= today || event.SignupDeadline === null;
  const showSignupButtons = event.EventType !== 'No signup';

  // Fetch everyone who is attending a specific event
  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const sp = getSP(context);
        const items = await sp.web.lists
          .getByTitle("Subscriptions")
          .items.filter(`EventId eq ${event.Id}`)
          .select("Id", "Carpooling", "DepartureFrom", "Attendee/Title")
          .expand("Attendee")();
        console.log("Fetched attendees:", items);
        setAttendees(items);
      } catch (error) {
        console.error("Error fetching attendees:", error);
      }
    };

    fetchAttendees();
  }, [context, event]);

  // Sign up / out button logic
  const renderSignupButton = () => {
    if (!showSignupButtons) return null;

    if (!canSignUp) {
      return <p style={{color: 'red', fontSize: 'large'}}>Signup deadline has passed</p>;
    }

    if (isSignedUp) {
      return (
        <button 
          className={styles.signOutButton} 
          onClick={handleSignOut}
          disabled={loading}
        >
          {loading ? 'Signing Out...' : 'Sign Out'}
        </button>
      );
    } else {
      return (
        <button 
          className={styles.signUpButton} 
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          Sign Up
        </button>
      );
    }
  };

  // If the event is of type 'custom', a link is provided and the sign up button 
  // will take the user to the url. This can either be a website where you sign up
  // or it takes you to a hand-made list to sign up the old way.
  const renderCustomSignup = () => {
    const signInUrl =
      typeof event.Signinlink === "string"
        ? event.Signinlink
        : event.Signinlink?.Url;

    if (!signInUrl) return null;

    return (
      <button
        className={styles.signUpButton}
        onClick={() => (window.location.href = signInUrl)}
        disabled={loading}
      >
        Sign Up
      </button>
    );
  };


  return (
    <div className={styles.detailsContainer}>
      <button onClick={onBack} className={styles.backButton}>← Back</button>
      
      {imageUrl && <img src={imageUrl} alt={event.Title} className={styles.detailsImage} />}
      
      {attendees.length > 0 ? (
        <div className={styles.topRightBox}>
          <h4 style={{fontSize: 'large', textDecoration: 'underline'}}>Attendees ({attendees.length})</h4>
          <ul>
            {attendees.map((att) => (
              <li key={att.Id}>
                <strong>{att.Attendee?.Title}</strong>
                {event.Carpooling && att.Carpooling && (
                  <div>
                    {att.Carpooling} {att.DepartureFrom && ` (${att.DepartureFrom})`}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles.topRightBox}>
          <h2>Attendees ({attendees.length})</h2>
          <p>There are no attendess for this event</p>
        </div>
      )}

      <h2>{event.Title}</h2>
      <div>📍{event.Location}</div>
      <p>
        <svg style={{marginRight: '4px', transform: 'translateY(2px)'}} xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#000"> 
        <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z"/>
        </svg>{formatDate(event.StartTime, event.EndTime)}
      </p>
      
      {event.FoodEvent && <p style={{ color: 'green' }}>Food Included</p>}
      
      <div className={styles.descriptionContainer}>
        {event.Beschrijving && (
          <div
          className={styles.description}
          dangerouslySetInnerHTML={{ __html: event.Beschrijving }}
          />
        )}
      </div>
      <div style={{color: 'red', fontWeight: 'bold', marginTop: '20px'}}>
        {event.SignupDeadline && `Sign up deadline: ${formatSingleDate(event.SignupDeadline)} at 23:59`}
      </div>

      {checkingStatus ? (
        <div className={styles.loading}>Checking signup status...</div>
      ) : (
        event.EventType === 'Custom' || event.EventType === 'Online signup' ? (
          renderCustomSignup()
        ) : (

          renderSignupButton()
        )
      )}

      {notification && (
        <div className={`${styles.notification} ${notification.type === 'success' ? styles.success : styles.error}`}>
          {notification.message}
        </div>
      )}

      {showModal && (
        <SignupModal
          event={event}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default EventDetails;