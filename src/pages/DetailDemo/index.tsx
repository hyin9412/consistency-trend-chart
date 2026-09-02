import { Button, Link, Modal, PageHeader, Select, Table, Tabs, Tag, Tooltip } from '@tod-m/materials/ve-o';
import { IconQuestionCircle } from '@arco-design/web-react/icon';
import React, { useCallback, useMemo, useState } from 'react';
import styles from './index.module.scss';

enum RuleStatus {
  Active = 'active',
  Effective = 'effective',
}

const RULE_STATUS_CONFIG: Record<RuleStatus, { type: 'processing' | 'success'; text: string }> = {
  [RuleStatus.Active]: { type: 'processing', text: '生效中' },
  [RuleStatus.Effective]: { type: 'success', text: '已生效' },
};

enum ServiceStatus {
  Binding = 'binding',
  Bound = 'bound',
  DomainChanged = 'domain_changed',
}

const SERVICE_STATUS_CONFIG: Record<ServiceStatus, { type: 'processing' | 'success' | 'warning'; text: string }> = {
  [ServiceStatus.Binding]: { type: 'processing', text: '绑定中' },
  [ServiceStatus.Bound]: { type: 'success', text: '已绑定' },
  [ServiceStatus.DomainChanged]: { type: 'warning', text: '业务域变更' },
};

interface RuleItem {
  id: string;
  name: string;
  condition: string;
  conditionDetail: string;
  action: string;
  vregion: string;
  status: RuleStatus;
  createdAt: string;
  effectiveAt: string;
}

interface ServiceItem {
  id: string;
  psm: string;
  domainPath: string;
  platformType: string;
  status: ServiceStatus;
  bindTime: string;
}

const MOCK_RULES: RuleItem[] = [
  {
    id: '1',
    name: '入流量规则1',
    condition: '普通表达式',
    conditionDetail: 'fromIDC-m-gl\nidService-is-sinf.dw.mesh_cp_test.sinf.sinf.migration_sinf',
    action: 'lq 1\ngl 10000',
    vregion: 'China-North',
    status: RuleStatus.Active,
    createdAt: '2025-11-18 11:00:00',
    effectiveAt: '-',
  },
  {
    id: '2',
    name: '入流量规则2',
    condition: '普通表达式',
    conditionDetail: 'fromIDC-m-gl',
    action: 'lq 1\ngl 10000',
    vregion: 'China-North',
    status: RuleStatus.Effective,
    createdAt: '2025-11-18 11:00:00',
    effectiveAt: '2025-11-18 11:00:00',
  },
  {
    id: '3',
    name: '入流量规则3',
    condition: '普通表达式',
    conditionDetail: 'fromIDC-m-gl',
    action: 'lq 1\ngl 10000',
    vregion: 'China-North',
    status: RuleStatus.Effective,
    createdAt: '2025-11-18 11:00:00',
    effectiveAt: '2025-11-18 11:00:00',
  },
  {
    id: '4',
    name: '入流量规则x',
    condition: '普通表达式',
    conditionDetail: 'fromIDC-m-gl',
    action: 'lq 1\ngl 10000',
    vregion: 'China-North',
    status: RuleStatus.Effective,
    createdAt: '2025-11-18 11:00:00',
    effectiveAt: '2025-11-18 11:00:00',
  },
  {
    id: '5',
    name: '入流量规则x',
    condition: '普通表达式',
    conditionDetail: 'fromIDC-m-gl',
    action: 'lq 1\ngl 10000',
    vregion: 'China-North',
    status: RuleStatus.Effective,
    createdAt: '2025-11-18 11:00:00',
    effectiveAt: '2025-11-18 11:00:00',
  },
];

const MOCK_SERVICES: ServiceItem[] = [
  { id: '1', psm: 'mesh.cp_test.svc1', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Binding, bindTime: '-' },
  { id: '2', psm: 'mesh.cp_test.svc2', domainPath: '生活服务|xxx', platformType: 'FaaS', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
  { id: '3', psm: 'mesh.cp_test.x', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
  { id: '4', psm: 'mesh.cp_test.x', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
  { id: '5', psm: 'mesh.cp_test.x', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
  { id: '6', psm: 'mesh.cp_test.x', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
  { id: '7', psm: 'mesh.cp_test.x', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
  { id: '8', psm: 'mesh.cp_test.x', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
  { id: '9', psm: 'mesh.cp_test.x', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
  { id: '10', psm: 'mesh.cp_test.x', domainPath: '基础架构|字节云服务框架', platformType: 'TCE', status: ServiceStatus.Bound, bindTime: '2025-11-18 11:00:00' },
];

const STATUS_OPTIONS = [
  { label: '绑定中', value: ServiceStatus.Binding },
  { label: '已绑定', value: ServiceStatus.Bound },
  { label: '业务域变更', value: ServiceStatus.DomainChanged },
];

const DetailDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [ruleTab, setRuleTab] = useState('inbound');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const handleUnbind = useCallback((psm: string) => {
    Modal.confirm({
      title: '确认解除绑定',
      content: `确定要解除绑定服务 ${psm} 吗？`,
      okButtonProps: { status: 'danger' },
      onOk: () => {
        console.log('解除绑定:', psm);
      },
    });
  }, []);

  const handleBatchDelete = useCallback(() => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 项服务吗？`,
      okButtonProps: { status: 'danger' },
      onOk: () => {
        console.log('批量删除:', selectedRowKeys);
        setSelectedRowKeys([]);
      },
    });
  }, [selectedRowKeys]);

  const ruleColumns = useMemo(
    () => [
      { title: '名称', dataIndex: 'name', width: 140 },
      {
        title: '命中条件',
        dataIndex: 'condition',
        render: (_: unknown, record: RuleItem) => (
          <div className={styles.conditionCell}>
            <div className={styles.conditionType}>{record.condition}</div>
            <div className={styles.conditionDetail}>{record.conditionDetail}</div>
          </div>
        ),
      },
      {
        title: '执行动作',
        dataIndex: 'action',
        render: (_: unknown, record: RuleItem) => (
          <div className={styles.actionCell}>
            {record.action.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        ),
      },
      { title: 'VRegion', dataIndex: 'vregion', width: 120 },
      {
        title: '生效状态',
        dataIndex: 'status',
        width: 100,
        render: (_: unknown, record: RuleItem) => {
          const config = RULE_STATUS_CONFIG[record.status];
          return <Tag.TagPro type={config.type}>{config.text}</Tag.TagPro>;
        },
      },
      { title: '创建时间', dataIndex: 'createdAt', width: 180 },
      { title: '生效时间', dataIndex: 'effectiveAt', width: 180 },
    ],
    [],
  );

  const serviceColumns = useMemo(
    () => [
      { title: 'PSM', dataIndex: 'psm' },
      {
        title: (
          <span>
            业务域全路径
            <Tooltip content="业务域全路径为服务所属的业务域层级关系">
              <IconQuestionCircle style={{ color: 'var(--color-text-3)', cursor: 'pointer', marginLeft: 4 }} />
            </Tooltip>
          </span>
        ),
        dataIndex: 'domainPath',
        render: (value: string, record: ServiceItem) => {
          if (record.status === ServiceStatus.DomainChanged) {
            return <span className={styles.domainChanged}>{value}</span>;
          }
          return <span>{value}</span>;
        },
      },
      { title: '平台类型', dataIndex: 'platformType', width: 100 },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (_: unknown, record: ServiceItem) => {
          const config = SERVICE_STATUS_CONFIG[record.status];
          return <Tag.TagPro type={config.type}>{config.text}</Tag.TagPro>;
        },
      },
      { title: '绑定时间', dataIndex: 'bindTime', width: 180 },
      {
        title: '操作',
        dataIndex: 'action',
        width: 100,
        fixed: 'right' as const,
        render: (_: unknown, record: ServiceItem) => (
          <Link onClick={() => handleUnbind(record.psm)}>解除绑定</Link>
        ),
      },
    ],
    [handleUnbind],
  );

  const renderRuleListModule = () => (
    <div className={styles.module}>
      <div className={styles.ruleToolbar}>
        <span className={styles.moduleTitle}>规则列表</span>
        <Tabs type="capsule" activeTab={ruleTab} onChange={setRuleTab} className={styles.subTabs}>
          <Tabs.TabPane key="inbound" title="入流量视角" />
          <Tabs.TabPane key="outbound" title="出流量视角" />
        </Tabs>
        <Button type="secondary">编辑规则</Button>
      </div>
      <Table columns={ruleColumns} data={MOCK_RULES} rowKey="id" pagination={false} border />
    </div>
  );

  const renderServiceListModule = () => (
    <div className={styles.module}>
      <div className={styles.moduleHeader}>
        <span className={styles.moduleTitle}>服务列表</span>
      </div>
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <Select
            addBefore="PSM"
            placeholder="默认按PSM搜索"
            showSearch
            allowClear
            style={{ width: 280 }}
          />
          <Select
            placeholder="状态 支持多选"
            mode="multiple"
            options={STATUS_OPTIONS}
            allowClear
            style={{ width: 200 }}
          />
        </div>
        <div className={styles.filterRight}>
          <Button type="primary">添加服务</Button>
        </div>
      </div>
      <Table
        columns={serviceColumns}
        data={MOCK_SERVICES}
        rowKey="id"
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
        pagination={{
          total: 62,
          pageSize: 20,
          current: currentPage,
          onChange: setCurrentPage,
          showTotal: true,
          sizeCanChange: true,
          sizeOptions: [20, 50, 100],
        }}
      />
    </div>
  );

  return (
    <div className={styles.page}>
      <PageHeader.PageHeaderPro
        title="idc_traffic_domain_test"
        subTitle={[
          { label: '唯一标识', value: 'idc_traffic_domain_test' },
          {
            label: '关联业务域',
            value: <Tag.TagPro type="processing">基础架构</Tag.TagPro>,
          },
          { label: '生效区域', value: 'China-North  China-East' },
          { label: '管理员', value: '张三、李四、王五' },
          { label: '描述', value: 'XXX项目跨连LF→HL' },
        ]}
        breadcrumb={{
          routes: [
            { breadcrumbName: '全局流量调度', path: '/traffic' },
            { breadcrumbName: '详情', path: '' },
          ],
        }}
      />
      <Tabs type="card-gutter" activeTab={activeTab} onChange={setActiveTab} className={styles.globalTabs}>
        <Tabs.TabPane key="basic" title="基本信息" />
        <Tabs.TabPane key="rules" title="规则详情" />
        <Tabs.TabPane key="tickets" title="工单记录" />
      </Tabs>
      <div className={styles.tabContent}>
        {activeTab === 'rules' && (
          <>
            {renderRuleListModule()}
            {renderServiceListModule()}
          </>
        )}
        {activeTab === 'basic' && (
          <div className={styles.placeholder}>基本信息内容区域</div>
        )}
        {activeTab === 'tickets' && (
          <div className={styles.placeholder}>工单记录内容区域</div>
        )}
      </div>
      {selectedRowKeys.length > 0 && (
        <div className={styles.fixedFooter}>
          <div className={styles.batchBar}>
            <span>已选 {selectedRowKeys.length} 条</span>
            <Button type="text" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            <Button type="primary" status="danger" onClick={handleBatchDelete}>批量删除</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailDemo;
