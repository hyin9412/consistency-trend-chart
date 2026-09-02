import { Button, Card, Divider, Link, Message, Modal, PageHeader, Progress, Table, Tabs, Tag } from '@tod-m/materials/ve-o';
import type { ILineChartSpec } from '@visactor/vchart';
import { VChart } from '@visactor/react-vchart';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';

type PageTabKey = 'overview' | 'psm' | 'notice';
type TrendRangeKey = 'week' | 'twoWeeks' | 'month' | 'all';
type RiskActionKey = 'urge' | 'assign' | 'detail' | 'renotify';
type RiskLevel = 'high' | 'medium' | 'stable';
type NoticeStatus = 'done' | 'partial' | 'failed';

interface TrendSeries {
  name: string;
  color: string;
  values: number[];
}

interface TrendDataset {
  labels: string[];
  series: TrendSeries[];
}

interface TrendDatum {
  date: string;
  component: string;
  rate: number;
}

interface LowConsistencyComponent {
  name: string;
  rate: number;
}

interface RiskOverviewItem {
  label: string;
  count: number;
  actionLabel: string;
  actionKey: RiskActionKey;
}

interface NotificationMetricItem {
  label: string;
  value: string;
  detail: string;
  actionLabel: string;
  actionKey: RiskActionKey;
}

interface HandlerItem {
  name: string;
  pendingCount: number;
  rate: number;
}

interface PsmRow {
  id: string;
  psm: string;
  componentName: string;
  owner: string;
  currentRate: number;
  baselineRate: number;
  targetRate: number;
  riskLevel: RiskLevel;
  pendingTasks: number;
  latestNoticeAt: string;
}

interface NoticeRow {
  id: string;
  batch: string;
  channel: string;
  audience: string;
  sentAt: string;
  reachCount: number;
  readRate: number;
  unreadCount: number;
  failedCount: number;
  status: NoticeStatus;
}

const PAGE_TITLE = '一致性专项详情';

const OVERVIEW_METRIC = {
  current: 86.4,
  baseline: 82,
  target: 90,
};

const TREND_RANGE_OPTIONS: Array<{ key: TrendRangeKey; label: string }> = [
  { key: 'week', label: '最近一周' },
  { key: 'twoWeeks', label: '最近两周' },
  { key: 'month', label: '最近一个月' },
  { key: 'all', label: '项目开始至今' },
];

const TREND_DATA_MAP: Record<TrendRangeKey, TrendDataset> = {
  week: {
    labels: ['08/20', '08/21', '08/22', '08/23', '08/24', '08/25', '08/26'],
    series: [
      { name: '消息中心', color: '#165DFF', values: [78, 80, 79, 82, 84, 85, 86.4] },
      { name: 'PSM 配置', color: '#722ED1', values: [81, 82, 83, 84, 83, 85, 87] },
      { name: '通知引擎', color: '#00B42A', values: [75, 77, 78, 79, 81, 82, 83] },
      { name: '风险规则', color: '#FF7D00', values: [73, 74, 76, 77, 79, 80, 81] },
    ],
  },
  twoWeeks: {
    labels: ['08/13', '08/15', '08/17', '08/19', '08/21', '08/23', '08/25', '08/26'],
    series: [
      { name: '消息中心', color: '#165DFF', values: [74, 76, 77, 78, 80, 82, 85, 86.4] },
      { name: 'PSM 配置', color: '#722ED1', values: [76, 77, 79, 80, 82, 83, 85, 87] },
      { name: '通知引擎', color: '#00B42A', values: [70, 72, 73, 75, 77, 79, 81, 83] },
      { name: '风险规则', color: '#FF7D00', values: [68, 69, 71, 73, 74, 77, 79, 81] },
    ],
  },
  month: {
    labels: ['07/28', '08/01', '08/05', '08/09', '08/13', '08/17', '08/21', '08/26'],
    series: [
      { name: '消息中心', color: '#165DFF', values: [68, 71, 73, 75, 78, 80, 84, 86.4] },
      { name: 'PSM 配置', color: '#722ED1', values: [70, 72, 74, 76, 78, 81, 84, 87] },
      { name: '通知引擎', color: '#00B42A', values: [66, 68, 69, 71, 74, 77, 80, 83] },
      { name: '风险规则', color: '#FF7D00', values: [64, 65, 67, 69, 72, 75, 78, 81] },
    ],
  },
  all: {
    labels: ['项目启动', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', '当前'],
    series: [
      { name: '消息中心', color: '#165DFF', values: [62, 66, 70, 73, 77, 81, 84, 86.4] },
      { name: 'PSM 配置', color: '#722ED1', values: [64, 67, 71, 75, 78, 82, 85, 87] },
      { name: '通知引擎', color: '#00B42A', values: [59, 63, 66, 69, 73, 77, 80, 83] },
      { name: '风险规则', color: '#FF7D00', values: [57, 60, 64, 67, 70, 74, 78, 81] },
    ],
  },
};

const LOW_CONSISTENCY_COMPONENTS: LowConsistencyComponent[] = [
  { name: '风险规则编排', rate: 71.2 },
  { name: '通知失败兜底', rate: 73.8 },
  { name: '批量加急任务', rate: 75.1 },
  { name: 'PSM Owner 映射', rate: 76.6 },
  { name: '回执聚合链路', rate: 78.4 },
];

const RISK_OVERVIEW_ITEMS: RiskOverviewItem[] = [
  { label: '已逾期任务', count: 16, actionLabel: '批量加急', actionKey: 'urge' },
  { label: 'DDL <= 1 天', count: 11, actionLabel: '批量加急', actionKey: 'urge' },
  { label: '通知未读 >= 3 次', count: 8, actionLabel: '批量催办', actionKey: 'urge' },
  { label: '无处理人任务', count: 5, actionLabel: '指定处理人', actionKey: 'assign' },
];

const NOTIFICATION_METRICS: NotificationMetricItem[] = [
  { label: '累计触达对象人数', value: '1,286', detail: '覆盖 37 个组件负责人', actionLabel: '查看详情', actionKey: 'detail' },
  { label: '通知已读率', value: '84.7%', detail: '较上周提升 6.3%', actionLabel: '查看详情', actionKey: 'detail' },
  { label: '通知未读人数', value: '196', detail: '集中在 12 个高风险组件', actionLabel: '查看详情', actionKey: 'detail' },
  { label: '通知失败人数', value: '17', detail: '以飞书账号停用为主', actionLabel: '重新通知', actionKey: 'renotify' },
];

const TOP_HANDLERS: HandlerItem[] = [
  { name: '张帆', pendingCount: 12, rate: 92 },
  { name: '李想', pendingCount: 10, rate: 88 },
  { name: '王宁', pendingCount: 9, rate: 84 },
  { name: '周航', pendingCount: 8, rate: 81 },
  { name: '陈默', pendingCount: 7, rate: 78 },
  { name: '赵洋', pendingCount: 7, rate: 76 },
  { name: '孙岚', pendingCount: 6, rate: 74 },
  { name: '吴越', pendingCount: 5, rate: 71 },
  { name: '林初', pendingCount: 5, rate: 68 },
  { name: '高璟', pendingCount: 4, rate: 65 },
];

const PSM_ROWS: PsmRow[] = [
  {
    id: 'psm-1',
    psm: 'quality.notice.center',
    componentName: '消息中心',
    owner: '张帆',
    currentRate: 86.4,
    baselineRate: 82,
    targetRate: 90,
    riskLevel: 'stable',
    pendingTasks: 2,
    latestNoticeAt: '2026-08-26 11:20:13',
  },
  {
    id: 'psm-2',
    psm: 'quality.psm.mapping',
    componentName: 'PSM Owner 映射',
    owner: '李想',
    currentRate: 76.6,
    baselineRate: 81,
    targetRate: 90,
    riskLevel: 'medium',
    pendingTasks: 4,
    latestNoticeAt: '2026-08-26 10:58:02',
  },
  {
    id: 'psm-3',
    psm: 'quality.risk.rule',
    componentName: '风险规则编排',
    owner: '王宁',
    currentRate: 71.2,
    baselineRate: 80,
    targetRate: 90,
    riskLevel: 'high',
    pendingTasks: 6,
    latestNoticeAt: '2026-08-26 09:45:26',
  },
  {
    id: 'psm-4',
    psm: 'quality.notice.retry',
    componentName: '通知失败兜底',
    owner: '周航',
    currentRate: 73.8,
    baselineRate: 79,
    targetRate: 90,
    riskLevel: 'high',
    pendingTasks: 5,
    latestNoticeAt: '2026-08-26 09:32:15',
  },
  {
    id: 'psm-5',
    psm: 'quality.batch.escalate',
    componentName: '批量加急任务',
    owner: '陈默',
    currentRate: 75.1,
    baselineRate: 80,
    targetRate: 90,
    riskLevel: 'medium',
    pendingTasks: 3,
    latestNoticeAt: '2026-08-25 21:18:40',
  },
  {
    id: 'psm-6',
    psm: 'quality.receipt.aggregate',
    componentName: '回执聚合链路',
    owner: '赵洋',
    currentRate: 78.4,
    baselineRate: 80,
    targetRate: 90,
    riskLevel: 'medium',
    pendingTasks: 2,
    latestNoticeAt: '2026-08-25 18:44:51',
  },
  {
    id: 'psm-7',
    psm: 'quality.owner.binding',
    componentName: '处理人绑定',
    owner: '孙岚',
    currentRate: 84.9,
    baselineRate: 82,
    targetRate: 90,
    riskLevel: 'stable',
    pendingTasks: 1,
    latestNoticeAt: '2026-08-25 16:08:21',
  },
  {
    id: 'psm-8',
    psm: 'quality.notice.analytics',
    componentName: '通知效果分析',
    owner: '吴越',
    currentRate: 82.1,
    baselineRate: 81,
    targetRate: 90,
    riskLevel: 'stable',
    pendingTasks: 2,
    latestNoticeAt: '2026-08-25 15:19:08',
  },
];

const NOTICE_ROWS: NoticeRow[] = [
  {
    id: 'notice-1',
    batch: '第 128 批',
    channel: '飞书群 + 私聊',
    audience: '风险规则编排 / 通知失败兜底',
    sentAt: '2026-08-26 11:05:20',
    reachCount: 42,
    readRate: 81.2,
    unreadCount: 8,
    failedCount: 1,
    status: 'done',
  },
  {
    id: 'notice-2',
    batch: '第 127 批',
    channel: '飞书私聊',
    audience: 'PSM Owner 映射',
    sentAt: '2026-08-26 09:40:11',
    reachCount: 16,
    readRate: 75,
    unreadCount: 4,
    failedCount: 0,
    status: 'done',
  },
  {
    id: 'notice-3',
    batch: '第 126 批',
    channel: '飞书群',
    audience: '批量加急任务 / 回执聚合链路',
    sentAt: '2026-08-25 20:17:33',
    reachCount: 29,
    readRate: 68.9,
    unreadCount: 9,
    failedCount: 2,
    status: 'partial',
  },
  {
    id: 'notice-4',
    batch: '第 125 批',
    channel: '飞书私聊',
    audience: '无处理人任务专项',
    sentAt: '2026-08-25 18:03:41',
    reachCount: 11,
    readRate: 63.6,
    unreadCount: 4,
    failedCount: 0,
    status: 'partial',
  },
  {
    id: 'notice-5',
    batch: '第 124 批',
    channel: '飞书群 + 邮件',
    audience: '通知失败兜底',
    sentAt: '2026-08-25 15:09:17',
    reachCount: 23,
    readRate: 87,
    unreadCount: 3,
    failedCount: 0,
    status: 'done',
  },
  {
    id: 'notice-6',
    batch: '第 123 批',
    channel: '飞书私聊',
    audience: '风险规则编排',
    sentAt: '2026-08-24 21:36:08',
    reachCount: 9,
    readRate: 55.6,
    unreadCount: 3,
    failedCount: 1,
    status: 'failed',
  },
];

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const buildTrendChartData = (dataset: TrendDataset): TrendDatum[] =>
  dataset.series.flatMap((item) =>
    dataset.labels.map((label, index) => ({
      date: label,
      component: item.name,
      rate: item.values[index],
    })),
  );

const buildTrendChartSpec = (dataset: TrendDataset, isLarge = false): ILineChartSpec => ({
  type: 'line',
  autoFit: true,
  data: [
    {
      id: 'trendData',
      values: buildTrendChartData(dataset),
    },
  ],
  xField: 'date',
  yField: 'rate',
  seriesField: 'component',
  point: {
    visible: true,
  },
  legends: {
    visible: true,
    orient: 'top',
  },
  dataZoom: isLarge
    ? [
        {
          visible: true,
          orient: 'bottom',
          start: 0,
          end: 100,
        },
      ]
    : undefined,
  axes: [
    {
      orient: 'bottom',
      type: 'band',
      label: { visible: true },
    },
    {
      orient: 'left',
      type: 'linear',
      label: {
        visible: true,
        formatMethod: (value: string | string[]) => `${Array.isArray(value) ? value[0] : value}%`,
      },
    },
  ],
});

const getRiskTag = (riskLevel: RiskLevel) => {
  if (riskLevel === 'high') {
    return <Tag.TagPro type="error">高风险</Tag.TagPro>;
  }

  if (riskLevel === 'medium') {
    return <Tag.TagPro type="warning">中风险</Tag.TagPro>;
  }

  return <Tag.TagPro type="success">稳定</Tag.TagPro>;
};

const getNoticeStatusTag = (status: NoticeStatus) => {
  if (status === 'done') {
    return <Tag.TagPro type="success">已完成</Tag.TagPro>;
  }

  if (status === 'partial') {
    return <Tag.TagPro type="warning">部分触达</Tag.TagPro>;
  }

  return <Tag.TagPro type="error">触达失败</Tag.TagPro>;
};

const ConsistencySpecialDetail: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PageTabKey>('overview');
  const [trendRange, setTrendRange] = useState<TrendRangeKey>('week');
  const [chartModalVisible, setChartModalVisible] = useState(false);

  const trendDataset = useMemo(() => TREND_DATA_MAP[trendRange], [trendRange]);
  const trendChartSpec = useMemo(() => buildTrendChartSpec(trendDataset), [trendDataset]);
  const trendChartLargeSpec = useMemo(() => buildTrendChartSpec(trendDataset, true), [trendDataset]);

  const psmColumns = useMemo(
    () => [
      { title: 'PSM', dataIndex: 'psm', width: 220 },
      { title: '组件名称', dataIndex: 'componentName', width: 160 },
      { title: '处理人', dataIndex: 'owner', width: 120 },
      {
        title: '当前一致率',
        dataIndex: 'currentRate',
        width: 120,
        render: (value: number) => <span className={styles.monoValue}>{formatPercent(value)}</span>,
      },
      {
        title: '基准一致率',
        dataIndex: 'baselineRate',
        width: 120,
        render: (value: number) => <span className={styles.monoValue}>{formatPercent(value)}</span>,
      },
      {
        title: '目标一致率',
        dataIndex: 'targetRate',
        width: 120,
        render: (value: number) => <span className={styles.monoValue}>{formatPercent(value)}</span>,
      },
      {
        title: '风险等级',
        dataIndex: 'riskLevel',
        width: 100,
        render: (_: RiskLevel, record: PsmRow) => getRiskTag(record.riskLevel),
      },
      {
        title: '待处理任务',
        dataIndex: 'pendingTasks',
        width: 110,
        render: (value: number) => <span className={styles.monoValue}>{value}</span>,
      },
      { title: '最近通知时间', dataIndex: 'latestNoticeAt', width: 180 },
      {
        title: '操作',
        dataIndex: 'action',
        width: 100,
        fixed: 'right' as const,
        render: (_: unknown, record: PsmRow) => (
          <Link onClick={() => Message.info(`查看 ${record.componentName} 的详情为演示交互`)}>
            查看详情
          </Link>
        ),
      },
    ],
    [],
  );

  const noticeColumns = useMemo(
    () => [
      { title: '通知批次', dataIndex: 'batch', width: 100 },
      { title: '通知渠道', dataIndex: 'channel', width: 140 },
      { title: '触达对象', dataIndex: 'audience', width: 220 },
      { title: '通知时间', dataIndex: 'sentAt', width: 180 },
      {
        title: '触达人数',
        dataIndex: 'reachCount',
        width: 100,
        render: (value: number) => <span className={styles.monoValue}>{value}</span>,
      },
      {
        title: '已读率',
        dataIndex: 'readRate',
        width: 100,
        render: (value: number) => <span className={styles.monoValue}>{formatPercent(value)}</span>,
      },
      {
        title: '未读人数',
        dataIndex: 'unreadCount',
        width: 100,
        render: (value: number) => <span className={styles.monoValue}>{value}</span>,
      },
      {
        title: '失败人数',
        dataIndex: 'failedCount',
        width: 100,
        render: (value: number) => <span className={styles.monoValue}>{value}</span>,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (_: NoticeStatus, record: NoticeRow) => getNoticeStatusTag(record.status),
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 140,
        fixed: 'right' as const,
        render: (_: unknown, record: NoticeRow) => (
          <Link onClick={() => Message.info(`查看 ${record.batch} 明细为演示交互`)}>
            查看明细
          </Link>
        ),
      },
    ],
    [],
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/home');
  };

  const handleMockAction = (label: string, actionKey: RiskActionKey) => {
    const actionMap: Record<RiskActionKey, string> = {
      urge: '已触发批量催办流程',
      assign: '已打开指定处理人流程',
      detail: '已打开详情抽屉',
      renotify: '已重新发起通知',
    };

    Message.info(`${label}${actionMap[actionKey]}，当前为页面演示数据`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <PageHeader.PageHeaderPro
          title={PAGE_TITLE}
          onBack={handleBack}
          subTitle={[
            { label: '专项范围', value: '组件级一致性治理' },
            { label: '统计口径', value: '按当前生效 PSM 聚合' },
            { label: '最近更新', value: '2026-08-26 14:30:00' },
          ]}
        />
        <Divider className={styles.headerDivider} />
        <Tabs type="card-gutter" activeTab={activeTab} onChange={(key) => setActiveTab(key as PageTabKey)} className={styles.globalTabs}>
          <Tabs.TabPane key="overview" title="总览" />
          <Tabs.TabPane key="psm" title="PSM 列表" />
          <Tabs.TabPane key="notice" title="通知记录" />
        </Tabs>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <>
            <Card className={styles.heroCard}>
              <div className={styles.heroGrid}>
                <div className={styles.heroPrimary}>
                  <div className={styles.heroLabel}>当前一致率</div>
                  <div className={styles.heroValue}>{formatPercent(OVERVIEW_METRIC.current)}</div>
                  <div className={styles.heroMeta}>
                    较基准提升 {(OVERVIEW_METRIC.current - OVERVIEW_METRIC.baseline).toFixed(1)}%，距离目标还差{' '}
                    {(OVERVIEW_METRIC.target - OVERVIEW_METRIC.current).toFixed(1)}%
                  </div>
                  <Tag.TagPro type="success">整体处于持续改善区间</Tag.TagPro>
                </div>

                <div className={styles.progressPanel}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressTitle}>基准一致率 / 目标一致率参考</span>
                    <span className={styles.progressDesc}>用进度条直观展示当前所处位置</span>
                  </div>
                  <div className={styles.progressStage}>
                    <div
                      className={styles.currentMarker}
                      style={{ left: `calc(${OVERVIEW_METRIC.current}% - 34px)` }}
                    >
                      当前 {formatPercent(OVERVIEW_METRIC.current)}
                    </div>
                    <div
                      className={styles.referenceMarker}
                      style={{ left: `${OVERVIEW_METRIC.current}%`, borderLeftColor: 'rgb(var(--primary-6))' }}
                    />
                    <div className={styles.progressBar}>
                      <Progress
                        percent={OVERVIEW_METRIC.current}
                        showText={false}
                        strokeWidth={12}
                        color="rgb(var(--primary-6))"
                        trailColor="var(--color-fill-2)"
                      />
                    </div>
                    <div
                      className={styles.referenceMarker}
                      style={{ left: `${OVERVIEW_METRIC.baseline}%`, borderLeftColor: 'var(--color-text-3)' }}
                    >
                      <span className={styles.referenceLabel}>基准 {formatPercent(OVERVIEW_METRIC.baseline)}</span>
                    </div>
                    <div
                      className={styles.referenceMarker}
                      style={{ left: `${OVERVIEW_METRIC.target}%`, borderLeftColor: 'rgb(var(--success-6))' }}
                    >
                      <span className={styles.referenceLabel}>目标 {formatPercent(OVERVIEW_METRIC.target)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className={styles.trendRow}>
              <Card className={styles.trendCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.moduleTitle}>一致率趋势</div>
                    <div className={styles.helperText}>展示不同组件的一致率变化趋势，支持切换统计时间范围。</div>
                  </div>
                  <Button type="text" size="small" onClick={() => setChartModalVisible(true)}>
                    放大查看
                  </Button>
                </div>

                <div className={styles.rangeSwitch}>
                  {TREND_RANGE_OPTIONS.map((item) => (
                    <Button
                      key={item.key}
                      size="small"
                      type={trendRange === item.key ? 'primary' : 'default'}
                      onClick={() => setTrendRange(item.key)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>

                <div className={styles.chartStage}>
                  <VChart
                    spec={trendChartSpec}
                    className={styles.trendVChart}
                    style={{ height: 320 }}
                    onError={(error) => Message.error(`一致率趋势图加载失败：${error.message}`)}
                  />
                </div>
              </Card>

              <Card className={styles.sideCard}>
                <div className={styles.cardHeaderCompact}>
                  <div className={styles.moduleTitle}>Top 低一致率组件</div>
                  <div className={styles.helperText}>按当前一致率从低到高展示 Top5。</div>
                </div>

                <div className={styles.rankingList}>
                  {LOW_CONSISTENCY_COMPONENTS.map((item, index) => (
                    <div key={item.name} className={styles.rankingItem}>
                      <div className={styles.rankIndex}>{index + 1}</div>
                      <div className={styles.rankMain}>
                        <div className={styles.rankName}>{item.name}</div>
                        <div className={styles.miniBar}>
                          <div className={styles.miniBarValue} style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                      <div className={styles.rankValue}>{formatPercent(item.rate)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className={styles.summaryGrid}>
              <Card className={styles.summaryCard}>
                <div className={styles.cardHeaderCompact}>
                  <div className={styles.moduleTitle}>风险概览</div>
                  <div className={styles.helperText}>聚焦需要优先推进的风险任务。</div>
                </div>
                <div className={styles.summaryList}>
                  {RISK_OVERVIEW_ITEMS.map((item) => (
                    <div key={item.label} className={styles.summaryItem}>
                      <div className={styles.summaryTextBlock}>
                        <div className={styles.summaryLabel}>{item.label}</div>
                        <div className={styles.summaryHint}>支持从看板直接触发批量动作</div>
                      </div>
                      <div className={styles.summaryValue}>{item.count}</div>
                      <Button type="text" size="small" onClick={() => handleMockAction(item.label, item.actionKey)}>
                        {item.actionLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className={styles.summaryCard}>
                <div className={styles.cardHeaderCompact}>
                  <div className={styles.moduleTitle}>通知效果</div>
                  <div className={styles.helperText}>关注触达、阅读和失败情况。</div>
                </div>
                <div className={styles.summaryList}>
                  {NOTIFICATION_METRICS.map((item) => (
                    <div key={item.label} className={styles.summaryItem}>
                      <div className={styles.summaryTextBlock}>
                        <div className={styles.summaryLabel}>{item.label}</div>
                        <div className={styles.summaryHint}>{item.detail}</div>
                      </div>
                      <div className={styles.summaryValue}>{item.value}</div>
                      <Button type="text" size="small" onClick={() => handleMockAction(item.label, item.actionKey)}>
                        {item.actionLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className={styles.summaryCard}>
                <div className={styles.cardHeaderCompact}>
                  <div className={styles.moduleTitle}>Top 任务处理人</div>
                  <div className={styles.helperText}>展示待处理任务最多的 Top10 处理人。</div>
                </div>
                <div className={styles.handlerList}>
                  {TOP_HANDLERS.map((item, index) => (
                    <div key={item.name} className={styles.handlerItem}>
                      <div className={styles.handlerMain}>
                        <div className={styles.handlerName}>
                          {index + 1}. {item.name}
                        </div>
                        <div className={styles.handlerBar}>
                          <div className={styles.handlerBarValue} style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                      <div className={styles.handlerCount}>{item.pendingCount} 个待处理</div>
                      <Button type="text" size="small" onClick={() => handleMockAction(item.name, 'urge')}>
                        催办
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'psm' && (
          <Card className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.moduleTitle}>PSM 列表</div>
                <div className={styles.helperText}>查看各组件的一致率现状、风险等级和待处理任务。</div>
              </div>
            </div>

            <div className={styles.tableSummary}>
              <div className={styles.summaryPill}>
                <div className={styles.pillLabel}>纳入专项 PSM</div>
                <div className={styles.pillValue}>42</div>
              </div>
              <div className={styles.summaryPill}>
                <div className={styles.pillLabel}>高风险组件</div>
                <div className={styles.pillValue}>7</div>
              </div>
              <div className={styles.summaryPill}>
                <div className={styles.pillLabel}>已达到目标一致率</div>
                <div className={styles.pillValue}>18</div>
              </div>
            </div>

            <Table
              columns={psmColumns}
              data={PSM_ROWS}
              rowKey="id"
              border
              scroll={{ x: 1380 }}
              pagination={{
                total: 42,
                pageSize: 10,
                current: 1,
                showTotal: true,
                sizeCanChange: false,
              }}
            />
          </Card>
        )}

        {activeTab === 'notice' && (
          <Card className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.moduleTitle}>通知记录</div>
                <div className={styles.helperText}>保留通知批次、触达结果和阅读情况，便于回溯通知效果。</div>
              </div>
            </div>

            <div className={styles.tableSummary}>
              <div className={styles.summaryPill}>
                <div className={styles.pillLabel}>累计通知批次</div>
                <div className={styles.pillValue}>128</div>
              </div>
              <div className={styles.summaryPill}>
                <div className={styles.pillLabel}>近 7 天重试次数</div>
                <div className={styles.pillValue}>14</div>
              </div>
              <div className={styles.summaryPill}>
                <div className={styles.pillLabel}>当前失败人数</div>
                <div className={styles.pillValue}>17</div>
              </div>
            </div>

            <Table
              columns={noticeColumns}
              data={NOTICE_ROWS}
              rowKey="id"
              border
              scroll={{ x: 1320 }}
              pagination={{
                total: 128,
                pageSize: 10,
                current: 1,
                showTotal: true,
                sizeCanChange: false,
              }}
            />
          </Card>
        )}
      </div>

      <Modal
        visible={chartModalVisible}
        title="一致率趋势"
        footer={null}
        onCancel={() => setChartModalVisible(false)}
        unmountOnExit
        style={{ width: 1120, maxWidth: 'calc(100vw - 80px)' }}
      >
        <div className={styles.chartModalBody}>
          <VChart spec={trendChartLargeSpec} className={styles.trendVChartLarge} style={{ height: 500 }} />
        </div>
      </Modal>
    </div>
  );
};

export default ConsistencySpecialDetail;
