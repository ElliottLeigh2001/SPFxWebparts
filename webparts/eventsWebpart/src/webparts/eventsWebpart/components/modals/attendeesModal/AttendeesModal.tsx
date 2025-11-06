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

  // For non-carpooling events, display the attendee list in 1-3 balanced columns depending on total
  const total = attendees.length;
  // If no attendees, we'll show a message instead of columns
  const columnsCount = total === 0 ? 0 : Math.min(3, total);
  const chunk = columnsCount > 0 ? Math.ceil(total / columnsCount) : 0;
  const columns: typeof attendees[] = [];
  for (let i = 0; i < columnsCount; i++) {
    columns.push(attendees.slice(i * chunk, i * chunk + chunk));
  }

  return (
    <div className={modalStyles.modalOverlay}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.closeButtonContainer}>
          <button className={modalStyles.closeButton} onClick={handleClose}>×</button>
        </div>
        <h2>Attendees for {event.Title}</h2>

        {!event.Carpooling ? (
          columnsCount === 0 ? (
            <p className={modalStyles.empty}>There are no attendees for this event.</p>
          ) : (
            <div className={`${modalStyles.attendeesGrid} ${(modalStyles as any)[`cols${columnsCount}`]}`}>
              {columns.map((col, idx) => (
                <div key={idx} className={`${modalStyles.carpoolColumn} ${modalStyles.attendeesColumn}`}>
                  {col.length > 0 ? (
                    <ul>
                      {col.map(att => (
                        <li key={att.Id}><strong>{att.Attendee?.Title}</strong></li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          )
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
