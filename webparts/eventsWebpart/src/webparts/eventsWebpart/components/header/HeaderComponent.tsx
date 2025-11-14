import React from "react";
import headerImg from "../../assets/headerImg.jpg";
import styles from "./HeaderComponent.module.scss"
import { HeaderProps } from "./HeaderComponentInterface";

const HeaderComponent: React.FC<HeaderProps> = ({event}) => {
    return (
      <>
        <img src={headerImg} alt="Header" className={styles.headerImg} />
        <div className={styles.headerTitleWrapper}>
            <div className={styles.headerTitleContainer}>
            {event ? (
                <>
                    <p>{event.Title}</p>
                    <p>heigh test</p>
                    <p>height tststs</p>
                </>
            ) : (
                <p>Events</p>
            )}
            </div>
        </div>
      </>
    )
}

export default HeaderComponent;