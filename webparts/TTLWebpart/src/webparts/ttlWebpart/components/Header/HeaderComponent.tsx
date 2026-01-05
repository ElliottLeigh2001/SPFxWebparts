import headerImg from "../../assets/headerImg.jpg";
import headerStyles from "./HeaderComponent.module.scss"
import * as React from "react";
import { IHeaderProps } from "./HeaderComponentProps";
import styles from "../Dashboard/TtlWebpart.module.scss";

const HeaderComponent: React.FC<IHeaderProps> = ({view, isHR, isCEO, isDeliveryDirector, allApprovers, loggedInUser, onViewClick}) => {
    const canShowApprover = !!(loggedInUser && allApprovers && allApprovers.some(approver => approver.PracticeLead?.EMail || approver.TeamCoach.EMail === loggedInUser.Email));

    return (
      <>
        <img src={headerImg} alt="Header" className={headerStyles.headerImg} />
        <div className={headerStyles.headerTitleWrapper}>
            <div className={headerStyles.headerTitleContainer}>
                <h1>{view}</h1>
            </div>
          <div className={headerStyles.headerButtons}>
            {canShowApprover && (
              <button
                onClick={() => onViewClick && onViewClick('approvers')}
                style={{ width: '110px' }}
                className={styles.stdButton}
              >
                Approver
              </button>
            )}

            {isHR && (
              <button onClick={() => onViewClick && onViewClick('HR')} style={{width: '110px'}} className={styles.stdButton}>HR</button>
            )}

            {isDeliveryDirector && (
              <button onClick={() => onViewClick && onViewClick('deliveryDirector')} style={{width: '160px'}} className={styles.stdButton}>Delivery Director</button>
            )}

            {isCEO && (
              <button onClick={() => onViewClick && onViewClick('director')} style={{width: '110px'}} className={styles.stdButton}>Director</button>
            )}
          </div>
        </div>

      </>
    )
}

export default HeaderComponent;