import * as React from "react";
import { useState } from "react";
import NewRequestTrainingTravel from "./NewRequestTrainingTravel";
import NewRequestSoftware from "./NewRequestSoftware";
import styles from "../Dashboard/TtlWebpart.module.scss";
import newRequestStyles from "./NewRequest.module.scss";
import softwareImg from "../../assets/softwarePhoto.jpg";
import trainingImg from "../../assets/trainingPhoto.jpg";
import { NewRequestProps } from "./NewRequestProps";

const ChooseNewRequest: React.FC<NewRequestProps> = ({ context, onSave, onCancel, approvers, loggedInUser }) => {
  const [showSoftware, setShowSoftware] = useState(false);
  const [showTrainingTravel, setShowTrainingTravel] = useState(false);

  if (showSoftware) {
    return (
      <NewRequestSoftware
        context={context}
        onCancel={() => {
          setShowSoftware(false);
          onCancel();
        }}
        onSave={onSave}
        approvers={approvers}
        loggedInUser={loggedInUser}
      />
    );
  }

  if (showTrainingTravel) {
    return (
      <NewRequestTrainingTravel
        context={context}
        onCancel={() => {
          setShowTrainingTravel(false);
          onCancel();
        }}
        onSave={onSave}
        approvers={approvers}
        loggedInUser={loggedInUser}
      />
    );
  }

  return (
    <div style={{position: 'relative'}} className={styles.ttlForm}>
      <h2 style={{textAlign: 'center'}}>Which type of request would you like to make?</h2>
      <div className={newRequestStyles.chooseContainer}>
        <div className={newRequestStyles.formHeader}>
          <button style={{position: 'absolute', top:'37px', left: '33px'}} onClick={onCancel} className={styles.stdButton}>Back</button>
        </div>

        <div className={newRequestStyles.chooseGrid}>
          <button
            className={`${newRequestStyles.chooseRequestButton}`}
            style={{ backgroundImage: `url(${softwareImg})` }}
            onClick={() => setShowSoftware(true)}
          >
            <div className={newRequestStyles.overlay}>
              <h3>Software License</h3>
            </div>
          </button>

          <button
            className={`${newRequestStyles.chooseRequestButton}`}
            style={{ backgroundImage: `url(${trainingImg})` }}
            onClick={() => setShowTrainingTravel(true)}
          >
            <div className={newRequestStyles.overlay}>
              <h3>Training / Travel</h3>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseNewRequest;
