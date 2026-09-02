export type ControlStage = 'observe' | 'soft' | 'gray-hard' | 'hard';

export const DEFAULT_CONTROL_STAGE: ControlStage = 'gray-hard';

export const CONTROL_STAGE_OPTIONS: { label: string; value: ControlStage }[] = [
  { label: '观察期', value: 'observe' },
  { label: '软卡', value: 'soft' },
  { label: '灰度硬卡', value: 'gray-hard' },
  { label: '硬卡', value: 'hard' },
];

export const isControlStage = (value: string | null): value is ControlStage =>
  value === 'observe' || value === 'soft' || value === 'gray-hard' || value === 'hard';
