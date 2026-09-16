import { Button, Card, Divider, Message, PageHeader, Radio, Select, Tabs } from '@tod-m/materials/ve-o';
import { VChart as VChartCore, type ICommonChartSpec, type ILineChartSpec, type IVChart } from '@visactor/vchart';
import { VChart } from '@visactor/react-vchart';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.module.scss';

type SchemeKey = 'facets' | 'focus' | 'dualAxis' | 'dualAxisTable' | 'dualAxisFacets';
type MetricKey = 'estimatePrice' | 'unitCost' | 'resourceCost' | 'markupRate' | 'sellRate';
type LineKind = 'actual' | 'target';
type AxisValueType = 'price' | 'rate';
type DualAxisColorMode = 'metric' | 'combo' | 'comboMetric';
type DualAxisLegendMode = 'metric' | 'combo' | 'comboMetric' | 'comboMetricGroup' | 'comboMetricLine';
type DualAxisTooltipMode = 'list' | 'table';
type FinalViewMode = 'single' | 'multiple';

interface MetricConfig {
  key: MetricKey;
  name: string;
  unit: string;
  direction: string;
  actual: number[];
  target: number[];
}

interface DimensionConfig {
  key: string;
  name: string;
  color: string;
  delta: number;
}

interface TrendDatum {
  period: string;
  metric: MetricKey;
  metricName: string;
  dimension: string;
  lineKind: LineKind;
  series: string;
  value: number;
}

interface AttainmentDatum {
  period: string;
  metric: MetricKey;
  metricName: string;
  value: number;
}

interface DualAxisTrendDatum extends TrendDatum {
  axisValueType: AxisValueType;
  billingUnit: string;
  region: string;
  combo: string;
  color: string;
  valueUnit: string;
}

interface SelectableLegendItem {
  name: string;
  color: string;
}

interface DragPreviewState {
  metricKey: MetricKey;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

const PERIODS = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
const CNY_EXCHANGE_RATE = 7.2;
const DEFAULT_BILLING_UNITS = ['bytegraph.cpu'];
const DEFAULT_REGIONS = ['cn'];
const SELECT_ALL_OPTION_VALUE = '__all__';

const BILLING_UNIT_OPTIONS = [
  { label: 'bytegraph.cpu', value: 'bytegraph.cpu' },
  { label: 'bytegraph.mem', value: 'bytegraph.mem' },
  { label: 'bytegraph.storage', value: 'bytegraph.storage' },
  { label: 'bytegraph3.storage.cu', value: 'bytegraph3.storage.cu' },
];

const REGION_OPTIONS = [
  { label: 'cn', value: 'cn' },
  { label: 'ap', value: 'ap' },
  { label: 'sg', value: 'sg' },
  { label: 'va', value: 'va' },
];

const TIME_WINDOW_OPTIONS = [{ label: '过去 6 个月', value: 'last6Months' }];

const METRICS: MetricConfig[] = [
  {
    key: 'estimatePrice',
    name: '成本测算单价',
    unit: '美元/核·日',
    direction: '越低越好',
    actual: [0.041, 0.039, 0.038, 0.037, 0.036, 0.035],
    target: [0.037, 0.037, 0.037, 0.036, 0.036, 0.036],
  },
  {
    key: 'unitCost',
    name: '单位成本',
    unit: '美元/核·日',
    direction: '越低越好',
    actual: [0.038, 0.036, 0.035, 0.033, 0.032, 0.0321],
    target: [0.034, 0.034, 0.034, 0.034, 0.034, 0.034],
  },
  {
    key: 'resourceCost',
    name: '单位资源成本',
    unit: '美元/核·日',
    direction: '稳定在目标 ±5%',
    actual: [0.0305, 0.0301, 0.0298, 0.0302, 0.0299, 0.0298],
    target: [0.03, 0.03, 0.03, 0.03, 0.03, 0.03],
  },
  {
    key: 'markupRate',
    name: '其他成本加成比例',
    unit: '%',
    direction: '越低越好',
    actual: [7.8, 7.2, 7.1, 6.9, 6.7, 6.6],
    target: [6.5, 6.5, 6.5, 6.5, 6.5, 6.5],
  },
  {
    key: 'sellRate',
    name: '综合售卖率',
    unit: '%',
    direction: '越高越好',
    actual: [91.2, 93.7, 94.5, 96.1, 97.4, 98.3],
    target: [96, 96, 96, 96, 96, 96],
  },
];
const METRIC_OPTIONS = METRICS.map((metric) => ({ label: metric.name, value: metric.key }));
const DEFAULT_METRICS = METRICS.map((metric) => metric.key);
const ORIGIN_CHART_COLOR_PALETTE = [
  '#1664FF',
  '#1AC6FF',
  '#FF8A00',
  '#3CC780',
  '#7442D4',
  '#FFC400',
  '#304D77',
  '#B48DEB',
  '#009488',
  '#FF7DDA',
];

const DIMENSIONS: DimensionConfig[] = [
  { key: 'cpu-cn', name: 'bytegraph.cpu × cn', color: '#1664FF', delta: -0.02 },
  { key: 'cpu-ap', name: 'bytegraph.cpu × ap', color: '#00A870', delta: 0.04 },
  { key: 'mem-cn', name: 'bytegraph.mem × cn', color: '#FF7D00', delta: -0.06 },
  { key: 'storage-ap', name: 'bytegraph.storage × ap', color: '#722ED1', delta: 0.08 },
];

const DRILLDOWN_LEGEND_ID = 'target-trend-drilldown-legend';
const DRILLDOWN_DIMENSION_NAMES = DIMENSIONS.map((item) => item.name);
const TOOLTIP_FONT_FAMILY = 'Roboto, "PingFang SC", sans-serif';
const TOOLTIP_BODY_FONT_SIZE = 12;
const TOOLTIP_BODY_LINE_HEIGHT = 20;
const TOOLTIP_BODY_FONT_WEIGHT = 400;
const FINAL_SCHEME_TOOLTIP_MAX_HEIGHT = 420;
const FINAL_SCHEME_TOOLTIP_MAX_WIDTH = 500;
const LEGEND_PAGER_ARROW_UP = 'M3 7.5L6 4.5L9 7.5';
const LEGEND_PAGER_ARROW_DOWN = 'M3 4.5L6 7.5L9 4.5';

const getToken = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

const formatValue = (value: number, unit: string) => {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (value < 0.01) return value.toFixed(5);
  return value.toFixed(4);
};

const formatCnyValue = (value: number) => {
  if (value < 0.01) return value.toFixed(5);
  return value.toFixed(3);
};

const getMetricAxisValueType = (metric: MetricConfig): AxisValueType => (metric.unit === '%' ? 'rate' : 'price');

const getDynamicAxisRange = (data: DualAxisTrendDatum[], axisValueType: AxisValueType) => {
  const values = data.map((item) => item.value).filter((value) => Number.isFinite(value));
  if (!values.length) return {};

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue;
  const fallbackPadding = axisValueType === 'rate' ? 1 : Math.max(Math.abs(maxValue) * 0.08, 0.01);
  const padding = span > 0 ? span * 0.12 : fallbackPadding;

  return {
    min: Math.max(0, minValue - padding),
    max: maxValue + padding,
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getMetricDisplayUnit = (metric: MetricConfig) => {
  if (metric.unit === '%') return '%';
  return metric.unit.replace('美元', '人民币');
};

const getMetricTitleDisplayUnit = (metric: MetricConfig) => getMetricDisplayUnit(metric).replace('人民币', '元');

const formatPeriodToDateGranularity = (value: string | string[]) => {
  const rawValue = String(Array.isArray(value) ? value[0] : value);
  return /^\d{4}-\d{2}$/.test(rawValue) ? `${rawValue}-01` : rawValue;
};

const getCombinationFactor = (billingUnit: string, region: string, periodIndex: number) => {
  const billingSeed = BILLING_UNIT_OPTIONS.findIndex((item) => item.value === billingUnit);
  const regionSeed = REGION_OPTIONS.findIndex((item) => item.value === region);
  return 1 + (billingSeed - 1) * 0.032 + (regionSeed - 1) * 0.024 + Math.sin((periodIndex + 1) * (billingSeed + 2)) * 0.012;
};

const normalizeSelection = (value: string[] | string) => (Array.isArray(value) ? value : [value]);
const getValidSelectValues = (options: Array<{ value: string }>) => options.map((option) => option.value);
const getAllSelectionState = (selectedValues: string[], options: Array<{ value: string }>) => {
  const validValues = new Set(getValidSelectValues(options));
  const selectedCount = selectedValues.filter((item) => validValues.has(item)).length;

  if (selectedCount === 0) return 'none';
  return selectedCount === validValues.size ? 'all' : 'partial';
};
const buildOptionsWithSelectAll = (options: Array<{ label: string; value: string }>, allState: 'none' | 'partial' | 'all') => [
  {
    label: (
      <span
        className={
          allState === 'partial'
            ? styles.finalSelectAllOptionIndeterminate
            : allState === 'all'
              ? styles.finalSelectAllOptionChecked
              : undefined
        }
      >
        全选
      </span>
    ),
    value: SELECT_ALL_OPTION_VALUE,
  },
  ...options,
];
const normalizeSelectionWithAll = (
  value: string[] | string,
  options: Array<{ value: string }>,
  currentValues: string[],
) => {
  const values = normalizeSelection(value);
  const availableValues = new Set(getValidSelectValues(options));
  const isAllSelected = currentValues.filter((item) => availableValues.has(item)).length === availableValues.size;
  if (values.includes(SELECT_ALL_OPTION_VALUE)) return isAllSelected ? [] : [...availableValues];

  return values.filter((item) => availableValues.has(item));
};
const normalizeMetricSelection = (value: string[] | string): MetricKey[] =>
  normalizeSelection(value).filter((key): key is MetricKey => METRICS.some((metric) => metric.key === key));

const reorderList = <T,>(list: T[], fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;

  const next = [...list];
  const [movedItem] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, movedItem);
  return next;
};

const getClientPointFromVChartEvent = (event: any) => {
  const sourceEvents = [
    event?.event?.detail?.event?.nativeEvent,
    event?.event?.detail?.event,
    event?.value?.event?.nativeEvent,
    event?.value?.event,
    event?.event?.nativeEvent,
    event?.nativeEvent,
    event?.event,
    event,
  ];
  const sourceEvent = sourceEvents.find((item) => typeof item?.clientX === 'number' || typeof item?.viewX === 'number');
  const clientX = sourceEvent?.clientX ?? sourceEvent?.viewX;
  const clientY = sourceEvent?.clientY ?? sourceEvent?.viewY;

  if (typeof clientX !== 'number' || typeof clientY !== 'number') return null;
  return { clientX, clientY };
};

const isLegendFocusIconEvent = (event: any) => {
  const targetNames = [
    event?.event?.detail?.event?.target?.name,
    event?.value?.event?.target?.name,
    event?.event?.target?.name,
    event?.target?.name,
  ];
  return targetNames.includes('legendItemFocus');
};

const getMetricByKey = (key: MetricKey) => METRICS.find((item) => item.key === key) ?? METRICS[0];

const getMetricColor = (metricKey: MetricKey) => {
  const metricIndex = METRICS.findIndex((metric) => metric.key === metricKey);
  return ORIGIN_CHART_COLOR_PALETTE[Math.max(metricIndex, 0) % ORIGIN_CHART_COLOR_PALETTE.length];
};

const getMetricSortIndex = (metricKey?: MetricKey) => {
  const index = METRICS.findIndex((metric) => metric.key === metricKey);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const isSameStringArray = (left: string[] | null, right: string[] | null) =>
  left === right || Boolean(left && right && left.length === right.length && left.every((item, index) => item === right[index]));

const getComboColor = (billingUnit: string, region: string, billingUnits: string[], regions: string[]) => {
  const comboIndex = billingUnits.indexOf(billingUnit) * regions.length + regions.indexOf(region);
  return ORIGIN_CHART_COLOR_PALETTE[Math.max(comboIndex, 0) % ORIGIN_CHART_COLOR_PALETTE.length];
};

const getComboMetricColor = (
  billingUnit: string,
  region: string,
  metricKey: MetricKey,
  billingUnits: string[],
  regions: string[],
  metricKeys: MetricKey[],
) => {
  const comboIndex = billingUnits.indexOf(billingUnit) * regions.length + regions.indexOf(region);
  const metricIndex = metricKeys.indexOf(metricKey);
  const colorIndex = Math.max(comboIndex, 0) * Math.max(metricKeys.length, 1) + Math.max(metricIndex, 0);
  return ORIGIN_CHART_COLOR_PALETTE[colorIndex % ORIGIN_CHART_COLOR_PALETTE.length];
};

const getComboMetricLegendName = (datum: Pick<DualAxisTrendDatum, 'combo' | 'metricName'>) =>
  `${datum.combo}, ${datum.metricName}`;

const getLineKindLabel = (lineKind: LineKind) => (lineKind === 'actual' ? '实际' : '目标');

const getComboMetricGroupLabel = (datum: Pick<DualAxisTrendDatum, 'billingUnit' | 'region' | 'metricName'>) =>
  `[${datum.billingUnit}×${datum.region}] ${datum.metricName}`;

const getComboMetricLineLabel = (
  datum: Pick<DualAxisTrendDatum, 'billingUnit' | 'region' | 'metricName' | 'lineKind'>,
) => `[${datum.billingUnit}×${datum.region}] ${datum.metricName}（${getLineKindLabel(datum.lineKind)}）`;

const getComboLineKindLabel = (datum: Pick<DualAxisTrendDatum, 'billingUnit' | 'region' | 'lineKind'>) =>
  `${datum.billingUnit} × ${datum.region} （${getLineKindLabel(datum.lineKind)}）`;

const getDualAxisLegendName = (datum: DualAxisTrendDatum, legendMode: DualAxisLegendMode) =>
  legendMode === 'metric'
    ? datum.metricName
    : legendMode === 'combo'
      ? datum.combo
      : legendMode === 'comboMetricLine'
        ? getComboMetricLineLabel(datum)
        : legendMode === 'comboMetricGroup'
          ? getComboMetricGroupLabel(datum)
          : getComboMetricLegendName(datum);

const calculateAttainmentRate = (metric: MetricConfig, index: number) => {
  const actual = metric.actual[index];
  const target = metric.target[index];

  if (metric.direction.includes('越高')) {
    return Number(Math.min((actual / target) * 100, 120).toFixed(1));
  }

  if (metric.direction.includes('稳定')) {
    return Number(Math.max(0, 100 - (Math.abs(actual - target) / target) * 100).toFixed(1));
  }

  return Number(Math.min((target / actual) * 100, 120).toFixed(1));
};

const buildAttainmentOverviewData = (): AttainmentDatum[] =>
  METRICS.flatMap((metric) =>
    PERIODS.map((period, index) => ({
      period,
      metric: metric.key,
      metricName: metric.name,
      value: calculateAttainmentRate(metric, index),
    })),
  );

const buildOverviewData = (metric: MetricConfig): TrendDatum[] =>
  PERIODS.flatMap((period, index) => [
    {
      period,
      metric: metric.key,
      metricName: metric.name,
      dimension: '整体',
      lineKind: 'actual' as const,
      series: '实际',
      value: metric.actual[index],
    },
    {
      period,
      metric: metric.key,
      metricName: metric.name,
      dimension: '整体',
      lineKind: 'target' as const,
      series: '目标',
      value: metric.target[index],
    },
  ]);

const buildDrilldownData = (metric: MetricConfig): TrendDatum[] =>
  DIMENSIONS.flatMap((dimension) =>
    PERIODS.flatMap((period, index) => {
      const actualBase = metric.actual[index];
      const targetBase = metric.target[index];
      const factor = 1 + dimension.delta + Math.sin((index + 1) * (dimension.delta + 0.18)) * 0.015;
      return [
        {
          period,
          metric: metric.key,
          metricName: metric.name,
          dimension: dimension.name,
          lineKind: 'actual' as const,
          series: `${dimension.name} 实际`,
          value: Number((actualBase * factor).toFixed(metric.unit === '%' ? 2 : 5)),
        },
        {
          period,
          metric: metric.key,
          metricName: metric.name,
          dimension: dimension.name,
          lineKind: 'target' as const,
          series: `${dimension.name} 目标`,
          value: Number((targetBase * (1 + dimension.delta * 0.35)).toFixed(metric.unit === '%' ? 2 : 5)),
        },
      ];
    }),
  );

const buildDualAxisTrendData = (
  billingUnits: string[],
  regions: string[],
  metricKeys: MetricKey[],
  colorMode: DualAxisColorMode = 'metric',
): DualAxisTrendDatum[] =>
  billingUnits.flatMap((billingUnit) =>
    regions.flatMap((region) => {
      const combo = `${billingUnit} × ${region}`;
      const selectedMetrics = METRICS.filter((metric) => metricKeys.includes(metric.key));

      return selectedMetrics.flatMap((metric) =>
        PERIODS.flatMap((period, index) => {
          const factor = getCombinationFactor(billingUnit, region, index);
          const axisValueType = getMetricAxisValueType(metric);
          const displayUnit = getMetricDisplayUnit(metric);
          const valueMultiplier = axisValueType === 'price' ? CNY_EXCHANGE_RATE : 1;
          const precision = axisValueType === 'price' ? 5 : 2;
          const color =
            colorMode === 'comboMetric'
              ? getComboMetricColor(billingUnit, region, metric.key, billingUnits, regions, metricKeys)
              : colorMode === 'combo'
                ? getComboColor(billingUnit, region, billingUnits, regions)
                : getMetricColor(metric.key);

          return [
            {
              period,
              metric: metric.key,
              metricName: metric.name,
              dimension: combo,
              lineKind: 'actual' as const,
              series: `${combo} ${metric.name} 实际值`,
              value: Number((metric.actual[index] * factor * valueMultiplier).toFixed(precision)),
              axisValueType,
              billingUnit,
              region,
              combo,
              color,
              valueUnit: displayUnit,
            },
            {
              period,
              metric: metric.key,
              metricName: metric.name,
              dimension: combo,
              lineKind: 'target' as const,
              series: `${combo} ${metric.name} 目标值`,
              value: Number((metric.target[index] * (1 + (factor - 1) * 0.42) * valueMultiplier).toFixed(precision)),
              axisValueType,
              billingUnit,
              region,
              combo,
              color,
              valueUnit: displayUnit,
            },
          ];
        }),
      );
    }),
  );

const buildColorRange = (isDrilldown: boolean) => {
  if (!isDrilldown) return ['#1664FF', '#A9AEB8'];
  return DIMENSIONS.flatMap((item) => [item.color, item.color]);
};

const buildDrilldownLegendItems = (items: any[]) =>
  DIMENSIONS.map((dimension) => {
    const sourceItem = items.find((item) => item.label === `${dimension.name} 实际`) ?? items[0] ?? {};
    return {
      ...sourceItem,
      key: dimension.name,
      label: dimension.name,
      originalKey: dimension.name,
      shape: {
        ...(sourceItem.shape ?? {}),
        fill: dimension.color,
        stroke: dimension.color,
        symbolType: 'square',
      },
    };
  });

const buildDrilldownLegendSpec = (colorText2: string, colorText3: string) => ({
  id: DRILLDOWN_LEGEND_ID,
  visible: true,
  orient: 'top',
  position: 'start',
  layout: 'horizontal',
  interactive: true,
  select: {
    trigger: 'click',
  },
  allowAllCanceled: true,
  data: buildDrilldownLegendItems,
  customFilter: (data: TrendDatum[], selectedDimensions: Array<string | number>) =>
    data.filter((datum) => selectedDimensions.includes(datum.dimension)),
  item: {
    spaceCol: 14,
    spaceRow: 6,
    padding: 2,
    shape: {
      space: 6,
      style: {
        size: 8,
      },
    },
    label: {
      space: 6,
      style: {
        fill: colorText2,
        fontFamily: 'Roboto, "PingFang SC", sans-serif',
        fontSize: 12,
        lineHeight: 20,
      },
      state: {
        unSelected: {
          fill: colorText3,
          fontFamily: 'Roboto, "PingFang SC", sans-serif',
          fontSize: 12,
          lineHeight: 20,
        },
      },
    },
  },
  title: { visible: false },
  pager: {
    layout: 'vertical',
    handler: {
      space: 4,
      preShape: LEGEND_PAGER_ARROW_UP,
      nextShape: LEGEND_PAGER_ARROW_DOWN,
      style: {
        size: 12,
        fill: false,
        stroke: colorText2,
        lineWidth: 1.8,
        lineCap: 'round',
        lineJoin: 'round',
      },
      state: {
        hover: {
          stroke: colorText2,
        },
        disable: {
          stroke: colorText2,
          opacity: 0.4,
        },
      },
    },
    textStyle: {
      fill: '#1d2129',
      fontFamily: 'Roboto, "PingFang SC", sans-serif',
      fontSize: 12,
      lineHeight: 20,
    },
  },
  padding: [8, 0, 0, 0],
} as any);

const buildSelectableLegendItems = (legendItems: SelectableLegendItem[]) => (items: any[]) =>
  legendItems.map((legendItem) => {
    const sourceItem = items.find((item) => item.label?.includes(legendItem.name)) ?? items[0] ?? {};
    return {
      ...sourceItem,
      key: legendItem.name,
      label: legendItem.name,
      originalKey: legendItem.name,
      shape: {
        ...(sourceItem.shape ?? {}),
        fill: legendItem.color,
        stroke: legendItem.color,
        symbolType: 'square',
      },
    };
  });

const buildDualAxisLegendSpec = (
  colorText2: string,
  colorText3: string,
  legendItems: SelectableLegendItem[],
  legendMode: DualAxisLegendMode,
  defaultSelected?: string[],
  showFocusIcon = false,
  focusIconColor = colorText3,
) => ({
  visible: true,
  orient: 'bottom',
  position: 'start',
  layout: 'horizontal',
  interactive: true,
  select: {
    trigger: 'click',
  },
  allowAllCanceled: true,
  defaultSelected,
  data: buildSelectableLegendItems(legendItems),
  customFilter: (data: DualAxisTrendDatum[], selectedItems: Array<string | number>) =>
    data.filter((datum) => {
      const legendName = getDualAxisLegendName(datum, legendMode);
      return selectedItems.includes(legendName);
    }),
  item: {
    spaceCol: 18,
    spaceRow: 4,
    padding: 2,
    shape: {
      space: 6,
      style: {
        size: 8,
      },
    },
    focus: showFocusIcon,
    focusIconStyle: {
      size: 12,
      fill: focusIconColor,
      cursor: 'pointer',
    },
    label: {
      space: 6,
      style: {
        fill: colorText2,
        fontFamily: 'Roboto, "PingFang SC", sans-serif',
        fontSize: 12,
        lineHeight: 20,
      },
      state: {
        unSelected: {
          fill: colorText3,
          fontFamily: 'Roboto, "PingFang SC", sans-serif',
          fontSize: 12,
          lineHeight: 20,
        },
      },
    },
  },
  title: { visible: false },
  padding: [8, 0, 0, 0],
} as any);

const buildAttainmentLineSpec = (
  data: AttainmentDatum[],
  colorText2: string,
  colorText3: string,
  colorBorder2: string,
): ILineChartSpec => ({
  type: 'line',
  autoFit: true,
  background: '#fff',
  padding: 0,
  data: [{ id: 'attainment-overview', values: data }],
  xField: 'period',
  yField: 'value',
  seriesField: 'metricName',
  color: METRICS.map((metric) => getMetricColor(metric.key)),
  line: {
    style: {
      lineWidth: 2.25,
      cursor: 'pointer',
    },
  } as any,
  point: {
    visible: true,
    style: { size: 0, fillOpacity: 0, strokeOpacity: 0, lineWidth: 0, cursor: 'pointer' },
    state: {
      hover: {
        visible: true,
        style: { size: 7, symbolType: 'circle', lineWidth: 1, stroke: '#fff', fillOpacity: 1, strokeOpacity: 1 },
      },
      dimension_hover: {
        visible: true,
        style: { size: 7, symbolType: 'circle', lineWidth: 1, stroke: '#fff', fillOpacity: 1, strokeOpacity: 1 },
      },
    },
  },
  axes: [
    {
      orient: 'bottom',
      type: 'band',
      label: { visible: true, space: 2, style: { fill: colorText3 } },
      title: { visible: false },
    },
    {
      orient: 'left',
      type: 'linear',
      min: 0,
      max: 120,
      label: {
        visible: true,
        space: 4,
        style: { fill: colorText3 },
        formatMethod: (value: string | string[]) => `${Number(Array.isArray(value) ? value[0] : value).toFixed(0)}%`,
      },
      grid: { visible: true, style: { stroke: colorBorder2, lineDash: [4, 3], lineWidth: 1 } },
      title: { visible: false },
    },
  ],
  legends: { visible: false },
  tooltip: {
    renderMode: 'html',
    dimension: {
      updateTitle: (title: any) => ({
        ...title,
        value: `点击数据点下钻子节点\n${title?.value ?? ''}`,
        spaceRow: 6,
      }),
    },
    style: {
      titleLabel: {
        fontFamily: 'Roboto, "PingFang SC", sans-serif',
        fontSize: 12,
        fill: colorText3,
        multiLine: true,
        lineHeight: 20,
      } as any,
      keyLabel: { fontFamily: 'Roboto, "PingFang SC", sans-serif', fontSize: 12, fill: colorText2 },
      valueLabel: { fontFamily: 'Roboto, "PingFang SC", sans-serif', fontSize: 12, fill: colorText2 },
      shape: { size: 10, spacing: 8 },
      spaceRow: 2,
    },
  },
  crosshair: {
    trigger: 'hover',
    xField: { visible: true, line: { visible: true, type: 'rect', style: { fill: colorBorder2 } } },
    yField: { visible: false },
  },
});

const buildDualAxisLineSeriesSpec = (dataId: string, axisValueType: AxisValueType) =>
  ({
    id: axisValueType === 'price' ? 'priceSeries' : 'rateSeries',
    type: 'line',
    dataId,
    xField: 'period',
    yField: 'value',
    seriesField: 'series',
    invalidType: 'link',
    line: {
      style: {
        stroke: (datum: DualAxisTrendDatum) => datum.color,
        lineWidth: (datum: DualAxisTrendDatum) => (datum.lineKind === 'target' ? 1.5 : 2.25),
        lineDash: (datum: DualAxisTrendDatum) => (datum.lineKind === 'target' ? [6, 4] : [0, 0]),
      },
    },
    point: {
      visible: true,
      style: {
        size: 0,
        fill: (datum: DualAxisTrendDatum) => datum.color,
        stroke: '#fff',
        fillOpacity: 0,
        strokeOpacity: 0,
        lineWidth: 0,
      },
      state: {
        hover: {
          visible: true,
          style: { size: 7, lineWidth: 1, fillOpacity: 1, strokeOpacity: 1 },
        },
        dimension_hover: {
          visible: true,
          style: { size: 7, lineWidth: 1, fillOpacity: 1, strokeOpacity: 1 },
        },
      },
    },
  } as any);

const applyScrollableTooltipStyle = (tooltipElement: HTMLElement, maxHeight: number) => {
  tooltipElement.dataset.targetTrendScrollableTooltip = 'true';
  tooltipElement.style.maxHeight = `${maxHeight}px`;
  tooltipElement.style.width = 'max-content';
  tooltipElement.style.maxWidth = `${FINAL_SCHEME_TOOLTIP_MAX_WIDTH}px`;
  tooltipElement.style.overflowY = 'auto';
  tooltipElement.style.overflowX = 'hidden';
  tooltipElement.style.pointerEvents = 'auto';
  tooltipElement.style.overscrollBehavior = 'contain';

  tooltipElement.querySelectorAll<HTMLElement>('*').forEach((element) => {
    element.style.maxWidth = `${FINAL_SCHEME_TOOLTIP_MAX_WIDTH}px`;
  });
  tooltipElement.querySelectorAll<HTMLElement>('[class*="value"], [class*="Value"]').forEach((element) => {
    element.style.whiteSpace = 'nowrap';
  });
};

const getTooltipMarkerColor = (datum: DualAxisTrendDatum, fallback?: string) =>
  escapeHtml(datum.color || fallback || '#A9AEB8');

const renderTooltipLineKindMarker = (datum: DualAxisTrendDatum, fallbackColor?: string) => {
  const color = getTooltipMarkerColor(datum, fallbackColor);
  if (datum.lineKind === 'target') {
    return `<span style="display: inline-block; width: 10px; height: 2px; flex: 0 0 auto; border-radius: 99px; background: repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 5px); vertical-align: middle;"></span>`;
  }

  return `<span style="display: inline-block; width: 10px; height: 10px; flex: 0 0 auto; border-radius: 2px; background: ${color}; vertical-align: middle;"></span>`;
};

const applyLineKindTooltipMarkerStyle = (tooltipElement: HTMLElement, actualTooltip: any) => {
  const content = Array.isArray(actualTooltip?.content) ? actualTooltip.content : [];
  const shapeColumn = tooltipElement.querySelector<HTMLElement>('[data-col="shape"]');
  if (!shapeColumn) return;

  const shapeRows = Array.from(shapeColumn.children) as HTMLElement[];
  content.forEach((item: any, index: number) => {
    const datum = item?.datum as DualAxisTrendDatum | undefined;
    const shapeRow = shapeRows[index];
    if (!datum || datum.lineKind !== 'target' || !shapeRow) return;

    shapeRow.innerHTML = renderTooltipLineKindMarker(datum, item.shapeStroke || item.shapeFill);
  });
};

const formatDualAxisTooltipValue = (datum: DualAxisTrendDatum) =>
  datum.axisValueType === 'rate'
    ? `${datum.value.toFixed(1)}%`
    : `${formatCnyValue(datum.value)} ${datum.valueUnit.replace('人民币/', '/')}`;

const renderDualAxisTooltipTable = (tooltipElement: HTMLElement, actualTooltip: any, maxHeight?: number) => {
  if (maxHeight) {
    applyScrollableTooltipStyle(tooltipElement, maxHeight);
  } else {
    tooltipElement.dataset.targetTrendScrollableTooltip = 'true';
    tooltipElement.style.maxHeight = '';
    tooltipElement.style.overflowY = '';
    tooltipElement.style.overflowX = '';
    tooltipElement.style.pointerEvents = 'auto';
    tooltipElement.style.overscrollBehavior = 'contain';
  }

  const content = Array.isArray(actualTooltip?.content) ? actualTooltip.content : [];
  const tableRows: DualAxisTrendDatum[] = content
    .map((item: any) => item?.datum as DualAxisTrendDatum | undefined)
    .filter((datum: DualAxisTrendDatum | undefined): datum is DualAxisTrendDatum => Boolean(datum))
    .sort((a: DualAxisTrendDatum, b: DualAxisTrendDatum) => {
      const metricDiff = getMetricSortIndex(a.metric) - getMetricSortIndex(b.metric);
      if (metricDiff !== 0) return metricDiff;

      const comboDiff = a.combo.localeCompare(b.combo);
      if (comboDiff !== 0) return comboDiff;

      return a.lineKind === b.lineKind ? 0 : a.lineKind === 'actual' ? -1 : 1;
    });

  if (!tableRows.length) return;

  const title = `${actualTooltip?.title?.value ?? actualTooltip?.title?.key ?? ''}`.trim();

  tooltipElement.innerHTML = `
    <div style="width: max-content; max-width: ${FINAL_SCHEME_TOOLTIP_MAX_WIDTH}px; color: var(--color-text-1, #1d2129); font-family: Roboto, 'PingFang SC', sans-serif;">
      ${
        title
          ? `<div style="margin-bottom: 8px; color: var(--color-text-3, #86909c); font-family: Roboto, 'PingFang SC', sans-serif; font-size: 12px; line-height: 20px; font-weight: 400;">${escapeHtml(title)}</div>`
          : ''
      }
      <table style="width: 100%; max-width: ${FINAL_SCHEME_TOOLTIP_MAX_WIDTH}px; border-collapse: collapse; table-layout: fixed; font-size: 12px; line-height: 20px;">
        <thead>
          <tr>
            <th style="width: 360px; padding: 0 12px 6px 0; border-bottom: 1px solid var(--color-border-2, #eaedf1); color: var(--color-text-3, #86909c); font-weight: 400; text-align: left;">Label</th>
            <th style="width: 96px; padding: 0 0 6px 0; border-bottom: 1px solid var(--color-border-2, #eaedf1); color: var(--color-text-3, #86909c); font-weight: 400; text-align: right;">值</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows
            .map(
              (datum) => `
                <tr>
                  <td style="padding: 7px 12px 7px 0; border-bottom: 1px solid var(--color-border-1, #f2f3f5); color: var(--color-text-3, #86909c); font-family: Roboto, 'PingFang SC', sans-serif; font-size: 12px; line-height: 20px; font-weight: 400; white-space: normal; overflow-wrap: anywhere;">
                    <span style="display: inline-flex; align-items: center; gap: 8px; min-width: 0;">
                      ${renderTooltipLineKindMarker(datum)}
                      <span style="min-width: 0; overflow-wrap: anywhere;">${escapeHtml(getComboMetricLineLabel(datum))}</span>
                    </span>
                  </td>
                  <td style="padding: 7px 0 7px 0; border-bottom: 1px solid var(--color-border-1, #f2f3f5); color: var(--color-text-2, #4e5969); font-family: Roboto, 'PingFang SC', sans-serif; font-size: 12px; line-height: 20px; font-weight: 400; text-align: right; white-space: nowrap;">${escapeHtml(formatDualAxisTooltipValue(datum))}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
};

const buildDualAxisLineSpec = (
  data: DualAxisTrendDatum[],
  colorText2: string,
  colorText3: string,
  colorBorder2: string,
  legendMode: DualAxisLegendMode = 'metric',
  showMetricInTooltip = true,
  tooltipMaxHeight?: number,
  tooltipMode: DualAxisTooltipMode = 'table',
  selectedLegendNames?: string[] | null,
  showLegendFocusIcon = false,
  legendFocusIconColor?: string,
  showDateGranularityXAxis = false,
): ICommonChartSpec => {
  const activeLegendNameSet = selectedLegendNames ? new Set(selectedLegendNames) : null;
  const visibleData = activeLegendNameSet
    ? data.filter((item) => activeLegendNameSet.has(getDualAxisLegendName(item, legendMode)))
    : data;
  const priceData = data.filter((item) => item.axisValueType === 'price');
  const rateData = data.filter((item) => item.axisValueType === 'rate');
  const visiblePriceData = visibleData.filter((item) => item.axisValueType === 'price');
  const visibleRateData = visibleData.filter((item) => item.axisValueType === 'rate');
  const hasVisiblePriceData = visiblePriceData.length > 0;
  const hasVisibleRateData = visibleRateData.length > 0;
  const isDualAxis = hasVisiblePriceData && hasVisibleRateData;
  const singleAxisValueType: AxisValueType = hasVisibleRateData && !hasVisiblePriceData ? 'rate' : 'price';
  const priceAxisRange = getDynamicAxisRange(visiblePriceData, 'price');
  const rateAxisRange = getDynamicAxisRange(visibleRateData, 'rate');
  const singleAxisRange = singleAxisValueType === 'rate' ? rateAxisRange : priceAxisRange;
  const legendItems =
    legendMode === 'metric'
      ? METRICS.filter((metric) => data.some((item) => item.metric === metric.key)).map((metric) => ({
          name: metric.name,
          color: getMetricColor(metric.key),
        }))
      : Array.from(
          new Map(
            data.map((item) => [
              legendMode === 'comboMetricLine'
                ? getComboMetricLineLabel(item)
                : legendMode === 'comboMetricGroup'
                  ? getComboMetricGroupLabel(item)
                  : legendMode === 'comboMetric'
                  ? getComboMetricLegendName(item)
                  : item.combo,
              item.color,
            ]),
          ).entries(),
        ).map(([name, color]) => ({
          name,
          color,
        }));
  const axes = [
    {
      orient: 'bottom',
      type: 'band',
      label: {
        visible: true,
        space: 2,
        style: { fill: colorText3 },
        formatMethod: showDateGranularityXAxis ? formatPeriodToDateGranularity : undefined,
      },
      title: { visible: false },
    },
    ...(isDualAxis
      ? [
          {
            orient: 'left',
            id: 'priceAxis',
            type: 'linear',
            seriesId: ['priceSeries'],
            min: priceAxisRange.min,
            max: priceAxisRange.max,
            label: {
              visible: true,
              space: 4,
              style: { fill: colorText3 },
              formatMethod: (value: string | string[]) =>
                formatCnyValue(Number(Array.isArray(value) ? value[0] : value)),
            },
            grid: { visible: true, style: { stroke: colorBorder2, lineDash: [4, 3], lineWidth: 1 } },
            title: { visible: false },
          },
          {
            orient: 'right',
            id: 'rateAxis',
            type: 'linear',
            min: rateAxisRange.min,
            max: rateAxisRange.max,
            seriesId: ['rateSeries'],
            label: {
              visible: true,
              space: 4,
              style: { fill: colorText3 },
              formatMethod: (value: string | string[]) =>
                `${Number(Array.isArray(value) ? value[0] : value).toFixed(0)}%`,
            },
            grid: { visible: false },
            title: { visible: false },
          },
        ]
      : [
          {
            orient: 'left',
            id: singleAxisValueType === 'rate' ? 'rateAxis' : 'priceAxis',
            type: 'linear',
            seriesId: [singleAxisValueType === 'rate' ? 'rateSeries' : 'priceSeries'],
            min: singleAxisRange.min,
            max: singleAxisRange.max,
            label: {
              visible: true,
              space: 4,
              style: { fill: colorText3 },
              formatMethod: (value: string | string[]) => {
                const rawValue = Number(Array.isArray(value) ? value[0] : value);
                return singleAxisValueType === 'rate' ? `${rawValue.toFixed(0)}%` : formatCnyValue(rawValue);
              },
            },
            grid: { visible: true, style: { stroke: colorBorder2, lineDash: [4, 3], lineWidth: 1 } },
            title: { visible: false },
          },
        ]),
  ];

  return {
    type: 'common',
    autoFit: true,
    background: '#fff',
    padding: { top: 8, right: 8, bottom: 0, left: 4 },
    data: [
      { id: 'dualAxisPriceData', values: priceData },
      { id: 'dualAxisRateData', values: rateData },
    ],
    series: [
      buildDualAxisLineSeriesSpec('dualAxisPriceData', 'price'),
      buildDualAxisLineSeriesSpec('dualAxisRateData', 'rate'),
    ],
    axes: axes as any,
    legends: [
      buildDualAxisLegendSpec(
        colorText2,
        colorText3,
        legendItems,
        legendMode,
        selectedLegendNames ?? undefined,
        showLegendFocusIcon,
        legendFocusIconColor,
      ),
    ],
    tooltip: {
      renderMode: 'html',
      enterable: true,
      updateElement: (tooltipElement: HTMLElement, actualTooltip: any) => {
        if (tooltipMode === 'table') {
          renderDualAxisTooltipTable(tooltipElement, actualTooltip, tooltipMaxHeight);
          return;
        }

        if (tooltipMaxHeight) {
          applyScrollableTooltipStyle(tooltipElement, tooltipMaxHeight);
        }
        applyLineKindTooltipMarkerStyle(tooltipElement, actualTooltip);
      },
      dimension: {
        shapeType: 'square',
        shapeSize: 10,
        updateContent: (items: any[] = []) =>
          [...items].sort((a, b) => {
            const datumA = a?.datum as DualAxisTrendDatum | undefined;
            const datumB = b?.datum as DualAxisTrendDatum | undefined;
            if (!datumA || !datumB) return 0;

            const metricDiff = getMetricSortIndex(datumA.metric) - getMetricSortIndex(datumB.metric);
            if (metricDiff !== 0) return metricDiff;

            const comboDiff = datumA.combo.localeCompare(datumB.combo);
            if (comboDiff !== 0) return comboDiff;

            return datumA.lineKind === datumB.lineKind ? 0 : datumA.lineKind === 'actual' ? -1 : 1;
          }).map((item) => {
            const datum = item?.datum as DualAxisTrendDatum | undefined;
            if (!datum) return item;

            return {
              ...item,
              key: showMetricInTooltip
                ? getComboMetricLineLabel(datum)
                : `[${datum.billingUnit}×${datum.region}] ${getLineKindLabel(datum.lineKind)}`,
              value:
                datum.axisValueType === 'rate'
                  ? `${datum.value.toFixed(1)}%`
                  : `${formatCnyValue(datum.value)} ${datum.valueUnit.replace('人民币/', '/')}`,
              shapeStroke: datum.color,
              shapeFill: datum.color,
            };
          }),
      },
      mark: {
        shapeType: 'square',
        shapeSize: 10,
      },
      style: {
        titleLabel: {
          fontFamily: TOOLTIP_FONT_FAMILY,
          fontSize: TOOLTIP_BODY_FONT_SIZE,
          lineHeight: TOOLTIP_BODY_LINE_HEIGHT,
          fontWeight: TOOLTIP_BODY_FONT_WEIGHT,
          fill: colorText3,
          textBaseline: 'middle',
        },
        keyLabel: {
          fontFamily: TOOLTIP_FONT_FAMILY,
          fontSize: TOOLTIP_BODY_FONT_SIZE,
          lineHeight: TOOLTIP_BODY_LINE_HEIGHT,
          fontWeight: TOOLTIP_BODY_FONT_WEIGHT,
          fill: colorText3,
          textBaseline: 'middle',
        },
        valueLabel: {
          fontFamily: TOOLTIP_FONT_FAMILY,
          fontSize: TOOLTIP_BODY_FONT_SIZE,
          lineHeight: TOOLTIP_BODY_LINE_HEIGHT,
          fontWeight: TOOLTIP_BODY_FONT_WEIGHT,
          fill: colorText2,
          textBaseline: 'middle',
        },
        shape: { size: 10, spacing: 8 },
        spaceRow: 2,
      },
    },
    crosshair: {
      trigger: 'hover',
      xField: {
        visible: true,
        line: { visible: true, type: 'line', style: { stroke: '#C9CDD4', lineWidth: 1, lineDash: [0, 0] } },
      },
      yField: { visible: false },
    },
  };
};

const buildSingleAxisMetricLineSpec = (
  metric: MetricConfig,
  data: DualAxisTrendDatum[],
  colorText2: string,
  colorText3: string,
  colorBorder2: string,
  tooltipMaxHeight?: number,
  showLegendFocusIcon = false,
  legendFocusIconColor?: string,
  showDateGranularityXAxis = false,
): ICommonChartSpec => {
  const axisValueType = getMetricAxisValueType(metric);
  const axisRange = getDynamicAxisRange(data, axisValueType);
  const legendItems = Array.from(
    new Map(data.map((item) => [getComboMetricGroupLabel(item), item.color])).entries(),
  ).map(([name, color]) => ({
    name,
    color,
  }));

  return {
    type: 'common',
    autoFit: true,
    background: '#fff',
    padding: { top: 8, right: 8, bottom: 0, left: 4 },
    data: [{ id: 'singleMetricData', values: data }],
    series: [
      {
        id: 'singleMetricSeries',
        type: 'line',
        dataId: 'singleMetricData',
        xField: 'period',
        yField: 'value',
        seriesField: 'series',
        invalidType: 'link',
        line: {
          style: {
            stroke: (datum: any) => datum.color,
            lineWidth: (datum: any) => (datum.lineKind === 'target' ? 1.5 : 2.25),
            lineDash: (datum: any) => (datum.lineKind === 'target' ? [6, 4] : [0, 0]),
          },
        },
        point: {
          visible: true,
          style: {
            size: 0,
            fill: (datum: any) => datum.color,
            stroke: '#fff',
            fillOpacity: 0,
            strokeOpacity: 0,
            lineWidth: 0,
          },
          state: {
            hover: {
              visible: true,
              style: { size: 7, lineWidth: 1, fillOpacity: 1, strokeOpacity: 1 },
            },
            dimension_hover: {
              visible: true,
              style: { size: 7, lineWidth: 1, fillOpacity: 1, strokeOpacity: 1 },
            },
          },
        },
      },
    ],
    axes: [
      {
        orient: 'bottom',
        type: 'band',
        label: {
          visible: true,
          space: 2,
          style: { fill: colorText3 },
          formatMethod: showDateGranularityXAxis ? formatPeriodToDateGranularity : undefined,
        },
        title: { visible: false },
      },
      {
        orient: 'left',
        type: 'linear',
        min: axisRange.min,
        max: axisRange.max,
        label: {
          visible: true,
          space: 4,
          style: { fill: colorText3 },
          formatMethod: (value: string | string[]) => {
            const rawValue = Number(Array.isArray(value) ? value[0] : value);
            return axisValueType === 'rate' ? `${rawValue.toFixed(0)}%` : formatCnyValue(rawValue);
          },
        },
        grid: { visible: true, style: { stroke: colorBorder2, lineDash: [4, 3], lineWidth: 1 } },
        title: { visible: false },
      },
    ],
    legends: [
      buildDualAxisLegendSpec(
        colorText2,
        colorText3,
        legendItems,
        'comboMetricGroup',
        undefined,
        showLegendFocusIcon,
        legendFocusIconColor,
      ),
    ],
    tooltip: {
      renderMode: 'html',
      confine: true,
      enterable: true,
      updateElement: tooltipMaxHeight
        ? (tooltipElement: HTMLElement, actualTooltip: any) => {
            applyScrollableTooltipStyle(tooltipElement, tooltipMaxHeight);
            applyLineKindTooltipMarkerStyle(tooltipElement, actualTooltip);
          }
        : undefined,
      dimension: {
        shapeType: 'square',
        shapeSize: 10,
        updateContent: (items: any[] = []) =>
          items.map((item) => {
            const datum = item?.datum as DualAxisTrendDatum | undefined;
            if (!datum) return item;

            return {
              ...item,
              key: getComboLineKindLabel(datum),
              value:
                axisValueType === 'rate'
                  ? `${datum.value.toFixed(1)}%`
                  : `${formatCnyValue(datum.value)} ${datum.valueUnit.replace('人民币/', '/')}`,
              shapeStroke: datum.color,
              shapeFill: datum.color,
            };
          }),
      },
      mark: {
        shapeType: 'square',
        shapeSize: 10,
      },
      style: {
        titleLabel: {
          fontFamily: TOOLTIP_FONT_FAMILY,
          fontSize: TOOLTIP_BODY_FONT_SIZE,
          lineHeight: TOOLTIP_BODY_LINE_HEIGHT,
          fontWeight: TOOLTIP_BODY_FONT_WEIGHT,
          fill: colorText3,
          textBaseline: 'middle',
        },
        keyLabel: {
          fontFamily: TOOLTIP_FONT_FAMILY,
          fontSize: TOOLTIP_BODY_FONT_SIZE,
          lineHeight: TOOLTIP_BODY_LINE_HEIGHT,
          fontWeight: TOOLTIP_BODY_FONT_WEIGHT,
          fill: colorText3,
          textBaseline: 'middle',
        },
        valueLabel: {
          fontFamily: TOOLTIP_FONT_FAMILY,
          fontSize: TOOLTIP_BODY_FONT_SIZE,
          lineHeight: TOOLTIP_BODY_LINE_HEIGHT,
          fontWeight: TOOLTIP_BODY_FONT_WEIGHT,
          fill: colorText2,
          textBaseline: 'middle',
        },
        shape: { size: 10, spacing: 8 },
        spaceRow: 2,
      },
    },
    crosshair: {
      trigger: 'hover',
      xField: {
        visible: true,
        line: { visible: true, type: 'line', style: { stroke: '#C9CDD4', lineWidth: 1, lineDash: [0, 0] } },
      },
      yField: { visible: false },
    },
  };
};

const buildLineSpec = (
  metric: MetricConfig,
  data: TrendDatum[],
  isDrilldown: boolean,
  colorText2: string,
  colorText3: string,
  colorBorder2: string,
  onTooltipDrill?: () => void,
): ILineChartSpec => ({
  type: 'line',
  autoFit: true,
  background: '#fff',
  padding: 0,
  data: [{ id: metric.key, values: data }],
  xField: 'period',
  yField: 'value',
  seriesField: 'series',
  color: buildColorRange(isDrilldown),
  line: {
    style: {
      lineWidth: (datum: any) => (datum.lineKind === 'target' ? 1.5 : 2.25),
      lineDash: (datum: any) => (datum.lineKind === 'target' ? [6, 4] : [0, 0]),
      cursor: isDrilldown ? 'default' : 'pointer',
    },
  } as any,
  point: {
    visible: true,
    style: { size: 0, fillOpacity: 0, strokeOpacity: 0, lineWidth: 0, cursor: isDrilldown ? 'default' : 'pointer' },
    state: {
      hover: {
        visible: true,
        style: { size: 7, symbolType: 'circle', lineWidth: 1, stroke: '#fff', fillOpacity: 1, strokeOpacity: 1 },
      },
      dimension_hover: {
        visible: true,
        style: { size: 7, symbolType: 'circle', lineWidth: 1, stroke: '#fff', fillOpacity: 1, strokeOpacity: 1 },
      },
    },
  },
  axes: [
    {
      orient: 'bottom',
      type: 'band',
      label: { visible: true, space: 2, style: { fill: colorText3 } },
      title: { visible: false },
    },
    {
      orient: 'left',
      type: 'linear',
      label: {
        visible: true,
        space: 4,
        style: { fill: colorText3 },
        formatMethod: (value: string | string[]) => {
          const rawValue = Number(Array.isArray(value) ? value[0] : value);
          return metric.unit === '%' ? `${rawValue.toFixed(0)}%` : rawValue.toFixed(rawValue < 0.01 ? 4 : 2);
        },
      },
      grid: { visible: true, style: { stroke: colorBorder2, lineDash: [4, 3], lineWidth: 1 } },
      title: { visible: false },
    },
  ],
  legends: isDrilldown ? buildDrilldownLegendSpec(colorText2, colorText3) : { visible: false },
  tooltip: {
    renderMode: 'html',
    enterable: true,
    updateElement: (tooltipElement: HTMLElement) => {
      const existingEntry = tooltipElement.querySelector('[data-target-trend-tooltip-drill]');
      if (existingEntry) {
        existingEntry.remove();
      }

      if (isDrilldown || !onTooltipDrill) return;

      const entry = document.createElement('button');
      entry.type = 'button';
      entry.dataset.targetTrendTooltipDrill = 'true';
      entry.textContent = '下钻[计费单元 × 大区]';
      entry.style.width = '100%';
      entry.style.marginTop = '8px';
      entry.style.padding = '8px 0 0';
      entry.style.border = '0';
      entry.style.borderTop = '1px solid #EAEDF1';
      entry.style.background = 'transparent';
      entry.style.color = '#1664FF';
      entry.style.fontFamily = 'Roboto, "PingFang SC", sans-serif';
      entry.style.fontSize = '12px';
      entry.style.fontWeight = '500';
      entry.style.lineHeight = '20px';
      entry.style.textAlign = 'left';
      entry.style.cursor = 'pointer';
      entry.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onTooltipDrill();
      };
      tooltipElement.appendChild(entry);
    },
    style: {
      titleLabel: { fontFamily: 'Roboto, "PingFang SC", sans-serif', fontSize: 12, fill: colorText3 },
      keyLabel: { fontFamily: 'Roboto, "PingFang SC", sans-serif', fontSize: 12, fill: colorText2 },
      valueLabel: { fontFamily: 'Roboto, "PingFang SC", sans-serif', fontSize: 12, fill: colorText2 },
      shape: { size: 10, spacing: 8 },
      spaceRow: 2,
    },
  },
  crosshair: {
    trigger: 'hover',
    xField: { visible: true, line: { visible: true, type: 'rect', style: { fill: colorBorder2 } } },
    yField: { visible: false },
  },
});

const getLegendItemName = (event: any) => {
  const detail = event?.event?.detail;
  const data = detail?.item ?? detail?.data ?? event?.datum;
  const name = data?.label ?? data?.key ?? data?.id ?? data?.data?.label ?? data?.data?.key ?? data?.datum?.dimension;
  return typeof name === 'string' ? name.replace(/\s+(实际|目标)$/, '') : null;
};

const isDoubleClickLegendEvent = (event: any) => {
  const sourceEvent = event?.event?.nativeEvent ?? event?.event;
  return sourceEvent?.detail === 2 || sourceEvent?.type === 'dblclick';
};

const showOnlyLegendItem = (chart: IVChart | null | undefined, event: any) => {
  const itemName = getLegendItemName(event);
  if (!itemName || !DRILLDOWN_DIMENSION_NAMES.includes(itemName)) return;

  chart?.setLegendSelectedDataById(DRILLDOWN_LEGEND_ID, [itemName]);
};

function LineKindLegend() {
  return (
    <div className={styles.lineKindLegend} aria-label="实际值与目标值图例">
      <div className={styles.legendItem}>
        <span className={styles.legendLine} />
        <span>实际值</span>
      </div>
      <div className={styles.legendItem}>
        <span className={`${styles.legendLine} ${styles.legendLineDashed}`} />
        <span>目标值</span>
      </div>
    </div>
  );
}

function MetricChartCard({
  metric,
  drilled,
  onToggle,
  onChartReady,
  onDimensionSync,
}: {
  metric: MetricConfig;
  drilled: boolean;
  onToggle: () => void;
  onChartReady?: (metricKey: MetricKey, chart: IVChart | null) => void;
  onDimensionSync?: (metricKey: MetricKey, period: string | null) => void;
}) {
  const colorText2 = useMemo(() => getToken('--color-text-2', '#4E5969'), []);
  const colorText3 = useMemo(() => getToken('--color-text-3', '#86909C'), []);
  const colorBorder2 = useMemo(() => getToken('--color-border-2', '#EAEDF1'), []);
  const chartRef = useRef<IVChart | null>(null);
  const data = useMemo(() => (drilled ? buildDrilldownData(metric) : buildOverviewData(metric)), [drilled, metric]);
  const spec = useMemo(
    () => buildLineSpec(metric, data, drilled, colorText2, colorText3, colorBorder2, onToggle),
    [colorBorder2, colorText2, colorText3, data, drilled, metric, onToggle],
  );
  const handleChartClick = (event: any) => {
    if (drilled) return;

    const datum = Array.isArray(event?.datum) ? event.datum[0] : event?.datum;
    if (datum?.metric === metric.key) {
      onToggle();
    }
  };
  const handleDimensionHover = (event: any) => {
    const period = event?.dimensionInfo?.[0]?.value;
    if (event?.action === 'leave' || !period) {
      onDimensionSync?.(metric.key, null);
      return;
    }

    onDimensionSync?.(metric.key, String(period));
  };

  return (
    <div className={`${styles.chartCard} ${drilled ? styles.chartCardDrilled : ''}`}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleBlock}>
          <div className={styles.chartTitleRow}>
            <div className={styles.chartTitle}>
              {metric.name}（{metric.unit}）
            </div>
            {drilled && <LineKindLegend />}
          </div>
        </div>
        <Button size="small" type={drilled ? 'primary' : 'outline'} onClick={onToggle}>
          {drilled ? '返回整体' : '下钻'}
        </Button>
      </div>

      <VChart
        spec={spec}
        className={styles.chart}
        style={{ height: drilled ? 320 : 260 }}
        onReady={(chart) => {
          chartRef.current = chart;
          onChartReady?.(metric.key, chart);
        }}
        onClick={handleChartClick}
        onLegendItemClick={(event) => {
          if (drilled && isDoubleClickLegendEvent(event)) {
            showOnlyLegendItem(chartRef.current, event);
          }
        }}
        onDimensionHover={handleDimensionHover}
        onPointerLeave={() => onDimensionSync?.(metric.key, null)}
        onError={(error) => Message.error(`${metric.name} 趋势图加载失败：${error.message}`)}
      />

      <div className={styles.legend}>
        {!drilled && (
          <>
            <div className={styles.legendItem}>
              <span className={styles.legendLine} style={{ borderTopColor: '#1664FF' }} />
              <span>实际值</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendLine} ${styles.legendLineDashed}`} />
              <span>目标值</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SchemeTwoChart({
  drillMetric,
  onDrill,
  onBack,
}: {
  drillMetric: MetricKey | null;
  onDrill: (metricKey: MetricKey) => void;
  onBack: () => void;
}) {
  const colorText2 = useMemo(() => getToken('--color-text-2', '#4E5969'), []);
  const colorText3 = useMemo(() => getToken('--color-text-3', '#86909C'), []);
  const colorBorder2 = useMemo(() => getToken('--color-border-2', '#EAEDF1'), []);
  const chartRef = useRef<IVChart | null>(null);
  const drilledMetricConfig = drillMetric ? getMetricByKey(drillMetric) : null;
  const overviewData = useMemo(() => buildAttainmentOverviewData(), []);
  const chartData = useMemo(
    () => (drilledMetricConfig ? buildDrilldownData(drilledMetricConfig) : overviewData),
    [drilledMetricConfig, overviewData],
  );
  const spec = useMemo(
    () =>
      drilledMetricConfig
        ? buildLineSpec(drilledMetricConfig, chartData as TrendDatum[], true, colorText2, colorText3, colorBorder2)
        : buildAttainmentLineSpec(chartData as AttainmentDatum[], colorText2, colorText3, colorBorder2),
    [chartData, colorBorder2, colorText2, colorText3, drilledMetricConfig],
  );

  const handleChartClick = (event: any) => {
    if (drillMetric) return;

    const datum = Array.isArray(event?.datum) ? event.datum[0] : event?.datum;
    const metricKey = datum?.metric;
    if (metricKey) {
      onDrill(metricKey as MetricKey);
    }
  };

  return (
    <div className={styles.focusWorkspace}>
      <aside className={styles.focusSidebar}>
        <div className={styles.sidebarTitle}>指标</div>
        <div className={styles.sidebarMetricList}>
          {METRICS.map((metric) => {
            const latestRate = calculateAttainmentRate(metric, metric.actual.length - 1);
            const isActive = drillMetric === metric.key;

            return (
              <button
                key={metric.key}
                type="button"
                className={`${styles.sidebarMetricItem} ${isActive ? styles.sidebarMetricItemActive : ''}`}
                onClick={() => onDrill(metric.key)}
              >
                <span className={styles.sidebarMetricName}>{metric.name}</span>
                <span className={styles.sidebarMetricMeta}>
                  <span>{latestRate.toFixed(1)}%</span>
                  <span>{isActive ? '查看中' : '下钻'}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <Card className={styles.focusPanel}>
        <div className={styles.focusHeader}>
          <div className={styles.chartTitleBlock}>
            <div className={styles.chartTitleRow}>
              <div className={styles.chartTitle}>
                {drilledMetricConfig ? `${drilledMetricConfig.name}：计费单元 × 大区拆分` : '指标达标率趋势'}
              </div>
              {drilledMetricConfig && <LineKindLegend />}
            </div>
          </div>
          <div className={styles.focusHeaderActions}>
            {drilledMetricConfig && (
              <Button size="small" type="outline" onClick={onBack}>
                返回上层
              </Button>
            )}
          </div>
        </div>

        <VChart
          spec={spec}
          className={styles.focusChart}
          style={{ height: drilledMetricConfig ? 360 : 420 }}
          onReady={(chart) => {
            chartRef.current = chart;
          }}
          onClick={handleChartClick}
          onLegendItemClick={(event) => {
            if (drilledMetricConfig && isDoubleClickLegendEvent(event)) {
              showOnlyLegendItem(chartRef.current, event);
            }
          }}
          onError={(error) => Message.error(`方案二趋势图加载失败：${error.message}`)}
        />

        <div className={styles.legend}>
          {!drilledMetricConfig && (
            METRICS.map((metric) => (
              <div key={metric.key} className={styles.legendItem}>
                <span className={styles.legendMarker} style={{ backgroundColor: getMetricColor(metric.key) }} />
                <span>{metric.name}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function SchemeThreeChart({
  tooltipMode = 'list',
  errorLabel = '方案三',
}: {
  tooltipMode?: DualAxisTooltipMode;
  errorLabel?: string;
}) {
  const colorText2 = useMemo(() => getToken('--color-text-2', '#4E5969'), []);
  const colorText3 = useMemo(() => getToken('--color-text-3', '#86909C'), []);
  const colorBorder2 = useMemo(() => getToken('--color-border-2', '#EAEDF1'), []);
  const chartRef = useRef<IVChart | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [lockedTooltipPeriod, setLockedTooltipPeriod] = useState<string | null>(null);
  const [selectedBillingUnits, setSelectedBillingUnits] = useState<string[]>(DEFAULT_BILLING_UNITS);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(DEFAULT_METRICS);
  const [timeWindow, setTimeWindow] = useState('last6Months');

  const selectedPeriods = useMemo(() => (timeWindow === 'last6Months' ? PERIODS : PERIODS), [timeWindow]);
  const chartData = useMemo(
    () =>
      buildDualAxisTrendData(selectedBillingUnits, selectedRegions, selectedMetrics, 'comboMetric').filter((item) =>
        selectedPeriods.includes(item.period),
      ),
    [selectedBillingUnits, selectedMetrics, selectedPeriods, selectedRegions],
  );
  const spec = useMemo(
    () => buildDualAxisLineSpec(chartData, colorText2, colorText3, colorBorder2, 'comboMetric', true, 438, tooltipMode),
    [chartData, colorBorder2, colorText2, colorText3, tooltipMode],
  );
  const clearLockedTooltip = useCallback(() => {
    setLockedTooltipPeriod(null);
    chartRef.current?.hideTooltip();
    chartRef.current?.setDimensionIndex(null as any, { tooltip: false, crosshair: true });
  }, []);
  const handleDimensionClick = useCallback((event: any) => {
    const period = event?.dimensionInfo?.[0]?.value;
    if (!period) return;

    const nextPeriod = String(period);
    setLockedTooltipPeriod(nextPeriod);
    chartRef.current?.setDimensionIndex(nextPeriod, {
      tooltip: true,
      crosshair: true,
      showTooltipOption: { activeType: 'dimension', alwaysShow: true },
    });
  }, []);

  useEffect(() => {
    clearLockedTooltip();
  }, [clearLockedTooltip, selectedBillingUnits, selectedMetrics, selectedRegions, timeWindow]);

  useEffect(() => {
    if (!lockedTooltipPeriod) return;

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isInsidePanel = Boolean(panelRef.current?.contains(target));
      const isInsideTooltip = Boolean(target.closest('[data-target-trend-scrollable-tooltip="true"]'));
      if (isInsidePanel || isInsideTooltip) return;

      clearLockedTooltip();
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [clearLockedTooltip, lockedTooltipPeriod]);

  return (
    <div className={styles.schemeStack}>
      <div className={styles.compactRuleText}>
        默认选中 1 个计费单元、1 个大区，账期为过去 6 个月；一张图双 Y 轴展示价格与百分比指标，实线为实际值，虚线为目标值。
      </div>

      <div className={styles.dualAxisOuterToolbar}>
        <Select
          addBefore="指标"
          className={styles.dualAxisMultiSelect}
          mode="multiple"
          maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
          value={selectedMetrics}
          options={METRIC_OPTIONS}
          onChange={(value) => setSelectedMetrics(normalizeMetricSelection(value as string[] | string))}
          triggerProps={{ popupStyle: { width: 320 } }}
        />
        <Select
          addBefore="计费单元"
          className={styles.dualAxisMultiSelect}
          mode="multiple"
          maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
          value={selectedBillingUnits}
          options={BILLING_UNIT_OPTIONS}
          onChange={(value) => setSelectedBillingUnits(normalizeSelection(value as string[] | string))}
          triggerProps={{ popupStyle: { width: 280 } }}
        />
        <Select
          addBefore="大区"
          className={styles.dualAxisMultiSelect}
          mode="multiple"
          maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
          value={selectedRegions}
          options={REGION_OPTIONS}
          onChange={(value) => setSelectedRegions(normalizeSelection(value as string[] | string))}
          triggerProps={{ popupStyle: { width: 180 } }}
        />
        <Select
          addBefore="时间"
          value={timeWindow}
          options={TIME_WINDOW_OPTIONS}
          onChange={(value) => setTimeWindow(String(value))}
          triggerProps={{ popupStyle: { width: 180 } }}
        />
      </div>

      <Card className={styles.dualAxisPanel}>
        <div className={styles.focusHeader}>
          <div className={styles.chartTitleBlock}>
            <div className={styles.chartTitle}>指标实际/目标趋势图</div>
          </div>
          <LineKindLegend />
        </div>

        <div ref={panelRef}>
          <VChart
            spec={spec}
            className={styles.dualAxisChart}
            style={{ height: 276 }}
            onReady={(chart) => {
              chartRef.current = chart;
            }}
            onDimensionClick={handleDimensionClick}
            onError={(error) => Message.error(`${errorLabel}趋势图加载失败：${error.message}`)}
          />
        </div>
      </Card>
    </div>
  );
}

function SchemeFourChart() {
  const colorText2 = useMemo(() => getToken('--color-text-2', '#4E5969'), []);
  const colorText3 = useMemo(() => getToken('--color-text-3', '#86909C'), []);
  const colorBorder2 = useMemo(() => getToken('--color-border-2', '#EAEDF1'), []);
  const colorFunctionalIcon1 = useMemo(() => getToken('--color-functional-icon-1', '#6B7785'), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overviewChartRef = useRef<IVChart | null>(null);
  const splitChartRefs = useRef<Partial<Record<MetricKey, IVChart>>>({});
  const [selectedBillingUnits, setSelectedBillingUnits] = useState<string[]>(DEFAULT_BILLING_UNITS);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(DEFAULT_METRICS);
  const [timeWindow, setTimeWindow] = useState('last6Months');
  const [viewMode, setViewMode] = useState<FinalViewMode>('single');
  const [selectedOverviewLegendNames, setSelectedOverviewLegendNames] = useState<string[] | null>(null);
  const [metricOrder, setMetricOrder] = useState<MetricKey[]>(DEFAULT_METRICS);
  const [draggingMetricKey, setDraggingMetricKey] = useState<MetricKey | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const [lockedTooltip, setLockedTooltip] = useState<{ metricKey: MetricKey; period: string } | null>(null);
  const [legendFocusTooltip, setLegendFocusTooltip] = useState<{ x: number; y: number } | null>(null);
  const draggingMetricKeyRef = useRef<MetricKey | null>(null);

  const selectedPeriods = useMemo(() => (timeWindow === 'last6Months' ? PERIODS : PERIODS), [timeWindow]);
  const isMultipleMode = viewMode === 'multiple';
  const orderedSelectedMetrics = useMemo(
    () => metricOrder.filter((metricKey) => selectedMetrics.includes(metricKey)),
    [metricOrder, selectedMetrics],
  );
  const billingUnitAllState = useMemo(
    () => getAllSelectionState(selectedBillingUnits, BILLING_UNIT_OPTIONS),
    [selectedBillingUnits],
  );
  const regionAllState = useMemo(() => getAllSelectionState(selectedRegions, REGION_OPTIONS), [selectedRegions]);
  const finalBillingUnitOptions = useMemo(
    () => buildOptionsWithSelectAll(BILLING_UNIT_OPTIONS, billingUnitAllState),
    [billingUnitAllState],
  );
  const finalRegionOptions = useMemo(() => buildOptionsWithSelectAll(REGION_OPTIONS, regionAllState), [regionAllState]);
  const overviewChartData = useMemo(
    () =>
      buildDualAxisTrendData(selectedBillingUnits, selectedRegions, selectedMetrics, 'metric').filter((item) =>
        selectedPeriods.includes(item.period),
      ),
    [selectedBillingUnits, selectedMetrics, selectedPeriods, selectedRegions],
  );
  const splitChartData = useMemo(
    () =>
      buildDualAxisTrendData(selectedBillingUnits, selectedRegions, selectedMetrics, 'combo').filter((item) =>
        selectedPeriods.includes(item.period),
      ),
    [selectedBillingUnits, selectedMetrics, selectedPeriods, selectedRegions],
  );
  const overviewSpec = useMemo(
    () =>
      buildDualAxisLineSpec(
        overviewChartData,
        colorText2,
        colorText3,
        colorBorder2,
        'comboMetricGroup',
        true,
        FINAL_SCHEME_TOOLTIP_MAX_HEIGHT,
        'list',
        selectedOverviewLegendNames,
        true,
        colorFunctionalIcon1,
        true,
      ),
    [colorFunctionalIcon1, overviewChartData, colorBorder2, colorText2, colorText3, selectedOverviewLegendNames],
  );
  const splitChartItems = useMemo(
    () =>
      orderedSelectedMetrics.map((metricKey) => {
        const metric = getMetricByKey(metricKey);
        const metricData = splitChartData.filter((item) => item.metric === metric.key);
        return {
          metric,
          spec: buildSingleAxisMetricLineSpec(
            metric,
            metricData,
            colorText2,
            colorText3,
            colorBorder2,
            FINAL_SCHEME_TOOLTIP_MAX_HEIGHT,
            true,
            colorFunctionalIcon1,
            true,
          ),
        };
      }),
    [colorBorder2, colorFunctionalIcon1, colorText2, colorText3, orderedSelectedMetrics, splitChartData],
  );
  const clearLockedTooltip = useCallback(() => {
    setLockedTooltip(null);
    Object.values(splitChartRefs.current).forEach((chart) => {
      chart?.hideTooltip();
      chart?.setDimensionIndex(null as any, { tooltip: false, crosshair: true });
    });
  }, []);
  const syncSplitTooltip = useCallback(
    (period: string) => {
      orderedSelectedMetrics.forEach((metricKey) => {
        splitChartRefs.current[metricKey]?.setDimensionIndex(period, {
          tooltip: true,
          crosshair: true,
          showTooltipOption: { activeType: 'dimension', alwaysShow: true },
        });
      });
    },
    [orderedSelectedMetrics],
  );
  const handleOverviewLegendSelectedDataChange = useCallback((event: any) => {
    const selectedData =
      overviewChartRef.current?.getLegendSelectedDataByIndex(0) ??
      event?.value ??
      event?.event?.detail?.currentSelected ??
      [];
    const nextSelectedLegendNames = selectedData.map(String);
    setSelectedOverviewLegendNames((current) =>
      isSameStringArray(current, nextSelectedLegendNames) ? current : nextSelectedLegendNames,
    );
  }, []);
  const hideLegendFocusTooltip = useCallback(() => {
    setLegendFocusTooltip(null);
  }, []);
  const handleLegendItemHover = useCallback((event: any) => {
    if (!isLegendFocusIconEvent(event)) {
      setLegendFocusTooltip(null);
      return;
    }

    const point = getClientPointFromVChartEvent(event);
    if (!point) return;

    setLegendFocusTooltip({
      x: Math.min(point.clientX + 10, window.innerWidth - 132),
      y: Math.max(point.clientY - 34, 8),
    });
  }, []);
  const handleSplitDimensionClick = useCallback((metricKey: MetricKey, event: any) => {
    const period = event?.dimensionInfo?.[0]?.value;
    if (!period) return;

    const nextPeriod = String(period);
    setLockedTooltip({ metricKey, period: nextPeriod });
    syncSplitTooltip(nextPeriod);
  }, [syncSplitTooltip]);
  const handleSplitDimensionHover = useCallback(
    (event: any) => {
      if (lockedTooltip) return;

      const period = event?.dimensionInfo?.[0]?.value;
      if (event?.action === 'leave' || !period) {
        clearLockedTooltip();
        return;
      }

      syncSplitTooltip(String(period));
    },
    [clearLockedTooltip, lockedTooltip, syncSplitTooltip],
  );
  const moveFacetChart = useCallback((sourceMetricKey: MetricKey, event: any) => {
    const point = getClientPointFromVChartEvent(event);
    draggingMetricKeyRef.current = null;
    setDraggingMetricKey(null);
    setDragPreview(null);
    if (!point) return;

    const targetElement = document
      .elementsFromPoint(point.clientX, point.clientY)
      .map((element) => element.closest?.('[data-scheme-four-metric-key]'))
      .find((element): element is HTMLElement => element instanceof HTMLElement);
    const targetMetricKey = targetElement?.dataset.schemeFourMetricKey as MetricKey | undefined;

    if (!targetMetricKey || targetMetricKey === sourceMetricKey) return;

    setMetricOrder((current) =>
      reorderList(current, current.indexOf(sourceMetricKey), current.indexOf(targetMetricKey)),
    );
  }, []);
  const handleFacetDragStart = useCallback((metricKey: MetricKey, event: React.PointerEvent<HTMLDivElement>) => {
    const point = getClientPointFromVChartEvent(event);
    const cardElement = event.currentTarget.closest('[data-scheme-four-metric-key]');
    if (!point || !(cardElement instanceof HTMLElement)) return;

    const rect = cardElement.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    draggingMetricKeyRef.current = metricKey;
    setDraggingMetricKey(metricKey);
    setDragPreview({
      metricKey,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      offsetX: point.clientX - rect.left,
      offsetY: point.clientY - rect.top,
    });
  }, []);
  const handleFacetDragEnd = useCallback(
    (event: any) => {
      const sourceMetricKey = draggingMetricKeyRef.current;
      if (!sourceMetricKey) return;

      moveFacetChart(sourceMetricKey, event);
    },
    [moveFacetChart],
  );

  useEffect(() => {
    setMetricOrder((current) => {
      const selectedMetricSet = new Set(selectedMetrics);
      const keptMetricKeys = current.filter((metricKey) => selectedMetricSet.has(metricKey));
      const appendedMetricKeys = selectedMetrics.filter((metricKey) => !keptMetricKeys.includes(metricKey));
      return [...keptMetricKeys, ...appendedMetricKeys];
    });
  }, [selectedMetrics]);

  useEffect(() => {
    const selectedMetricSet = new Set(selectedMetrics);
    METRICS.forEach((metric) => {
      if (!selectedMetricSet.has(metric.key)) {
        delete splitChartRefs.current[metric.key];
      }
    });
  }, [selectedMetrics]);

  useEffect(() => {
    setSelectedOverviewLegendNames(null);
  }, [selectedBillingUnits, selectedMetrics, selectedRegions, timeWindow]);

  useEffect(() => {
    clearLockedTooltip();
    hideLegendFocusTooltip();
  }, [clearLockedTooltip, hideLegendFocusTooltip, selectedBillingUnits, selectedMetrics, selectedRegions, timeWindow, viewMode]);

  useEffect(() => {
    if (!lockedTooltip) return undefined;

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isInsideContainer = Boolean(containerRef.current?.contains(target));
      const isInsideTooltip = Boolean(target.closest('[data-target-trend-scrollable-tooltip="true"]'));
      if (isInsideContainer || isInsideTooltip) return;

      clearLockedTooltip();
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [clearLockedTooltip, lockedTooltip]);

  useEffect(() => {
    if (!draggingMetricKey) return undefined;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = 'move';

    const handlePointerMove = (event: PointerEvent) => {
      setDragPreview((current) =>
        current
          ? {
              ...current,
              x: event.clientX - current.offsetX,
              y: event.clientY - current.offsetY,
            }
          : current,
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const sourceMetricKey = draggingMetricKeyRef.current;
      if (!sourceMetricKey) return;
      moveFacetChart(sourceMetricKey, event);
    };

    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    return () => {
      document.body.style.cursor = previousCursor;
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
    };
  }, [draggingMetricKey, moveFacetChart]);

  const dragPreviewItem = useMemo(
    () => splitChartItems.find((item) => item.metric.key === dragPreview?.metricKey),
    [dragPreview?.metricKey, splitChartItems],
  );

  return (
    <div className={styles.schemeStack} ref={containerRef}>
      <div className={styles.compactRuleText}>
        默认单图总览，不管选择几个计费单元和几个大区都全部展示在一张图中；切换多图拆分后，按指标一图展示计费单元 × 大区粒度。
      </div>

      <div className={styles.dualAxisOuterToolbar}>
            <Select
              addBefore="指标"
              className={styles.dualAxisMultiSelect}
              mode="multiple"
              maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
              value={selectedMetrics}
              options={METRIC_OPTIONS}
              onChange={(value) => setSelectedMetrics(normalizeMetricSelection(value as string[] | string))}
              triggerProps={{ popupStyle: { width: 320 } }}
            />
            <Select
              addBefore="计费单元"
              className={styles.dualAxisMultiSelect}
              mode="multiple"
              maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
              value={selectedBillingUnits}
              options={finalBillingUnitOptions}
              onChange={(value) =>
                setSelectedBillingUnits(
                  normalizeSelectionWithAll(value as string[] | string, BILLING_UNIT_OPTIONS, selectedBillingUnits),
                )
              }
              triggerProps={{ popupStyle: { width: 280 } }}
            />
            <Select
              addBefore="大区"
              className={styles.dualAxisMultiSelect}
              mode="multiple"
              maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
              value={selectedRegions}
              options={finalRegionOptions}
              onChange={(value) =>
                setSelectedRegions(
                  normalizeSelectionWithAll(value as string[] | string, REGION_OPTIONS, selectedRegions),
                )
              }
              triggerProps={{ popupStyle: { width: 180 } }}
            />
            <Select
              addBefore="时间"
              value={timeWindow}
              options={TIME_WINDOW_OPTIONS}
              onChange={(value) => setTimeWindow(String(value))}
              triggerProps={{ popupStyle: { width: 180 } }}
            />
            <Radio.Group value={viewMode} type="button" onChange={(value) => setViewMode(value as FinalViewMode)}>
              <Radio value="single">单图总览</Radio>
              <Radio value="multiple">多图拆分</Radio>
            </Radio.Group>
          </div>

          {isMultipleMode ? (
            <div className={styles.dualAxisFacetsGrid}>
              {splitChartItems.map(({ metric, spec }) => {
                if (draggingMetricKey === metric.key) {
                  return (
                    <div
                      key={metric.key}
                      className={`${styles.dualAxisPanel} ${styles.dualAxisDraggablePanel} ${styles.dualAxisDragPlaceholder}`}
                      data-scheme-four-metric-key={metric.key}
                    />
                  );
                }

                return (
                  <Card
                    key={metric.key}
                    className={`${styles.dualAxisPanel} ${styles.dualAxisDraggablePanel}`}
                    data-scheme-four-metric-key={metric.key}
                  >
                    <div
                      className={`${styles.focusHeader} ${styles.dualAxisDragHeader}`}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        handleFacetDragStart(metric.key, event);
                      }}
                    >
                      <div className={styles.chartTitleBlock}>
                        <div className={`${styles.chartTitle} ${styles.dualAxisDragTitle}`}>
                          <span className={styles.dualAxisDragHandle} aria-hidden="true" />
                          {metric.name}
                          <span className={styles.chartTitleUnit}>（{getMetricTitleDisplayUnit(metric)}）</span>
                        </div>
                      </div>
                      <LineKindLegend />
                    </div>

                    <VChart
                      spec={spec}
                      className={styles.dualAxisFacetChart}
                      style={{ height: 230 }}
                      onReady={(chart) => {
                        splitChartRefs.current[metric.key] = chart;
                      }}
                      onLegendItemHover={handleLegendItemHover}
                      onLegendItemUnHover={hideLegendFocusTooltip}
                      onDimensionHover={handleSplitDimensionHover}
                      onDimensionClick={(event) => handleSplitDimensionClick(metric.key, event)}
                      onPointerLeave={() => {
                        hideLegendFocusTooltip();
                        if (!lockedTooltip) {
                          clearLockedTooltip();
                        }
                      }}
                      onError={(error) => Message.error(`最终方案 ${metric.name} 趋势图加载失败：${error.message}`)}
                    />
                  </Card>
                );
              })}
              {dragPreview && dragPreviewItem && (
                <Card
                  className={`${styles.dualAxisPanel} ${styles.dualAxisDraggablePanel} ${styles.dualAxisDragPreview}`}
                  style={{
                    width: dragPreview.width,
                    height: dragPreview.height,
                    transform: `translate3d(${dragPreview.x}px, ${dragPreview.y}px, 0)`,
                  }}
                >
                  <div className={`${styles.focusHeader} ${styles.dualAxisDragHeader}`}>
                    <div className={styles.chartTitleBlock}>
                      <div className={`${styles.chartTitle} ${styles.dualAxisDragTitle}`}>
                        <span className={styles.dualAxisDragHandle} aria-hidden="true" />
                        {dragPreviewItem.metric.name}
                        <span className={styles.chartTitleUnit}>
                          （{getMetricTitleDisplayUnit(dragPreviewItem.metric)}）
                        </span>
                      </div>
                    </div>
                    <LineKindLegend />
                  </div>

                  <VChart
                    spec={dragPreviewItem.spec}
                    className={styles.dualAxisFacetChart}
                    style={{ height: 230 }}
                    onError={(error) =>
                      Message.error(`最终方案 ${dragPreviewItem.metric.name} 趋势图加载失败：${error.message}`)
                    }
                  />
                </Card>
              )}
            </div>
          ) : (
            <Card className={styles.dualAxisPanel}>
              <div className={styles.focusHeader}>
                <div className={styles.chartTitleBlock}>
                  <div className={styles.chartTitle}>指标实际/目标趋势图</div>
                </div>
                <LineKindLegend />
              </div>

              <VChart
                spec={overviewSpec}
                className={styles.dualAxisChart}
                style={{ height: 276 }}
                onReady={(chart) => {
                  overviewChartRef.current = chart;
                }}
                onLegendItemHover={handleLegendItemHover}
                onLegendItemUnHover={hideLegendFocusTooltip}
                onLegendSelectedDataChange={handleOverviewLegendSelectedDataChange}
                onPointerLeave={hideLegendFocusTooltip}
                onError={(error) => Message.error(`最终方案趋势图加载失败：${error.message}`)}
              />
            </Card>
          )}
      {legendFocusTooltip && (
        <div
          className={styles.legendFocusTooltip}
          style={{ left: legendFocusTooltip.x, top: legendFocusTooltip.y }}
        >
          点击仅展示该数据
        </div>
      )}
    </div>
  );
}

const TargetTrendChartSchemes: React.FC = () => {
  const [activeScheme, setActiveScheme] = useState<SchemeKey>('dualAxisFacets');
  const [drilledMetrics, setDrilledMetrics] = useState<Record<string, boolean>>({});
  const [focusDrillMetric, setFocusDrillMetric] = useState<MetricKey | null>(null);
  const facetChartsRef = useRef<Partial<Record<MetricKey, IVChart>>>({});
  const syncingDimensionRef = useRef(false);
  const syncAnimationFrameRef = useRef<number | null>(null);

  const toggleDrilldown = (metricKey: MetricKey) => {
    setDrilledMetrics((current) => ({ ...current, [metricKey]: !current[metricKey] }));
  };
  useEffect(() => {
    const previousUniqueTooltip = VChartCore.globalConfig.uniqueTooltip;
    VChartCore.globalConfig.uniqueTooltip = false;

    return () => {
      VChartCore.globalConfig.uniqueTooltip = previousUniqueTooltip;
      if (syncAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(syncAnimationFrameRef.current);
      }
    };
  }, []);
  const registerFacetChart = useCallback((metricKey: MetricKey, chart: IVChart | null) => {
    if (chart) {
      facetChartsRef.current[metricKey] = chart;
    } else {
      delete facetChartsRef.current[metricKey];
    }
  }, []);
  const syncFacetDimension = useCallback((sourceMetricKey: MetricKey, period: string | null) => {
    if (syncingDimensionRef.current) return;

    syncingDimensionRef.current = true;
    if (syncAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(syncAnimationFrameRef.current);
    }

    syncAnimationFrameRef.current = window.requestAnimationFrame(() => {
      METRICS.forEach((metric) => {
        if (metric.key === sourceMetricKey) return;

        const chart = facetChartsRef.current[metric.key];
        if (!chart) return;

        if (period) {
          chart.setDimensionIndex(period, {
            tooltip: true,
            crosshair: true,
            showTooltipOption: { activeType: 'dimension', alwaysShow: true },
          });
        } else {
          chart.hideTooltip();
          chart.setDimensionIndex(null as any, { tooltip: false, crosshair: true });
        }
      });
      syncingDimensionRef.current = false;
      syncAnimationFrameRef.current = null;
    });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <PageHeader.PageHeaderPro
          title="目标趋势图方案"
          subTitle={[
            { label: '商品', value: 'Bytegraph' },
            { label: '口径', value: '计费单元 × 月' },
            { label: '图表组件', value: 'VChart' },
          ]}
        />
        <Divider className={styles.headerDivider} />
      </div>

      <div className={styles.content}>
        <Tabs type="card-gutter" activeTab={activeScheme} onChange={(key) => setActiveScheme(key as SchemeKey)}>
          <Tabs.TabPane key="facets" title="方案一：网格分面" />
          <Tabs.TabPane key="focus" title="方案二：折线下钻" />
          <Tabs.TabPane key="dualAxis" title="方案三：双轴总览" />
          <Tabs.TabPane key="dualAxisTable" title="方案四：双轴总览（表格 Tooltip）" />
          <Tabs.TabPane key="dualAxisFacets" title="最终方案" />
        </Tabs>

        {activeScheme === 'facets' ? (
          <div className={styles.schemeStack}>
            <Card className={styles.ruleCard}>
              <div className={styles.ruleGrid}>
                <div>
                  <div className={styles.ruleTitle}>默认层级</div>
                  <div className={styles.ruleText}>每个指标一张图，独立 Y 轴，实际值蓝色实线，目标值灰色虚线。</div>
                </div>
                <div>
                  <div className={styles.ruleTitle}>下钻层级</div>
                  <div className={styles.ruleText}>点击图表右上角下钻后，按计费单元 × 大区展开；同对象同色，实际值实线，目标值虚线。</div>
                </div>
              </div>
            </Card>

            <div className={styles.facetsGrid}>
              {METRICS.map((metric) => (
                <MetricChartCard
                  key={metric.key}
                  metric={metric}
                  drilled={Boolean(drilledMetrics[metric.key])}
                  onToggle={() => toggleDrilldown(metric.key)}
                  onChartReady={registerFacetChart}
                  onDimensionSync={syncFacetDimension}
                />
              ))}
            </div>
          </div>
        ) : activeScheme === 'focus' ? (
          <div className={styles.schemeStack}>
            <Card className={styles.ruleCard}>
              <div className={styles.ruleGrid}>
                <div>
                  <div className={styles.ruleTitle}>默认层级</div>
                  <div className={styles.ruleText}>默认一张图，使用折线展示不同指标的达标率趋势。</div>
                </div>
                <div>
                  <div className={styles.ruleTitle}>下钻层级</div>
                  <div className={styles.ruleText}>点击指标折线后，按计费单元 × 大区展开；同对象同色，实际值实线，目标值虚线。</div>
                </div>
              </div>
            </Card>
            <SchemeTwoChart
              drillMetric={focusDrillMetric}
              onDrill={setFocusDrillMetric}
              onBack={() => setFocusDrillMetric(null)}
            />
          </div>
        ) : activeScheme === 'dualAxis' ? (
          <SchemeThreeChart />
        ) : activeScheme === 'dualAxisTable' ? (
          <SchemeThreeChart tooltipMode="table" errorLabel="方案四" />
        ) : (
          <SchemeFourChart />
        )}
      </div>
    </div>
  );
};

export default TargetTrendChartSchemes;
