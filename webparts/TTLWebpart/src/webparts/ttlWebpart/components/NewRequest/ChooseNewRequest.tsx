import * as React from "react";
import { useState } from "react";
import NewRequestTrainingTravel from "./NewRequestTrainingTravel";
import NewRequestSoftware from "./NewRequestSoftware";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { Approver } from "../../Interfaces/TTLInterfaces";
import styles from "../Dashboard/TtlWebpart.module.scss";
import newRequestStyles from "./NewRequest.module.scss";
import softwareImg from "../../assets/softwarePhoto.jpg";
import trainingImg from "../../assets/trainingPhoto.jpg";

export interface ChooseNewRequestProps {
  context: WebPartContext;
  onSave: () => void;
  onCancel: () => void;
  approvers: Approver[];
  loggedInUser: any;
}

const ChooseNewRequest: React.FC<ChooseNewRequestProps> = ({
  context,
  onSave,
  onCancel,
  approvers,
  loggedInUser,
}) => {
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
    <div className={`${styles.ttlForm} ${newRequestStyles.chooseContainer}`}>
      <div className={newRequestStyles.formHeader}>
        <h2>Which type of request would you like to make?</h2>
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
  );
};

export default ChooseNewRequest;
