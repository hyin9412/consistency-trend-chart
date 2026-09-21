import { Card, Divider, Message, PageHeader, Select } from '@tod-m/materials/ve-o';
import { VChart } from '@visactor/react-vchart';
import {
  registerDomTooltipHandler,
  registerSankeyChart,
  registerTooltip,
  type ISankeyChartSpec,
} from '@visactor/vchart';
import React, { useMemo, useState } from 'react';
import styles from './index.module.scss';

interface CostNode {
  nodeName: string;
  labelText: string;
  layer: number;
  order: number;
  tooltipTitle: string;
  tooltipItems: Array<{ key: string; value: string }>;
}

interface CostLink {
  source: number;
  target: number;
  value: number;
  type: string;
  tooltipFrom: number;
}

interface CostFlowData {
  total: number;
  nodes: CostNode[];
  links: CostLink[];
}

const BILLING_UNIT_OPTIONS = [
  { label: 'bytegraph.cpu', value: 'bytegraph.cpu' },
  { label: 'bytegraph.mem', value: 'bytegraph.mem' },
  { label: 'bytegraph.storage', value: 'bytegraph.storage' },
];

const REGION_OPTIONS = [{ label: 'AP', value: 'AP' }];
const PERIOD_OPTIONS = [{ label: '2026-08', value: '2026-08' }];
const CURRENCY_OPTIONS = [{ label: '人民币', value: 'cny' }];

const COST_FLOW_DATA: Record<string, CostFlowData> = {
  'bytegraph.cpu': {
    total: 129.4,
    nodes: [
      {
        nodeName: 'bytegraph_计算层资源_物理_成本 $307.46万',
        labelText: 'bytegraph_计算层资源_物理_成本\n$307.46万',
        layer: 0,
        order: 0,
        tooltipTitle: 'bytegraph_计算层资源_物理_成本',
        tooltipItems: [{ key: '金额', value: '$307.46万' }],
      },
      {
        nodeName: 'bytegraph_计算层资源_总成本 $121.34万',
        labelText: 'bytegraph_计算层资源_总成本\n$121.34万',
        layer: 1,
        order: 0,
        tooltipTitle: 'bytegraph_计算层资源_总成本',
        tooltipItems: [
          { key: '金额', value: '$121.34万' },
          { key: 'bytegraph_CPU_MEM_归一化_成本_占比', value: '39.5%' },
          { key: '总成本占比', value: '93.8%' },
        ],
      },
      {
        nodeName: 'bytegraph_其他成本商品_成本（cpu 分摊） $8.06万',
        labelText: 'bytegraph_其他成本商品_成本（cpu 分摊）\n$8.06万',
        layer: 1,
        order: 1,
        tooltipTitle: 'bytegraph_其他成本商品_成本（cpu 分摊）',
        tooltipItems: [
          { key: '金额', value: '$8.06万' },
          { key: 'bytegraph_其他成本_加成_比例', value: '6.6%' },
          { key: '总成本占比', value: '6.2%' },
        ],
      },
      {
        nodeName: 'bytegraph_计算层资源_物理_成本（未分摊，剩余 mem） $186.11万',
        labelText: 'bytegraph_计算层资源_物理_成本（未分摊，剩余 mem）\n$186.11万',
        layer: 1,
        order: 2,
        tooltipTitle: 'bytegraph_计算层资源_物理_成本（未分摊，剩余 mem）',
        tooltipItems: [{ key: '金额', value: '$186.11万' }],
      },
      {
        nodeName: '总成本 $129.40万',
        labelText: '总成本\n$129.40万',
        layer: 2,
        order: 0,
        tooltipTitle: '总成本',
        tooltipItems: [{ key: '金额', value: '$129.40万' }],
      },
    ],
    links: [
      { source: 0, target: 1, value: 121.34, type: '归一化成本', tooltipFrom: 1 },
      { source: 0, target: 3, value: 186.11, type: '未分摊成本', tooltipFrom: 3 },
      { source: 1, target: 4, value: 121.34, type: '归一化成本', tooltipFrom: 1 },
      { source: 2, target: 4, value: 8.06, type: '其他成本', tooltipFrom: 2 },
    ],
  },
  'bytegraph.mem': {
    total: 198.47,
    nodes: [
      {
        nodeName: 'bytegraph_计算层资源_物理_成本 $307.46万',
        labelText: 'bytegraph_计算层资源_物理_成本\n$307.46万',
        layer: 0,
        order: 0,
        tooltipTitle: 'bytegraph_计算层资源_物理_成本',
        tooltipItems: [{ key: '金额', value: '$307.46万' }],
      },
      {
        nodeName: 'bytegraph_计算层资源_总成本 $186.11万',
        labelText: 'bytegraph_计算层资源_总成本\n$186.11万',
        layer: 1,
        order: 0,
        tooltipTitle: 'bytegraph_计算层资源_总成本',
        tooltipItems: [
          { key: '金额', value: '$186.11万' },
          { key: 'bytegraph_CPU_MEM_归一化_成本_占比', value: '60.5%' },
          { key: '总成本占比', value: '93.8%' },
        ],
      },
      {
        nodeName: 'bytegraph_其他成本商品_成本（mem 分摊） $12.36万',
        labelText: 'bytegraph_其他成本商品_成本（mem 分摊）\n$12.36万',
        layer: 1,
        order: 1,
        tooltipTitle: 'bytegraph_其他成本商品_成本（mem 分摊）',
        tooltipItems: [
          { key: '金额', value: '$12.36万' },
          { key: 'bytegraph_其他成本_加成_比例', value: '6.6%' },
          { key: '总成本占比', value: '6.2%' },
        ],
      },
      {
        nodeName: 'bytegraph_计算层资源_物理_成本（未分摊，剩余 cpu） $121.34万',
        labelText: 'bytegraph_计算层资源_物理_成本（未分摊，剩余 cpu）\n$121.34万',
        layer: 1,
        order: 2,
        tooltipTitle: 'bytegraph_计算层资源_物理_成本（未分摊，剩余 cpu）',
        tooltipItems: [{ key: '金额', value: '$121.34万' }],
      },
      {
        nodeName: '总成本 $198.47万',
        labelText: '总成本\n$198.47万',
        layer: 2,
        order: 0,
        tooltipTitle: '总成本',
        tooltipItems: [{ key: '金额', value: '$198.47万' }],
      },
    ],
    links: [
      { source: 0, target: 1, value: 186.11, type: '归一化成本', tooltipFrom: 1 },
      { source: 0, target: 3, value: 121.34, type: '未分摊成本', tooltipFrom: 3 },
      { source: 1, target: 4, value: 186.11, type: '归一化成本', tooltipFrom: 1 },
      { source: 2, target: 4, value: 12.36, type: '其他成本', tooltipFrom: 2 },
    ],
  },
  'bytegraph.storage': {
    total: 253.42,
    nodes: [
      {
        nodeName: 'bytegraph_bg2_成本 $230.71万',
        labelText: 'bytegraph_bg2_成本\n$230.71万',
        layer: 0,
        order: 0,
        tooltipTitle: 'bytegraph_bg2_成本',
        tooltipItems: [{ key: '金额', value: '$230.71万' }],
      },
      {
        nodeName: 'bytegraph_存储资源_总成本 $237.64万',
        labelText: 'bytegraph_存储资源_总成本\n$237.64万',
        layer: 1,
        order: 0,
        tooltipTitle: 'bytegraph_存储资源_总成本',
        tooltipItems: [
          { key: '金额', value: '$237.64万' },
          { key: '总成本占比', value: '93.8%' },
        ],
      },
      {
        nodeName: 'bytegraph_其他成本商品_成本（storage 分摊） $15.78万',
        labelText: 'bytegraph_其他成本商品_成本（storage 分摊）\n$15.78万',
        layer: 1,
        order: 1,
        tooltipTitle: 'bytegraph_其他成本商品_成本（storage 分摊）',
        tooltipItems: [
          { key: '金额', value: '$15.78万' },
          { key: 'bytegraph_其他成本_加成_比例', value: '6.6%' },
          { key: '总成本占比', value: '6.2%' },
        ],
      },
      {
        nodeName: 'bytegraph_bg3_成本 $6.92万',
        labelText: 'bytegraph_bg3_成本\n$6.92万',
        layer: 0,
        order: 1,
        tooltipTitle: 'bytegraph_bg3_成本',
        tooltipItems: [{ key: '金额', value: '$6.92万' }],
      },
      {
        nodeName: '总成本 $253.42万',
        labelText: '总成本\n$253.42万',
        layer: 2,
        order: 0,
        tooltipTitle: '总成本',
        tooltipItems: [{ key: '金额', value: '$253.42万' }],
      },
    ],
    links: [
      { source: 0, target: 1, value: 230.71, type: '存储资源成本', tooltipFrom: 0 },
      { source: 3, target: 1, value: 6.92, type: '存储资源成本', tooltipFrom: 3 },
      { source: 1, target: 4, value: 237.64, type: '存储资源成本', tooltipFrom: 1 },
      { source: 2, target: 4, value: 15.78, type: '其他成本', tooltipFrom: 2 },
    ],
  },
};

registerSankeyChart();
registerTooltip();
registerDomTooltipHandler();

const getTooltipDatum = (datum: any) => datum?.datum ?? datum ?? {};
const removeBytegraphPrefix = (text: string) => text.replace(/bytegraph_/g, '');
const getTooltipItem = (datum: any, index: number, field: 'key' | 'value') => {
  const item = getTooltipDatum(datum).tooltipItems?.[index];
  return item?.[field] ?? '';
};
const getLabelText = (datum: any) => datum?.datum?.labelText ?? datum?.labelText ?? datum?.nodeName ?? '';

function buildSankeySpec(unit: string): ISankeyChartSpec {
  const current = COST_FLOW_DATA[unit] ?? COST_FLOW_DATA['bytegraph.mem'];
  const nodes = current.nodes.map((node) => ({
    ...node,
    nodeName: removeBytegraphPrefix(node.nodeName),
    labelText: removeBytegraphPrefix(node.labelText),
    tooltipTitle: removeBytegraphPrefix(node.tooltipTitle),
    tooltipItems: node.tooltipItems.map((item) => ({
      ...item,
      key: removeBytegraphPrefix(item.key),
    })),
  }));

  return {
    type: 'sankey',
    background: '#ffffff',
    data: [
      {
        id: 'costFlow',
        values: [
          {
            nodes,
            links: current.links.map((link) => ({
              ...link,
              source: nodes[link.source].nodeName,
              target: nodes[link.target].nodeName,
              tooltipTitle: nodes[link.tooltipFrom].tooltipTitle,
              tooltipItems: nodes[link.tooltipFrom].tooltipItems,
            })),
          },
        ],
      },
    ],
    categoryField: 'nodeName',
    valueField: 'value',
    nodeKey: 'nodeName',
    sourceField: 'source',
    targetField: 'target',
    nodeAlign: 'justify',
    setNodeLayer: (datum: any) => datum.layer,
    nodeSortBy: (a: any, b: any) => (a.datum?.order ?? 0) - (b.datum?.order ?? 0),
    nodeGap: 24,
    nodeWidth: 14,
    minNodeHeight: 6,
    crossNodeAlign: 'start',
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    label: {
      visible: true,
      position: 'outside',
      offset: 8,
      style: {
        text: (datum: any) => getLabelText(datum),
        fill: '#1d2129',
        fontFamily: 'Roboto, "PingFang SC", sans-serif',
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 18,
        maxLineWidth: 260,
      },
    },
    node: {
      style: {
        fillOpacity: 0.95,
      },
      state: {
        hover: {
          fillOpacity: 1,
          stroke: '#1d2129',
          lineWidth: 1,
        },
        selected: {
          fillOpacity: 1,
        },
        blur: {
          fillOpacity: 0.16,
        },
      },
    },
    link: {
      style: {
        fillOpacity: 0.35,
      },
      state: {
        hover: {
          fillOpacity: 0.72,
        },
        selected: {
          fillOpacity: 0.72,
        },
        blur: {
          fillOpacity: 0.08,
        },
      },
    },
    emphasis: {
      enable: true,
      effect: 'adjacency',
    },
    tooltip: {
      style: {
        titleLabel: {
          fontFamily: '"PingFang SC", sans-serif',
          fontSize: 12,
          fontWeight: 500,
          fill: 'var(--color-text-1, #1d2129)',
          fontColor: 'var(--color-text-1, #1d2129)',
          lineHeight: 20,
        },
        keyLabel: {
          fontFamily: '"PingFang SC", sans-serif',
          fontSize: 12,
          fontWeight: 400,
          fill: 'var(--color-text-3, #86909c)',
          fontColor: 'var(--color-text-3, #86909c)',
          lineHeight: 20,
        },
        valueLabel: {
          fontFamily: 'Roboto, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          fill: 'var(--color-text-1, #1d2129)',
          fontColor: 'var(--color-text-1, #1d2129)',
          textAlign: 'right',
          lineHeight: 20,
        },
      },
      mark: {
        title: {
          value: (datum: any) => getTooltipDatum(datum).tooltipTitle ?? '成本流向',
        },
        content: [
          {
            key: (datum: any) => getTooltipItem(datum, 0, 'key'),
            value: (datum: any) => getTooltipItem(datum, 0, 'value'),
          },
          {
            key: (datum: any) => getTooltipItem(datum, 1, 'key'),
            value: (datum: any) => getTooltipItem(datum, 1, 'value'),
          },
          {
            key: (datum: any) => getTooltipItem(datum, 2, 'key'),
            value: (datum: any) => getTooltipItem(datum, 2, 'value'),
          },
        ],
        updateContent: (items: any[] = []) =>
          items.filter((item) => {
            const key = `${item?.key ?? ''}`.trim();
            const value = `${item?.value ?? ''}`.trim();
            return key && value;
          }),
      },
    },
  } as ISankeyChartSpec;
}

const CostFlowSankey: React.FC = () => {
  const [billingUnit, setBillingUnit] = useState('bytegraph.mem');
  const [region, setRegion] = useState('AP');
  const [period, setPeriod] = useState('2026-08');
  const [currency, setCurrency] = useState('cny');

  const spec = useMemo(() => buildSankeySpec(billingUnit), [billingUnit]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <PageHeader.PageHeaderPro
          title="成本流向桑基图"
          subTitle={[
            { label: '商品', value: 'Bytegraph' },
            { label: '口径', value: '计费单元 × 大区 × 账期' },
            { label: '图表组件', value: 'VChart Sankey' },
          ]}
        />
        <Divider className={styles.headerDivider} />
      </div>

      <div className={styles.content}>
        <div className={styles.filters}>
          <Select
            addBefore="计费单元"
            value={billingUnit}
            options={BILLING_UNIT_OPTIONS}
            onChange={(value) => setBillingUnit(String(value))}
            triggerProps={{ popupStyle: { width: 285 } }}
          />
          <Select
            addBefore="大区"
            value={region}
            options={REGION_OPTIONS}
            onChange={(value) => setRegion(String(value))}
            triggerProps={{ popupStyle: { width: 160 } }}
          />
          <Select
            addBefore="账期"
            value={period}
            options={PERIOD_OPTIONS}
            onChange={(value) => setPeriod(String(value))}
            triggerProps={{ popupStyle: { width: 160 } }}
          />
          <Select
            addBefore="币种筛选"
            value={currency}
            options={CURRENCY_OPTIONS}
            onChange={(value) => setCurrency(String(value))}
            triggerProps={{ popupStyle: { width: 160 } }}
          />
        </div>

        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.sectionTitle}>成本流向</div>
            </div>
          </div>
          <div className={styles.chartWrap}>
            <VChart
              spec={spec}
              className={styles.sankeyChart}
              style={{ width: '100%', height: 360 }}
              onError={(error) => Message.error(`成本流向桑基图加载失败：${error.message}`)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CostFlowSankey;
