import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { EventItem } from '../../EventsInterfaces';
import { SportFormFields } from '../form-fields/Sport/SportFormField';
import { FoodFormFields } from '../form-fields/Food/FoodFormFields';
import { CarpoolingFormFields } from '../form-fields/Carpooling/CarpoolingFormFields';
import { FamilyFormFields } from '../form-fields/Family/FamilyFormFields';
import { SinterklaasFormFields } from '../form-fields/Sinterklaas/SinterklaasFormFields';
import { PlusOneFormFields } from '../form-fields/PlusOne/PlusOneFormFields';
import { formatSingleDate } from '../../utils/DateUtils';
import { useEventSignup } from '../../hooks/UseEventSignup';
import detailsStyles from './EventDetails.module.scss'
import { getSP } from '../../utils/getSP';

const EventDetails: React.FC<{ context: WebPartContext; event: EventItem; onBack: () => void; }> = ({ context, event, onBack }) => {
  const [allAttendees, setAllAttendees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'attendees' | 'carpooling'>('details');
  const activeTabRef = useRef<HTMLParagraphElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState<React.CSSProperties>({});
  const [formData, setFormData] = useState<any>({
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
    ageChild1: '',
    ageChild2: '',
    ageChild3: '',
  });
  const {
    isSignedUp,
    loading,
    notification,
    checkingStatus,
    handleSignOut,
    handleSubmit,
  } = useEventSignup(context, event);

  const carpoolOptions = {
  lift: "I would like someone to give me a lift",
  drive: "I will drive for my colleagues",
  none: "Not interested in carpooling",
  };

  const groupedAttendees: Record<string, any[]> = {
    lift: allAttendees.filter(a => a.Carpooling === carpoolOptions.lift),
    drive: allAttendees.filter(a => a.Carpooling === carpoolOptions.drive),
    none: allAttendees.filter(a => a.Carpooling === carpoolOptions.none),
  };

  const imageData = event.Image0
  ? JSON.parse(event.Image0)
  : null;
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

        setAllAttendees(uniqueAttendees);
      } catch (error) {
        console.error("Error fetching attendees:", error);
      }
    };

    fetchAttendees();
  }, [context, event]);

  useEffect(() => {
    if (activeTabRef.current && activeTabRef.current.parentElement) {
      const rect = activeTabRef.current.getBoundingClientRect();
      const containerRect = activeTabRef.current.parentElement.getBoundingClientRect();

      setUnderlineStyle({
        width: rect.width + "px",
        transform: `translateX(${rect.left - containerRect.left}px)`
      });
    }
  }, [activeTab]);

  // Sign up, sign out and deadline logic
  // Signup button logic is incorporated into the side panel form; keep sign-out button rendered in main content when needed

  // If the event is of type 'custom', a link is provided and the sign up button 
  // will take the user to the url. This can either be a website where you sign up
  // or it takes you to a hand-made list to sign up the old way.
  const renderCustomSignup = () => {
    const signInUrl = typeof event.Signinlink === 'string' ? event.Signinlink : event.Signinlink;

    if (!signInUrl) {
      return <p className={detailsStyles.cantSignUp}>Someone tell HR they forgot to add a sign up link</p>;
    }

    if (!canSignUp) {
      return <p className={detailsStyles.cantSignUp}>Signup deadline has passed</p>;
    }

    return (
      <div className={detailsStyles.modalActions}>
        <button
          className={detailsStyles.submitButton}
          onClick={() => (window.location.href = signInUrl)}
          disabled={loading}
        >
          Sign Up
        </button>
      </div>
    );
  };

  // Handlers for the inline form
  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleLocalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      ageChild1: formData.ageChild1 ? parseInt(formData.ageChild1) || 0 : 0,
      ageChild2: formData.ageChild2 ? parseInt(formData.ageChild2) || 0 : 0,
      ageChild3: formData.ageChild3 ? parseInt(formData.ageChild3) || 0 : 0,
    };

    await handleSubmit(submissionData);

    // reset
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
      ageChild1: '',
      ageChild2: '',
      ageChild3: '',
    });
  };
  
  return (
    <>
    <img src={imageUrl} alt="Header" className={detailsStyles.headerImg} />
    <div className={detailsStyles.pageWrapper}>
      <div className={detailsStyles.headerTitleWrapper}>
        <div className={detailsStyles.headerTitleContainer}>
          {event ? (
            <>
              <h2>{event.Title}</h2>
              <p>{formatSingleDate(event.StartTime)}</p>
              <p>{event.Location}</p>
            </>
          ) : (
            <h1>Events</h1>
          )}
        </div>
      </div>
      <div className={detailsStyles.detailsContainer}>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
        <div className={detailsStyles.details}>
          <div className={detailsStyles.tabsContainer}>
            {(event.EventTypes !== 'Custom' && event.EventTypes !== 'No signup') ? (
              <>
                <p
                  onClick={() => setActiveTab("details")}
                  className={`${detailsStyles.panelHeader} ${activeTab === 'details' ? detailsStyles.activeTab : ""}`}
                  ref={activeTab === 'details' ? activeTabRef : null}
                >
                  Details</p>
                <p
                  onClick={() => setActiveTab("attendees")}
                  className={`${detailsStyles.panelHeader} ${activeTab === 'attendees' ? detailsStyles.activeTab : ""}`}
                  ref={activeTab === 'attendees' ? activeTabRef : null}
                >
                  Attendees {`(${allAttendees.length})`}</p>
                {event.Carpooling && (
                  <p
                    onClick={() => setActiveTab("carpooling")}
                    className={`${detailsStyles.panelHeader} ${activeTab === 'carpooling' ? detailsStyles.activeTab : ""}`}
                    ref={activeTab === 'carpooling' ? activeTabRef : null}
                  >
                    Carpooling</p>
                )}
                <span className={detailsStyles.activeUnderline} style={underlineStyle}></span>
              </>
            ) : (
              <h3 className={`${detailsStyles.panelHeader} ${detailsStyles.activeTab}`}>Details</h3>
            )}
          </div>

          <div className={detailsStyles.descriptionContainer}>
            {activeTab === 'details' && (
              <div
                className={detailsStyles.description}
                dangerouslySetInnerHTML={{ __html: event.Beschrijving }} />
            )}

            {activeTab === 'attendees' && (
              allAttendees.length > 0 ? (
                <div className={detailsStyles.attendeesPanel}>
                  <ul>
                    {allAttendees.map(att => (
                      <li key={att.Id}>{att.Attendee?.Title}</li>
                    ))}
                  </ul>
                </div>
              ) : <h4>There are no attendees for this event</h4>
            )}

            {activeTab === 'carpooling' && (
              <>
                {Object.entries(carpoolOptions).map(([key, label]) => {
                  const group = groupedAttendees[key];
                  return (
                    <details key={key} className={detailsStyles.carpoolSection}>
                      <summary>{label} ({group.length})</summary>
                      <ul>
                        {group.length > 0 ? (
                          group.map(att => (
                            <li key={att.Id}>{att.Attendee?.Title} {att.DepartureFrom ? `(${att.DepartureFrom})` : ''}</li>
                          ))
                        ) : (
                          <li>No attendees for this option</li>
                        )}
                      </ul>
                    </details>
                  );
                })}
              </>
            )}
            
          </div>

          {notification && (
            <div className={`${detailsStyles.notification} ${notification.type === 'success' ? detailsStyles.success : detailsStyles.error}`}>
              {notification.message}
            </div>
          )}

        </div>

      <aside className={detailsStyles.register}>
        <div className={detailsStyles.tabsContainer}>
          <h3 className={detailsStyles.panelHeader}>Register Now</h3>
        </div>

        {event.EventTypes !== 'No signup' ? (
          <>
            {event.SignupDeadline && (
              <div className={detailsStyles.signupDeadline}>
                <div>
                  <strong>Registration Deadline: </strong>
                  {formatSingleDate(event.SignupDeadline)}
                </div>
              </div>
            )}

            {event.EventTypes === 'Custom' ? (
              renderCustomSignup()
            ) : (
              showSignupButtons &&
              canSignUp && (
                <form onSubmit={handleLocalSubmit} className={detailsStyles.inlineForm}>
                  {event.EventTypes === 'Sport' && (
                    <SportFormFields
                      shirtSize={formData.shirtSize}
                      setShirtSize={(value: any) => updateFormData('shirtSize', value)}
                      disabled={loading}
                    />
                  )}

                  {event.EventTypes === 'Sinterklaas' && (
                    <SinterklaasFormFields
                      amountOfKids={formData.amountOfKids || 0}
                      setAmountOfKids={(value: any) => updateFormData('amountOfKids', value)}
                      kidsData={formData.kidsData || []}
                      setKidsData={(kidsData: any) => updateFormData('kidsData', kidsData)}
                      disabled={loading}
                    />
                  )}

                  {event.EventTypes === 'Family' && (
                    <FamilyFormFields
                      amountOfKids={formData.amountOfKids || 0}
                      setAmountOfKids={(value: any) => updateFormData('amountOfKids', value)}
                      ageChild1={formData.ageChild1}
                      setAgeChild1={(value: any) => updateFormData('ageChild1', value)}
                      ageChild2={formData.ageChild2}
                      setAgeChild2={(value: any) => updateFormData('ageChild2', value)}
                      ageChild3={formData.ageChild3}
                      setAgeChild3={(value: any) => updateFormData('ageChild3', value)}
                      disabled={loading}
                    />
                  )}

                  {event.FoodEvent && (
                    <FoodFormFields
                      food={formData.food}
                      setFood={(value: any) => updateFormData('food', value)}
                      dietaryPrefs={formData.dietaryPrefs}
                      setDietaryPrefs={(value: any) => updateFormData('dietaryPrefs', value)}
                      disabled={loading}
                    />
                  )}

                  {event.PlusOne && (
                    <PlusOneFormFields
                      plusOne={formData.plusOne}
                      setPlusOne={(value: any) => updateFormData('plusOne', value)}
                      dietaryPrefsPlusOne={formData.dietaryPrefsPlusOne}
                      setDietaryPrefsPlusOne={(value: any) =>
                        updateFormData('dietaryPrefsPlusOne', value)
                      }
                      foodPlusOne={formData.foodPlusOne}
                      setFoodPlusOne={(value: any) =>
                        updateFormData('foodPlusOne', value)
                      }
                      disabled={loading}
                      showFoodFields={event.FoodEvent}
                    />
                  )}

                  {event.Carpooling && (
                    <CarpoolingFormFields
                      carpooling={formData.carpooling}
                      setCarpooling={(value: any) => updateFormData('carpooling', value)}
                      departureFrom={formData.departureFrom}
                      setDepartureFrom={(value: any) =>
                        updateFormData('departureFrom', value)
                      }
                      disabled={loading}
                    />
                  )}

                  <label>
                    Extra information
                    <br />
                    <textarea
                      value={formData.extraInfo}
                      onChange={(e) => updateFormData('extraInfo', e.target.value)}
                      disabled={loading}
                    />
                  </label>

                  <div className={detailsStyles.modalActions}>
                    {!checkingStatus && (
                      <>
                        {isSignedUp ? (
                          <button
                            className={detailsStyles.signOutButton}
                            onClick={handleSignOut}
                            disabled={loading}
                            style={!event.SignupDeadline ? { marginTop: '20px' } : {}}
                          >
                            {loading ? 'Signing Out...' : 'Sign Out'}
                          </button>
                        ) : (
                          <button
                            type="submit"
                            className={detailsStyles.submitButton}
                            disabled={loading}
                          >
                            {loading ? 'Signing up...' : 'Sign up'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </form>
              )
            )}
          </>
        ) : (
          <p style={{fontWeight: '500', fontSize: 'medium'}}>This event does not require you to sign up</p>
        )}
        </aside>
      </div>
    </div>
  </>
  );
};

export default EventDetails;