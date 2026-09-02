import { IconExitFullScreenV2, IconFullScreenV2 } from '@arco-design/iconbox-react-ve-o-design';
import { CloudEChart, type CloudEChartOption } from '@cloud-materials/charts-common';
import { Button, Card, Divider, Message, PageHeader, Select } from '@tod-m/materials/ve-o';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.module.scss';

interface PushTrendPoint {
  date: string;
  count: number;
  category: string;
}

type ComponentRankingKey = 'low' | 'high';
type TimeRangeKey = 'week' | 'twoWeeks' | 'month' | 'all';

interface SeriesConfigItem {
  category: string;
  base: number;
  slope: number;
  wave: number;
  phase: number;
}

interface LegendLimitTooltipState {
  visible: boolean;
  left: number;
  top: number;
}

const END_DATE = new Date('2026-08-27T00:00:00');
const TOTAL_DAYS = 90;
const COMPONENT_SELECTOR_PLACEHOLDER = '请选择';
const LEGEND_SELECTION_LIMIT = 10;
const SERIES_COLOR_PALETTE = [
  '#4080FF',
  '#36CFC9',
  '#FF7D00',
  '#F7BA1E',
  '#8B5CFF',
  '#00B42A',
  '#165DFF',
  '#FF5722',
  '#7BC616',
  '#86909C',
];

const formatPercentValue = (value: unknown) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value ?? '');
  }
  return `${numericValue.toFixed(1)}%`;
};

const COMPONENT_RANKING_OPTIONS = [
  { label: 'Top5 低一致率组件', value: 'low' },
  { label: 'Top5 高一致率组件', value: 'high' },
];

const TIME_RANGE_OPTIONS = [
  { label: '最近一周', value: 'week' },
  { label: '最近两周', value: 'twoWeeks' },
  { label: '最近一个月', value: 'month' },
  { label: '项目开始至今', value: 'all' },
];

const COMPONENT_NAMES = [
  'TCE 容器引擎',
  'RMQ 消息队列',
  'BMQ 消息队列',
  'RDS 关系型数据库',
  'Redis 缓存',
  'Kafka 消息流',
  'RocketMQ 消息队列',
  'RabbitMQ 消息队列',
  'Pulsar 消息队列',
  'Elasticsearch 检索服务',
  'ClickHouse 分析数据库',
  'Doris OLAP 引擎',
  'HBase 列式数据库',
  'MongoDB 文档数据库',
  'MySQL 主库',
  'MySQL 从库',
  'PostgreSQL 数据库',
  'ZooKeeper 注册中心',
  'Nacos 配置中心',
  'Etcd 配置存储',
  'Prometheus 监控',
  'Grafana 看板',
  'Flink 实时计算',
  'Spark 离线计算',
  'HDFS 分布式存储',
  'MinIO 对象存储',
  'OSS 对象存储',
  'CDN 内容分发',
  'Gateway 网关',
  'Scheduler 调度中心',
];

const TIME_RANGE_DAY_COUNT: Record<TimeRangeKey, number> = {
  week: 7,
  twoWeeks: 14,
  month: 30,
  all: TOTAL_DAYS,
};

const CATEGORY_COLOR_MAP = new Map(
  COMPONENT_NAMES.map((name, index) => [name, SERIES_COLOR_PALETTE[index % SERIES_COLOR_PALETTE.length]]),
);

const formatDateLabel = (date: Date) =>
  `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const buildDateLabels = (days: number) =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date(END_DATE);
    date.setDate(END_DATE.getDate() - (days - index - 1));
    return formatDateLabel(date);
  });

const buildSeriesValues = (config: SeriesConfigItem) =>
  Array.from({ length: TOTAL_DAYS }, (_, index) => {
    const primaryWave = Math.sin((index + config.phase) / 4) * config.wave;
    const secondaryWave = Math.cos((index + config.phase * 2) / 9) * config.wave * 0.45;
    const trendValue = config.base + config.slope * index + primaryWave + secondaryWave;
    return Number(Math.min(99.6, Math.max(58, trendValue)).toFixed(1));
  });

const SERIES_CONFIG: SeriesConfigItem[] = COMPONENT_NAMES.map((category, index) => ({
  category,
  base: Number((61.8 + index * 1.12).toFixed(1)),
  slope: Number((0.016 + ((index % 6) * 0.004 + (29 - index) * 0.0004)).toFixed(3)),
  wave: Number(Math.max(0.45, 1.75 - index * 0.04 + (index % 4) * 0.06).toFixed(2)),
  phase: index + 1,
}));

const FULL_SERIES_DATA = SERIES_CONFIG.map((item) => ({
  category: item.category,
  values: buildSeriesValues(item),
}));

const LOW_TREND_CATEGORIES = FULL_SERIES_DATA.slice(0, 5).map((item) => item.category);
const HIGH_TREND_CATEGORIES = FULL_SERIES_DATA.slice(-5).map((item) => item.category);
const COMPONENT_ORDER_MAP = new Map(FULL_SERIES_DATA.map((item, index) => [item.category, index]));

const getTextDisplayWidth = (text: string) =>
  Array.from(text).reduce((total, char) => total + (/[\u4e00-\u9fa5]/.test(char) ? 14 : 8), 0);

const getMaxOptionLabelWidth = (options: Array<{ label: string; value: string }>) =>
  options.reduce((maxWidth, option) => Math.max(maxWidth, getTextDisplayWidth(option.label)), 0);

const sortCategories = (categories: string[]) =>
  categories
    .filter((category, index, source) => source.indexOf(category) === index)
    .sort((left, right) => (COMPONENT_ORDER_MAP.get(left) ?? 0) - (COMPONENT_ORDER_MAP.get(right) ?? 0));

const isSameCategoryGroup = (left: string[], right: string[]) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

const getPresetCategories = (preset: ComponentRankingKey) =>
  preset === 'low' ? LOW_TREND_CATEGORIES : HIGH_TREND_CATEGORIES;

const getRankingFromSelectedCategories = (categories: string[]): ComponentRankingKey | undefined => {
  if (isSameCategoryGroup(categories, LOW_TREND_CATEGORIES)) {
    return 'low';
  }

  if (isSameCategoryGroup(categories, HIGH_TREND_CATEGORIES)) {
    return 'high';
  }

  return undefined;
};

const getTooltipPosition = (
  event: Pick<React.MouseEvent<HTMLElement>, 'clientX' | 'clientY'>,
  container: HTMLDivElement | null,
): Pick<LegendLimitTooltipState, 'left' | 'top'> => {
  if (!container) {
    return { left: 0, top: 0 };
  }

  const bounds = container.getBoundingClientRect();
  return {
    left: event.clientX - bounds.left + 6,
    top: event.clientY - bounds.top - 4,
  };
};

const CloudEChartLineDemo: React.FC = () => {
  const chartCardRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<{ resize: () => void } | null>(null);
  const [componentRanking, setComponentRanking] = useState<ComponentRankingKey | undefined>('low');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(LOW_TREND_CATEGORIES);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('week');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [legendSortMode, setLegendSortMode] = useState<ComponentRankingKey>('low');
  const [legendLimitTooltip, setLegendLimitTooltip] = useState<LegendLimitTooltipState>({
    visible: false,
    left: 0,
    top: 0,
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === chartCardRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    chartInstanceRef.current?.resize();
  }, [isFullscreen]);

  const orderedSeriesData = useMemo(
    () => (legendSortMode === 'high' ? [...FULL_SERIES_DATA].reverse() : FULL_SERIES_DATA),
    [legendSortMode],
  );

  const chartData = useMemo<PushTrendPoint[]>(() => {
    const dayCount = TIME_RANGE_DAY_COUNT[timeRange];
    const labels = buildDateLabels(dayCount);
    return orderedSeriesData.flatMap((seriesItem) => {
      const seriesValues = seriesItem.values.slice(-dayCount);
      return labels.map((date, index) => ({
        date,
        count: seriesValues[index],
        category: seriesItem.category,
      }));
    });
  }, [orderedSeriesData, timeRange]);

  const visibleChartData = useMemo(
    () => chartData.filter((item) => selectedCategories.includes(item.category)),
    [chartData, selectedCategories],
  );

  const yAxisMin = useMemo(() => {
    if (!visibleChartData.length) {
      return 55;
    }

    const minValue = Math.min(...visibleChartData.map((item) => item.count));
    return Math.max(55, Math.floor((minValue - 3) / 5) * 5);
  }, [visibleChartData]);

  const summary = useMemo(() => {
    if (!visibleChartData.length) {
      return {
        average: null,
        peakItem: null,
        lowItem: null,
      };
    }

    const total = visibleChartData.reduce((acc, item) => acc + item.count, 0);
    const peakItem = visibleChartData.reduce((prev, current) => (current.count > prev.count ? current : prev));
    const lowItem = visibleChartData.reduce((prev, current) => (current.count < prev.count ? current : prev));
    const average = Number((total / visibleChartData.length).toFixed(1));

    return {
      average,
      peakItem,
      lowItem,
    };
  }, [visibleChartData]);

  const chartOption = useMemo<CloudEChartOption>(() => {
    const dayCount = TIME_RANGE_DAY_COUNT[timeRange];
    const labels = buildDateLabels(dayCount);

    return {
      animationDuration: 250,
      color: orderedSeriesData.map((item) => CATEGORY_COLOR_MAP.get(item.category) ?? '#4080FF'),
      CLegend: {
        show: false,
      },
      legend: {
        show: false,
        data: [],
      },
      grid: {
        top: 20,
        left: 12,
        right: 16,
        bottom: 12,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
        },
        valueFormatter: (value) => formatPercentValue(value),
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels,
        axisTick: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: '#E5E6EB',
          },
        },
        axisLabel: {
          color: '#4E5969',
        },
      },
      yAxis: {
        type: 'value',
        min: yAxisMin,
        max: 100,
        axisLabel: {
          color: '#4E5969',
          formatter: '{value}%',
        },
        splitLine: {
          lineStyle: {
            color: '#E5E6EB',
            type: 'dashed',
          },
        },
      },
      series: orderedSeriesData
        .filter((item) => selectedCategories.includes(item.category))
        .map((item) => ({
          type: 'line' as const,
          name: item.category,
          data: item.values.slice(-dayCount),
          showSymbol: false,
          smooth: false,
          lineStyle: {
            width: 2,
          },
          emphasis: {
            focus: 'series' as const,
          },
          itemStyle: {
            color: CATEGORY_COLOR_MAP.get(item.category) ?? '#4080FF',
          },
        })),
    };
  }, [orderedSeriesData, selectedCategories, timeRange, yAxisMin]);

  const componentRankingDropdownWidth = `${getMaxOptionLabelWidth(COMPONENT_RANKING_OPTIONS) + 52}px`;
  const timeRangeDropdownWidth = `${getMaxOptionLabelWidth(TIME_RANGE_OPTIONS) + 68}px`;

  const hideLegendLimitTooltip = () => {
    setLegendLimitTooltip((current) => (current.visible ? { ...current, visible: false } : current));
  };

  const handleComponentRankingChange = (value: string) => {
    const nextRanking = value as ComponentRankingKey;
    const nextSelectedCategories = getPresetCategories(nextRanking);
    setComponentRanking(nextRanking);
    setLegendSortMode(nextRanking);
    setSelectedCategories(nextSelectedCategories);
    hideLegendLimitTooltip();
  };

  const showLegendLimitHint = (event: React.MouseEvent<HTMLElement>) => {
    const nextPosition = getTooltipPosition(event, chartCardRef.current);
    setLegendLimitTooltip({
      visible: true,
      left: nextPosition.left,
      top: nextPosition.top,
    });
  };

  const handleLegendToggle = (category: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const isSelected = selectedCategories.includes(category);

    if (!isSelected && selectedCategories.length >= LEGEND_SELECTION_LIMIT) {
      showLegendLimitHint(event);
      return;
    }

    const nextSelectedCategories = isSelected
      ? selectedCategories.filter((item) => item !== category)
      : sortCategories([...selectedCategories, category]);
    const nextRanking = getRankingFromSelectedCategories(nextSelectedCategories);

    setSelectedCategories(nextSelectedCategories);
    setComponentRanking(nextRanking);
    if (nextRanking) {
      setLegendSortMode(nextRanking);
    }
    hideLegendLimitTooltip();
  };

  const handleLegendHover = (category: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const shouldShowTooltip =
      selectedCategories.length >= LEGEND_SELECTION_LIMIT && !selectedCategories.includes(category);

    if (!shouldShowTooltip) {
      hideLegendLimitTooltip();
      return;
    }

    showLegendLimitHint(event);
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await chartCardRef.current?.requestFullscreen();
        return;
      }

      await document.exitFullscreen();
    } catch (error) {
      const message = error instanceof Error ? error.message : '浏览器不支持当前全屏操作';
      Message.error(message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <PageHeader.PageHeaderPro
          title="CloudEChart 折线图示例"
          subTitle={[
            { label: '场景', value: '组件一致率趋势' },
            { label: '图表库', value: 'CloudEChart' },
            { label: '数据来源', value: 'Mock 示例数据' },
          ]}
        />
        <Divider className={styles.headerDivider} />
      </div>

      <div className={styles.content}>
        <div className={styles.summaryGrid}>
          <Card className={styles.metricCard}>
            <div className={styles.metricLabel}>平均一致率</div>
            <div className={styles.metricValue}>{summary.average === null ? '--' : `${summary.average}%`}</div>
            <div className={styles.metricHint}>当前选中组件在当前时间范围内的平均表现</div>
          </Card>

          <Card className={styles.metricCard}>
            <div className={styles.metricLabel}>最高单点</div>
            <div className={styles.metricValue}>{summary.peakItem ? `${summary.peakItem.count}%` : '--'}</div>
            <div className={styles.metricHint}>
              {summary.peakItem ? `${summary.peakItem.category} · ${summary.peakItem.date}` : '请至少选择一个组件'}
            </div>
          </Card>

          <Card className={styles.metricCard}>
            <div className={styles.metricLabel}>最低单点</div>
            <div className={styles.metricValue}>{summary.lowItem ? `${summary.lowItem.count}%` : '--'}</div>
            <div className={styles.metricHint}>
              {summary.lowItem ? `${summary.lowItem.category} · ${summary.lowItem.date}` : '请至少选择一个组件'}
            </div>
          </Card>
        </div>

        <div ref={chartCardRef} className={isFullscreen ? styles.chartCardFullscreen : undefined}>
          <Card className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.chartTitle}>组件一致率趋势</div>
              </div>
              <div className={styles.cardActions}>
                <Select
                  className={styles.inlineSelect}
                  bordered={false}
                  style={{ width: 'fit-content' }}
                  dropdownMenuStyle={{
                    minWidth: componentRankingDropdownWidth,
                    width: 'max-content',
                    whiteSpace: 'nowrap',
                  }}
                  placeholder={COMPONENT_SELECTOR_PLACEHOLDER}
                  options={COMPONENT_RANKING_OPTIONS}
                  value={componentRanking}
                  onChange={(value) => handleComponentRankingChange(String(value))}
                />
                <Select
                  className={styles.inlineSelect}
                  bordered={false}
                  style={{ width: 'fit-content' }}
                  dropdownMenuStyle={{
                    minWidth: timeRangeDropdownWidth,
                    width: 'max-content',
                    whiteSpace: 'nowrap',
                  }}
                  options={TIME_RANGE_OPTIONS}
                  value={timeRange}
                  onChange={(value) => setTimeRange(String(value) as TimeRangeKey)}
                />
                <Button
                  type="outline"
                  iconOnly
                  icon={isFullscreen ? <IconExitFullScreenV2 /> : <IconFullScreenV2 />}
                  className={styles.fullscreenButton}
                  onClick={handleToggleFullscreen}
                  aria-label={isFullscreen ? '退出全屏' : '全屏'}
                />
              </div>
            </div>

            <div className={`${styles.chartStage} ${isFullscreen ? styles.chartStageFullscreen : ''}`}>
              {legendLimitTooltip.visible ? (
                <div
                  className={styles.legendLimitTooltip}
                  style={{ left: legendLimitTooltip.left, top: legendLimitTooltip.top }}
                >
                  至多只能同时查看 10 个组件的一致率
                </div>
              ) : null}
              <CloudEChart
                className={styles.chart}
                style={{ height: isFullscreen ? 560 : 360 }}
                option={chartOption}
                onChartReady={(instance) => {
                  chartInstanceRef.current = instance;
                }}
              />
            </div>

            <div className={styles.legendPanel}>
              {orderedSeriesData.map((item) => {
                const isSelected = selectedCategories.includes(item.category);
                const itemColor = CATEGORY_COLOR_MAP.get(item.category) ?? '#4080FF';

                return (
                  <button
                    key={item.category}
                    type="button"
                    className={`${styles.legendItem} ${isSelected ? styles.legendItemSelected : ''}`}
                    onClick={(event) => handleLegendToggle(item.category, event)}
                    onMouseEnter={(event) => handleLegendHover(item.category, event)}
                    onMouseLeave={hideLegendLimitTooltip}
                  >
                    <span
                      className={styles.legendMarker}
                      style={{
                        background: isSelected ? itemColor : 'transparent',
                        borderColor: itemColor,
                      }}
                    />
                    <span className={styles.legendLabel}>{item.category}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CloudEChartLineDemo;
