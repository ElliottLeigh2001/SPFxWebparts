import * as React from "react";
import { useState } from "react";
import { INewRequestProps } from "./NewRequestProps";
import NewRequestTraining from "./NewRequestTraining";
import NewRequestTravel from "./NewRequestTravel";
import trainingImg from "../../assets/trainingPhoto.jpg";
import travelImg from "../../assets/travelPhoto.jpg"
import styles from "../Dashboard/TtlWebpart.module.scss";
import newRequestStyles from "./NewRequest.module.scss";
import HeaderComponent from "../Header/HeaderComponent";

const ChooseNewRequest: React.FC<INewRequestProps> = ({ context, onSave, onCancel, approvers, loggedInUser }) => {
  const [showTraining, setShowTraining] = useState(false);
  const [showTravel, setShowTravel] = useState(false);

  if (showTraining) {
    return (
      <NewRequestTraining
        context={context}
        onCancel={() => {
          setShowTraining(false);
          onCancel();
        }}
        onSave={onSave}
        approvers={approvers}
        loggedInUser={loggedInUser}
      />
    );
  }

  if (showTravel) {
    return (
      <NewRequestTravel
        context={context}
        onCancel={() => {
          setShowTravel(false);
          onCancel();
        }}
        onSave={onSave}
        approvers={approvers}
        loggedInUser={loggedInUser}
      />
    );
  }

  return (
    <>
    <HeaderComponent view="New Request"/>
    <div style={{ position: 'relative' }} className={styles.ttlForm}>
      <h2 style={{ textAlign: 'center', marginBottom: '5rem' }}>Which type of request would you like to make?</h2>
      <div className={newRequestStyles.chooseContainer}>

        <div className={newRequestStyles.chooseGrid}>
          <button
            className={`${newRequestStyles.chooseRequestButton}`}
            style={{ backgroundImage: `url(${trainingImg})` }}
            onClick={() => setShowTraining(true)}
          >
            <div className={newRequestStyles.overlay}>
              <h3>Training</h3>
            </div>
          </button>

          <button
            className={`${newRequestStyles.chooseRequestButton}`}
            style={{ backgroundImage: `url(${travelImg})` }}
            onClick={() => setShowTravel(true)}
          >
            <div className={newRequestStyles.overlay}>
              <h3>Travel</h3>
            </div>
          </button>
          
        </div>
      </div>
    </div>
    </>
  );
};

export default ChooseNewRequest;
