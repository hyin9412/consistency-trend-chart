import { Button, Input, PageHeader, Table, Tabs, Tag } from '@tod-m/materials/ve-o';
import { IconPlus, IconStarFill, IconStar } from '@arco-design/web-react/icon';
import React, { useCallback, useMemo, useState } from 'react';
import styles from './index.module.scss';

enum ServiceStatus {
  WaitingCluster = 'waiting_cluster',
  Deploying = 'deploying',
  Running = 'running',
}

const STATUS_CONFIG: Record<ServiceStatus, { type: 'stop' | 'loading' | 'success'; text: string }> = {
  [ServiceStatus.WaitingCluster]: { type: 'stop', text: '待创建集群' },
  [ServiceStatus.Deploying]: { type: 'loading', text: '正在部署' },
  [ServiceStatus.Running]: { type: 'success', text: '正在运行' },
};

interface RayService {
  id: string;
  status: ServiceStatus;
  serviceName: string;
  appId: string;
  shortName: string;
  owner: string;
  updatedAt: string;
  starred: boolean;
}

const MOCK_DATA: RayService[] = [
  {
    id: '1',
    status: ServiceStatus.Deploying,
    serviceName: 'sinf.ecology.rayheader_test',
    appId: '207428076',
    shortName: 'rayheader_test',
    owner: '宋明杰',
    updatedAt: '2026-04-16 15:27:12',
    starred: true,
  },
  {
    id: '2',
    status: ServiceStatus.Deploying,
    serviceName: 'sinf.ecology.rayheader_test',
    appId: '207428076',
    shortName: 'rayheader_test',
    owner: '宋明杰',
    updatedAt: '2026-04-16 15:27:12',
    starred: true,
  },
  {
    id: '3',
    status: ServiceStatus.Deploying,
    serviceName: 'sinf.ecology.rayheader_test',
    appId: '207428076',
    shortName: 'rayheader_test',
    owner: '宋明杰',
    updatedAt: '2026-04-16 15:27:12',
    starred: true,
  },
  {
    id: '4',
    status: ServiceStatus.Deploying,
    serviceName: 'sinf.ecology.rayheader_test',
    appId: '207428076',
    shortName: 'rayheader_test',
    owner: '宋明杰',
    updatedAt: '2026-04-16 15:27:12',
    starred: true,
  },
  {
    id: '5',
    status: ServiceStatus.Running,
    serviceName: 'data.platform.ray_worker',
    appId: '301562890',
    shortName: 'ray_worker',
    owner: '李明',
    updatedAt: '2026-04-15 09:12:34',
    starred: false,
  },
];

const ListDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('subscribed');
  const [searchValue, setSearchValue] = useState('');
  const [data, setData] = useState<RayService[]>(MOCK_DATA);

  const handleSearch = useCallback((value: string) => {
    if (!value.trim()) {
      setData(MOCK_DATA);
      return;
    }
    setData(MOCK_DATA.filter((item) => item.serviceName.includes(value.trim())));
  }, []);

  const handleToggleStar = useCallback((id: string) => {
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item)));
  }, []);

  const columns = useMemo(
    () => [
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (_: unknown, record: RayService) => {
          const config = STATUS_CONFIG[record.status];
          return <Tag.TagPro type={config.type}>{config.text}</Tag.TagPro>;
        },
      },
      {
        title: '服务',
        dataIndex: 'serviceName',
        render: (_: unknown, record: RayService) => (
          <div className={styles.serviceCell}>
            <span className={styles.serviceName}>{record.serviceName}</span>
            <span className={styles.serviceSubtext}>
              {record.appId}&nbsp;&nbsp;{record.shortName}
            </span>
          </div>
        ),
      },
      {
        title: '负责人',
        dataIndex: 'owner',
        width: 160,
      },
      {
        title: '更新时间（UTC+8）',
        dataIndex: 'updatedAt',
        width: 180,
        sorter: (a: RayService, b: RayService) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 80,
        fixed: 'right' as const,
        render: (_: unknown, record: RayService) => (
          <button className={styles.starBtn} type="button" onClick={() => handleToggleStar(record.id)}>
            {record.starred ? (
              <IconStarFill className={styles.starActive} />
            ) : (
              <IconStar className={styles.starInactive} />
            )}
          </button>
        ),
      },
    ],
    [handleToggleStar],
  );

  return (
    <div className={styles.page}>
      <PageHeader.PageHeaderPro title="Ray 服务列表" />
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Tabs type="capsule" activeTab={activeTab} onChange={setActiveTab} className={styles.tabs}>
              <Tabs.TabPane key="subscribed" title="我的订阅" />
              <Tabs.TabPane key="all" title="所有服务" />
            </Tabs>
            <Input
              className={styles.searchInput}
              addBefore="PSM"
              placeholder="请输入 PSM，按回车搜索"
              allowClear
              value={searchValue}
              onChange={setSearchValue}
              onPressEnter={() => handleSearch(searchValue)}
            />
          </div>
          <Button type="primary" icon={<IconPlus />}>
            创建 Ray 服务
          </Button>
        </div>
        <Table columns={columns} data={data} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: true }} />
      </div>
    </div>
  );
};

export default ListDemo;
