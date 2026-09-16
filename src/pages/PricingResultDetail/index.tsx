import { Button, Card, Divider, Message, PageHeader, Radio, Select, Table, Tabs, Tag, Tooltip } from '@tod-m/materials/ve-o';
import { IconDownload, IconQuestionCircle, IconRefresh } from '@arco-design/iconbox-react-ve-o-design';
import type { ILineChartSpec } from '@visactor/vchart';
import { VChart } from '@visactor/react-vchart';
import React, { useMemo, useState } from 'react';
import styles from './index.module.scss';

type MainTabKey = 'targetTrend' | 'formula';
type EntityMode = 'billingUnit' | 'billingItem';
type TimeMode = 'month' | 'day';
type CurrencyMode = 'auto' | 'cny' | 'usd';
type Direction = 'lower' | 'higher' | 'stable';
type FormulaStatus = 'done' | 'warning' | 'attention';

interface TargetMetric {
  key: string;
  label: string;
  direction: Direction;
  value: string;
  target: string;
  achievementRate: number;
  reached: number;
  total: number;
  trend: 'up' | 'down' | 'flat';
}

interface TrendPoint {
  period: string;
  metric: string;
  type: '实际值' | '目标值';
  value: number;
  series: string;
}

interface DetailRow {
  id: string;
  object: string;
  region: string;
  site: string;
  unit: string;
  jan: string;
  feb: string;
  mar: string;
  apr: string;
  may: string;
  jun: string;
}

interface FormulaStep {
  id: string;
  title: string;
  value: string;
  unit: string;
  expression: string;
  status: FormulaStatus;
  desc: string;
}

interface CostNode {
  label: string;
  value: string;
  percent: number;
  color: string;
}

const METRIC_OPTIONS = [
  { label: '成本测算单价', value: 'estimatePrice' },
  { label: '单位成本', value: 'unitCost' },
  { label: '单位资源成本', value: 'resourceCost' },
  { label: '其他成本加成比例', value: 'markupRate' },
  { label: '综合售卖率', value: 'sellRate' },
  { label: '线上单价', value: 'onlinePrice' },
];

const BILLING_UNIT_OPTIONS = [
  { label: 'bytegraph.cpu', value: 'bytegraph.cpu' },
  { label: 'bytegraph.mem', value: 'bytegraph.mem' },
  { label: 'bytegraph.storage', value: 'bytegraph.storage' },
  { label: 'bytegraph3.storage.cu', value: 'bytegraph3.storage.cu' },
];

const BILLING_ITEM_OPTIONS = [
  { label: 'bytegraph.cpu.ap1', value: 'bytegraph.cpu.ap1' },
  { label: 'bytegraph.mem.ap1', value: 'bytegraph.mem.ap1' },
  { label: 'bytegraph.storage.ap1', value: 'bytegraph.storage.ap1' },
  { label: 'bytegraph.storagedisk-1', value: 'bytegraph.storagedisk-1' },
];

const REGION_OPTIONS = [
  { label: 'cn', value: 'cn' },
  { label: 'ap', value: 'ap' },
  { label: 'sg', value: 'sg' },
  { label: 'va', value: 'va' },
];

const SITE_OPTIONS = [
  { label: '中国大陆', value: 'cn-mainland' },
  { label: 'AP1', value: 'ap1' },
  { label: 'SG1', value: 'sg1' },
  { label: 'VA1', value: 'va1' },
];

const PERIOD_OPTIONS = [
  { label: '2026-03', value: '2026-03' },
  { label: '2026-04', value: '2026-04' },
  { label: '2026-05', value: '2026-05' },
  { label: '2026-06', value: '2026-06' },
  { label: '2026-07', value: '2026-07' },
  { label: '2026-08', value: '2026-08' },
];

const TARGET_METRICS: TargetMetric[] = [
  {
    key: 'unitCost',
    label: '单位成本',
    direction: 'lower',
    value: '0.0321',
    target: '0.0340',
    achievementRate: 92,
    reached: 23,
    total: 25,
    trend: 'down',
  },
  {
    key: 'sellRate',
    label: '综合售卖率',
    direction: 'higher',
    value: '98.3%',
    target: '96.0%',
    achievementRate: 88,
    reached: 22,
    total: 25,
    trend: 'up',
  },
  {
    key: 'resourceCost',
    label: '单位资源成本',
    direction: 'stable',
    value: '0.0298',
    target: '0.0300 ±5%',
    achievementRate: 76,
    reached: 19,
    total: 25,
    trend: 'flat',
  },
];

const TREND_DATA: TrendPoint[] = [
  { period: '2026-03', metric: '单位成本', type: '实际值', series: '单位成本 实际值', value: 0.038 },
  { period: '2026-04', metric: '单位成本', type: '实际值', series: '单位成本 实际值', value: 0.036 },
  { period: '2026-05', metric: '单位成本', type: '实际值', series: '单位成本 实际值', value: 0.035 },
  { period: '2026-06', metric: '单位成本', type: '实际值', series: '单位成本 实际值', value: 0.033 },
  { period: '2026-07', metric: '单位成本', type: '实际值', series: '单位成本 实际值', value: 0.032 },
  { period: '2026-08', metric: '单位成本', type: '实际值', series: '单位成本 实际值', value: 0.0321 },
  { period: '2026-03', metric: '单位成本', type: '目标值', series: '单位成本 目标值', value: 0.034 },
  { period: '2026-04', metric: '单位成本', type: '目标值', series: '单位成本 目标值', value: 0.034 },
  { period: '2026-05', metric: '单位成本', type: '目标值', series: '单位成本 目标值', value: 0.034 },
  { period: '2026-06', metric: '单位成本', type: '目标值', series: '单位成本 目标值', value: 0.034 },
  { period: '2026-07', metric: '单位成本', type: '目标值', series: '单位成本 目标值', value: 0.034 },
  { period: '2026-08', metric: '单位成本', type: '目标值', series: '单位成本 目标值', value: 0.034 },
  { period: '2026-03', metric: '综合售卖率', type: '实际值', series: '综合售卖率 实际值', value: 91.2 },
  { period: '2026-04', metric: '综合售卖率', type: '实际值', series: '综合售卖率 实际值', value: 93.7 },
  { period: '2026-05', metric: '综合售卖率', type: '实际值', series: '综合售卖率 实际值', value: 94.5 },
  { period: '2026-06', metric: '综合售卖率', type: '实际值', series: '综合售卖率 实际值', value: 96.1 },
  { period: '2026-07', metric: '综合售卖率', type: '实际值', series: '综合售卖率 实际值', value: 97.4 },
  { period: '2026-08', metric: '综合售卖率', type: '实际值', series: '综合售卖率 实际值', value: 98.3 },
  { period: '2026-03', metric: '综合售卖率', type: '目标值', series: '综合售卖率 目标值', value: 96 },
  { period: '2026-04', metric: '综合售卖率', type: '目标值', series: '综合售卖率 目标值', value: 96 },
  { period: '2026-05', metric: '综合售卖率', type: '目标值', series: '综合售卖率 目标值', value: 96 },
  { period: '2026-06', metric: '综合售卖率', type: '目标值', series: '综合售卖率 目标值', value: 96 },
  { period: '2026-07', metric: '综合售卖率', type: '目标值', series: '综合售卖率 目标值', value: 96 },
  { period: '2026-08', metric: '综合售卖率', type: '目标值', series: '综合售卖率 目标值', value: 96 },
];

const DETAIL_ROWS: DetailRow[] = [
  {
    id: '1',
    object: 'bytegraph.cpu',
    region: 'ap',
    site: 'AP1',
    unit: '美元/核·日',
    jan: '0.0380',
    feb: '0.0360',
    mar: '0.0350',
    apr: '0.0330',
    may: '0.0320',
    jun: '0.0321',
  },
  {
    id: '2',
    object: 'bytegraph.mem',
    region: 'ap',
    site: 'AP1',
    unit: '美元/GB·日',
    jan: '0.0049',
    feb: '0.0047',
    mar: '0.0046',
    apr: '0.0045',
    may: '0.0044',
    jun: '0.0044',
  },
  {
    id: '3',
    object: 'bytegraph.storage',
    region: 'cn',
    site: '中国大陆',
    unit: '人民币/GB·日',
    jan: '0.00021',
    feb: '0.00020',
    mar: '0.00020',
    apr: '0.00019',
    may: '0.00019',
    jun: '0.00018',
  },
];

const COST_NODES: CostNode[] = [
  { label: 'CPU_MEM 成本', value: '$43.03 万', percent: 35.5, color: 'var(--cost-blue)' },
  { label: '计算层资源物理成本', value: '$307.09 万', percent: 39.8, color: 'var(--cost-cyan)' },
  { label: '存储资源总成本', value: '$237.36 万', percent: 93.8, color: 'var(--cost-green)' },
  { label: '其他商品成本', value: '$15.75 万', percent: 6.2, color: 'var(--cost-orange)' },
];

const FORMULA_STEPS: FormulaStep[] = [
  {
    id: 'total',
    title: '计算层资源总成本',
    value: '$121.20 万',
    unit: '月',
    expression: 'CPU_MEM 成本 + 物理成本分摊 + 其他成本分摊',
    status: 'done',
    desc: '作为单位成本和测算单价的主口径输入。',
  },
  {
    id: 'resource',
    title: '单位资源成本',
    value: '$0.032178',
    unit: '核·日',
    expression: '计算层资源总成本 / 物理容量',
    status: 'done',
    desc: 'PRD 要求 cpu / mem 使用物理容量分母。',
  },
  {
    id: 'markup',
    title: '其他成本加成比例',
    value: '6.6%',
    unit: '占比',
    expression: '其他成本商品成本 / (计算层资源物理成本 + 存储资源总成本)',
    status: 'warning',
    desc: '超过 5% 时建议回看其他商品成本构成。',
  },
  {
    id: 'price',
    title: '成本测算单价',
    value: '$0.035948',
    unit: '核·日',
    expression: '单位成本 / 综合售卖率',
    status: 'attention',
    desc: '与线上单价并列展示，便于发现定价倒挂。',
  },
];

const getToken = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

const directionText: Record<Direction, string> = {
  lower: '越低越好',
  higher: '越高越好',
  stable: '目标值 ±5%',
};

const statusTypeMap: Record<FormulaStatus, 'success' | 'warning' | 'error'> = {
  done: 'success',
  warning: 'warning',
  attention: 'error',
};

const buildTrendSpec = (data: TrendPoint[], textColor: string, weakTextColor: string, borderColor: string): ILineChartSpec => ({
  type: 'line',
  autoFit: true,
  padding: 0,
  data: [{ id: 'target-trend', values: data }],
  xField: 'period',
  yField: 'value',
  seriesField: 'series',
  line: {
    style: {
      lineWidth: 2,
    },
  },
  point: {
    visible: true,
    style: { size: 0, fillOpacity: 0, strokeOpacity: 0, lineWidth: 0 },
    state: {
      hover: { visible: true, style: { size: 7, lineWidth: 1, stroke: '#fff', fillOpacity: 1, strokeOpacity: 1 } },
    },
  },
  color: ['#1664FF', '#7AA7FF', '#00A870', '#79D9B3'],
  axes: [
    {
      orient: 'bottom',
      type: 'band',
      label: { visible: true, space: 2, style: { fill: weakTextColor } },
      title: { visible: false },
    },
    {
      orient: 'left',
      type: 'linear',
      label: { visible: true, space: 4, style: { fill: weakTextColor } },
      grid: { visible: true, style: { stroke: borderColor, lineDash: [4, 3], lineWidth: 1 } },
      title: { visible: false },
    },
  ],
  legends: { visible: false },
  tooltip: {
    renderMode: 'html',
    style: {
      titleLabel: { fontFamily: 'Roboto, "PingFang SC", sans-serif', fill: weakTextColor },
      valueLabel: { fontFamily: 'Roboto, "PingFang SC", sans-serif', fill: textColor },
      shape: { size: 10, spacing: 8 },
      spaceRow: 2,
    },
  },
});

const PricingResultDetail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTabKey>('targetTrend');
  const [entityMode, setEntityMode] = useState<EntityMode>('billingUnit');
  const [timeMode, setTimeMode] = useState<TimeMode>('month');
  const [currency, setCurrency] = useState<CurrencyMode>('auto');
  const [periods, setPeriods] = useState(['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']);
  const [selectedMetrics, setSelectedMetrics] = useState(['unitCost', 'sellRate']);
  const [selectedUnits, setSelectedUnits] = useState(['bytegraph.cpu']);
  const [selectedRegions, setSelectedRegions] = useState(['ap']);
  const [selectedSites, setSelectedSites] = useState(['ap1', 'sg1', 'va1']);

  const colorText2 = useMemo(() => getToken('--color-text-2', '#4E5969'), []);
  const colorText3 = useMemo(() => getToken('--color-text-3', '#86909C'), []);
  const colorBorder2 = useMemo(() => getToken('--color-border-2', '#EAEDF1'), []);

  const filteredMetricOptions = useMemo(
    () => (entityMode === 'billingUnit' ? METRIC_OPTIONS.filter((item) => item.value !== 'onlinePrice') : METRIC_OPTIONS),
    [entityMode],
  );

  const trendData = useMemo(() => {
    const metricLabels = selectedMetrics
      .map((value) => METRIC_OPTIONS.find((item) => item.value === value)?.label)
      .filter((item): item is string => Boolean(item));
    return TREND_DATA.filter((item) => metricLabels.includes(item.metric));
  }, [selectedMetrics]);

  const trendSpec = useMemo(
    () => buildTrendSpec(trendData, colorText2, colorText3, colorBorder2),
    [colorBorder2, colorText2, colorText3, trendData],
  );

  const detailColumns = useMemo(
    () => [
      { title: entityMode === 'billingUnit' ? '计费单元' : '计费项', dataIndex: 'object', width: 180, fixed: 'left' as const },
      { title: '大区', dataIndex: 'region', width: 90 },
      { title: '售卖区域', dataIndex: 'site', width: 120 },
      { title: '单位', dataIndex: 'unit', width: 120 },
      { title: '2026-03', dataIndex: 'jan', align: 'right' as const },
      { title: '2026-04', dataIndex: 'feb', align: 'right' as const },
      { title: '2026-05', dataIndex: 'mar', align: 'right' as const },
      { title: '2026-06', dataIndex: 'apr', align: 'right' as const },
      { title: '2026-07', dataIndex: 'may', align: 'right' as const },
      { title: '2026-08', dataIndex: 'jun', align: 'right' as const },
    ],
    [entityMode],
  );

  const handleRefresh = () => {
    Message.success('已按当前筛选条件刷新分析结果');
  };

  const showTargetCards = activeTab === 'targetTrend' && entityMode === 'billingUnit' && timeMode === 'month';

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <PageHeader.PageHeaderPro
          title="数据库定价及目标 Diff 分析"
          subTitle={[
            { label: '商品', value: 'Bytegraph' },
            { label: '版本', value: '2026-08 测算记录' },
            { label: '数据范围', value: timeMode === 'month' ? '近 6 个账期' : '近 31 天' },
          ]}
          extra={[
            <Button key="refresh" type="outline" icon={<IconRefresh />} onClick={handleRefresh}>
              刷新
            </Button>,
            <Button key="export" type="primary" icon={<IconDownload />} onClick={() => Message.info('导出任务已创建')}>
              导出
            </Button>,
          ]}
        />
        <Divider className={styles.headerDivider} />
      </div>

      <div className={styles.content}>
        <Tabs type="card-gutter" activeTab={activeTab} onChange={(key) => setActiveTab(key as MainTabKey)} className={styles.globalTabs}>
          <Tabs.TabPane key="targetTrend" title="目标与趋势分析" />
          <Tabs.TabPane key="formula" title="成本定价公式分析" />
        </Tabs>

        <Card className={styles.filterCard}>
          <div className={styles.filterTopLine}>
            <Radio.Group value={entityMode} type="button" onChange={(value) => setEntityMode(value as EntityMode)}>
              <Radio value="billingUnit">计费单元</Radio>
              <Radio value="billingItem">计费项</Radio>
            </Radio.Group>
            <Radio.Group value={timeMode} type="button" onChange={(value) => setTimeMode(value as TimeMode)}>
              <Radio value="month">月</Radio>
              <Radio value="day">日</Radio>
            </Radio.Group>
          </div>
          <div className={styles.filterGrid}>
            <Select
              addBefore="账期"
              mode={activeTab === 'targetTrend' ? 'multiple' : undefined}
              value={activeTab === 'targetTrend' ? periods : periods[periods.length - 1]}
              options={PERIOD_OPTIONS}
              onChange={(value) => setPeriods(Array.isArray(value) ? value as string[] : [value as string])}
              triggerProps={{ popupStyle: { width: 240 } }}
            />
            <Select
              addBefore={entityMode === 'billingUnit' ? '计费单元' : '计费项'}
              mode={activeTab === 'targetTrend' ? 'multiple' : undefined}
              value={activeTab === 'targetTrend' ? selectedUnits : selectedUnits[0]}
              options={entityMode === 'billingUnit' ? BILLING_UNIT_OPTIONS : BILLING_ITEM_OPTIONS}
              onChange={(value) => setSelectedUnits(Array.isArray(value) ? value as string[] : [value as string])}
              triggerProps={{ popupStyle: { width: 260 } }}
            />
            <Select
              addBefore="大区"
              mode={activeTab === 'targetTrend' ? 'multiple' : undefined}
              value={activeTab === 'targetTrend' ? selectedRegions : selectedRegions[0]}
              options={REGION_OPTIONS}
              onChange={(value) => setSelectedRegions(Array.isArray(value) ? value as string[] : [value as string])}
              triggerProps={{ popupStyle: { width: 220 } }}
            />
            {entityMode === 'billingItem' && (
              <Select
                addBefore="售卖区域"
                mode={activeTab === 'targetTrend' ? 'multiple' : undefined}
                value={activeTab === 'targetTrend' ? selectedSites : selectedSites[0]}
                options={SITE_OPTIONS}
                onChange={(value) => setSelectedSites(Array.isArray(value) ? value as string[] : [value as string])}
                triggerProps={{ popupStyle: { width: 220 } }}
              />
            )}
            <Select
              addBefore="币种"
              value={currency}
              options={[
                { label: '按大区默认', value: 'auto' },
                { label: '人民币', value: 'cny' },
                { label: '美元', value: 'usd' },
              ]}
              onChange={(value) => setCurrency(value as CurrencyMode)}
              triggerProps={{ popupStyle: { width: 220 } }}
            />
          </div>
          {activeTab === 'targetTrend' && (
            <div className={styles.metricSelector}>
              <div className={styles.selectorHeader}>
                <span>指标</span>
                <Button type="text" size="small" onClick={() => setSelectedMetrics(filteredMetricOptions.map((item) => item.value))}>
                  全选
                </Button>
                <Button type="text" size="small" onClick={() => setSelectedMetrics([])}>
                  去选
                </Button>
              </div>
              <Select
                mode="multiple"
                value={selectedMetrics}
                options={filteredMetricOptions}
                onChange={(value) => setSelectedMetrics(value as string[])}
                placeholder="请选择指标"
              />
            </div>
          )}
        </Card>

        {activeTab === 'targetTrend' ? (
          <>
            {showTargetCards && (
              <div className={styles.targetGrid}>
                {TARGET_METRICS.map((item) => (
                  <Card key={item.key} className={styles.targetCard}>
                    <div className={styles.targetHeader}>
                      <div>
                        <div className={styles.cardTitle}>{item.label}</div>
                        <div className={styles.helperText}>{directionText[item.direction]}</div>
                      </div>
                      <Tag.TagPro type={item.achievementRate >= 85 ? 'success' : 'warning'}>{item.achievementRate}% 达标</Tag.TagPro>
                    </div>
                    <div className={styles.targetValues}>
                      <div>
                        <div className={styles.valueLabel}>实际值</div>
                        <div className={styles.metricValue}>{item.value}</div>
                      </div>
                      <div>
                        <div className={styles.valueLabel}>目标值</div>
                        <div className={styles.targetValue}>{item.target}</div>
                      </div>
                    </div>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressValue} style={{ width: `${item.achievementRate}%` }} />
                    </div>
                    <div className={styles.cardFooter}>
                      <span>{item.reached} / {item.total} 个对象已达标</span>
                      <Tooltip content="按所选账期内各对象最后一期数据计算">
                        <IconQuestionCircle className={styles.infoIcon} />
                      </Tooltip>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className={styles.analysisGrid}>
              <Card className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.sectionTitle}>目标与实际趋势</div>
                    <div className={styles.helperText}>按对象和指标拆分曲线，目标值使用虚线表达。</div>
                  </div>
                  <Tag.TagPro type="processing">{periods.length} 个账期</Tag.TagPro>
                </div>
                <VChart
                  spec={trendSpec}
                  className={styles.trendChart}
                  style={{ height: 360 }}
                  onError={(error) => Message.error(`趋势图加载失败：${error.message}`)}
                />
              </Card>
              <Card className={styles.sideCard}>
                <div className={styles.sectionTitle}>未达标对象</div>
                <div className={styles.missList}>
                  {['bytegraph.storage / ap / AP1', 'bytegraph.mem / sg / SG1', 'bytegraph.cpu / va / VA1'].map((item, index) => (
                    <div key={item} className={styles.missItem}>
                      <span className={styles.rank}>{index + 1}</span>
                      <span className={styles.missName}>{item}</span>
                      <Tag.TagPro type={index === 0 ? 'error' : 'warning'}>{index === 0 ? '偏离 8.4%' : '偏离 4.1%'}</Tag.TagPro>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className={styles.tableCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.sectionTitle}>明细数据</div>
                  <div className={styles.helperText}>与当前筛选条件同步，保留各期数值用于回溯。</div>
                </div>
              </div>
              <Table columns={detailColumns} data={DETAIL_ROWS} rowKey="id" pagination={false} scroll={{ x: 1180 }} />
            </Card>
          </>
        ) : (
          <>
            <div className={styles.formulaLayout}>
              <Card className={styles.flowCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.sectionTitle}>成本流向</div>
                    <div className={styles.helperText}>按总成本、资源成本和其他成本拆解构成。</div>
                  </div>
                  <Tag.TagPro type="success">总成本 $253.11 万</Tag.TagPro>
                </div>
                <div className={styles.costFlow}>
                  <div className={styles.totalCostBox}>
                    <div className={styles.valueLabel}>筛选对象总成本</div>
                    <div className={styles.totalCostValue}>$253.11 万</div>
                    <div className={styles.helperText}>bytegraph.storage / ap1 / 2026-08</div>
                  </div>
                  <div className={styles.costBars}>
                    {COST_NODES.map((node) => (
                      <div key={node.label} className={styles.costNode}>
                        <div className={styles.costNodeHeader}>
                          <span>{node.label}</span>
                          <span className={styles.costValue}>{node.value}</span>
                        </div>
                        <div className={styles.costTrack}>
                          <div className={styles.costFill} style={{ width: `${node.percent}%`, background: node.color }} />
                        </div>
                        <div className={styles.helperText}>占比 {node.percent}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className={styles.sideCard}>
                <div className={styles.sectionTitle}>口径提示</div>
                <div className={styles.definitionList}>
                  <div>
                    <span>cpu / mem</span>
                    <p>按计算层资源总成本、物理容量与综合售卖率逐层计算。</p>
                  </div>
                  <div>
                    <span>storage</span>
                    <p>按存储资源总成本和售卖单位成本展示。</p>
                  </div>
                  <div>
                    <span>币种默认</span>
                    <p>国内大区使用人民币，海外大区使用美元。</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className={styles.formulaCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.sectionTitle}>成本定价公式拆解</div>
                  <div className={styles.helperText}>把看板中的关键口径拆成可检查的输入、公式和输出。</div>
                </div>
              </div>
              <div className={styles.formulaGrid}>
                {FORMULA_STEPS.map((step, index) => (
                  <div key={step.id} className={styles.formulaStep}>
                    <div className={styles.stepIndex}>{index + 1}</div>
                    <div className={styles.stepMain}>
                      <div className={styles.stepHeader}>
                        <span>{step.title}</span>
                        <Tag.TagPro type={statusTypeMap[step.status]}>{step.status === 'done' ? '正常' : step.status === 'warning' ? '需关注' : '待校验'}</Tag.TagPro>
                      </div>
                      <div className={styles.stepValue}>{step.value}<span>{step.unit}</span></div>
                      <div className={styles.expression}>{step.expression}</div>
                      <div className={styles.helperText}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default PricingResultDetail;
