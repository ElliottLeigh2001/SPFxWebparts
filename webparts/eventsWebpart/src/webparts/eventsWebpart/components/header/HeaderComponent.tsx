import React from "react";
import headerImg from "../../assets/headerImg.jpg";
import styles from "./HeaderComponent.module.scss"
import { HeaderProps } from "./HeaderComponentInterface";
import { formatSingleDate } from "../../utils/DateUtils";

const HeaderComponent: React.FC<HeaderProps> = ({event}) => {
    return (
      <>
        <img src={headerImg} alt="Header" className={styles.headerImg} />
        <div className={styles.headerTitleWrapper}>
            <div className={styles.headerTitleContainer}>
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
      </>
    )
}

export default HeaderComponent;