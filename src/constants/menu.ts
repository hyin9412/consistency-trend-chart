export enum MenuGroupKey {
  Examples = 'examples',
}

export enum MenuKey {
  Home = 'home',
  TagManagement = 'tag-management',
  PushAbnormalDashboard = 'push-abnormal-dashboard',
  ConsistencySpecialDetail = 'consistency-special-detail',
  ListDemo = 'list-demo',
  DetailDemo = 'detail-demo',
  ConfigDemo = 'config-demo',
  ModalDrawer = 'modal-drawer',
  VChartLineDemo = 'vchart-line-demo',
  CloudEChartLineDemo = 'cloud-echart-line-demo',
}

export interface MenuItem {
  key: string;
  title: string;
  route: string;
  hidden?: boolean;
}

export interface MenuGroup {
  key: string;
  title: string;
  children: MenuItem[];
}

export const menuConfig: MenuGroup[] = [
  {
    key: MenuGroupKey.Examples,
    title: '示例页面',
    children: [
      { key: MenuKey.Home, title: '首页', route: '/home', hidden: true },
      { key: MenuKey.TagManagement, title: '标签管理', route: '/tag-management', hidden: true },
      { key: MenuKey.PushAbnormalDashboard, title: '推量异常看板', route: '/push-abnormal-dashboard', hidden: true },
      {
        key: MenuKey.ConsistencySpecialDetail,
        title: '一致性专项详情',
        route: '/consistency-special-detail',
        hidden: true,
      },
      { key: MenuKey.ListDemo, title: '列表页', route: '/list-demo', hidden: true },
      { key: MenuKey.DetailDemo, title: '详情页', route: '/detail-demo', hidden: true },
      { key: MenuKey.ConfigDemo, title: '配置页', route: '/config-demo', hidden: true },
      { key: MenuKey.ModalDrawer, title: '弹窗与抽屉', route: '/modal-drawer', hidden: true },
      { key: MenuKey.VChartLineDemo, title: 'VChart 折线图', route: '/vchart-line-demo' },
      {
        key: MenuKey.CloudEChartLineDemo,
        title: 'CloudEChart 折线图',
        route: '/cloud-echart-line-demo',
        hidden: true,
      },
    ],
  },
];
