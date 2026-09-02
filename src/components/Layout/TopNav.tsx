import React from 'react';
import { Avatar, Badge, Input } from '@arco-design/web-react';
import { Select } from '@tod-m/materials/ve-o';
import { IconNotification, IconDown } from '@arco-design/iconbox-react-ve-o-design';
import { useLocation, useSearchParams } from 'react-router-dom';
import logoSvg from '../../assets/logo.svg';
import {
  CONTROL_STAGE_OPTIONS,
  ControlStage,
  DEFAULT_CONTROL_STAGE,
  isControlStage,
} from '../../constants/controlStage';
import styles from './topnav.module.scss';

const TopNav: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');
  const currentStage = isControlStage(stageParam) ? stageParam : DEFAULT_CONTROL_STAGE;
  const showStageConfig = location.pathname === '/push-abnormal-dashboard';

  const handleStageChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('stage', value);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className={styles.topNav}>
      {/* 左侧：汉堡菜单 + Logo + 产品名 */}
      <div className={styles.left}>
        <div className={styles.hamburger}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M0 1h18M0 7h18M0 13h18" stroke="#42464E" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className={styles.brand}>
          <img src={logoSvg} width={28} height={28} alt="logo" />
          <div className={styles.separator} />
          <span className={styles.productName}>字节云</span>
          {showStageConfig && (
            <Select
              className={styles.stageSelect}
              size="small"
              addBefore="当前卡控阶段"
              options={CONTROL_STAGE_OPTIONS}
              value={currentStage}
              onChange={(value) => handleStageChange(value as ControlStage)}
            />
          )}
          <span className={styles.envBadge}>Online</span>
        </div>
      </div>

      {/* 右侧：搜索 + 菜单 + 操作 */}
      <div className={styles.right}>
        <Input
          className={styles.searchInput}
          placeholder="⌘ + K 搜索平台/PSM/文档等"
          prefix={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M7.333 12.667A5.333 5.333 0 107.333 2a5.333 5.333 0 000 10.667zM14 14l-2.9-2.9"
                stroke="#80838A"
                strokeWidth="1.33"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <div className={styles.menuItems}>
          <span className={styles.menuItem}>CN<span className={styles.arrow}><IconDown style={{ width: 12, height: 12 }} /></span></span>
          <span className={styles.menuItem}>Skills 市场<span className={styles.arrow}><IconDown style={{ width: 12, height: 12 }} /></span></span>
          <span className={styles.menuItem}>开放平台</span>
          <span className={styles.menuItem}>帮助中心<span className={styles.arrow}><IconDown style={{ width: 12, height: 12 }} /></span></span>
        </div>
        <div className={styles.actions}>
          <Badge count={0} dot>
            <div className={styles.iconBtn}>
              <IconNotification style={{ width: 16, height: 16, color: '#5E6673' }} />
            </div>
          </Badge>
          <Avatar size={28} style={{ backgroundColor: '#1664FF', fontSize: 13, color: '#fff' }}>U</Avatar>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
