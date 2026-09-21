import { Card, Divider, Message, PageHeader, Radio, Select, Tabs } from '@tod-m/materials/ve-o';
import { VChart } from '@visactor/react-vchart';
import { VChart as VChartCore } from '@visactor/vchart';
import type {
  ICartesianAxisSpec,
  Datum,
  ICommonChartSpec,
  IDiscreteLegendSpec,
  ITooltipActual,
  ITooltipLineActual,
  IVChart,
} from '@visactor/vchart';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CustomPagedLegend, { type CustomPagedLegendItem } from 'components/CustomPagedLegend';
import styles from './index.module.scss';

type OverviewSchemeKey = 'archive' | 'final';
type MetricKey = 'estimatePrice' | 'unitCost' | 'resourceCost' | 'markupRate' | 'sellRate';
type LineKind = 'actual' | 'target';
type AxisValueType = 'price' | 'rate';
type FinalViewMode = 'single' | 'multiple';
type ProductColorMode = 'metric' | 'product' | 'productMetric';
type ProductLegendMode = 'product' | 'productDimension' | 'productMetricGroup' | 'productMetricLine' | 'productMetric';

interface MetricConfig {
  key: MetricKey;
  name: string;
  unit: string;
  direction: string;
  actual: number[];
  target: number[];
}

interface ProductConfig {
  key: string;
  name: string;
  color: string;
  delta: number;
}

interface ProductTrendDatum {
  period: string;
  metric: MetricKey;
  metricName: string;
  productKey: string;
  product: string;
  billingUnit?: string;
  region?: string;
  lineKind: LineKind;
  series: string;
  value: number;
  color: string;
  axisValueType: AxisValueType;
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

interface TooltipAlignmentConfig {
  scope: string;
  metricKey: MetricKey;
  alignSinglePointSide?: boolean;
}

type LegendSpecWithPadding = IDiscreteLegendSpec & {
  padding?: [number, number, number, number];
};

const PERIODS = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
const CNY_EXCHANGE_RATE = 7.2;
const SELECT_ALL_OPTION_VALUE = '__all__';
const TOOLTIP_FONT_FAMILY = 'Roboto, "PingFang SC", sans-serif';
const TOOLTIP_BODY_FONT_SIZE = 12;
const TOOLTIP_BODY_LINE_HEIGHT = 20;
const TOOLTIP_BODY_FONT_WEIGHT = 400;
const FINAL_SCHEME_TOOLTIP_MAX_HEIGHT = 420;
const FINAL_SCHEME_SPLIT_TOOLTIP_MAX_HEIGHT = 264;
const FINAL_SCHEME_TOOLTIP_MAX_WIDTH = 500;
const TOOLTIP_ROW_ALIGNMENT_TOLERANCE = 8;
const SINGLE_POINT_TOOLTIP_GAP = 12;
const SINGLE_POINT_TOOLTIP_VIEWPORT_PADDING = 8;
const CHART_Y_AXIS_TICK_COUNT = 5;
const SINGLE_PERIOD_POINT_SIZE = 10;
const SINGLE_PERIOD_TARGET_POINT_SIZE = 8;
const TOOLTIP_MARKER_SIZE = 10;
const getYAxisLabelConfig = (colorText3: string): NonNullable<ICartesianAxisSpec['label']> => ({
  visible: true,
  space: 4,
  firstVisible: true,
  lastVisible: true,
  style: { fill: colorText3, textBaseline: 'middle' },
});
const FINAL_HOVER_POINT_STYLE = {
  size: 10,
  symbolType: 'circle',
  lineWidth: 2,
  stroke: '#fff',
  fillOpacity: 1,
  strokeOpacity: 1,
  lineDash: [0, 0],
};
const getSinglePeriodPointSize = (showSinglePeriodPoints: boolean, lineKind?: LineKind) => {
  if (!showSinglePeriodPoints) return 0;
  return lineKind === 'target' ? SINGLE_PERIOD_TARGET_POINT_SIZE : SINGLE_PERIOD_POINT_SIZE;
};
const PRODUCT_CHART_COLOR_PALETTE = [
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
const ARCHIVE_DEFAULT_METRICS: MetricKey[] = ['estimatePrice', 'unitCost', 'resourceCost', 'markupRate'];
const DEFAULT_METRICS = METRICS.map((metric) => metric.key);

const PRODUCTS: ProductConfig[] = [
  { key: 'bytegraph', name: 'Bytegraph', color: '#1664FF', delta: 0 },
  { key: 'bytendb', name: 'ByteNDB', color: '#1AC6FF', delta: -0.07 },
  { key: 'mysql', name: 'Mysql', color: '#FF8A00', delta: -0.16 },
  { key: 'cache', name: 'CACHE', color: '#3CC780', delta: -0.27 },
  { key: 'abase', name: 'Abase', color: '#7442D4', delta: 0.05 },
];

const PRODUCT_NAMES = PRODUCTS.map((product) => product.name);
const PRODUCT_OPTIONS = PRODUCTS.map((product) => ({ label: product.name, value: product.key }));
const DEFAULT_PRODUCTS = PRODUCTS.map((product) => product.key);
const BILLING_UNIT_OPTIONS = [
  { label: 'ByteGraph CPU', value: 'ByteGraph CPU' },
  { label: 'bytegraph.mem', value: 'bytegraph.mem' },
  { label: 'ByteGraph 存储', value: 'ByteGraph 存储' },
];
const REGION_OPTIONS = [
  { label: 'cn', value: 'cn' },
  { label: 'ap', value: 'ap' },
  { label: 'sg', value: 'sg' },
  { label: 'va', value: 'va' },
];
const DEFAULT_BILLING_UNITS = BILLING_UNIT_OPTIONS.map((option) => option.value);
const DEFAULT_REGIONS = ['cn'];
const LINE_KIND_OPTIONS = [
  { label: '实际值', value: 'actual' },
  { label: '目标值', value: 'target' },
];
const DEFAULT_LINE_KINDS: LineKind[] = ['actual'];
const TIME_WINDOW_OPTIONS = [
  { label: '2026-08', value: '2026-08' },
  { label: '过去 6 个月', value: 'last6Months' },
];

const getToken = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

const normalizeMetricSelection = (value: string[] | string): MetricKey[] => {
  const values = Array.isArray(value) ? value : [value];
  return values.filter((key): key is MetricKey => METRICS.some((metric) => metric.key === key));
};

const normalizeLineKindSelection = (value: string[] | string): LineKind[] => {
  const values = Array.isArray(value) ? value : [value];
  return values.filter((key): key is LineKind => key === 'actual' || key === 'target');
};

const normalizeSelection = (value: string[] | string) => (Array.isArray(value) ? value : [value]);
const getValidSelectValues = (options: Array<{ value: string }>) => options.map((option) => option.value);
const getAllSelectionState = (selectedValues: string[], options: Array<{ value: string }>) => {
  const validValues = new Set(getValidSelectValues(options));
  const selectedCount = selectedValues.filter((item) => validValues.has(item)).length;

  if (selectedCount === 0) return 'none';
  return selectedCount === validValues.size ? 'all' : 'partial';
};
const buildOptionsWithSelectAll = (
  options: Array<{ label: string; value: string }>,
  allState: 'none' | 'partial' | 'all',
) => [
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

const getMetricByKey = (key: MetricKey) => METRICS.find((metric) => metric.key === key) ?? METRICS[0];
const getProductByKey = (key: string) => PRODUCTS.find((product) => product.key === key) ?? PRODUCTS[0];

const reorderList = <T,>(list: T[], fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;

  const next = [...list];
  const [movedItem] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, movedItem);
  return next;
};

const getMetricColor = (metricKey: MetricKey) => {
  const metricIndex = METRICS.findIndex((metric) => metric.key === metricKey);
  return PRODUCT_CHART_COLOR_PALETTE[Math.max(metricIndex, 0) % PRODUCT_CHART_COLOR_PALETTE.length];
};

const getProductColor = (productKey: string, productKeys = DEFAULT_PRODUCTS) => {
  const productIndex = productKeys.indexOf(productKey);
  return PRODUCTS.find((product) => product.key === productKey)?.color ??
    PRODUCT_CHART_COLOR_PALETTE[Math.max(productIndex, 0) % PRODUCT_CHART_COLOR_PALETTE.length];
};

const getProductMetricColor = (productKey: string, metricKey: MetricKey, productKeys: string[], metricKeys: MetricKey[]) => {
  const productIndex = productKeys.indexOf(productKey);
  const metricIndex = metricKeys.indexOf(metricKey);
  const colorIndex = Math.max(productIndex, 0) * Math.max(metricKeys.length, 1) + Math.max(metricIndex, 0);
  return PRODUCT_CHART_COLOR_PALETTE[colorIndex % PRODUCT_CHART_COLOR_PALETTE.length];
};

const getMetricSortIndex = (metricKey?: MetricKey) => {
  const index = METRICS.findIndex((metric) => metric.key === metricKey);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const isSameStringArray = (left: string[] | null, right: string[] | null) =>
  left === right || Boolean(left && right && left.length === right.length && left.every((item, index) => item === right[index]));

const getMetricAxisValueType = (metric: MetricConfig): AxisValueType => (metric.unit === '%' ? 'rate' : 'price');

const getMetricDisplayUnit = (metric: MetricConfig) => {
  if (metric.unit === '%') return '%';
  return metric.unit.replace('美元', '人民币');
};

const getMetricTitleDisplayUnit = (metric: MetricConfig) => getMetricDisplayUnit(metric).replace('人民币', '元');

const formatCnyValue = (value: number) => {
  if (value < 0.01) return value.toFixed(5);
  return value.toFixed(3);
};

const formatPeriodToDateGranularity = (value: unknown) => {
  const rawValue = String(Array.isArray(value) ? value[0] : value);
  const monthMatch = rawValue.match(/^(\d{4}-\d{2})(?:-\d{2})?$/);
  return monthMatch ? monthMatch[1] : rawValue;
};

const getLineKindLabel = (lineKind: LineKind) => (lineKind === 'actual' ? '实际值' : '目标值');
const getTooltipLineKindLabel = (lineKind: LineKind) => (lineKind === 'actual' ? '实际' : '目标');

const formatBillingUnitForChart = (billingUnit: string) =>
  billingUnit
    .replace(/^bytegraph[.\s-]*/i, '')
    .trim();

const getProductDimensionLabel = (
  datum: Pick<ProductTrendDatum, 'product'> & Partial<Pick<ProductTrendDatum, 'billingUnit' | 'region'>>,
) => {
  const dimensionLabel =
    datum.billingUnit && datum.region ? `${formatBillingUnitForChart(datum.billingUnit)}|${datum.region}` : '计费单元|大区';
  return `${datum.product}, ${dimensionLabel}`;
};

const getProductLineLabel = (
  datum: Pick<ProductTrendDatum, 'product' | 'lineKind'> &
    Partial<Pick<ProductTrendDatum, 'billingUnit' | 'region'>>,
) => `${getProductDimensionLabel(datum)}, ${getTooltipLineKindLabel(datum.lineKind)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getPathValue = (source: unknown, path: string[]) =>
  path.reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), source);

const getClientPointFromVChartEvent = (event: unknown) => {
  const sourceEvents = [
    getPathValue(event, ['event', 'detail', 'event', 'nativeEvent']),
    getPathValue(event, ['event', 'detail', 'event']),
    getPathValue(event, ['value', 'event', 'nativeEvent']),
    getPathValue(event, ['value', 'event']),
    getPathValue(event, ['event', 'nativeEvent']),
    getPathValue(event, ['nativeEvent']),
    getPathValue(event, ['event']),
    event,
  ];

  const sourceEvent = sourceEvents.find(
    (item) =>
      isRecord(item) && (typeof item.clientX === 'number' || typeof item.viewX === 'number'),
  );
  if (!isRecord(sourceEvent)) return null;

  const clientX = typeof sourceEvent.clientX === 'number' ? sourceEvent.clientX : sourceEvent.viewX;
  const clientY = typeof sourceEvent.clientY === 'number' ? sourceEvent.clientY : sourceEvent.viewY;

  if (typeof clientX !== 'number' || typeof clientY !== 'number') return null;
  return { clientX, clientY };
};

const isLegendFocusIconEvent = (event: unknown) => {
  const targetNames = [
    getPathValue(event, ['event', 'detail', 'event', 'target', 'name']),
    getPathValue(event, ['value', 'event', 'target', 'name']),
    getPathValue(event, ['event', 'target', 'name']),
    getPathValue(event, ['target', 'name']),
  ];
  return targetNames.includes('legendItemFocus');
};

const getLegendItemName = (event: unknown) => {
  const values = [
    getPathValue(event, ['value', 'data', 'label']),
    getPathValue(event, ['value', 'data', 'name']),
    getPathValue(event, ['value', 'item', 'name']),
    getPathValue(event, ['value', 'name']),
    getPathValue(event, ['event', 'detail', 'item', 'name']),
  ];

  const itemName = values.find((value): value is string => typeof value === 'string' && value.length > 0);
  return itemName ?? null;
};

const showOnlyLegendItem = (chart: IVChart | null | undefined, event: unknown, availableNames = PRODUCT_NAMES) => {
  const itemName = getLegendItemName(event);
  if (!itemName || !availableNames.includes(itemName)) return;

  chart?.setLegendSelectedDataByIndex(0, [itemName]);
};

const asProductTrendDatum = (datum: Datum | undefined): ProductTrendDatum | undefined => {
  if (!datum || typeof datum.product !== 'string') return undefined;
  if (datum.lineKind !== 'actual' && datum.lineKind !== 'target') return undefined;
  if (typeof datum.value !== 'number' || typeof datum.color !== 'string') return undefined;
  if (datum.axisValueType !== 'price' && datum.axisValueType !== 'rate') return undefined;

  return {
    period: String(datum.period),
    metric: datum.metric as MetricKey,
    metricName: String(datum.metricName),
    productKey: String(datum.productKey),
    product: datum.product,
    billingUnit: typeof datum.billingUnit === 'string' ? datum.billingUnit : undefined,
    region: typeof datum.region === 'string' ? datum.region : undefined,
    lineKind: datum.lineKind,
    series: String(datum.series),
    value: datum.value,
    color: datum.color,
    axisValueType: datum.axisValueType,
    valueUnit: String(datum.valueUnit),
  };
};

const getProductFactor = (product: ProductConfig, periodIndex: number, metricIndex: number) =>
  1 + product.delta + Math.sin((periodIndex + 1) * (metricIndex + 1.4) + product.delta * 10) * 0.018;

const getNiceAxisStep = (range: number) => {
  if (range <= 0) return 1;

  const roughStep = range / Math.max(CHART_Y_AXIS_TICK_COUNT - 1, 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;

  if (normalizedStep <= 1) return magnitude;
  if (normalizedStep <= 2) return 2 * magnitude;
  if (normalizedStep <= 2.5) return 2.5 * magnitude;
  if (normalizedStep <= 5) return 5 * magnitude;
  return 10 * magnitude;
};

const normalizeAxisValue = (value: number) => Number(value.toPrecision(12));

const getBillingRegionFactor = (billingUnit: string, region: string, periodIndex: number) => {
  const billingIndex = BILLING_UNIT_OPTIONS.findIndex((option) => option.value === billingUnit);
  const regionIndex = REGION_OPTIONS.findIndex((option) => option.value === region);
  return 1 + Math.max(billingIndex, 0) * 0.026 + Math.max(regionIndex, 0) * 0.018 + Math.sin((periodIndex + 1) * (billingIndex + 2)) * 0.01;
};

const getProductMetricLegendName = (
  datum: Pick<ProductTrendDatum, 'product' | 'metricName'> &
    Partial<Pick<ProductTrendDatum, 'billingUnit' | 'region'>>,
) => `${getProductDimensionLabel(datum)}, ${datum.metricName}`;

const getProductMetricGroupLabel = (
  datum: Pick<ProductTrendDatum, 'product' | 'metricName'> &
    Partial<Pick<ProductTrendDatum, 'billingUnit' | 'region'>>,
) => `${getProductDimensionLabel(datum)}, ${datum.metricName}`;

const getProductMetricLineLabel = (
  datum: Pick<ProductTrendDatum, 'product' | 'metricName' | 'lineKind'> &
    Partial<Pick<ProductTrendDatum, 'billingUnit' | 'region'>>,
) => `${getProductDimensionLabel(datum)}, ${datum.metricName}, ${getTooltipLineKindLabel(datum.lineKind)}`;

const getProductLineKindLabel = (datum: Pick<ProductTrendDatum, 'product' | 'lineKind'>) =>
  `${datum.product}（${getLineKindLabel(datum.lineKind).replace('值', '')}）`;

const getProductLegendName = (datum: ProductTrendDatum, legendMode: ProductLegendMode) =>
  legendMode === 'product'
    ? datum.product
    : legendMode === 'productDimension'
      ? getProductDimensionLabel(datum)
      : legendMode === 'productMetricLine'
        ? getProductMetricLineLabel(datum)
        : legendMode === 'productMetricGroup'
          ? getProductMetricGroupLabel(datum)
          : getProductMetricLegendName(datum);

const buildProductTrendData = (metric: MetricConfig, productKeys = DEFAULT_PRODUCTS): ProductTrendDatum[] => {
  const metricIndex = METRICS.findIndex((item) => item.key === metric.key);
  const axisValueType = getMetricAxisValueType(metric);
  const valueMultiplier = axisValueType === 'price' ? CNY_EXCHANGE_RATE : 1;
  const precision = axisValueType === 'price' ? 5 : 2;
  const valueUnit = getMetricDisplayUnit(metric);

  return productKeys.map(getProductByKey).flatMap((product) =>
    PERIODS.flatMap((period, periodIndex) => {
      const factor = getProductFactor(product, periodIndex, metricIndex);

      return [
        {
          period,
          metric: metric.key,
          metricName: metric.name,
          productKey: product.key,
          product: product.name,
          lineKind: 'actual' as const,
          series: `${product.name} 实际`,
          value: Number((metric.actual[periodIndex] * factor * valueMultiplier).toFixed(precision)),
          color: product.color,
          axisValueType,
          valueUnit,
        },
        {
          period,
          metric: metric.key,
          metricName: metric.name,
          productKey: product.key,
          product: product.name,
          lineKind: 'target' as const,
          series: `${product.name} 目标`,
          value: Number((metric.target[periodIndex] * (1 + (factor - 1) * 0.36) * valueMultiplier).toFixed(precision)),
          color: product.color,
          axisValueType,
          valueUnit,
        },
      ];
    }),
  );
};

const buildFinalProductTrendData = (
  productKeys: string[],
  metricKeys: MetricKey[],
  colorMode: ProductColorMode = 'product',
  billingUnits = DEFAULT_BILLING_UNITS,
  regions = DEFAULT_REGIONS,
): ProductTrendDatum[] =>
  productKeys.map(getProductByKey).flatMap((product) =>
    billingUnits.flatMap((billingUnit) =>
      regions.flatMap((region) =>
        METRICS.filter((metric) => metricKeys.includes(metric.key)).flatMap((metric) => {
          const metricIndex = METRICS.findIndex((item) => item.key === metric.key);
          const axisValueType = getMetricAxisValueType(metric);
          const valueMultiplier = axisValueType === 'price' ? CNY_EXCHANGE_RATE : 1;
          const precision = axisValueType === 'price' ? 5 : 2;
          const valueUnit = getMetricDisplayUnit(metric);
          const color =
            colorMode === 'productMetric'
              ? getProductMetricColor(product.key, metric.key, productKeys, metricKeys)
              : colorMode === 'metric'
                ? getMetricColor(metric.key)
                : getProductColor(product.key, productKeys);

          return PERIODS.flatMap((period, periodIndex) => {
            const factor =
              getProductFactor(product, periodIndex, metricIndex) *
              getBillingRegionFactor(billingUnit, region, periodIndex);
            const dimensionLabel = getProductDimensionLabel({ product: product.name, billingUnit, region });

            return [
              {
                period,
                metric: metric.key,
                metricName: metric.name,
                productKey: product.key,
                product: product.name,
                billingUnit,
                region,
                lineKind: 'actual' as const,
                series: `${dimensionLabel}, ${metric.name}, 实际`,
                value: Number((metric.actual[periodIndex] * factor * valueMultiplier).toFixed(precision)),
                color,
                axisValueType,
                valueUnit,
              },
              {
                period,
                metric: metric.key,
                metricName: metric.name,
                productKey: product.key,
                product: product.name,
                billingUnit,
                region,
                lineKind: 'target' as const,
                series: `${dimensionLabel}, ${metric.name}, 目标`,
                value: Number((metric.target[periodIndex] * (1 + (factor - 1) * 0.42) * valueMultiplier).toFixed(precision)),
                color,
                axisValueType,
                valueUnit,
              },
            ];
          });
        }),
      ),
    ),
  );

const getDynamicAxisRange = (data: ProductTrendDatum[], axisValueType: AxisValueType) => {
  const values = data.map((item) => item.value).filter((value) => Number.isFinite(value));
  if (!values.length) return {};

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue;
  const fallbackPadding = axisValueType === 'rate' ? 1 : Math.max(Math.abs(maxValue) * 0.08, 0.01);
  const padding = span > 0 ? span * 0.12 : fallbackPadding;
  const paddedMin = Math.max(0, minValue - padding);
  const paddedMax = maxValue + padding;
  const niceStep = getNiceAxisStep(paddedMax - paddedMin);

  return {
    min: normalizeAxisValue(Math.max(0, Math.floor(paddedMin / niceStep) * niceStep)),
    max: normalizeAxisValue(Math.ceil(paddedMax / niceStep) * niceStep),
  };
};

const formatTooltipValue = (datum: ProductTrendDatum) =>
  datum.axisValueType === 'rate'
    ? `${datum.value.toFixed(1)}%`
    : `${formatCnyValue(datum.value)} ${datum.valueUnit.replace('人民币/', '/')}`;

const getTooltipMarkerColor = (datum: ProductTrendDatum, fallback?: string) => {
  const color = datum.color || fallback || '#A9AEB8';
  return /^#[\da-f]{3,8}$/i.test(color) || /^rgb(a)?\(/i.test(color) ? color : '#A9AEB8';
};

const renderTooltipLineKindMarker = (datum: ProductTrendDatum, fallbackColor?: string) => {
  const color = getTooltipMarkerColor(datum, fallbackColor);
  if (datum.lineKind === 'target') {
    return `<span style="display: block; width: ${TOOLTIP_MARKER_SIZE}px; height: 2px; flex: 0 0 ${TOOLTIP_MARKER_SIZE}px; border-radius: 99px; background: repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 5px);"></span>`;
  }

  return `<span style="display: block; width: ${TOOLTIP_MARKER_SIZE}px; height: 2px; flex: 0 0 ${TOOLTIP_MARKER_SIZE}px; border-radius: 99px; background: ${color};"></span>`;
};

const applyLineKindTooltipMarkerStyle = (tooltipElement: HTMLElement, actualTooltip: ITooltipActual) => {
  const content = Array.isArray(actualTooltip.content) ? actualTooltip.content : [];
  const shapeColumn = tooltipElement.querySelector<HTMLElement>('[data-col="shape"]');
  if (!shapeColumn) return;

  const shapeRows = Array.from(shapeColumn.children) as HTMLElement[];
  content.forEach((item, index) => {
    const datum = asProductTrendDatum(item.datum);
    const shapeRow = shapeRows[index];
    if (!datum || !shapeRow) return;

    shapeRow.style.display = 'flex';
    shapeRow.style.alignItems = 'center';
    shapeRow.style.justifyContent = 'center';
    shapeRow.style.height = `${TOOLTIP_BODY_LINE_HEIGHT}px`;
    shapeRow.style.lineHeight = `${TOOLTIP_BODY_LINE_HEIGHT}px`;
    shapeRow.innerHTML = renderTooltipLineKindMarker(datum, item.shapeStroke || item.shapeFill);
  });
};

const applyScrollableTooltipStyle = (tooltipElement: HTMLElement, maxHeight: number) => {
  tooltipElement.dataset.targetTrendScrollableTooltip = 'true';
  tooltipElement.style.maxHeight = `${maxHeight}px`;
  tooltipElement.style.width = 'max-content';
  tooltipElement.style.maxWidth = `${FINAL_SCHEME_TOOLTIP_MAX_WIDTH}px`;
  tooltipElement.style.overflowY = 'auto';
  tooltipElement.style.overflowX = 'hidden';
  tooltipElement.style.pointerEvents = 'auto';
  tooltipElement.style.overscrollBehavior = 'contain';
  tooltipElement.onscroll = null;

  tooltipElement.querySelectorAll<HTMLElement>('*').forEach((element) => {
    element.style.maxWidth = `${FINAL_SCHEME_TOOLTIP_MAX_WIDTH}px`;
  });
  tooltipElement.querySelectorAll<HTMLElement>('[class*="value"], [class*="Value"]').forEach((element) => {
    element.style.whiteSpace = 'nowrap';
  });
};

const getVisibleAlignedTooltipElements = (scope: string) =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-target-trend-scrollable-tooltip="true"][data-target-trend-tooltip-align-scope="${scope}"]`,
    ),
  ).filter((tooltipElement) => {
    const rect = tooltipElement.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

const findTooltipAnchorElement = (scope: string, metricKey: string) =>
  Array.from(
    document.querySelectorAll<HTMLElement>(`[data-target-trend-tooltip-anchor-scope="${scope}"]`),
  ).find((element) => element.dataset.targetTrendTooltipAnchorMetricKey === metricKey);

type SplitTooltipAlignmentItem = {
  tooltipElement: HTMLElement;
  tooltipTop: number;
  tooltipLeft: number;
  tooltipWidth: number;
  anchorTop: number;
  anchorLeft: number;
  anchorWidth: number;
  alignSinglePointSide: boolean;
};

const getSinglePointTooltipSide = (items: SplitTooltipAlignmentItem[]) => {
  const viewportRight = window.innerWidth - SINGLE_POINT_TOOLTIP_VIEWPORT_PADDING;
  const getOverflow = (side: 'left' | 'right') =>
    items.reduce((total, { tooltipWidth, anchorLeft, anchorWidth }) => {
      const hoverLineX = anchorLeft + anchorWidth / 2;
      const nextLeft =
        side === 'left'
          ? hoverLineX - tooltipWidth - SINGLE_POINT_TOOLTIP_GAP
          : hoverLineX + SINGLE_POINT_TOOLTIP_GAP;
      const nextRight = nextLeft + tooltipWidth;

      return (
        total +
        Math.max(0, SINGLE_POINT_TOOLTIP_VIEWPORT_PADDING - nextLeft) +
        Math.max(0, nextRight - viewportRight)
      );
    }, 0);

  return getOverflow('left') <= getOverflow('right') ? 'left' : 'right';
};

const alignSplitTooltipRows = (scope: string) => {
  window.requestAnimationFrame(() => {
    const rows: Array<Array<SplitTooltipAlignmentItem>> = [];

    getVisibleAlignedTooltipElements(scope).forEach((tooltipElement) => {
      tooltipElement.style.marginTop = '';
      tooltipElement.style.marginLeft = '';

      const metricKey = tooltipElement.dataset.targetTrendTooltipAlignMetricKey;
      if (!metricKey) return;

      const anchorElement = findTooltipAnchorElement(scope, metricKey);
      if (!anchorElement) return;

      const anchorRect = anchorElement.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();
      const anchorTop = anchorRect.top;
      const tooltipTop = tooltipRect.top;
      const existingRow = rows.find((row) =>
        row.some((item) => Math.abs(item.anchorTop - anchorTop) <= TOOLTIP_ROW_ALIGNMENT_TOLERANCE),
      );
      const rowItem = {
        tooltipElement,
        tooltipTop,
        tooltipLeft: tooltipRect.left,
        tooltipWidth: tooltipRect.width,
        anchorTop,
        anchorLeft: anchorRect.left,
        anchorWidth: anchorRect.width,
        alignSinglePointSide: tooltipElement.dataset.targetTrendTooltipAlignSinglePointSide === 'true',
      };

      if (existingRow) {
        existingRow.push(rowItem);
      } else {
        rows.push([rowItem]);
      }
    });

    const singlePointItems = rows.flat().filter((item) => item.alignSinglePointSide);
    const singlePointTooltipSide = getSinglePointTooltipSide(singlePointItems);

    rows.forEach((row) => {
      if (row.length >= 2) {
        const alignedTop = Math.min(...row.map((item) => item.tooltipTop));
        row.forEach(({ tooltipElement, tooltipTop }) => {
          tooltipElement.style.marginTop = `${alignedTop - tooltipTop}px`;
        });
      }

      row.forEach(({ tooltipElement, tooltipLeft, tooltipWidth, anchorLeft, anchorWidth }) => {
        if (tooltipElement.dataset.targetTrendTooltipAlignSinglePointSide !== 'true') return;

        const hoverLineX = anchorLeft + anchorWidth / 2;
        const preferredLeft =
          singlePointTooltipSide === 'left'
            ? hoverLineX - tooltipWidth - SINGLE_POINT_TOOLTIP_GAP
            : hoverLineX + SINGLE_POINT_TOOLTIP_GAP;
        const maxLeft = window.innerWidth - tooltipWidth - SINGLE_POINT_TOOLTIP_VIEWPORT_PADDING;
        const nextLeft = Math.min(Math.max(SINGLE_POINT_TOOLTIP_VIEWPORT_PADDING, preferredLeft), maxLeft);
        tooltipElement.style.marginLeft = `${nextLeft - tooltipLeft}px`;
      });
    });
  });
};

const applySplitTooltipAlignment = (tooltipElement: HTMLElement, alignment?: TooltipAlignmentConfig) => {
  if (!alignment) return;

  tooltipElement.dataset.targetTrendTooltipAlignScope = alignment.scope;
  tooltipElement.dataset.targetTrendTooltipAlignMetricKey = alignment.metricKey;
  tooltipElement.dataset.targetTrendTooltipAlignSinglePointSide = alignment.alignSinglePointSide ? 'true' : 'false';
  alignSplitTooltipRows(alignment.scope);
};

const renderProductTooltipTable = (tooltipElement: HTMLElement, actualTooltip: ITooltipActual, maxHeight?: number) => {
  if (maxHeight) {
    applyScrollableTooltipStyle(tooltipElement, maxHeight);
  }

  const content = Array.isArray(actualTooltip.content) ? actualTooltip.content : [];
  const tableRows = content
    .map((item) => asProductTrendDatum(item.datum))
    .filter((datum): datum is ProductTrendDatum => Boolean(datum))
    .sort((left, right) => {
      const metricDiff = getMetricSortIndex(left.metric) - getMetricSortIndex(right.metric);
      if (metricDiff !== 0) return metricDiff;

      const productDiff =
        PRODUCTS.findIndex((product) => product.name === left.product) -
        PRODUCTS.findIndex((product) => product.name === right.product);
      if (productDiff !== 0) return productDiff;

      return left.lineKind === right.lineKind ? 0 : left.lineKind === 'actual' ? -1 : 1;
    });

  if (!tableRows.length) return;

  const title = formatPeriodToDateGranularity(`${actualTooltip.title?.value ?? actualTooltip.title?.key ?? ''}`.trim());
  tooltipElement.innerHTML = `
    <div style="width: max-content; max-width: ${FINAL_SCHEME_TOOLTIP_MAX_WIDTH}px; color: var(--color-text-1, #1d2129); font-family: Roboto, 'PingFang SC', sans-serif;">
      ${
        title
          ? `<div style="margin-bottom: 8px; color: var(--color-text-3, #86909c); font-family: Roboto, 'PingFang SC', sans-serif; font-size: 12px; line-height: 20px; font-weight: 400;">${title}</div>`
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
                    <span style="display: flex; align-items: center; gap: 3.6px; min-width: 0; height: 20px; line-height: 20px;">
                      ${renderTooltipLineKindMarker(datum)}
                      <span style="min-width: 0; overflow-wrap: anywhere;">${getProductMetricLineLabel(datum)}</span>
                    </span>
                  </td>
                  <td style="padding: 7px 0 7px 0; border-bottom: 1px solid var(--color-border-1, #f2f3f5); color: var(--color-text-2, #4e5969); font-family: Roboto, 'PingFang SC', sans-serif; font-size: 12px; line-height: 20px; font-weight: 400; text-align: right; white-space: nowrap;">${formatTooltipValue(datum)}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
};

const buildSelectableLegendItems = (legendItems: SelectableLegendItem[]) => (items: unknown[] = []) =>
  legendItems.map((legendItem) => {
    const sourceItem =
      items.find((item) => {
        const label = getPathValue(item, ['label']);
        return typeof label === 'string' && label.includes(legendItem.name);
      }) ?? {};
    const sourceShape = getPathValue(sourceItem, ['shape']);

    return {
      ...(isRecord(sourceItem) ? sourceItem : {}),
      key: legendItem.name,
      label: legendItem.name,
      originalKey: legendItem.name,
      shape: {
        ...(isRecord(sourceShape) ? sourceShape : {}),
        fill: legendItem.color,
        stroke: legendItem.color,
        symbolType: 'square',
      },
    };
  });

const buildProductLegendSpec = (
  colorText2: string,
  colorText3: string,
  focusIconColor: string,
  legendItems = PRODUCTS.map((product) => ({ name: product.name, color: product.color })),
  legendMode: ProductLegendMode = 'product',
  selectedLegendNames?: string[] | null,
): LegendSpecWithPadding => ({
  visible: true,
  orient: 'bottom',
  position: 'start',
  layout: 'horizontal',
  interactive: true,
  select: {
    trigger: 'click',
  },
  allowAllCanceled: true,
  defaultSelected: selectedLegendNames ?? undefined,
  data: buildSelectableLegendItems(legendItems),
  customFilter: (data: ProductTrendDatum[], selectedItems: Array<string | number>) =>
    data.filter((datum) => selectedItems.includes(getProductLegendName(datum, legendMode))),
  item: {
    spaceCol: 18,
    spaceRow: 4,
    padding: 0,
    height: 20,
    shape: {
      space: 6,
      style: {
        size: 8,
      },
    },
    focus: true,
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
});

const buildProductCustomLegendItems = (
  data: ProductTrendDatum[],
  legendMode: ProductLegendMode,
): CustomPagedLegendItem[] =>
  Array.from(new Map(data.map((item) => [getProductLegendName(item, legendMode), item.color]))).map(([name, color]) => ({
    name,
    color,
  }));

const buildMetricChartSpec = (
  metric: MetricConfig,
  data: ProductTrendDatum[],
  colorText2: string,
  colorText3: string,
  colorBorder2: string,
  colorFunctionalIcon1: string,
  showSinglePeriodPoints = false,
  tooltipAlignment?: TooltipAlignmentConfig,
  selectedLegendNames?: string[] | null,
  hideLegend = false,
): ICommonChartSpec => {
  const axisValueType = getMetricAxisValueType(metric);
  const activeLegendNameSet = selectedLegendNames ? new Set(selectedLegendNames) : null;
  const visibleData = activeLegendNameSet
    ? data.filter((item) => activeLegendNameSet.has(getProductLegendName(item, 'productDimension')))
    : data;
  const axisRange = getDynamicAxisRange(visibleData, axisValueType);
  const legendItems = buildProductCustomLegendItems(data, 'productDimension');
  const axes: ICartesianAxisSpec[] = [
    {
      orient: 'bottom',
      type: 'band',
      label: {
        visible: true,
        space: 2,
        style: { fill: colorText3 },
        formatMethod: formatPeriodToDateGranularity,
      },
      title: { visible: false },
    },
    {
      orient: 'left',
      type: 'linear',
      min: axisRange.min,
      max: axisRange.max,
      nice: false,
      sampling: false,
      tick: { forceTickCount: CHART_Y_AXIS_TICK_COUNT },
      label: {
        ...getYAxisLabelConfig(colorText3),
        formatMethod: (value: string | string[]) => {
          const rawValue = Number(Array.isArray(value) ? value[0] : value);
          return axisValueType === 'rate' ? `${rawValue.toFixed(0)}%` : formatCnyValue(rawValue);
        },
      },
      grid: { visible: true, style: { stroke: colorBorder2, lineDash: [4, 3], lineWidth: 1 } },
      title: { visible: false },
    },
  ];

  return {
    type: 'common',
    autoFit: true,
    background: '#fff',
    padding: { top: 8, right: 8, bottom: 0, left: 4 },
    data: [{ id: `${metric.key}Data`, values: visibleData }],
    series: [
      {
        id: `${metric.key}Series`,
        type: 'line',
        dataId: `${metric.key}Data`,
        xField: 'period',
        yField: 'value',
        seriesField: 'series',
        invalidType: 'link',
        animationState: { duration: 0 },
        line: {
          style: {
            stroke: (datum: Datum) => asProductTrendDatum(datum)?.color ?? '#A9AEB8',
            lineWidth: (datum: Datum) => (asProductTrendDatum(datum)?.lineKind === 'target' ? 1.5 : 2.25),
            lineDash: (datum: Datum) => (asProductTrendDatum(datum)?.lineKind === 'target' ? [6, 4] : [0, 0]),
          },
        },
        point: {
          visible: true,
          style: {
            size: (datum: Datum) => getSinglePeriodPointSize(showSinglePeriodPoints, asProductTrendDatum(datum)?.lineKind),
            symbolType: 'circle',
            fill: (datum: Datum) => {
              const trendDatum = asProductTrendDatum(datum);
              if (!trendDatum) return '#A9AEB8';
              return trendDatum.lineKind === 'target' ? '#fff' : trendDatum.color;
            },
            stroke: (datum: Datum) => {
              const trendDatum = asProductTrendDatum(datum);
              if (!trendDatum) return '#fff';
              return trendDatum.lineKind === 'target' ? trendDatum.color : '#fff';
            },
            fillOpacity: (datum: Datum) =>
              showSinglePeriodPoints && asProductTrendDatum(datum) ? 1 : 0,
            strokeOpacity: showSinglePeriodPoints ? 1 : 0,
            lineWidth: showSinglePeriodPoints ? 2 : 0,
            lineDash: (datum: Datum) => (asProductTrendDatum(datum)?.lineKind === 'target' ? [3, 2] : [0, 0]),
          },
          state: {
            hover: {
              visible: true,
              style: {
                ...FINAL_HOVER_POINT_STYLE,
                fill: (datum: Datum) => asProductTrendDatum(datum)?.color ?? '#A9AEB8',
              },
            },
            dimension_hover: {
              visible: true,
              style: {
                ...FINAL_HOVER_POINT_STYLE,
                fill: (datum: Datum) => asProductTrendDatum(datum)?.color ?? '#A9AEB8',
              },
            },
          },
        },
      },
    ],
    axes,
    legends: hideLegend
      ? { visible: false }
      : [buildProductLegendSpec(colorText2, colorText3, colorFunctionalIcon1, legendItems, 'productDimension')],
    tooltip: {
      renderMode: 'html',
      enterable: true,
      confine: true,
      updateElement: (tooltipElement: HTMLElement, actualTooltip: ITooltipActual) => {
        applyScrollableTooltipStyle(tooltipElement, FINAL_SCHEME_SPLIT_TOOLTIP_MAX_HEIGHT);
        applyLineKindTooltipMarkerStyle(tooltipElement, actualTooltip);
        applySplitTooltipAlignment(tooltipElement, tooltipAlignment);
      },
      dimension: {
        shapeType: 'square',
        shapeSize: 10,
        updateTitle: (title: ITooltipActual['title']) => ({
          ...title,
          value: formatPeriodToDateGranularity(title?.value ?? title?.key ?? ''),
        }),
        updateContent: (items: ITooltipLineActual[] = []) =>
          items
            .map((item) => {
              const datum = asProductTrendDatum(item.datum);
              if (!datum) return item;

              return {
                ...item,
                key: getProductLineLabel(datum),
                value: formatTooltipValue(datum),
                shapeStroke: datum.color,
                shapeFill: datum.color,
              };
            })
            .sort((left, right) => {
              const leftDatum = left.datum;
              const rightDatum = right.datum;
              if (!leftDatum || !rightDatum) return 0;

              const productDiff =
                PRODUCTS.findIndex((product) => product.name === leftDatum.product) -
                PRODUCTS.findIndex((product) => product.name === rightDatum.product);
              if (productDiff !== 0) return productDiff;
              return leftDatum.lineKind === rightDatum.lineKind ? 0 : leftDatum.lineKind === 'actual' ? -1 : 1;
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
        shape: { size: 10, spacing: 3.6 },
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

const buildProductLineSeriesSpec = (
  dataId: string,
  axisValueType: AxisValueType,
  showSinglePeriodPoints = false,
): NonNullable<ICommonChartSpec['series']>[number] => ({
  id: axisValueType === 'price' ? 'priceSeries' : 'rateSeries',
  type: 'line' as const,
  dataId,
  xField: 'period',
  yField: 'value',
  seriesField: 'series',
  invalidType: 'link',
  animationState: { duration: 0 },
  line: {
    style: {
      stroke: (datum: Datum) => asProductTrendDatum(datum)?.color ?? '#A9AEB8',
      lineWidth: (datum: Datum) => (asProductTrendDatum(datum)?.lineKind === 'target' ? 1.5 : 2.25),
      lineDash: (datum: Datum) => (asProductTrendDatum(datum)?.lineKind === 'target' ? [6, 4] : [0, 0]),
    },
  },
  point: {
    visible: true,
    style: {
      size: (datum: Datum) => getSinglePeriodPointSize(showSinglePeriodPoints, asProductTrendDatum(datum)?.lineKind),
      symbolType: 'circle',
      fill: (datum: Datum) => {
        const trendDatum = asProductTrendDatum(datum);
        if (!trendDatum) return '#A9AEB8';
        return trendDatum.lineKind === 'target' ? '#fff' : trendDatum.color;
      },
      stroke: (datum: Datum) => {
        const trendDatum = asProductTrendDatum(datum);
        if (!trendDatum) return '#fff';
        return trendDatum.lineKind === 'target' ? trendDatum.color : '#fff';
      },
      fillOpacity: (datum: Datum) =>
        showSinglePeriodPoints && asProductTrendDatum(datum) ? 1 : 0,
      strokeOpacity: showSinglePeriodPoints ? 1 : 0,
      lineWidth: showSinglePeriodPoints ? 2 : 0,
      lineDash: (datum: Datum) => (asProductTrendDatum(datum)?.lineKind === 'target' ? [3, 2] : [0, 0]),
    },
    state: {
      hover: {
        visible: true,
        style: {
          ...FINAL_HOVER_POINT_STYLE,
          fill: (datum: Datum) => asProductTrendDatum(datum)?.color ?? '#A9AEB8',
        },
      },
      dimension_hover: {
        visible: true,
        style: {
          ...FINAL_HOVER_POINT_STYLE,
          fill: (datum: Datum) => asProductTrendDatum(datum)?.color ?? '#A9AEB8',
        },
      },
    },
  },
});

const buildFinalOverviewChartSpec = (
  data: ProductTrendDatum[],
  colorText2: string,
  colorText3: string,
  colorBorder2: string,
  colorFunctionalIcon1: string,
  selectedLegendNames?: string[] | null,
  showSinglePeriodPoints = false,
  hideLegend = false,
): ICommonChartSpec => {
  const activeLegendNameSet = selectedLegendNames ? new Set(selectedLegendNames) : null;
  const visibleData = activeLegendNameSet
    ? data.filter((item) => activeLegendNameSet.has(getProductLegendName(item, 'productMetricGroup')))
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
  const legendItems = buildProductCustomLegendItems(data, 'productMetricGroup');
  const axes: ICartesianAxisSpec[] = [
    {
      orient: 'bottom',
      type: 'band',
      label: {
        visible: true,
        space: 2,
        style: { fill: colorText3 },
        formatMethod: formatPeriodToDateGranularity,
      },
      title: { visible: false },
    },
    ...(isDualAxis
      ? [
          {
            orient: 'left' as const,
            id: 'priceAxis',
            type: 'linear' as const,
            seriesId: ['priceSeries'],
            min: priceAxisRange.min,
            max: priceAxisRange.max,
            nice: false,
            sampling: false,
            tick: { forceTickCount: CHART_Y_AXIS_TICK_COUNT },
            label: {
              ...getYAxisLabelConfig(colorText3),
              formatMethod: (value: string | string[]) =>
                formatCnyValue(Number(Array.isArray(value) ? value[0] : value)),
            },
            grid: { visible: true, style: { stroke: colorBorder2, lineDash: [4, 3], lineWidth: 1 } },
            title: { visible: false },
          },
          {
            orient: 'right' as const,
            id: 'rateAxis',
            type: 'linear' as const,
            min: rateAxisRange.min,
            max: rateAxisRange.max,
            nice: false,
            seriesId: ['rateSeries'],
            sampling: false,
            tick: { forceTickCount: CHART_Y_AXIS_TICK_COUNT },
            label: {
              ...getYAxisLabelConfig(colorText3),
              formatMethod: (value: string | string[]) =>
                `${Number(Array.isArray(value) ? value[0] : value).toFixed(0)}%`,
            },
            grid: { visible: false },
            title: { visible: false },
          },
        ]
      : [
          {
            orient: 'left' as const,
            id: singleAxisValueType === 'rate' ? 'rateAxis' : 'priceAxis',
            type: 'linear' as const,
            seriesId: [singleAxisValueType === 'rate' ? 'rateSeries' : 'priceSeries'],
            min: singleAxisRange.min,
            max: singleAxisRange.max,
            nice: false,
            sampling: false,
            tick: { forceTickCount: CHART_Y_AXIS_TICK_COUNT },
            label: {
              ...getYAxisLabelConfig(colorText3),
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
      { id: 'overviewPriceData', values: visiblePriceData },
      { id: 'overviewRateData', values: visibleRateData },
    ],
    series: [
      buildProductLineSeriesSpec('overviewPriceData', 'price', showSinglePeriodPoints),
      buildProductLineSeriesSpec('overviewRateData', 'rate', showSinglePeriodPoints),
    ],
    axes,
    legends: hideLegend
      ? { visible: false }
      : [
          buildProductLegendSpec(
            colorText2,
            colorText3,
            colorFunctionalIcon1,
            legendItems,
            'productMetricGroup',
            selectedLegendNames,
          ),
        ],
    tooltip: {
      renderMode: 'html',
      enterable: true,
      updateElement: (tooltipElement: HTMLElement, actualTooltip: ITooltipActual) => {
        applyScrollableTooltipStyle(tooltipElement, FINAL_SCHEME_TOOLTIP_MAX_HEIGHT);
        applyLineKindTooltipMarkerStyle(tooltipElement, actualTooltip);
      },
      dimension: {
        shapeType: 'square',
        shapeSize: 10,
        updateTitle: (title: ITooltipActual['title']) => ({
          ...title,
          value: formatPeriodToDateGranularity(title?.value ?? title?.key ?? ''),
        }),
        updateContent: (items: ITooltipLineActual[] = []) =>
          [...items]
            .sort((left, right) => {
              const leftDatum = asProductTrendDatum(left.datum);
              const rightDatum = asProductTrendDatum(right.datum);
              if (!leftDatum || !rightDatum) return 0;

              const metricDiff = getMetricSortIndex(leftDatum.metric) - getMetricSortIndex(rightDatum.metric);
              if (metricDiff !== 0) return metricDiff;

              const productDiff = leftDatum.product.localeCompare(rightDatum.product);
              if (productDiff !== 0) return productDiff;

              return leftDatum.lineKind === rightDatum.lineKind ? 0 : leftDatum.lineKind === 'actual' ? -1 : 1;
            })
            .map((item) => {
              const datum = asProductTrendDatum(item.datum);
              if (!datum) return item;

              return {
                ...item,
                key: getProductMetricLineLabel(datum),
                value: formatTooltipValue(datum),
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
        shape: { size: 10, spacing: 3.6 },
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

const getDimensionPeriod = (event: unknown) => {
  const period = getPathValue(event, ['dimensionInfo', '0', 'value']);
  return typeof period === 'string' || typeof period === 'number' ? String(period) : null;
};

function LineKindLegend() {
  return (
    <div className={styles.lineKindLegend} aria-label="实际与目标图例">
      <div className={styles.legendItem}>
        <span className={styles.legendLine} />
        <span className={styles.legendLabel}>实际</span>
      </div>
      <div className={styles.legendItem}>
        <span className={`${styles.legendLine} ${styles.legendLineDashed}`} />
        <span className={styles.legendLabel}>目标</span>
      </div>
    </div>
  );
}

function MetricTrendCard({ metric }: { metric: MetricConfig }) {
  const colorText2 = useMemo(() => getToken('--color-text-2', '#4E5969'), []);
  const colorText3 = useMemo(() => getToken('--color-text-3', '#86909C'), []);
  const colorBorder2 = useMemo(() => getToken('--color-border-2', '#EAEDF1'), []);
  const colorFunctionalIcon1 = useMemo(() => getToken('--color-functional-icon-1', '#6B7785'), []);
  const chartRef = useRef<IVChart | null>(null);
  const [legendFocusTooltip, setLegendFocusTooltip] = useState<{ x: number; y: number } | null>(null);
  const chartData = useMemo(() => buildProductTrendData(metric), [metric]);
  const spec = useMemo(
    () => buildMetricChartSpec(metric, chartData, colorText2, colorText3, colorBorder2, colorFunctionalIcon1),
    [chartData, colorBorder2, colorFunctionalIcon1, colorText2, colorText3, metric],
  );
  const hideLegendFocusTooltip = useCallback(() => {
    setLegendFocusTooltip(null);
  }, []);
  const handleLegendItemHover = useCallback((event: unknown) => {
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

  return (
    <Card className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleBlock}>
          <div className={styles.chartTitle}>
            {metric.name}
            <span className={styles.chartTitleUnit}>（{getMetricTitleDisplayUnit(metric)}）</span>
          </div>
        </div>
        <LineKindLegend />
      </div>

      <VChart
        spec={spec}
        className={styles.chart}
        style={{ height: 230 }}
        onReady={(chart) => {
          chartRef.current = chart;
        }}
        onLegendItemHover={handleLegendItemHover}
        onLegendItemUnHover={hideLegendFocusTooltip}
        onLegendItemClick={(event) => {
          hideLegendFocusTooltip();
          if (isLegendFocusIconEvent(event)) {
            showOnlyLegendItem(chartRef.current, event);
          }
        }}
        onPointerLeave={hideLegendFocusTooltip}
        onError={(error) => Message.error(`${metric.name} 趋势图加载失败：${error.message}`)}
      />

      {legendFocusTooltip && (
        <div className={styles.legendFocusTooltip} style={{ left: legendFocusTooltip.x, top: legendFocusTooltip.y }}>
          点击仅展示该数据
        </div>
      )}
    </Card>
  );
}

function ArchiveOverviewTrendChart() {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(ARCHIVE_DEFAULT_METRICS);
  const selectedMetricItems = useMemo(
    () => METRICS.filter((metric) => selectedMetrics.includes(metric.key)),
    [selectedMetrics],
  );

  return (
    <div className={styles.schemeStack}>
      <div className={styles.archiveLabel}>archive</div>
      <Card className={styles.filterCard}>
        <Select
          addBefore="指标"
          className={styles.metricSelect}
          mode="multiple"
          maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
          value={selectedMetrics}
          options={METRIC_OPTIONS}
          onChange={(value) => setSelectedMetrics(normalizeMetricSelection(value as string[] | string))}
          triggerProps={{ popupStyle: { width: 320 } }}
        />
      </Card>

      {selectedMetricItems.length > 0 ? (
        <div className={styles.chartGrid}>
          {selectedMetricItems.map((metric) => (
            <MetricTrendCard key={metric.key} metric={metric} />
          ))}
        </div>
      ) : (
        <Card className={styles.emptyCard}>请选择至少一个指标</Card>
      )}
    </div>
  );
}

function FinalOverviewTrendChart() {
  const colorText2 = useMemo(() => getToken('--color-text-2', '#4E5969'), []);
  const colorText3 = useMemo(() => getToken('--color-text-3', '#86909C'), []);
  const colorBorder2 = useMemo(() => getToken('--color-border-2', '#EAEDF1'), []);
  const colorFunctionalIcon1 = useMemo(() => getToken('--color-functional-icon-1', '#6B7785'), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overviewChartRef = useRef<IVChart | null>(null);
  const splitChartRefs = useRef<Partial<Record<MetricKey, IVChart>>>({});
  const draggingMetricKeyRef = useRef<MetricKey | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(DEFAULT_PRODUCTS);
  const [selectedBillingUnits, setSelectedBillingUnits] = useState<string[]>(DEFAULT_BILLING_UNITS);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(DEFAULT_METRICS);
  const [selectedLineKinds, setSelectedLineKinds] = useState<LineKind[]>(DEFAULT_LINE_KINDS);
  const [timeWindow, setTimeWindow] = useState('2026-08');
  const [viewMode, setViewMode] = useState<FinalViewMode>('multiple');
  const [selectedOverviewLegendNames, setSelectedOverviewLegendNames] = useState<string[] | null>(null);
  const [selectedSplitLegendNames, setSelectedSplitLegendNames] = useState<Partial<Record<MetricKey, string[] | null>>>({});
  const [metricOrder, setMetricOrder] = useState<MetricKey[]>(DEFAULT_METRICS);
  const [draggingMetricKey, setDraggingMetricKey] = useState<MetricKey | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const [lockedTooltip, setLockedTooltip] = useState<{ metricKey: MetricKey; period: string } | null>(null);
  const lockedTooltipRef = useRef<{ metricKey: MetricKey; period: string } | null>(null);
  const [legendFocusTooltip, setLegendFocusTooltip] = useState<{ x: number; y: number } | null>(null);

  const selectedPeriods = useMemo(() => (timeWindow === 'last6Months' ? PERIODS : [timeWindow]), [timeWindow]);
  const showSinglePeriodPoints = selectedPeriods.length === 1;
  const orderedSelectedMetrics = useMemo(
    () => metricOrder.filter((metricKey) => selectedMetrics.includes(metricKey)),
    [metricOrder, selectedMetrics],
  );
  const productAllState = useMemo(() => getAllSelectionState(selectedProducts, PRODUCT_OPTIONS), [selectedProducts]);
  const billingUnitAllState = useMemo(
    () => getAllSelectionState(selectedBillingUnits, BILLING_UNIT_OPTIONS),
    [selectedBillingUnits],
  );
  const regionAllState = useMemo(() => getAllSelectionState(selectedRegions, REGION_OPTIONS), [selectedRegions]);
  const finalProductOptions = useMemo(
    () => buildOptionsWithSelectAll(PRODUCT_OPTIONS, productAllState),
    [productAllState],
  );
  const finalBillingUnitOptions = useMemo(
    () => buildOptionsWithSelectAll(BILLING_UNIT_OPTIONS, billingUnitAllState),
    [billingUnitAllState],
  );
  const finalRegionOptions = useMemo(
    () => buildOptionsWithSelectAll(REGION_OPTIONS, regionAllState),
    [regionAllState],
  );
  const overviewChartData = useMemo(
    () =>
      buildFinalProductTrendData(
        selectedProducts,
        selectedMetrics,
        'metric',
        selectedBillingUnits,
        selectedRegions,
      ).filter((item) => selectedPeriods.includes(item.period) && selectedLineKinds.includes(item.lineKind)),
    [selectedBillingUnits, selectedLineKinds, selectedMetrics, selectedPeriods, selectedProducts, selectedRegions],
  );
  const overviewLegendItems = useMemo(
    () => buildProductCustomLegendItems(overviewChartData, 'productMetricGroup'),
    [overviewChartData],
  );
  const overviewLegendNames = useMemo(() => overviewLegendItems.map((item) => item.name), [overviewLegendItems]);
  const selectedOverviewLegendValues = selectedOverviewLegendNames ?? overviewLegendNames;
  const splitChartData = useMemo(
    () =>
      buildFinalProductTrendData(
        selectedProducts,
        selectedMetrics,
        'product',
        selectedBillingUnits,
        selectedRegions,
      ).filter((item) => selectedPeriods.includes(item.period) && selectedLineKinds.includes(item.lineKind)),
    [selectedBillingUnits, selectedLineKinds, selectedMetrics, selectedPeriods, selectedProducts, selectedRegions],
  );
  const splitLegendNames = useMemo(
    () => Array.from(new Set(splitChartData.map((item) => getProductLegendName(item, 'productDimension')))),
    [splitChartData],
  );
  const overviewSpec = useMemo(
    () =>
      buildFinalOverviewChartSpec(
        overviewChartData,
        colorText2,
        colorText3,
        colorBorder2,
        colorFunctionalIcon1,
        selectedOverviewLegendNames,
        showSinglePeriodPoints,
        true,
      ),
    [
      colorBorder2,
      colorFunctionalIcon1,
      colorText2,
      colorText3,
      overviewChartData,
      selectedOverviewLegendNames,
      showSinglePeriodPoints,
    ],
  );
  const splitChartItems = useMemo(
    () =>
      orderedSelectedMetrics.map((metricKey) => {
        const metric = getMetricByKey(metricKey);
        const metricData = splitChartData.filter((item) => item.metric === metric.key);
        const legendItems = buildProductCustomLegendItems(metricData, 'productDimension');
        const selectedLegendNames = selectedSplitLegendNames[metric.key] ?? legendItems.map((item) => item.name);
        return {
          metric,
          legendItems,
          selectedLegendNames,
          spec: buildMetricChartSpec(
            metric,
            metricData,
            colorText2,
            colorText3,
            colorBorder2,
            colorFunctionalIcon1,
            showSinglePeriodPoints,
            { scope: 'overview-final-split', metricKey: metric.key, alignSinglePointSide: showSinglePeriodPoints },
            selectedLegendNames,
            true,
          ),
        };
      }),
    [
      colorBorder2,
      colorFunctionalIcon1,
      colorText2,
      colorText3,
      orderedSelectedMetrics,
      selectedSplitLegendNames,
      showSinglePeriodPoints,
      splitChartData,
    ],
  );

  const clearLockedTooltip = useCallback(() => {
    lockedTooltipRef.current = null;
    setLockedTooltip(null);
    Object.values(splitChartRefs.current).forEach((chart) => {
      chart?.hideTooltip();
      chart?.setDimensionIndex(null as unknown as string, { tooltip: false, crosshair: true });
    });
  }, []);
  const hideLegendFocusTooltip = useCallback(() => {
    setLegendFocusTooltip(null);
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
  const handleLegendItemHover = useCallback((event: unknown) => {
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
  const handleOverviewLegendSelectedDataChange = useCallback((event: unknown) => {
    const eventSelected = getPathValue(event, ['event', 'detail', 'currentSelected']);
    const selectedData =
      overviewChartRef.current?.getLegendSelectedDataByIndex(0) ??
      (Array.isArray(eventSelected) ? eventSelected : []);
    const nextSelectedLegendNames = selectedData.map(String);
    setSelectedOverviewLegendNames((current) =>
      isSameStringArray(current, nextSelectedLegendNames) ? current : nextSelectedLegendNames,
    );
  }, []);
  const handleSplitDimensionClick = useCallback(
    (metricKey: MetricKey, event: unknown) => {
      const period = getDimensionPeriod(event);
      if (!period) return;

      const nextLockedTooltip = { metricKey, period };
      lockedTooltipRef.current = nextLockedTooltip;
      setLockedTooltip(nextLockedTooltip);
      syncSplitTooltip(period);
    },
    [syncSplitTooltip],
  );
  const handleSplitDimensionHover = useCallback(
    (event: unknown) => {
      if (lockedTooltipRef.current) return;

      const period = getDimensionPeriod(event);
      if (getPathValue(event, ['action']) === 'leave' || !period) {
        clearLockedTooltip();
        return;
      }

      syncSplitTooltip(period);
    },
    [clearLockedTooltip, syncSplitTooltip],
  );
  const moveFacetChart = useCallback((sourceMetricKey: MetricKey, event: unknown) => {
    const point = getClientPointFromVChartEvent(event);
    draggingMetricKeyRef.current = null;
    setDraggingMetricKey(null);
    setDragPreview(null);
    if (!point) return;

    const targetElement = document
      .elementsFromPoint(point.clientX, point.clientY)
      .map((element) => element.closest?.('[data-overview-final-metric-key]'))
      .find((element): element is HTMLElement => element instanceof HTMLElement);
    const targetMetricKey = targetElement?.dataset.overviewFinalMetricKey as MetricKey | undefined;

    if (!targetMetricKey || targetMetricKey === sourceMetricKey) return;

    setMetricOrder((current) =>
      reorderList(current, current.indexOf(sourceMetricKey), current.indexOf(targetMetricKey)),
    );
  }, []);
  const handleFacetDragStart = useCallback((metricKey: MetricKey, event: React.PointerEvent<HTMLDivElement>) => {
    const point = getClientPointFromVChartEvent(event);
    const cardElement = event.currentTarget.closest('[data-overview-final-metric-key]');
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
    setSelectedSplitLegendNames({});
  }, [selectedBillingUnits, selectedLineKinds, selectedMetrics, selectedProducts, selectedRegions, timeWindow]);

  useEffect(() => {
    clearLockedTooltip();
    hideLegendFocusTooltip();
  }, [
    clearLockedTooltip,
    hideLegendFocusTooltip,
    selectedBillingUnits,
    selectedLineKinds,
    selectedMetrics,
    selectedProducts,
    selectedRegions,
    timeWindow,
    viewMode,
  ]);

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

  if (
    !selectedProducts.length ||
    !selectedBillingUnits.length ||
    !selectedRegions.length ||
    !selectedMetrics.length ||
    !selectedLineKinds.length
  ) {
    return (
      <div className={styles.schemeStack}>
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
            addBefore="数据取值"
            className={styles.dualAxisMultiSelect}
            mode="multiple"
            maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
            value={selectedLineKinds}
            options={LINE_KIND_OPTIONS}
            onChange={(value) => setSelectedLineKinds(normalizeLineKindSelection(value as string[] | string))}
            triggerProps={{ popupStyle: { width: 180 } }}
          />
          <Select
            addBefore="商品"
            className={styles.dualAxisMultiSelect}
            mode="multiple"
            maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
            value={selectedProducts}
            options={finalProductOptions}
            onChange={(value) =>
              setSelectedProducts(normalizeSelectionWithAll(value as string[] | string, PRODUCT_OPTIONS, selectedProducts))
            }
            triggerProps={{ popupStyle: { width: 220 } }}
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
            triggerProps={{ popupStyle: { width: 260 } }}
          />
          <Select
            addBefore="大区"
            className={styles.dualAxisMultiSelect}
            mode="multiple"
            maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
            value={selectedRegions}
            options={finalRegionOptions}
            onChange={(value) =>
              setSelectedRegions(normalizeSelectionWithAll(value as string[] | string, REGION_OPTIONS, selectedRegions))
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
            <Radio value="single">单图聚合</Radio>
            <Radio value="multiple">多图拆分</Radio>
          </Radio.Group>
        </div>
        <Card className={styles.emptyCard}>请选择至少一个指标、数据取值、商品、计费单元和大区</Card>
      </div>
    );
  }

  return (
    <div className={styles.schemeStack} ref={containerRef}>
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
          addBefore="数据取值"
          className={styles.dualAxisMultiSelect}
          mode="multiple"
          maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
          value={selectedLineKinds}
          options={LINE_KIND_OPTIONS}
          onChange={(value) => setSelectedLineKinds(normalizeLineKindSelection(value as string[] | string))}
          triggerProps={{ popupStyle: { width: 180 } }}
        />
        <Select
          addBefore="商品"
          className={styles.dualAxisMultiSelect}
          mode="multiple"
          maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
          value={selectedProducts}
          options={finalProductOptions}
          onChange={(value) =>
            setSelectedProducts(normalizeSelectionWithAll(value as string[] | string, PRODUCT_OPTIONS, selectedProducts))
          }
          triggerProps={{ popupStyle: { width: 220 } }}
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
          triggerProps={{ popupStyle: { width: 260 } }}
        />
        <Select
          addBefore="大区"
          className={styles.dualAxisMultiSelect}
          mode="multiple"
          maxTagCount={{ count: 'responsive', render: (invisibleTagCount) => `+${invisibleTagCount}` }}
          value={selectedRegions}
          options={finalRegionOptions}
          onChange={(value) =>
            setSelectedRegions(normalizeSelectionWithAll(value as string[] | string, REGION_OPTIONS, selectedRegions))
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
          <Radio value="single">单图聚合</Radio>
          <Radio value="multiple">多图拆分</Radio>
        </Radio.Group>
      </div>

      {viewMode === 'multiple' ? (
        <div className={styles.dualAxisFacetsGrid}>
          {splitChartItems.map(({ metric, spec, legendItems, selectedLegendNames }) => {
            if (draggingMetricKey === metric.key) {
              return (
                <div
                  key={metric.key}
                  className={`${styles.dualAxisPanel} ${styles.dualAxisDraggablePanel} ${styles.dualAxisDragPlaceholder}`}
                  data-overview-final-metric-key={metric.key}
                />
              );
            }

            return (
              <Card
                key={metric.key}
                className={`${styles.dualAxisPanel} ${styles.dualAxisDraggablePanel}`}
                data-overview-final-metric-key={metric.key}
                data-target-trend-tooltip-anchor-scope="overview-final-split"
                data-target-trend-tooltip-anchor-metric-key={metric.key}
              >
                <div
                  className={`${styles.chartHeader} ${styles.dualAxisDragHeader}`}
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

                <div className={styles.dualAxisChartStage}>
                  <VChart
                    spec={spec}
                    className={styles.dualAxisFacetChart}
                    style={{ height: '100%' }}
                    onReady={(chart) => {
                      splitChartRefs.current[metric.key] = chart;
                    }}
                    onDimensionHover={handleSplitDimensionHover}
                    onDimensionClick={(event) => handleSplitDimensionClick(metric.key, event)}
                    onPointerLeave={() => {
                      hideLegendFocusTooltip();
                      if (!lockedTooltipRef.current) {
                        clearLockedTooltip();
                      }
                    }}
                    onError={(error) => Message.error(`最终方案 ${metric.name} 趋势图加载失败：${error.message}`)}
                  />
                  <CustomPagedLegend
                    items={legendItems}
                    selectedNames={selectedLegendNames}
                    onSelectedNamesChange={(nextSelectedNames) =>
                      setSelectedSplitLegendNames((current) => ({
                        ...current,
                        [metric.key]: nextSelectedNames,
                      }))
                    }
                  />
                </div>
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
              <div className={`${styles.chartHeader} ${styles.dualAxisDragHeader}`}>
                <div className={styles.chartTitleBlock}>
                  <div className={`${styles.chartTitle} ${styles.dualAxisDragTitle}`}>
                    <span className={styles.dualAxisDragHandle} aria-hidden="true" />
                    {dragPreviewItem.metric.name}
                    <span className={styles.chartTitleUnit}>（{getMetricTitleDisplayUnit(dragPreviewItem.metric)}）</span>
                  </div>
                </div>
                <LineKindLegend />
              </div>

              <div className={styles.dualAxisChartStage}>
                <VChart
                  spec={dragPreviewItem.spec}
                  className={styles.dualAxisFacetChart}
                  style={{ height: '100%' }}
                  onError={(error) =>
                    Message.error(`最终方案 ${dragPreviewItem.metric.name} 趋势图加载失败：${error.message}`)
                  }
                />
                <CustomPagedLegend
                  items={dragPreviewItem.legendItems}
                  selectedNames={dragPreviewItem.selectedLegendNames}
                  onSelectedNamesChange={() => undefined}
                  showOnlyAction={false}
                />
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className={styles.dualAxisPanel}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleBlock}>
              <div className={styles.chartTitle}>指标实际/目标趋势图</div>
            </div>
            <LineKindLegend />
          </div>

          <div className={styles.dualAxisChartStage}>
            <VChart
              spec={overviewSpec}
              className={styles.dualAxisChart}
              style={{ height: '100%' }}
              onReady={(chart) => {
                overviewChartRef.current = chart;
              }}
              onPointerLeave={hideLegendFocusTooltip}
              onError={(error) => Message.error(`最终方案趋势图加载失败：${error.message}`)}
            />
            <CustomPagedLegend
              items={overviewLegendItems}
              selectedNames={selectedOverviewLegendValues}
              onSelectedNamesChange={setSelectedOverviewLegendNames}
            />
          </div>
        </Card>
      )}

      {legendFocusTooltip && (
        <div className={styles.legendFocusTooltip} style={{ left: legendFocusTooltip.x, top: legendFocusTooltip.y }}>
          点击仅展示该数据
        </div>
      )}
    </div>
  );
}

const chartRefOrNull = (chart: IVChart | undefined) => chart ?? null;

const OverviewTrendChart: React.FC = () => {
  const [activeScheme, setActiveScheme] = useState<OverviewSchemeKey>('final');

  useEffect(() => {
    const previousUniqueTooltip = VChartCore.globalConfig.uniqueTooltip;
    VChartCore.globalConfig.uniqueTooltip = false;

    return () => {
      VChartCore.globalConfig.uniqueTooltip = previousUniqueTooltip;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <PageHeader.PageHeaderPro
          title="总览趋势图"
          subTitle={[
            { label: '商品', value: 'Bytegraph / ByteNDB / Mysql / CACHE / Abase' },
            { label: '口径', value: '商品 × 月' },
            { label: '图表组件', value: 'VChart' },
          ]}
        />
        <Divider className={styles.headerDivider} />
      </div>

      <div className={styles.content}>
        <Tabs type="card-gutter" activeTab={activeScheme} onChange={(key) => setActiveScheme(key as OverviewSchemeKey)}>
          <Tabs.TabPane key="archive" title="方案一：archive" />
          <Tabs.TabPane key="final" title="方案二：最终方案" />
        </Tabs>

        {activeScheme === 'archive' ? <ArchiveOverviewTrendChart /> : <FinalOverviewTrendChart />}
      </div>
    </div>
  );
};

export default OverviewTrendChart;
