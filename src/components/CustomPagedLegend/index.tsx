import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './index.module.scss';

export interface CustomPagedLegendItem {
  name: string;
  color: string;
}

interface CustomPagedLegendProps {
  items: CustomPagedLegendItem[];
  selectedNames: string[];
  onSelectedNamesChange: (selectedNames: string[]) => void;
  showOnlyAction?: boolean;
}

const LEGEND_MAX_ROWS_PER_PAGE = 2;
const LEGEND_ITEM_GAP = 16;
const LEGEND_MARKER_SIZE = 10;
const LEGEND_MARKER_LABEL_GAP = 3.6;
const LEGEND_ONLY_ICON_SIZE = 12;
const LEGEND_ONLY_ICON_GAP = 6;
const LEGEND_PAGER_WIDTH = 32;
const LEGEND_PAGER_GAP = 12;
const LEGEND_FOCUS_ICON_PATH =
  'M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8.75044 2.55077L8.75 3.75H7.25L7.25006 2.5507C4.81247 2.88304 2.88304 4.81247 2.5507 7.25006L3.75 7.25V8.75L2.55077 8.75044C2.8833 11.1878 4.81264 13.117 7.25006 13.4493L7.25 12.25H8.75L8.75044 13.4492C11.1876 13.1167 13.1167 11.1876 13.4492 8.75044L12.25 8.75V7.25L13.4493 7.25006C13.117 4.81264 11.1878 2.8833 8.75044 2.55077ZM8 5.5C9.38071 5.5 10.5 6.61929 10.5 8C10.5 9.38071 9.38071 10.5 8 10.5C6.61929 10.5 5.5 9.38071 5.5 8C5.5 6.61929 6.61929 5.5 8 5.5ZM8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7Z';

const getTextDisplayWidth = (text: string) =>
  Array.from(text).reduce((total, char) => total + (/[\u4e00-\u9fa5]/.test(char) ? 14 : 8), 0);

const getLegendItemWidth = (label: string, showOnlyAction: boolean) =>
  getTextDisplayWidth(label) +
  LEGEND_MARKER_SIZE +
  LEGEND_MARKER_LABEL_GAP +
  (showOnlyAction ? LEGEND_ONLY_ICON_GAP + LEGEND_ONLY_ICON_SIZE : 0);

const paginateLegendItems = (
  items: CustomPagedLegendItem[],
  maxRowWidth: number,
  showOnlyAction: boolean,
  measuredItemWidths: number[],
) => {
  if (!items.length) {
    return [[[] as CustomPagedLegendItem[]]];
  }

  if (maxRowWidth <= 0) {
    return items.reduce<CustomPagedLegendItem[][][]>((pages, item, index) => {
      if (index % LEGEND_MAX_ROWS_PER_PAGE === 0) {
        pages.push([[item]]);
      } else {
        pages[pages.length - 1].push([item]);
      }

      return pages;
    }, []);
  }

  const pages: CustomPagedLegendItem[][][] = [];
  let currentPage: CustomPagedLegendItem[][] = [[]];
  let currentRowIndex = 0;
  let currentRowWidth = 0;

  items.forEach((item, index) => {
    const itemWidth = measuredItemWidths[index] || getLegendItemWidth(item.name, showOnlyAction);
    const nextRowWidth = currentPage[currentRowIndex].length
      ? currentRowWidth + LEGEND_ITEM_GAP + itemWidth
      : itemWidth;

    if (nextRowWidth <= maxRowWidth || currentPage[currentRowIndex].length === 0) {
      currentPage[currentRowIndex].push(item);
      currentRowWidth = nextRowWidth;
      return;
    }

    if (currentRowIndex < LEGEND_MAX_ROWS_PER_PAGE - 1) {
      currentRowIndex += 1;
      currentPage[currentRowIndex] = [item];
      currentRowWidth = itemWidth;
      return;
    }

    pages.push(currentPage);
    currentPage = [[item]];
    currentRowIndex = 0;
    currentRowWidth = itemWidth;
  });

  if (currentPage.some((row) => row.length > 0)) {
    pages.push(currentPage);
  }

  return pages;
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

const LegendFocusIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: 'block' }}>
    <path d={LEGEND_FOCUS_ICON_PATH} fill="currentColor" />
  </svg>
);

const CustomPagedLegend: React.FC<CustomPagedLegendProps> = ({
  items,
  selectedNames,
  onSelectedNamesChange,
  showOnlyAction = true,
}) => {
  const customLegendRef = useRef<HTMLDivElement | null>(null);
  const legendMeasureRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [legendWidth, setLegendWidth] = useState(0);
  const [measuredItemWidths, setMeasuredItemWidths] = useState<number[]>([]);
  const selectedNameSet = useMemo(() => new Set(selectedNames), [selectedNames]);
  const legendPagesWithoutPager = useMemo(
    () => paginateLegendItems(items, legendWidth, showOnlyAction, measuredItemWidths),
    [items, legendWidth, measuredItemWidths, showOnlyAction],
  );
  const shouldShowPager = legendPagesWithoutPager.length > 1;
  const legendPages = useMemo(
    () =>
      shouldShowPager
        ? paginateLegendItems(
            items,
            Math.max(0, legendWidth - LEGEND_PAGER_WIDTH - LEGEND_PAGER_GAP),
            showOnlyAction,
            measuredItemWidths,
          )
        : legendPagesWithoutPager,
    [items, legendPagesWithoutPager, legendWidth, measuredItemWidths, shouldShowPager, showOnlyAction],
  );
  const totalPages = legendPages.length || 1;
  const currentPageItems = legendPages[currentPage - 1] ?? legendPages[0] ?? [[], []];

  useLayoutEffect(() => {
    const container = customLegendRef.current;
    if (!container) return undefined;

    const updateWidth = () => {
      const nextWidth = container.clientWidth;
      setLegendWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
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

  useLayoutEffect(() => {
    const measureContainer = legendMeasureRef.current;
    if (!measureContainer) return;

    const nextWidths = Array.from(measureContainer.children).map((child) =>
      Math.ceil(child.getBoundingClientRect().width),
    );

    setMeasuredItemWidths((currentWidths) => {
      const hasSameWidth =
        currentWidths.length === nextWidths.length &&
        currentWidths.every((currentWidth, index) => currentWidth === nextWidths[index]);

      return hasSameWidth ? currentWidths : nextWidths;
    });
  }, [items, showOnlyAction]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  const handleLegendItemClick = (name: string) => {
    const isSelected = selectedNameSet.has(name);
    const nextSelectedNames = isSelected
      ? selectedNames.filter((item) => item !== name)
      : items.map((item) => item.name).filter((item) => selectedNameSet.has(item) || item === name);

    onSelectedNamesChange(nextSelectedNames);
  };

  const handleOnlyLegendItemClick = (event: React.MouseEvent<HTMLButtonElement>, name: string) => {
    event.stopPropagation();
    onSelectedNamesChange([name]);
  };

  return (
    <div ref={customLegendRef} className={styles.customLegend}>
      <div ref={legendMeasureRef} className={styles.legendMeasureLayer} aria-hidden="true">
        {items.map((item, index) => (
          <span key={`measure-${index}-${item.name}`} className={`${styles.legendItem} ${styles.legendMeasureItem}`}>
            <span className={styles.legendToggleButton}>
              <span className={styles.legendMarker} style={{ backgroundColor: item.color }} />
              <span className={styles.legendLabel}>{item.name}</span>
            </span>
            {showOnlyAction ? (
              <span className={styles.legendOnlyButton}>
                <LegendFocusIcon />
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <div className={styles.legendRows}>
        {currentPageItems.map((rowItems, rowIndex) => (
          <div key={`legend-row-${rowIndex}`} className={styles.legendRow}>
            {rowItems.map((item) => {
              const isSelected = selectedNameSet.has(item.name);

              return (
                <span
                  key={item.name}
                  className={`${styles.legendItem} ${!isSelected ? styles.legendItemUnselected : ''}`}
                >
                  <button
                    type="button"
                    className={styles.legendToggleButton}
                    onClick={() => handleLegendItemClick(item.name)}
                  >
                    <span className={styles.legendMarker} style={{ backgroundColor: item.color }} />
                    <span className={styles.legendLabel}>{item.name}</span>
                  </button>
                  {showOnlyAction ? (
                    <button
                      type="button"
                      className={styles.legendOnlyButton}
                      onClick={(event) => handleOnlyLegendItemClick(event, item.name)}
                      aria-label={`仅展示 ${item.name}`}
                      title="仅展示该数据"
                    >
                      <LegendFocusIcon />
                    </button>
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {shouldShowPager ? (
        <div className={styles.legendPager}>
          <button
            type="button"
            className={styles.legendPagerButton}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            <PagerArrowIcon direction="up" disabled={currentPage === 1} />
          </button>
          <div className={styles.legendPagerText}>
            {currentPage}/{totalPages}
          </div>
          <button
            type="button"
            className={styles.legendPagerButton}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            <PagerArrowIcon direction="down" disabled={currentPage === totalPages} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default CustomPagedLegend;
