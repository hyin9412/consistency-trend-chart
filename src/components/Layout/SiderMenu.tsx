import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XSideMenu, XOverflowText } from '@tod-m/materials';
import {
  IconHouseDashboard,
} from '@arco-design/iconbox-react-ve-o-design';
import { menuConfig, MenuKey, MenuGroupKey } from 'constants/menu';

const groupIconMap: Record<string, React.ReactNode> = {
  [MenuGroupKey.Examples]: <IconHouseDashboard style={{ width: 20, height: 20 }} />,
};

function findMenuKeyByPath(pathname: string): string | undefined {
  for (const group of menuConfig) {
    for (const item of group.children) {
      if (pathname.includes(item.route)) return item.key;
    }
  }
  return undefined;
}

const SiderMenu: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([MenuKey.Home]);
  const [openKeys, setOpenKeys] = useState<string[]>([MenuGroupKey.Examples]);

  useEffect(() => {
    const key = findMenuKeyByPath(pathname);
    if (key) {
      setSelectedKeys([key]);
    }
  }, [pathname]);

  const handleMenuClick = useCallback(
    (key: string) => {
      setSelectedKeys([key]);
      const route = findMenuRoute(key);
      if (route) {
        navigate(route);
      }
    },
    [navigate],
  );

  const menuOptions = menuConfig.map((group) => ({
    key: group.key,
    text: group.title,
    display: (
      <div className="flex items-center">
        {groupIconMap[group.key] && (
          <div className="prefix-icon-container">{groupIconMap[group.key]}</div>
        )}
        <XOverflowText maxWidth={125} style={{ display: 'inline-block' }}>
          {group.title}
        </XOverflowText>
      </div>
    ),
    children: group.children.filter((item) => !item.hidden).map((item) => ({
      key: item.key,
      text: item.title,
      display: (
        <XOverflowText maxWidth={140} style={{ display: 'inline-block' }}>
          {item.title}
        </XOverflowText>
      ),
      children: [],
    })),
  }));

  return (
    <div className="sider-menu-wrapper" id="tod-side-menu">
      <XSideMenu
        showOverview={false}
        menuOptions={menuOptions}
        toggleMouseIn={false}
        menuProps={{
          selectedKeys,
          openKeys,
          onClickSubMenu: (_, keys) => setOpenKeys(keys),
        }}
        style={{ paddingTop: 12, flex: 1, height: 'auto', minHeight: 0, width: 200 }}
        onClickMenu={handleMenuClick}
      />
    </div>
  );
};

function findMenuRoute(key: string): string | undefined {
  for (const group of menuConfig) {
    for (const item of group.children) {
      if (item.key === key) return item.route;
    }
  }
  return undefined;
}

export default SiderMenu;
