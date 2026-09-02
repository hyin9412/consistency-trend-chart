import React from 'react';
import styles from './index.module.scss';

interface FixedFooterProps {
  children: React.ReactNode;
  leftOffset?: number;
  rightOffset?: number;
}

const FixedFooter: React.FC<FixedFooterProps> = ({ children, leftOffset = 0, rightOffset = 0 }) => (
  <div className={styles.footer} style={{ left: leftOffset, right: rightOffset }}>
    {children}
  </div>
);

export default FixedFooter;
