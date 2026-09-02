import { IconExitRichText, IconRichText } from '@arco-design/iconbox-react-ve-o-design';
import { Button, Card, Divider, Message, PageHeader, Select } from '@tod-m/materials/ve-o';
import { type ILineChartSpec } from '@visactor/vchart';
import { VChart } from '@visactor/react-vchart';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
const LEGEND_MAX_ROWS_PER_PAGE = 2;
const LEGEND_ITEM_GAP = 16;
const LEGEND_MARKER_SIZE = 12;
const LEGEND_MARKER_LABEL_GAP = 8;
const SELECT_DROPDOWN_HORIZONTAL_PADDING = 30;
const COLOR_BORDER_2_FALLBACK = '#EAEDF1';
const COLOR_TEXT_2_FALLBACK = '#4E5969';
const COLOR_TEXT_3_FALLBACK = '#86909C';
const TOOLTIP_FONT_FAMILY = 'Roboto, "PingFang SC", sans-serif';
const TOOLTIP_ROUNDED_SQUARE_PATH =
  'M1.54 0H10.46A1.54 1.54 0 0 1 12 1.54V10.46A1.54 1.54 0 0 1 10.46 12H1.54A1.54 1.54 0 0 1 0 10.46V1.54A1.54 1.54 0 0 1 1.54 0Z';
const COMPONENT_COLORS = [
  '#4080FF',
  '#BEDAFF',
  '#57A9FB',
  '#9CDCFC',
  '#FF7D00',
  '#FFCF8B',
  '#4CD263',
  '#AFF0B5',
  '#A871E3',
  '#CDBDFF',
  '#F7BA1E',
  '#FADC6D',
  '#9FDB1D',
  '#D3F261',
  '#F53F3F',
  '#FBACA3',
  '#14C9C9',
  '#8DDEDE',
  '#E865DF',
  '#F7BAEF',
  '#4080FF',
  '#BEDAFF',
  '#57A9FB',
  '#9CDCFC',
  '#FF7D00',
  '#FFCF8B',
  '#4CD263',
  '#AFF0B5',
  '#A871E3',
  '#CDBDFF',
];

const formatPercentValue = (value: unknown) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value ?? '');
  }
  return `${numericValue.toFixed(1)}%`;
};

const getColorBorder2 = () => {
  if (typeof window === 'undefined') {
    return COLOR_BORDER_2_FALLBACK;
  }

  const colorBorder2 = window.getComputedStyle(document.documentElement).getPropertyValue('--color-border-2').trim();
  return colorBorder2 || COLOR_BORDER_2_FALLBACK;
};

const getColorText2 = () => {
  if (typeof window === 'undefined') {
    return COLOR_TEXT_2_FALLBACK;
  }

  const colorText2 = window.getComputedStyle(document.documentElement).getPropertyValue('--color-text-2').trim();
  return colorText2 || COLOR_TEXT_2_FALLBACK;
};

const getColorText3 = () => {
  if (typeof window === 'undefined') {
    return COLOR_TEXT_3_FALLBACK;
  }

  const colorText3 = window.getComputedStyle(document.documentElement).getPropertyValue('--color-text-3').trim();
  return colorText3 || COLOR_TEXT_3_FALLBACK;
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

const formatDateLabel = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
const COMPONENT_COLOR_MAP = new Map(COMPONENT_NAMES.map((category, index) => [category, COMPONENT_COLORS[index]]));

const getTextDisplayWidth = (text: string) =>
  Array.from(text).reduce((total, char) => total + (/[\u4e00-\u9fa5]/.test(char) ? 14 : 8), 0);
const getMaxOptionLabelWidth = (options: Array<{ label: string; value: string }>) =>
  options.reduce((maxWidth, option) => Math.max(maxWidth, getTextDisplayWidth(option.label)), 0);
const getLegendItemWidth = (label: string) => getTextDisplayWidth(label) + LEGEND_MARKER_SIZE + LEGEND_MARKER_LABEL_GAP;
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
  sourceEvent: MouseEvent | React.MouseEvent<HTMLElement>,
  container: HTMLDivElement | null,
): Pick<LegendLimitTooltipState, 'left' | 'top'> => {
  if (!container) {
    return { left: 0, top: 0 };
  }

  const bounds = container.getBoundingClientRect();
  return {
    left: sourceEvent.clientX - bounds.left + 6,
    top: sourceEvent.clientY - bounds.top - 4,
  };
};

const PagerArrowIcon: React.FC<{ direction: 'up' | 'down'; disabled?: boolean }> = ({ direction, disabled }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    style={{ display: 'block', opacity: disabled ? 0.4 : 1 }}
  >
    <path
      d={direction === 'up' ? 'M3 7.5L6 4.5L9 7.5' : 'M3 4.5L6 7.5L9 4.5'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const paginateLegendItems = (categories: string[], maxRowWidth: number) => {
  if (!categories.length) {
    return [[[]]];
  }

  if (maxRowWidth <= 0) {
    return categories.reduce<string[][][]>((pages, category, index) => {
      if (index % LEGEND_MAX_ROWS_PER_PAGE === 0) {
        pages.push([[category]]);
      } else {
        pages[pages.length - 1].push([category]);
      }

      return pages;
    }, []);
  }

  const pages: string[][][] = [];
  let currentPage: string[][] = [[]];
  let currentRowIndex = 0;
  let currentRowWidth = 0;

  categories.forEach((category) => {
    const itemWidth = getLegendItemWidth(category);
    const nextRowWidth = currentPage[currentRowIndex].length
      ? currentRowWidth + LEGEND_ITEM_GAP + itemWidth
      : itemWidth;

    if (nextRowWidth <= maxRowWidth || currentPage[currentRowIndex].length === 0) {
      currentPage[currentRowIndex].push(category);
      currentRowWidth = nextRowWidth;
      return;
    }

    if (currentRowIndex < LEGEND_MAX_ROWS_PER_PAGE - 1) {
      currentRowIndex += 1;
      currentPage[currentRowIndex] = [category];
      currentRowWidth = itemWidth;
      return;
    }

    pages.push(currentPage);
    currentPage = [[category]];
    currentRowIndex = 0;
    currentRowWidth = itemWidth;
  });

  if (currentPage.some((row) => row.length > 0)) {
    pages.push(currentPage);
  }

  return pages;
};

const VChartLineDemo: React.FC = () => {
  const chartCardRef = useRef<HTMLDivElement | null>(null);
  const legendRowsRef = useRef<HTMLDivElement | null>(null);
  const [componentRanking, setComponentRanking] = useState<ComponentRankingKey | undefined>('low');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(LOW_TREND_CATEGORIES);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('week');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [legendSortMode, setLegendSortMode] = useState<ComponentRankingKey>('low');
  const [currentLegendPage, setCurrentLegendPage] = useState(1);
  const [legendRowsWidth, setLegendRowsWidth] = useState(0);
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

  useLayoutEffect(() => {
    const container = legendRowsRef.current;

    if (!container) {
      return undefined;
    }

    const updateWidth = () => {
      const nextWidth = container.clientWidth;
      setLegendRowsWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const orderedSeriesData = useMemo(
    () => (legendSortMode === 'high' ? [...FULL_SERIES_DATA].reverse() : FULL_SERIES_DATA),
    [legendSortMode],
  );
  const colorBorder2 = useMemo(getColorBorder2, []);
  const colorText2 = useMemo(getColorText2, []);
  const colorText3 = useMemo(getColorText3, []);

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

  const lineChartSpec = useMemo<ILineChartSpec>(
    () => ({
      type: 'line',
      autoFit: true,
      padding: 0,
      data: [
        {
          id: 'componentTrend',
          values: visibleChartData,
        },
      ],
      xField: 'date',
      yField: 'count',
      seriesField: 'category',
      color: {
        field: 'category',
        type: 'ordinal',
        domain: COMPONENT_NAMES,
        range: COMPONENT_COLORS,
      },
      activePoint: true,
      point: {
        visible: true,
        style: {
          size: 0,
          fillOpacity: 0,
          strokeOpacity: 0,
          lineWidth: 0,
        },
        state: {
          hover: {
            visible: true,
            style: {
              size: 8,
              symbolType: 'circle',
              lineWidth: 1,
              stroke: '#fff',
              fillOpacity: 1,
              strokeOpacity: 1,
            },
          },
          dimension_hover: {
            visible: true,
            style: {
              size: 8,
              symbolType: 'circle',
              lineWidth: 1,
              stroke: '#fff',
              fillOpacity: 1,
              strokeOpacity: 1,
            },
          },
        },
      },
      line: {
        style: {
          lineWidth: 2,
        },
      },
      axes: [
        {
          orient: 'bottom',
          type: 'band',
          label: {
            visible: true,
            space: 2,
          },
          title: {
            visible: false,
          },
        },
        {
          orient: 'left',
          type: 'linear',
          min: yAxisMin,
          max: 100,
          label: {
            visible: true,
            space: 4,
            formatMethod: (value: string | string[]) => {
              const rawValue = Array.isArray(value) ? value[0] : value;
              return `${rawValue}%`;
            },
          },
          grid: {
            visible: true,
            style: {
              stroke: colorBorder2,
              lineDash: [4, 2],
              lineWidth: 1,
            },
          },
          title: {
            visible: false,
          },
        },
      ],
      legends: {
        visible: false,
      },
      tooltip: {
        renderMode: 'html',
        style: {
          shape: {
            size: 12,
            spacing: 10,
          },
          titleLabel: {
            fontFamily: TOOLTIP_FONT_FAMILY,
            fontSize: 12,
            lineHeight: 20,
            fill: colorText3,
            fontWeight: 400,
            textBaseline: 'middle',
          },
          keyLabel: {
            fontFamily: TOOLTIP_FONT_FAMILY,
            fontSize: 12,
            lineHeight: 20,
            textBaseline: 'middle',
          },
          valueLabel: {
            fontFamily: TOOLTIP_FONT_FAMILY,
            fontSize: 12,
            lineHeight: 20,
            fill: colorText2,
            fontWeight: 400,
            textBaseline: 'middle',
          },
          spaceRow: 2,
          align: 'left',
        },
        dimension: {
          shapeType: TOOLTIP_ROUNDED_SQUARE_PATH,
          shapeSize: 12,
          content: [
            {
              key: (datum?: { category?: string }) => datum?.category ?? '',
              value: (datum?: { count?: number }) => formatPercentValue(datum?.count),
              keyStyle: {
                fontFamily: TOOLTIP_FONT_FAMILY,
                fontSize: 12,
                lineHeight: 20,
                textBaseline: 'middle',
              },
              valueStyle: {
                fontFamily: TOOLTIP_FONT_FAMILY,
                fontSize: 12,
                lineHeight: 20,
                fill: colorText2,
                fontWeight: 400,
                textBaseline: 'middle',
              },
            },
          ],
        },
        mark: {
          shapeType: TOOLTIP_ROUNDED_SQUARE_PATH,
          shapeSize: 12,
          content: [
            {
              key: (datum?: { category?: string }) => datum?.category ?? '',
              value: (datum?: { count?: number }) => formatPercentValue(datum?.count),
              keyStyle: {
                fontFamily: TOOLTIP_FONT_FAMILY,
                fontSize: 12,
                lineHeight: 20,
                textBaseline: 'middle',
              },
              valueStyle: {
                fontFamily: TOOLTIP_FONT_FAMILY,
                fontSize: 12,
                lineHeight: 20,
                fill: colorText2,
                fontWeight: 400,
                textBaseline: 'middle',
              },
            },
          ],
        },
      },
      crosshair: {
        trigger: 'hover',
        xField: {
          visible: true,
          line: {
            visible: true,
            type: 'rect',
            width: 1,
            style: {
              fill: '#C9CDD4',
              lineWidth: 0,
              opacity: 1,
            },
          },
          label: {
            visible: false,
          },
        },
        yField: {
          visible: false,
        },
      },
    }),
    [colorBorder2, colorText2, colorText3, visibleChartData, yAxisMin],
  );

  const componentRankingDropdownWidth = `${getMaxOptionLabelWidth(COMPONENT_RANKING_OPTIONS) + SELECT_DROPDOWN_HORIZONTAL_PADDING}px`;
  const timeRangeDropdownWidth = `${getMaxOptionLabelWidth(TIME_RANGE_OPTIONS) + 68}px`;
  const legendCategories = orderedSeriesData.map((item) => item.category);
  const legendPages = useMemo(() => paginateLegendItems(legendCategories, legendRowsWidth), [legendCategories, legendRowsWidth]);
  const totalLegendPages = legendPages.length || 1;
  const currentLegendPageItems = legendPages[currentLegendPage - 1] ?? legendPages[0] ?? [[], []];

  useEffect(() => {
    setCurrentLegendPage((page) => Math.min(page, totalLegendPages));
  }, [totalLegendPages]);

  const hideLegendLimitTooltip = () => {
    setLegendLimitTooltip((current) => (current.visible ? { ...current, visible: false } : current));
  };

  const handleComponentRankingChange = (value: string) => {
    const nextRanking = value as ComponentRankingKey;
    setComponentRanking(nextRanking);
    setLegendSortMode(nextRanking);
    setCurrentLegendPage(1);
    setSelectedCategories(getPresetCategories(nextRanking));
    hideLegendLimitTooltip();
  };

  const handleLegendItemClick = (category: string) => {
    const isSelected = selectedCategories.includes(category);

    if (!isSelected && selectedCategories.length >= LEGEND_SELECTION_LIMIT) {
      Message.warning(`至多只能同时查看 ${LEGEND_SELECTION_LIMIT} 个组件的一致率`);
      return;
    }

    const nextSelectedCategories = isSelected
      ? selectedCategories.filter((item) => item !== category)
      : sortCategories([...selectedCategories, category]);
    const nextRanking = getRankingFromSelectedCategories(nextSelectedCategories);

    setSelectedCategories(nextSelectedCategories);
    setComponentRanking(nextRanking);
    hideLegendLimitTooltip();

    if (nextRanking) {
      setLegendSortMode(nextRanking);
      setCurrentLegendPage(1);
    }
  };

  const handleLegendItemMouseEnter = (event: React.MouseEvent<HTMLButtonElement>, category: string) => {
    if (selectedCategories.length < LEGEND_SELECTION_LIMIT || selectedCategories.includes(category)) {
      hideLegendLimitTooltip();
      return;
    }

    const nextPosition = getTooltipPosition(event, chartCardRef.current);
    setLegendLimitTooltip({
      visible: true,
      left: nextPosition.left,
      top: nextPosition.top,
    });
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
          title="VChart 折线图示例"
          subTitle={[
            { label: '场景', value: '组件一致率趋势' },
            { label: '图表库', value: 'VChart' },
            { label: '数据来源', value: 'Mock 示例数据' },
          ]}
        />
        <Divider className={styles.headerDivider} />
      </div>

      <div className={styles.content}>
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
                  triggerProps={{
                    popupStyle: {
                      width: componentRankingDropdownWidth,
                    },
                  }}
                  dropdownMenuStyle={{
                    minWidth: '100%',
                    width: '100%',
                    whiteSpace: 'nowrap',
                  }}
                  placeholder={COMPONENT_SELECTOR_PLACEHOLDER}
                  options={COMPONENT_RANKING_OPTIONS}
                  value={componentRanking}
                  onChange={handleComponentRankingChange}
                />
                <Select
                  className={styles.inlineSelect}
                  bordered={false}
                  style={{ width: 'fit-content' }}
                  triggerProps={{
                    popupStyle: {
                      width: '120px',
                    },
                  }}
                  dropdownMenuStyle={{
                    minWidth: '100%',
                    width: '100%',
                    whiteSpace: 'nowrap',
                  }}
                  options={TIME_RANGE_OPTIONS}
                  value={timeRange}
                  onChange={(value) => setTimeRange(value as TimeRangeKey)}
                />
                <Button
                  type="outline"
                  iconOnly
                  icon={isFullscreen ? <IconExitRichText /> : <IconRichText />}
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
              <VChart
                spec={lineChartSpec}
                className={styles.chart}
                style={{ height: isFullscreen ? 560 : 360 }}
                onError={(error) => Message.error(`折线图加载失败：${error.message}`)}
              />
            </div>

            <div className={styles.customLegend}>
              <div ref={legendRowsRef} className={styles.legendRows}>
                {currentLegendPageItems.map((rowItems, rowIndex) => (
                  <div key={`legend-row-${rowIndex}`} className={styles.legendRow}>
                    {rowItems.map((category) => {
                      const isSelected = selectedCategories.includes(category);
                      const isDisabled = !isSelected && selectedCategories.length >= LEGEND_SELECTION_LIMIT;

                      return (
                        <button
                          key={category}
                          type="button"
                          className={`${styles.legendItem} ${!isSelected ? styles.legendItemUnselected : ''} ${
                            isDisabled ? styles.legendItemDisabled : ''
                          }`}
                          onClick={() => handleLegendItemClick(category)}
                          onMouseEnter={(event) => handleLegendItemMouseEnter(event, category)}
                          onMouseLeave={hideLegendLimitTooltip}
                        >
                          <span
                            className={styles.legendMarker}
                            style={{ backgroundColor: COMPONENT_COLOR_MAP.get(category) ?? '#2E67F8' }}
                          />
                          <span className={styles.legendLabel}>{category}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className={styles.legendPager}>
                <button
                  type="button"
                  className={styles.legendPagerButton}
                  onClick={() => setCurrentLegendPage((page) => Math.max(1, page - 1))}
                  disabled={currentLegendPage === 1}
                >
                  <PagerArrowIcon direction="up" disabled={currentLegendPage === 1} />
                </button>
                <div className={styles.legendPagerText}>
                  {currentLegendPage}/{totalLegendPages}
                </div>
                <button
                  type="button"
                  className={styles.legendPagerButton}
                  onClick={() => setCurrentLegendPage((page) => Math.min(totalLegendPages, page + 1))}
                  disabled={currentLegendPage === totalLegendPages}
                >
                  <PagerArrowIcon direction="down" disabled={currentLegendPage === totalLegendPages} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VChartLineDemo;
