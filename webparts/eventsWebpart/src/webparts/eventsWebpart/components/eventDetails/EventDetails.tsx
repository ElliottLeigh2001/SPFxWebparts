import * as React from 'react';
import { useEffect, useState } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import { EventItem } from '../../EventsInterfaces';
import { SignupModal } from '../modals/signupModal/SignupModal';
import { formatDate, formatSingleDate } from '../../utils/DateUtils';
import { useEventSignup } from '../../hooks/UseEventSignup';
import detailsStyles from './EventDetails.module.scss'
import { AttendeesModal } from '../modals/attendeesModal/AttendeesModal';

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
  const [allAttendees, setAllAttendees] = useState<any[]>([]);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
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

  // Sign up deadline logic
  const today = new Date();
  const signupDeadlineDate = new Date(event.SignupDeadline);
  // +1 so you can still sign up on the day of the deadline
  signupDeadlineDate.setDate(signupDeadlineDate.getDate() + 1);
  const canSignUp = signupDeadlineDate >= today || event.SignupDeadline === null;
  const showSignupButtons = event.EventTypes !== 'No signup';

  // Fetch everyone who is attending a specific event
  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const sp = getSP(context);
        const items = await sp.web.lists
          .getByTitle("Subscriptions")
          .items.filter(`EventId eq ${event.Id}`)
          .select("Id", "Carpooling", "DepartureFrom", "Attendee/Id", "Attendee/Title")
          .expand("Attendee")();

        // Deduplicate by Attendee Id or Title
        const uniqueAttendees = Object.values(
          items.reduce((acc: any, item: any) => {
            const key = item.Attendee?.Id || item.Attendee?.Title;
            if (!acc[key]) {
              acc[key] = item;
            }
            return acc;
          }, {})
        );

        const firstTenAttendees = uniqueAttendees.slice(0, 10);
        setAllAttendees(uniqueAttendees);
        setAttendees(firstTenAttendees);
      } catch (error) {
        console.error("Error fetching attendees:", error);
      }
    };

    fetchAttendees();
  }, [context, event]);


  // Sign up, sign out and deadline logic
  const renderSignupButton = () => {
    if (!showSignupButtons) return null;

    if (!canSignUp) {
      return <p className={detailsStyles.cantSignUp}>Signup deadline has passed</p>;
    }

    if (isSignedUp) {
      return (
        <button 
          className={detailsStyles.signOutButton} 
          onClick={handleSignOut}
          disabled={loading}
        >
          {loading ? 'Signing Out...' : 'Sign Out'}
        </button>
      );
    } else {
      return (
        <button 
          className={detailsStyles.signUpButton} 
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
    : event.Signinlink
    
    if (!signInUrl) {
      return <p className={detailsStyles.cantSignUp}>Someone tell HR they forgot to add a sign up link</p>
    }

    if (!canSignUp) {
      return <p className={detailsStyles.cantSignUp}>Signup deadline has passed</p>;
    }

    return (
      <button
        className={detailsStyles.signUpButton}
        onClick={() => (window.location.href = signInUrl)}
        disabled={loading}
      >
        Sign Up
      </button>
    );
  };
  
  return (
<div className={detailsStyles.detailsContainer}>

    <div className={detailsStyles.left}>
      <button onClick={onBack} className={detailsStyles.backButton}>Back</button>
    </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt={event.Title}
          className={detailsStyles.detailsImage}
        />
      )}

      {(event.EventTypes !== "No signup" && event.EventTypes !== "Custom") && (
        <div className={detailsStyles.right}>
          <h4>Attendees ({allAttendees.length})</h4>
          {attendees.length > 0 ? (
            <>
              <ul>
                {attendees.map((att) => (
                  <li key={att.Id}>
                    <strong>{att.Attendee?.Title}</strong>
                  </li>
                ))}
              </ul>
              {allAttendees.length > attendees.length && (
                <p onClick={() => setShowAttendeesModal(true)} className={detailsStyles.seeMore}>See more</p>
              )}
            </>
          ) : (
            <p>No attendees yet</p>
          )}
        </div>
      )}
      <div style={{display: 'flex', justifyContent: 'center', width: "60%", margin: '20px'}}>
        <h2>{event.Title}</h2>
      </div>
      <div>📍{event.Location}</div>
      <div style={{margin: '20px'}}>
        <svg style={{marginRight: '4px', transform: 'translateY(2px)'}} xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#000"> 
        <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z"/>
        </svg>{formatDate(event.StartTime, event.EndTime)}
      </div>
      
      {event.FoodEvent && <div className={detailsStyles.foodEvent}>Food Included</div>}
      
      <div style={{margin: '20px'}} className={detailsStyles.signupDeadline}>
        {event.SignupDeadline && `Sign up deadline: ${formatSingleDate(event.SignupDeadline)} at 23:59`}
      </div>

      {checkingStatus ? (
        <div className={detailsStyles.loading}>Checking signup status...</div>
      ) : (
        event.EventTypes === 'Custom' || event.EventTypes === 'Online signup' ? (
          renderCustomSignup()
        ) : (

          renderSignupButton()
        )
      )}

      <div style={{margin: '20px'}} className={detailsStyles.descriptionContainer}>
        {event.Beschrijving && (
          <div
          className={detailsStyles.description}
          dangerouslySetInnerHTML={{ __html: event.Beschrijving }}
          />
        )}
      </div>

      {notification && (
        <div className={`${detailsStyles.notification} ${notification.type === 'success' ? detailsStyles.success : detailsStyles.error}`}>
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
      
      {showAttendeesModal && (
        <AttendeesModal
          onClose={() => setShowAttendeesModal(false)}
          attendees={allAttendees}
          event={event}
        />
      )}
    </div>
  );
};

export default EventDetails;