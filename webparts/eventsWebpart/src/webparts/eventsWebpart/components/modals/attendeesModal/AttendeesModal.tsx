import React, { useEffect } from 'react';
import modalStyles from './AttendeesModal.module.scss';
import { AttendeesModalProps } from './AttendeesModalInterface';

export const AttendeesModal: React.FC<AttendeesModalProps> = ({ event, attendees, onClose }) => {
  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    console.log(attendees)
    console.log(event)
  }, [])

  if (!event) return null;

  // Separate attendees by carpooling preference
  const wantLift = attendees.filter(a => a.Carpooling === 'I would like someone to give me a lift');
  const willDrive = attendees.filter(a => a.Carpooling === 'I will drive for my colleagues');
  const notInterested = attendees.filter(a => !a.Carpooling || a.Carpooling === 'Not interested in carpooling');

  // For non-carpooling events, display the attendee list in 3 balanced columns to save space
  const total = attendees.length;
  const chunk = Math.ceil(total / 3) || 0;
  const col1 = attendees.slice(0, chunk);
  const col2 = attendees.slice(chunk, chunk * 2);
  const col3 = attendees.slice(chunk * 2);

  return (
    <div className={modalStyles.modalOverlay}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.closeButtonContainer}>
          <button className={modalStyles.closeButton} onClick={handleClose}>×</button>
        </div>
        <h2>Attendees for {event.Title}</h2>

        {!event.Carpooling ? (
          <div className={modalStyles.attendeesGrid}>
            <div className={`${modalStyles.carpoolColumn} ${modalStyles.attendeesColumn}`}>
              {col1.length > 0 ? (
                <ul>
                  {col1.map(att => (
                    <li key={att.Id}><strong>{att.Attendee?.Title}</strong></li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className={`${modalStyles.carpoolColumn} ${modalStyles.attendeesColumn}`}>
              {col2.length > 0 ? (
                <ul>
                  {col2.map(att => (
                    <li key={att.Id}><strong>{att.Attendee?.Title}</strong></li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className={`${modalStyles.carpoolColumn} ${modalStyles.attendeesColumn}`}>
              {col3.length > 0 ? (
                <ul>
                  {col3.map(att => (
                    <li key={att.Id}><strong>{att.Attendee?.Title}</strong></li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={modalStyles.carpoolGrid}>
            <div className={modalStyles.carpoolColumn}>
              <h4>I would like a lift from someone</h4>
              {wantLift.length > 0 ? (
                <ul>
                  {wantLift.map(att => (
                    <li key={att.Id}>{att.Attendee?.Title} ({att.DepartureFrom})</li>
                  ))}
                </ul>
              ) : (
                <p className={modalStyles.empty}>No one selected this option</p>
              )}
            </div>

            <div className={modalStyles.carpoolColumn}>
              <h4>I will drive for my colleagues</h4>
              {willDrive.length > 0 ? (
                <ul>
                  {willDrive.map(att => (
                    <li key={att.Id}>{att.Attendee?.Title} ({att.DepartureFrom})</li>
                  ))}
                </ul>
              ) : (
                <p className={modalStyles.empty}>No one selected this option</p>
              )}
            </div>

            <div className={modalStyles.carpoolColumn}>
              <h4>Not interested in carpooling</h4>
              {notInterested.length > 0 ? (
                <ul>
                  {notInterested.map(att => (
                    <li key={att.Id}>{att.Attendee?.Title}</li>
                  ))}
                </ul>
              ) : (
                <p className={modalStyles.empty}>No one selected this option</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
