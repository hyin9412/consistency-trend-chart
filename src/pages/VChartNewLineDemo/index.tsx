import { Button, Card, Divider, Message, PageHeader, Select } from '@tod-m/materials/ve-o';
import { type ILineChartSpec } from '@visactor/vchart';
import { VChart } from '@visactor/react-vchart';
import React, { useMemo, useState } from 'react';
import styles from './index.module.scss';

type TimeRange = '7d' | '14d' | '30d';

interface TrendPoint {
  date: string;
  value: number;
  series: string;
}

const SERIES = [
  { name: '订单服务', color: '#4080FF', base: 96.8, wave: 0.55, phase: 1 },
  { name: '用户服务', color: '#14C9C9', base: 98.1, wave: 0.38, phase: 3 },
  { name: '支付服务', color: '#FF7D00', base: 97.4, wave: 0.48, phase: 5 },
];
const RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '14d': 14, '30d': 30 };
const RANGE_OPTIONS = [
  { label: '最近 7 天', value: '7d' },
  { label: '最近 14 天', value: '14d' },
  { label: '最近 30 天', value: '30d' },
];
const BORDER_FALLBACK = '#EAEDF1';
const TEXT_2_FALLBACK = '#4E5969';
const TEXT_3_FALLBACK = '#86909C';
const TOOLTIP_FONT_FAMILY = 'Roboto, "PingFang SC", sans-serif';

const getToken = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

const formatDate = (offset: number) => {
  const date = new Date('2026-08-27T00:00:00');
  date.setDate(date.getDate() - offset);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const buildData = (days: number): TrendPoint[] =>
  SERIES.flatMap((item) =>
    Array.from({ length: days }, (_, index) => {
      const offset = days - index - 1;
      const value =
        item.base +
        Math.sin((offset + item.phase) / 2.3) * item.wave +
        Math.cos((offset + item.phase) / 4.7) * item.wave * 0.5;
      return {
        date: formatDate(offset),
        value: Number(Math.min(99.8, Math.max(95.8, value)).toFixed(2)),
        series: item.name,
      };
    }),
  );

const VChartNewLineDemo: React.FC = () => {
  const [range, setRange] = useState<TimeRange>('7d');
  const [selectedSeries, setSelectedSeries] = useState(SERIES.map((item) => item.name));
  const colorBorder2 = useMemo(() => getToken('--color-border-2', BORDER_FALLBACK), []);
  const colorText2 = useMemo(() => getToken('--color-text-2', TEXT_2_FALLBACK), []);
  const colorText3 = useMemo(() => getToken('--color-text-3', TEXT_3_FALLBACK), []);
  const chartData = useMemo(
    () => buildData(RANGE_DAYS[range]).filter((item) => selectedSeries.includes(item.series)),
    [range, selectedSeries],
  );

  const spec = useMemo<ILineChartSpec>(
    () => ({
      type: 'line',
      autoFit: true,
      padding: 0,
      data: [{ id: 'api-success-rate', values: chartData }],
      xField: 'date',
      yField: 'value',
      seriesField: 'series',
      color: {
        field: 'series',
        type: 'ordinal',
        domain: SERIES.map((item) => item.name),
        range: SERIES.map((item) => item.color),
      },
      line: { style: { lineWidth: 2 } },
      point: {
        visible: true,
        style: { size: 0, fillOpacity: 0, strokeOpacity: 0, lineWidth: 0 },
        state: {
          hover: {
            visible: true,
            style: { size: 8, symbolType: 'circle', lineWidth: 1, stroke: '#fff', fillOpacity: 1, strokeOpacity: 1 },
          },
        },
      },
      axes: [
        {
          orient: 'bottom',
          type: 'band',
          label: { visible: true, space: 2 },
          title: { visible: false },
        },
        {
          orient: 'left',
          type: 'linear',
          min: 95,
          max: 100,
          label: {
            visible: true,
            space: 4,
            formatMethod: (value: string | string[]) => `${Array.isArray(value) ? value[0] : value}%`,
          },
          grid: { visible: true, style: { stroke: colorBorder2, lineDash: [4, 2], lineWidth: 1 } },
          title: { visible: false },
        },
      ],
      legends: { visible: false },
      tooltip: {
        renderMode: 'html',
        style: {
          shape: { size: 12, spacing: 10 },
          titleLabel: {
            fontFamily: TOOLTIP_FONT_FAMILY,
            fontSize: 12,
            lineHeight: 20,
            fill: colorText3,
            textBaseline: 'middle',
          },
          valueLabel: {
            fontFamily: TOOLTIP_FONT_FAMILY,
            fontSize: 12,
            lineHeight: 20,
            fill: colorText2,
            textBaseline: 'middle',
          },
          spaceRow: 2,
          align: 'left',
        },
      },
      crosshair: {
        trigger: 'hover',
        xField: { visible: true, line: { visible: true, type: 'rect', width: 1, style: { fill: colorBorder2 } } },
        yField: { visible: false },
      },
    }),
    [chartData, colorBorder2, colorText2, colorText3],
  );

  const toggleSeries = (name: string) => {
    setSelectedSeries((current) => {
      if (current.includes(name) && current.length === 1) {
        Message.warning('至少保留一个服务系列');
        return current;
      }
      return current.includes(name) ? current.filter((item) => item !== name) : [...current, name];
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <PageHeader.PageHeaderPro
          title="API 请求成功率趋势"
          subTitle={[
            { label: '场景', value: '服务稳定性监控' },
            { label: '图表库', value: 'VChart' },
            { label: '数据来源', value: 'Mock 示例数据' },
          ]}
        />
        <Divider className={styles.headerDivider} />
      </div>
      <div className={styles.content}>
        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.chartTitle}>服务成功率</div>
              <div className={styles.helperText}>按服务查看最近一段时间的请求成功率变化</div>
            </div>
            <Select
              value={range}
              options={RANGE_OPTIONS}
              onChange={(value) => setRange(value as TimeRange)}
              triggerProps={{ popupStyle: { width: 120 } }}
            />
          </div>
          <div className={styles.chartStage}>
            <VChart
              spec={spec}
              className={styles.chart}
              style={{ height: 360 }}
              onError={(error) => Message.error(`折线图加载失败：${error.message}`)}
            />
          </div>
          <div className={styles.legend} role="list" aria-label="服务系列">
            {SERIES.map((item) => {
              const selected = selectedSeries.includes(item.name);
              return (
                <Button
                  key={item.name}
                  type="text"
                  className={`${styles.legendItem} ${selected ? '' : styles.legendItemMuted}`}
                  onClick={() => toggleSeries(item.name)}
                  aria-pressed={selected}
                >
                  <span className={styles.legendMarker} style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </Button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VChartNewLineDemo;
