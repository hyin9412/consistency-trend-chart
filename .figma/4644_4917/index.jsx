import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.frame}>
      <div className={styles.instance3}>
        <div className={styles.instance}>
          <p className={styles.text}>按日</p>
        </div>
        <div className={styles.instance2}>
          <p className={styles.text2}>按周</p>
        </div>
        <div className={styles.instance2}>
          <p className={styles.text2}>按月</p>
        </div>
      </div>
      <div className={styles.instance4}>
        <div className={styles.frame1410097577}>
          <div className={styles.aComponentsComponent}>
            <p className={styles.text3}>2022-03-02&nbsp;</p>
          </div>
          <img
            src="../image/mt6p4v0t-lbehz9g.svg"
            className={styles.aComponentsComponent2}
          />
          <div className={styles.aComponentsComponent}>
            <p className={styles.text3}>2022-03-02</p>
          </div>
        </div>
        <img src="../image/mt6p4v0t-gh7kqx9.svg" className={styles.calendar} />
      </div>
    </div>
  );
}

export default Component;
