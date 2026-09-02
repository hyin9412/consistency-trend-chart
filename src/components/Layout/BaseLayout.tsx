import React from 'react';
import { Layout } from '@arco-design/web-react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import SiderMenu from './SiderMenu';
import styles from './index.module.scss';

const { Content } = Layout;

const BaseLayout: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <TopNav />
      <div className={styles.body}>
        <SiderMenu />
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </div>
    </div>
  );
};

export default BaseLayout;
