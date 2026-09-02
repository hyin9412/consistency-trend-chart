import { DatePicker } from '@tod-m/materials/ve-o';
import { IconCalendar } from '@arco-design/iconbox-react-ve-o-design';
import type { RangePickerProps } from '@tod-m/materials/ve-o';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './PeriodRangePicker.module.scss';

export type PeriodMode = 'day' | 'week' | 'month';

export interface PeriodRangeValue {
  mode: PeriodMode;
  range: [string, string] | undefined;
}

interface PeriodRangePickerProps {
  value?: PeriodRangeValue;
  defaultValue?: PeriodRangeValue;
  onChange?: (value: PeriodRangeValue) => void;
  style?: React.CSSProperties;
  className?: string;
}

const SEGMENT_OPTIONS: { label: string; value: PeriodMode }[] = [
  { label: '按日', value: 'day' },
  { label: '按周', value: 'week' },
  { label: '按月', value: 'month' },
];

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function differenceInDays(start: Date, end: Date): number {
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.round((endTime - startTime) / (24 * 60 * 60 * 1000));
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatDisplay(mode: PeriodMode, range: [string, string] | undefined): { start: string; end: string } {
  if (!range) {
    return mode === 'month'
      ? { start: '开始月份', end: '结束月份' }
      : { start: '开始日期', end: '结束日期' };
  }
  return { start: range[0], end: range[1] };
}

const DEFAULT_VALUE: PeriodRangeValue = { mode: 'day', range: ['2026-08-20', '2026-08-20'] };

const PeriodRangePicker: React.FC<PeriodRangePickerProps> = ({
  value,
  defaultValue,
  onChange,
  style,
  className,
}) => {
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState<PeriodRangeValue>(defaultValue ?? DEFAULT_VALUE);
  const current = isControlled ? value! : innerValue;

  const [popupOpen, setPopupOpen] = useState(false);
  const [weekDraftStart, setWeekDraftStart] = useState<string | null>(null);

  useEffect(() => {
    if (!popupOpen) {
      setWeekDraftStart(null);
    }
  }, [popupOpen]);

  const triggerChange = useCallback(
    (next: PeriodRangeValue) => {
      if (!isControlled) setInnerValue(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const handleModeChange = useCallback(
    (mode: PeriodMode) => {
      let nextRange: [string, string] | undefined;
      const [start] = current.range ?? [undefined];
      if (start) {
        const d = parseDate(start);
        if (mode === 'week') {
          nextRange = [formatDate(d), formatDate(addDays(d, 6))];
        } else if (mode === 'month') {
          const end = current.range?.[1] ? parseDate(current.range[1]) : d;
          nextRange = [formatDate(startOfMonth(d)), formatDate(endOfMonth(end))];
        } else {
          const end = current.range?.[1] ? parseDate(current.range[1]) : d;
          nextRange = [formatDate(d), formatDate(end)];
        }
      } else {
        nextRange = undefined;
      }
      triggerChange({ mode, range: nextRange });
    },
    [current.range, triggerChange],
  );

  const handleDayRangeChange = useCallback<NonNullable<RangePickerProps['onChange']>>(
    (dateString) => {
      if (!dateString || !dateString[0] || !dateString[1]) {
        triggerChange({ mode: 'day', range: undefined });
        return;
      }
      triggerChange({ mode: 'day', range: [dateString[0], dateString[1]] });
    },
    [triggerChange],
  );

  const handleWeekRangeSelect = useCallback<NonNullable<RangePickerProps['onSelect']>>(
    (dateString, _value, extra) => {
      if (extra.type === 'start') {
        setWeekDraftStart(dateString[0] ?? null);
        return;
      }

      setWeekDraftStart(null);
    },
    [],
  );

  const handleWeekRangeChange = useCallback<NonNullable<RangePickerProps['onChange']>>(
    (dateString) => {
      if (!dateString || !dateString[0] || !dateString[1]) {
        triggerChange({ mode: 'week', range: undefined });
        return;
      }

      triggerChange({ mode: 'week', range: [dateString[0], dateString[1]] });
    },
    [triggerChange],
  );

  const handleMonthRangeChange = useCallback<NonNullable<RangePickerProps['onChange']>>(
    (dateString) => {
      if (!dateString || !dateString[0] || !dateString[1]) {
        triggerChange({ mode: 'month', range: undefined });
        return;
      }

      const start = `${dateString[0]}-01`;
      const end = formatDate(endOfMonth(parseDate(`${dateString[1]}-01`)));
      triggerChange({ mode: 'month', range: [start, end] });
    },
    [triggerChange],
  );

  const weekDisabledDate = useCallback<NonNullable<RangePickerProps['disabledDate']>>(
    (currentDate) => {
      if (!weekDraftStart) {
        return false;
      }

      const diff = differenceInDays(parseDate(weekDraftStart), currentDate.toDate());
      return diff < 0 || diff % 7 !== 6;
    },
    [weekDraftStart],
  );

  const display = useMemo(() => formatDisplay(current.mode, current.range), [current]);
  const hasValue = !!current.range;
  const pickerClassName = `${styles.periodPicker} ${popupOpen ? styles.periodPickerFocused : ''} ${className ?? ''}`;

  const dateTriggerElement = useMemo(() => {
    return (
      <div className={styles.dateRangeTrigger}>
        <span className={`${styles.dateText} ${hasValue ? styles.hasValue : ''}`}>{display.start}</span>
        <span className={styles.dateSep}>-</span>
        <span className={`${styles.dateText} ${hasValue ? styles.hasValue : ''}`}>{display.end}</span>
        <span className={styles.calendarIcon}>
          <IconCalendar />
        </span>
      </div>
    );
  }, [display.end, display.start, hasValue]);

  const renderPanelWithTabs = useCallback(
    (panelNode: ReactNode) => (
      <div className={styles.panelWithTabs}>
        <div className={styles.modeTabs}>
          {SEGMENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.modeTab} ${current.mode === option.value ? styles.modeTabActive : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleModeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={styles.panelBody}>{panelNode}</div>
      </div>
    ),
    [current.mode, handleModeChange],
  );

  const onVisibleChange = useCallback((v?: boolean) => {
    setPopupOpen(!!v);
  }, []);

  if (current.mode === 'day') {
    return (
      <div className={pickerClassName} style={style}>
        <DatePicker.RangePicker
          style={{ flex: 1, minWidth: 0 }}
          value={current.range as [string, string] | undefined}
          onChange={handleDayRangeChange}
          triggerElement={dateTriggerElement}
          popupVisible={popupOpen}
          onVisibleChange={onVisibleChange}
          panelRender={renderPanelWithTabs}
          allowClear={false}
        />
      </div>
    );
  }

  if (current.mode === 'week') {
    return (
      <div className={pickerClassName} style={style}>
        <DatePicker.RangePicker
          style={{ flex: 1, minWidth: 0 }}
          value={current.range as [string, string] | undefined}
          onChange={handleWeekRangeChange}
          onSelect={handleWeekRangeSelect}
          disabledDate={weekDisabledDate}
          triggerElement={dateTriggerElement}
          popupVisible={popupOpen}
          onVisibleChange={onVisibleChange}
          panelRender={renderPanelWithTabs}
          allowClear={false}
          clearRangeOnReselect
        />
      </div>
    );
  }

  return (
    <div className={pickerClassName} style={style}>
      <DatePicker.RangePicker
        style={{ flex: 1, minWidth: 0 }}
        value={current.range as [string, string] | undefined}
        mode="month"
        format="YYYY-MM"
        onChange={handleMonthRangeChange}
        triggerElement={dateTriggerElement}
        popupVisible={popupOpen}
        onVisibleChange={onVisibleChange}
        panelRender={renderPanelWithTabs}
        allowClear={false}
        clearRangeOnReselect
      />
    </div>
  );
};

export default PeriodRangePicker;
