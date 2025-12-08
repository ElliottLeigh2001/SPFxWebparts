import headerImg from "../../assets/headerImg.jpg";
import styles from "./HeaderComponent.module.scss"
import * as React from "react";
import { HeaderProps } from "./HeaderComponentProps";
import dashStyles from "../Dashboard/TtlWebpart.module.scss";

const HeaderComponent: React.FC<HeaderProps> = ({view, isHR, isCEO, allApprovers, loggedInUser, onViewClick}) => {
    const canShowApprover = !!(loggedInUser && allApprovers && allApprovers.some(approver => approver.PracticeLead?.EMail === loggedInUser.Email));

    return (
      <>
        <img src={headerImg} alt="Header" className={styles.headerImg} />
        <div className={styles.headerTitleWrapper}>
            <div className={styles.headerTitleContainer}>
                <h1>{view}</h1>
            </div>
          <div className={styles.headerButtons}>
            {canShowApprover && (
              <button
                onClick={() => onViewClick && onViewClick('approvers')}
                style={{ width: '110px' }}
                className={dashStyles.stdButton}
              >
                Approver
              </button>
            )}

            {isHR && (
              <button onClick={() => onViewClick && onViewClick('HR')} style={{width: '110px'}} className={dashStyles.stdButton}>HR</button>
            )}

            {isCEO && (
              <button onClick={() => onViewClick && onViewClick('director')} style={{width: '110px'}} className={dashStyles.stdButton}>Director</button>
            )}
          </div>
        </div>

      </>
    )
}

export default HeaderComponent;