import { Alert, Button, Divider, Drawer, Input, Message, PageHeader, Select, Table, Tabs, Tag, Tooltip } from '@tod-m/materials/ve-o';
import {
  IconBulb,
  IconCaretUpGreen,
  IconDown,
  IconDownload,
  IconErrorFill,
  IconMinusCircleFill,
  IconQuestionCircle,
  IconRight,
  IconWarningFill,
} from '@arco-design/iconbox-react-ve-o-design';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ControlStage,
  DEFAULT_CONTROL_STAGE,
  isControlStage,
} from 'constants/controlStage';
import PeriodRangePicker, { PeriodRangeValue } from './PeriodRangePicker';
import styles from './index.module.scss';

type RuleTabKey = 'strategy' | 'exclude' | 'exempt';
type AuditResult = 'pass' | 'hard-block' | 'soft-alert' | 'observe-record' | 'exempt' | 'not-involved';
type RuleStrategy = 'hard' | 'soft' | 'off';
type ControlPolicyLabel = '硬卡' | '软卡' | '关闭';

const FLAVOR_TAG_GAP = 4;

interface StrategyRule {
  rule: string;
  meaning: string;
  strategy: RuleStrategy;
  flavors: string;
}

interface ExemptRule {
  id: string;
  flavor: string;
  ruleCode: string;
  ruleMeaning: string;
  period: string;
  before: ControlPolicyLabel;
  after: ControlPolicyLabel;
  effectiveTime: string;
  expireTime: string;
  remainingDays: number;
}

interface RuleBreakdown {
  rule: string;
  count: number;
}

interface OverviewCardData {
  key: string;
  title: string;
  value: number;
  desc: string;
  accentType: 'hard' | 'soft' | 'exempt' | 'exclude';
  rules?: RuleBreakdown[];
  filter: Partial<DetailFilters>;
}

interface DetailFilters {
  flavors: string[];
  psm: string;
  booked: 'all' | 'yes' | 'no';
  result: AuditResult | 'all';
}

interface AuditRecord {
  id: string;
  billBeginTime: string;
  billEndTime: string;
  product: string;
  flavor: string;
  regionSite: string;
  instance: string;
  serviceTreePath: string;
  customer: string;
  instanceUsage: string;
  pushUsage: string;
  updatedAt: string;
  booked: boolean;
  result: AuditResult;
  hitRule?: string;
  errorDesc?: string;
  suggestions?: string[];
  exemptRule?: string;
}

const STAGE_MAP: Record<ControlStage, { label: string; type: 'success' | 'warning' | 'processing' | 'error'; desc: string }> = {
  observe: { label: '观察期', type: 'success', desc: '只记录稽核结果，不拦截、不影响入账' },
  soft: { label: '软卡', type: 'warning', desc: '稽核不通过只做告警和周报通晒，不拦截、不影响入账' },
  'gray-hard': { label: '灰度硬卡', type: 'warning', desc: '按设定采样比例部分硬卡，命中采样且不通过的条目会被拦截，不入账。' },
  hard: { label: '硬卡', type: 'error', desc: '全量硬卡生效，所有稽核不通过的条目都被拦截，不入账' },
};

const PRODUCT_OPTIONS = [
  { label: 'AGCQ - 消息队列', value: 'agcq' },
  { label: 'AIPaaS - AI 平台', value: 'aipaas' },
  { label: 'TOS - 对象存储', value: 'tos' },
  { label: 'RDS - 关系数据库', value: 'rds' },
];

const FLAVOR_OPTIONS = [
  { label: 'storage_capacity_pre', value: 'storage_capacity_pre' },
  { label: 'api_request_post', value: 'api_request_post' },
  { label: 'data_transfer_out', value: 'data_transfer_out' },
];

const RESULT_OPTIONS: { label: string; value: AuditResult }[] = [
  { label: '校验通过', value: 'pass' },
  { label: '拦截不入账', value: 'hard-block' },
  { label: '软卡告警', value: 'soft-alert' },
  { label: '观察记录', value: 'observe-record' },
  { label: '豁免命中', value: 'exempt' },
  { label: '不参与稽核', value: 'not-involved' },
];

const STRATEGY_RULES: StrategyRule[] = [
  { rule: 'R1', meaning: '找不到生效的订单或实例（疑似漏推/多收）', strategy: 'hard', flavors: '全部计费项' },
  { rule: 'R2', meaning: '推量节点不是叶子节点，或节点没有对应 provider 资源', strategy: 'hard', flavors: 'agcq.44c175g、agcq.92c350g、aipaas.g3i' },
  { rule: 'R3', meaning: '推账用量超过订单额度', strategy: 'hard', flavors: 'agcq.44c175a' },
  { rule: 'R4', meaning: 'InstanceMeta 字段缺失或格式不合规', strategy: 'hard', flavors: 'agcq.44c175g、agcq.92c350g、aipaas.g3i' },
  { rule: 'R5', meaning: '命中 T+2 离线复核的禁推名单', strategy: 'soft', flavors: '全部计费项' },
];

const EXEMPT_RULES: ExemptRule[] = [
  {
    id: 'ex-1',
    flavor: '全部计费项',
    ruleCode: 'R5',
    ruleMeaning: '命中 T+2 离线复核的禁推名单',
    period: '20260714-20260818',
    before: '硬卡',
    after: '软卡',
    effectiveTime: '2026-07-14',
    expireTime: '2026-08-18',
    remainingDays: 1,
  },
  {
    id: 'ex-2',
    flavor: 'agcq.44c175g',
    ruleCode: 'R1',
    ruleMeaning: '无有效订单',
    period: '20260801-20280831',
    before: '硬卡',
    after: '关闭',
    effectiveTime: '2026-08-01',
    expireTime: '2026-08-31',
    remainingDays: 20,
  },
];

const EXCLUDED_SITES: string[] = [];

const getUniqueFlavorCount = (rules: ExemptRule[]) => new Set(rules.map((rule) => rule.flavor)).size;

const formatCompactDate = (value: string) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;

const formatBillingPeriod = (value: string) => {
  const [start, end] = value.split('-');
  if (!start || !end || start.length !== 8 || end.length !== 8) {
    return value;
  }
  return `${formatCompactDate(start)} ~ ${formatCompactDate(end)}`;
};

const CONTROL_POLICY_LABEL_MAP: Record<RuleStrategy, ControlPolicyLabel> = {
  hard: '硬卡',
  soft: '软卡',
  off: '关闭',
};

const renderControlPolicyTag = (label: ControlPolicyLabel) => {
  if (label === '硬卡') {
    return (
      <Tag.TagPro type="error" icon={null}>
        {label}
      </Tag.TagPro>
    );
  }
  if (label === '软卡') {
    return (
      <Tag.TagPro type="warning" icon={null} className={styles.orangeTag}>
        {label}
      </Tag.TagPro>
    );
  }
  return <Tag.TagPro icon={null}>{label}</Tag.TagPro>;
};

const renderFlavorTags = (value: string) => {
  if (value === '全部计费项') {
    return value;
  }

  return <FlavorTagsCell flavors={value.split('、')} />;
};

const FlavorTagsCell = ({ flavors }: { flavors: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const plusRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(flavors.length);

  const updateVisibleCount = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const tagWidths = tagRefs.current.map((tag) => tag?.offsetWidth ?? 0);
    const plusWidth = plusRef.current?.offsetWidth ?? 0;

    if (!containerWidth || tagWidths.some((width) => width === 0)) {
      return;
    }

    const fullWidth = tagWidths.reduce((sum, width) => sum + width, 0) + FLAVOR_TAG_GAP * (flavors.length - 1);
    if (fullWidth <= containerWidth) {
      setVisibleCount(flavors.length);
      return;
    }

    const availableWidth = containerWidth - plusWidth - FLAVOR_TAG_GAP;
    let usedWidth = 0;
    let nextVisibleCount = 0;

    for (const width of tagWidths) {
      const nextWidth = usedWidth + (nextVisibleCount > 0 ? FLAVOR_TAG_GAP : 0) + width;
      if (nextWidth > availableWidth) {
        break;
      }
      usedWidth = nextWidth;
      nextVisibleCount += 1;
    }

    setVisibleCount(nextVisibleCount);
  }, [flavors]);

  useLayoutEffect(() => {
    updateVisibleCount();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(updateVisibleCount);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [updateVisibleCount]);

  const hiddenCount = flavors.length - visibleCount;

  return (
    <div className={styles.flavorTags} ref={containerRef}>
      {flavors.slice(0, visibleCount).map((flavor) => (
        <Tag.TagPro key={flavor} mode="outline" icon={null}>
          {flavor}
        </Tag.TagPro>
      ))}
      {hiddenCount > 0 && (
        <Tag.TagPro mode="outline" icon={null}>
          +{hiddenCount}
        </Tag.TagPro>
      )}
      <div className={styles.flavorTagsMeasure} aria-hidden>
        {flavors.map((flavor, index) => (
          <span
            key={flavor}
            ref={(node) => {
              tagRefs.current[index] = node;
            }}
          >
            <Tag.TagPro mode="outline" icon={null}>
              {flavor}
            </Tag.TagPro>
          </span>
        ))}
        <span ref={plusRef}>
          <Tag.TagPro mode="outline" icon={null}>
            +{flavors.length}
          </Tag.TagPro>
        </span>
      </div>
    </div>
  );
};

const renderRuleCodeTag = (
  rule: string,
  options?: {
    type?: 'error' | 'warning' | 'processing';
    mode?: 'outline' | 'fill';
  },
) => (
  <Tag.TagPro
    type={options?.type}
    mode={options?.mode}
    icon={null}
    className={styles.ruleCodeTag}
  >
    <span className={styles.ruleCodeText}>{rule}</span>
  </Tag.TagPro>
);

const getExemptRuleCount = (record: AuditRecord) => (record.exemptRule ? 1 : 0);

const ERROR_ADVICE: Record<string, { desc: string; suggestions: string[] }> = {
  R1: {
    desc: '无有效订单',
    suggestions: ['检查当前推量实例是否有效；', '检查订单上报场景，排查是否漏报', '确认 InstanceMeta 与订单是否一致'],
  },
  R2: {
    desc: '叶子节点校验不通过',
    suggestions: ['检查服务树节点是否挂到正确叶子', '叶子节点的provider 与商品资源提供方是否一致'],
  },
  R3: {
    desc: '用量超过订单值',
    suggestions: ['检查推量用量及推量脚本', '检查转换规则'],
  },
  R4: {
    desc: 'InstanceMeta 字段缺失、格式不合规',
    suggestions: ['检查六元组和 extra 字段'],
  },
  R5: {
    desc: '用量不一致',
    suggestions: ['检查推量用量及推量脚本', '检查转换规则'],
  },
};

const ERROR_ADVICE_TABLE_DATA = ['R1', 'R2', 'R3', 'R4', 'R5'].map((rule) => ({
  rule,
  ...ERROR_ADVICE[rule],
}));

const MOCK_AUDIT_RECORDS: AuditRecord[] = [
  {
    id: 'audit-1',
    billBeginTime: '2026-08-20 00:00:00',
    billEndTime: '2026-08-20 23:59:59',
    product: 'AGCQ',
    flavor: 'agcq.44c175g',
    regionSite: 'cn-beijing / prod',
    instance: 'i-ybm1kq9z8x7c6v5b4n3m2l1k0j',
    serviceTreePath: '字节云/中间件/消息队列/AGCQ/华北',
    customer: 'douyin_cn',
    instanceUsage: '按实际使用量',
    pushUsage: '1,245,678',
    updatedAt: '2026-08-20 14:32:11',
    booked: false,
    result: 'hard-block',
    hitRule: 'R1',
    errorDesc: ERROR_ADVICE.R1.desc,
    suggestions: ERROR_ADVICE.R1.suggestions,
  },
  {
    id: 'audit-2',
    billBeginTime: '2026-08-20 00:00:00',
    billEndTime: '2026-08-20 23:59:59',
    product: 'AGCQ',
    flavor: 'agcq.92c350g',
    regionSite: 'cn-shanghai / prod',
    instance: 'i-shc2h3g4f5d6s7a8q9w0e',
    serviceTreePath: '字节云/中间件/消息队列/AGCQ/华东',
    customer: 'toutiao_global',
    instanceUsage: '2,000,000',
    pushUsage: '2,456,123',
    updatedAt: '2026-08-20 13:18:45',
    booked: false,
    result: 'hard-block',
    hitRule: 'R3',
    errorDesc: ERROR_ADVICE.R3.desc,
    suggestions: ERROR_ADVICE.R3.suggestions,
  },
  {
    id: 'audit-3',
    billBeginTime: '2026-08-20 00:00:00',
    billEndTime: '2026-08-20 23:59:59',
    product: 'AIPaaS',
    flavor: 'aipaas.g3i',
    regionSite: 'cn-guangzhou / prod',
    instance: 'i-gzh7j8k9l0z1x2c3v4b5',
    serviceTreePath: '字节云/AI/AIPaaS/华南',
    customer: 'douyin_effect',
    instanceUsage: '按实际使用量',
    pushUsage: '89,456',
    updatedAt: '2026-08-20 12:05:33',
    booked: true,
    result: 'soft-alert',
    hitRule: 'R5',
    errorDesc: ERROR_ADVICE.R5.desc,
    suggestions: ERROR_ADVICE.R5.suggestions,
  },
  {
    id: 'audit-4',
    billBeginTime: '2026-08-19 00:00:00',
    billEndTime: '2026-08-19 23:59:59',
    product: 'AGCQ',
    flavor: 'agcq.44c175a',
    regionSite: 'cn-beijing / prod',
    instance: 'i-bj6m7n8b9v0c1x2z3a4s',
    serviceTreePath: '字节云/中间件/消息队列/AGCQ/华北',
    customer: 'capcut_cn',
    instanceUsage: '500,000',
    pushUsage: '500,000',
    updatedAt: '2026-08-19 23:58:12',
    booked: true,
    result: 'exempt',
    exemptRule: '全部计费项硬卡降软卡',
  },
  {
    id: 'audit-5',
    billBeginTime: '2026-08-20 00:00:00',
    billEndTime: '2026-08-20 23:59:59',
    product: 'AGCQ',
    flavor: 'agcq.44c175g',
    regionSite: 'cn-beijing / boe',
    instance: 'i-boe1t2y3u4i5o6p7',
    serviceTreePath: '字节云/中间件/消息队列/AGCQ/BOE',
    customer: 'internal_test',
    instanceUsage: '-',
    pushUsage: '12,450',
    updatedAt: '2026-08-20 10:22:08',
    booked: true,
    result: 'not-involved',
  },
  {
    id: 'audit-6',
    billBeginTime: '2026-08-20 00:00:00',
    billEndTime: '2026-08-20 23:59:59',
    product: 'AGCQ',
    flavor: 'agcq.44c175g',
    regionSite: 'cn-beijing / prod',
    instance: 'i-pass8n9b0v1c2x3z4a5s',
    serviceTreePath: '字节云/中间件/消息队列/AGCQ/华北',
    customer: 'douyin_cn',
    instanceUsage: '1,000,000',
    pushUsage: '1,000,000',
    updatedAt: '2026-08-20 15:42:19',
    booked: true,
    result: 'pass',
  },
  {
    id: 'audit-7',
    billBeginTime: '2026-08-20 00:00:00',
    billEndTime: '2026-08-20 23:59:59',
    product: 'AIPaaS',
    flavor: 'aipaas.g3i',
    regionSite: 'cn-shanghai / prod',
    instance: 'i-shd6f7g8h9j0k1l2z3x',
    serviceTreePath: '字节云/AI/AIPaaS/华东',
    customer: 'jianying_cn',
    instanceUsage: '按实际使用量',
    pushUsage: '45,123',
    updatedAt: '2026-08-20 11:30:55',
    booked: false,
    result: 'hard-block',
    hitRule: 'R2',
    errorDesc: ERROR_ADVICE.R2.desc,
    suggestions: ERROR_ADVICE.R2.suggestions,
  },
  {
    id: 'audit-8',
    billBeginTime: '2026-08-20 00:00:00',
    billEndTime: '2026-08-20 23:59:59',
    product: 'AGCQ',
    flavor: 'agcq.44c175g',
    regionSite: 'cn-beijing / prod',
    instance: 'i-bjf4d5s6a7q8w9e0r1t',
    serviceTreePath: '字节云/中间件/消息队列/AGCQ/华北',
    customer: 'xigua_video',
    instanceUsage: '按实际使用量',
    pushUsage: '780,234',
    updatedAt: '2026-08-20 09:15:27',
    booked: false,
    result: 'hard-block',
    hitRule: 'R4',
    errorDesc: ERROR_ADVICE.R4.desc,
    suggestions: ERROR_ADVICE.R4.suggestions,
  },
  {
    id: 'audit-9',
    billBeginTime: '2026-08-20 00:00:00',
    billEndTime: '2026-08-20 23:59:59',
    product: 'AGCQ',
    flavor: 'agcq.44c175a',
    regionSite: 'cn-guangzhou / prod',
    instance: 'i-gzr2t3y4u5i6o7p8a9s',
    serviceTreePath: '字节云/中间件/消息队列/AGCQ/华南',
    customer: 'douyin_lite',
    instanceUsage: '按实际使用量',
    pushUsage: '312,890',
    updatedAt: '2026-08-20 16:08:42',
    booked: true,
    result: 'soft-alert',
    hitRule: 'R3',
    errorDesc: ERROR_ADVICE.R3.desc,
    suggestions: ERROR_ADVICE.R3.suggestions,
  },
  {
    id: 'audit-10',
    billBeginTime: '2026-08-19 00:00:00',
    billEndTime: '2026-08-19 23:59:59',
    product: 'AGCQ',
    flavor: 'agcq.92c350g',
    regionSite: 'cn-beijing / prod',
    instance: 'i-bjq1w2e3r4t5y6u7i8o',
    serviceTreePath: '字节云/中间件/消息队列/AGCQ/华北',
    customer: 'douyin_cn',
    instanceUsage: '1,500,000',
    pushUsage: '1,500,000',
    updatedAt: '2026-08-19 22:45:03',
    booked: true,
    result: 'exempt',
    exemptRule: 'agcq.44c175g 硬卡降关闭（20260801-20280831）',
  },
];

const DEFAULT_DETAIL_FILTERS: DetailFilters = {
  flavors: [],
  psm: '',
  booked: 'all',
  result: 'all',
};

const OVERVIEW_CARDS: OverviewCardData[] = [
  {
    key: 'hard-block',
    title: '硬卡拦截',
    value: 403,
    desc: '未入账，需优先修复或申请豁免',
    accentType: 'hard',
    rules: [
      { rule: 'R1', count: 168 },
      { rule: 'R2', count: 89 },
      { rule: 'R3', count: 87 },
      { rule: 'R4', count: 59 },
    ],
    filter: { booked: 'no' },
  },
  {
    key: 'soft-alert',
    title: '软卡告警',
    value: 403,
    desc: '已入账但稽核校验不通过，需持续跟进修复',
    accentType: 'soft',
    rules: [
      { rule: 'R3', count: 87 },
      { rule: 'R5', count: 59 },
    ],
    filter: { booked: 'yes', result: 'soft-alert' },
  },
  {
    key: 'exempt',
    title: '稽核豁免',
    value: 2,
    desc: '2 个生效豁免 · 1 个 24h 内到期',
    accentType: 'exempt',
    filter: { result: 'exempt' },
  },
  {
    key: 'not-involved',
    title: '不参与稽核',
    value: 0,
    desc: '生效豁免：2 / 24h 内到期：1',
    accentType: 'exclude',
    filter: { result: 'not-involved' },
  },
];

const getStageAuditRecords = (stage: ControlStage): AuditRecord[] =>
  MOCK_AUDIT_RECORDS.map((item) => {
    if (item.result !== 'hard-block' && item.result !== 'soft-alert') {
      return item;
    }

    if (stage === 'observe') {
      return { ...item, booked: true, result: 'observe-record' };
    }
    if (stage === 'soft') {
      return { ...item, booked: true, result: 'soft-alert' };
    }
    if (stage === 'hard') {
      return { ...item, booked: false, result: 'hard-block' };
    }
    return item;
  });

const getStageOverviewCards = (stage: ControlStage): OverviewCardData[] =>
  OVERVIEW_CARDS.map((card) => {
    if (card.key === 'hard-block') {
      if (stage === 'observe') {
        return { ...card, value: 0, desc: '观察期仅记录异常，不拦截入账', rules: [] };
      }
      if (stage === 'soft') {
        return { ...card, value: 0, desc: '软卡阶段不拦截入账，异常转为告警', rules: [] };
      }
      if (stage === 'hard') {
        return {
          ...card,
          value: 992,
          desc: '全量硬卡生效，稽核不通过均不入账',
          rules: [
            { rule: 'R1', count: 168 },
            { rule: 'R2', count: 89 },
            { rule: 'R3', count: 676 },
            { rule: 'R4', count: 59 },
          ],
        };
      }
    }

    if (card.key === 'soft-alert') {
      if (stage === 'observe') {
        return {
          ...card,
          title: '观察异常',
          value: 992,
          desc: '仅记录稽核异常，不拦截、不告警入账',
          rules: [
            { rule: 'R1', count: 168 },
            { rule: 'R2', count: 89 },
            { rule: 'R3', count: 293 },
            { rule: 'R4', count: 59 },
            { rule: 'R5', count: 383 },
          ],
          filter: { booked: 'yes', result: 'observe-record' },
        };
      }
      if (stage === 'soft') {
        return {
          ...card,
          value: 992,
          desc: '稽核不通过已入账并生成告警',
          rules: [
            { rule: 'R1', count: 168 },
            { rule: 'R2', count: 89 },
            { rule: 'R3', count: 293 },
            { rule: 'R4', count: 59 },
            { rule: 'R5', count: 383 },
          ],
        };
      }
      if (stage === 'hard') {
        return { ...card, value: 0, desc: '硬卡阶段无软卡告警，异常直接拦截', rules: [] };
      }
    }

    return card;
  });

const getStagePassRate = (stage: ControlStage) => {
  if (stage === 'observe' || stage === 'soft') {
    return '100.0%';
  }
  if (stage === 'hard') {
    return '91.7%';
  }
  return '90.2%';
};

const PushAbnormalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');
  const currentStage = isControlStage(stageParam) ? stageParam : DEFAULT_CONTROL_STAGE;
  const [selectedProduct, setSelectedProduct] = useState('agcq');
  const [periodRange, setPeriodRange] = useState<PeriodRangeValue>({
    mode: 'day',
    range: ['2026-08-20', '2026-08-20'],
  });
  const [collapseExpanded, setCollapseExpanded] = useState(true);
  const [activeRuleTab, setActiveRuleTab] = useState<RuleTabKey>('strategy');
  const [detailFilters, setDetailFilters] = useState<DetailFilters>(DEFAULT_DETAIL_FILTERS);
  const [suggestionDrawerVisible, setSuggestionDrawerVisible] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const prevStageRef = useRef<ControlStage>(currentStage);

  const samplingRate = 20;

  const stageInfo = STAGE_MAP[currentStage];
  const passRate = useMemo(() => getStagePassRate(currentStage), [currentStage]);
  const overviewCards = useMemo(() => getStageOverviewCards(currentStage), [currentStage]);
  const stageAuditRecords = useMemo(() => getStageAuditRecords(currentStage), [currentStage]);
  const excludeSiteCount = EXCLUDED_SITES.length;
  const exemptFlavorCount = useMemo(() => getUniqueFlavorCount(EXEMPT_RULES), []);

  useEffect(() => {
    if (prevStageRef.current !== currentStage) {
      setDetailFilters(DEFAULT_DETAIL_FILTERS);
      prevStageRef.current = currentStage;
    }
  }, [currentStage]);

  const filteredRecords = useMemo(() => {
    return stageAuditRecords.filter((item) => {
      if (detailFilters.flavors.length && !detailFilters.flavors.includes(item.flavor)) {
        return false;
      }
      if (detailFilters.psm && !item.serviceTreePath.toLowerCase().includes(detailFilters.psm.toLowerCase())) {
        return false;
      }
      if (detailFilters.booked !== 'all') {
        const isBooked = detailFilters.booked === 'yes';
        if (item.booked !== isBooked) {
          return false;
        }
      }
      if (detailFilters.result !== 'all' && item.result !== detailFilters.result) {
        return false;
      }
      return true;
    });
  }, [detailFilters, stageAuditRecords]);

  const drawerRuleHitCountMap = useMemo(() => {
    return filteredRecords.reduce<Record<string, number>>((acc, item) => {
      if (item.hitRule) {
        acc[item.hitRule] = (acc[item.hitRule] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [filteredRecords]);

  const scrollToDetail = useCallback((filter?: Partial<DetailFilters>) => {
    const nextFilters = { ...DEFAULT_DETAIL_FILTERS, ...filter };
    setDetailFilters(nextFilters);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleDetailFilterChange = useCallback(<K extends keyof DetailFilters>(field: K, value: DetailFilters[K]) => {
    setDetailFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleExport = useCallback(() => {
    Message.success(`已创建 ${filteredRecords.length} 条记录的导出任务，可在 BABI 导出中心查看`);
  }, [filteredRecords.length]);

  const handleOverviewKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>, filter?: Partial<DetailFilters>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    scrollToDetail(filter);
  }, [scrollToDetail]);

  const strategyColumns = useMemo(
    () => [
      {
        title: '规则',
        dataIndex: 'rule',
        width: 80,
        render: (v: string) => <span className={styles.ruleCodeText}>{v}</span>,
      },
      { title: '规则含义', dataIndex: 'meaning' },
      {
        title: '管控策略',
        dataIndex: 'strategy',
        width: 120,
        render: (v: RuleStrategy) => renderControlPolicyTag(CONTROL_POLICY_LABEL_MAP[v]),
      },
      {
        title: '命中计费项',
        dataIndex: 'flavors',
        width: 300,
        render: (v: string) => renderFlavorTags(v),
      },
    ],
    [],
  );

  const exemptColumns = useMemo(
    () => [
      { title: '计费项', dataIndex: 'flavor', width: 160 },
      {
        title: '策略规则',
        dataIndex: 'ruleCode',
        width: 220,
        render: (_: string, record: ExemptRule) => (
          <div className={styles.ruleReference}>
            {renderRuleCodeTag(record.ruleCode, { mode: 'outline' })}
            <span>{record.ruleMeaning}</span>
          </div>
        ),
      },
      {
        title: '账期',
        dataIndex: 'period',
        width: 220,
        render: (v: string) => formatBillingPeriod(v),
      },
      {
        title: '豁免前',
        dataIndex: 'before',
        width: 100,
        render: (v: ControlPolicyLabel) => renderControlPolicyTag(v),
      },
      {
        title: '豁免后',
        dataIndex: 'after',
        width: 100,
        render: (v: ControlPolicyLabel) => renderControlPolicyTag(v),
      },
      { title: '生效时间', dataIndex: 'effectiveTime', width: 120 },
      { title: '到期时间', dataIndex: 'expireTime', width: 120 },
      {
        title: '剩余时间',
        dataIndex: 'remainingDays',
        width: 120,
        render: (v: number) => (
          <span style={{ color: v <= 3 ? 'rgb(var(--danger-6))' : 'var(--color-text-2)' }}>
            {v <= 0 ? '已过期' : `剩余 ${v} 天`}
          </span>
        ),
      },
    ],
    [],
  );

  const detailColumns = useMemo(
    () => [
      {
        title: '账期',
        dataIndex: 'billBeginTime',
        width: 220,
        render: (_: string, record: AuditRecord) =>
          `${record.billBeginTime.slice(0, 10)} ~ ${record.billEndTime.slice(0, 10)}`,
      },
      { title: '商品', dataIndex: 'product', width: 100 },
      { title: '计费项', dataIndex: 'flavor', width: 160 },
      { title: '售卖区域/Site', dataIndex: 'regionSite', width: 160 },
      {
        title: '实例',
        dataIndex: 'instance',
        width: 200,
        ellipsis: true,
        tooltip: true,
      },
      {
        title: '服务树路径',
        dataIndex: 'serviceTreePath',
        width: 220,
        ellipsis: true,
        tooltip: true,
      },
      { title: 'Customer', dataIndex: 'customer', width: 140, ellipsis: true, tooltip: true },
      { title: '实例用量', dataIndex: 'instanceUsage', width: 120 },
      { title: '推账条目用量', dataIndex: 'pushUsage', width: 130, sorter: true, align: 'right' as const },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 180,
        sorter: true,
        defaultSortOrder: 'descend' as const,
      },
      {
        title: '是否入账',
        dataIndex: 'booked',
        width: 100,
        render: (v: boolean) =>
          v ? <Tag.TagPro type="success">是</Tag.TagPro> : <Tag.TagPro type="error">否</Tag.TagPro>,
      },
      {
        title: '稽核结果',
        dataIndex: 'result',
        width: 130,
        fixed: 'right' as const,
        render: (v: AuditResult, record: AuditRecord) => {
          switch (v) {
            case 'pass':
              return <Tag.TagPro type="success">校验通过</Tag.TagPro>;
            case 'hard-block':
              return <Tag.TagPro type="error">拦截不入账</Tag.TagPro>;
            case 'soft-alert':
              return <Tag.TagPro type="warning">软卡告警</Tag.TagPro>;
            case 'observe-record':
              return <Tag.TagPro type="success">观察记录</Tag.TagPro>;
            case 'exempt':
              return (
                <Tooltip content={record.exemptRule}>
                  <Tag.TagPro type="processing">豁免命中</Tag.TagPro>
                </Tooltip>
              );
            case 'not-involved':
              return (
                <Tag.TagPro icon={<IconMinusCircleFill />} className={styles.notInvolvedTag}>
                  不参与稽核
                </Tag.TagPro>
              );
            default:
              return <span className={styles.placeholder}>-</span>;
          }
        },
      },
      {
        title: '命中规则和异常结果',
        dataIndex: 'hitRule',
        width: 260,
        fixed: 'right' as const,
        render: (_: string | undefined, record: AuditRecord) => {
          if (record.result === 'exempt' && record.exemptRule) {
            return (
              <Tooltip content={record.exemptRule}>
                <span className={styles.ruleSummaryText}>
                  <span className={styles.exemptRuleCount}>{`${getExemptRuleCount(record)} 条`}</span>
                  <span>豁免规则</span>
                </span>
              </Tooltip>
            );
          }
          if (record.result === 'not-involved') {
            return (
              <Tooltip content="当前条目命中排除配置，不参与本次稽核。">
                <span className={styles.ruleSummaryText}>不参与稽核，无异常结果</span>
              </Tooltip>
            );
          }
          if (!record.hitRule || !record.errorDesc) {
            return <span className={styles.placeholder}>-</span>;
          }

          return (
            <Tooltip content={ERROR_ADVICE[record.hitRule]?.desc}>
              <div className={styles.ruleSummary}>
                {renderRuleCodeTag(record.hitRule, {
                  type: record.result === 'soft-alert' ? 'warning' : 'error',
                  mode: 'outline',
                })}
                <span className={styles.ruleSummaryText}>{record.errorDesc}</span>
              </div>
            </Tooltip>
          );
        },
      },
    ],
    [],
  );

  const renderStageTag = () => {
    const stageTagClassName = stageInfo.type === 'warning' ? styles.orangeTag : undefined;

    if (currentStage === 'gray-hard') {
      return (
        <Tooltip content={stageInfo.desc}>
          <Tag.TagPro type={stageInfo.type} icon={null} className={stageTagClassName}>
            <span className={styles.stageTagContent}>
              <span className={styles.stageTagUnderlined}>{stageInfo.label}</span>
              <span className={styles.stageTagDivider} aria-hidden="true" />
              <span className={styles.stageTagUnderlined}>{`硬卡采样 ${samplingRate}%`}</span>
            </span>
          </Tag.TagPro>
        </Tooltip>
      );
    }

    return (
      <Tooltip content={stageInfo.desc}>
        <Tag.TagPro type={stageInfo.type} icon={null} className={stageTagClassName}>
          <span className={styles.stageTagUnderlined}>{stageInfo.label}</span>
        </Tag.TagPro>
      </Tooltip>
    );
  };

  const renderCollapseHeader = () => (
    <div className={styles.collapseHeader} onClick={() => setCollapseExpanded(!collapseExpanded)}>
      <div className={styles.collapseHeaderLeft}>
        <span className={styles.moduleTitle}>当前卡控阶段与命中规则</span>
        {renderStageTag()}
      </div>
      <div className={styles.collapseHeaderRight}>
        <span className={`${styles.collapseArrow} ${!collapseExpanded ? styles.collapsed : ''}`}>
          <IconDown />
        </span>
      </div>
    </div>
  );

  const getRuleLabel = (rule: string) => ERROR_ADVICE[rule]?.desc.split('：')[0] ?? '';

  const renderMetricMiniCard = (
    card: OverviewCardData,
    extra?: React.ReactNode,
  ) => (
    <div
      key={card.key}
      className={styles.metricMiniCard}
      role="button"
      tabIndex={0}
      onClick={() => scrollToDetail(card.filter)}
      onKeyDown={(event) => handleOverviewKeyDown(event, card.filter)}
    >
      <div className={styles.metricMiniHeader}>
        <span className={styles.metricMiniTitle}>{card.title}</span>
        <IconRight className={styles.metricArrow} />
      </div>
      <div className={styles.metricMiniValue}>{card.value.toLocaleString()}</div>
      {extra}
    </div>
  );

  const renderPassRateGauge = () => {
    const passRateValue = Number(passRate.replace('%', ''));
    const normalizedRate = Number.isFinite(passRateValue)
      ? Math.max(0, Math.min(100, passRateValue))
      : 0;

    return (
      <div className={styles.passGauge}>
        <svg className={styles.gaugeSvg} viewBox="0 0 200 132" aria-hidden="true">
          <path className={styles.gaugeTrack} d="M 26 100 A 74 74 0 0 1 174 100" pathLength={100} />
          <path
            className={styles.gaugeProgress}
            d="M 26 100 A 74 74 0 0 1 174 100"
            pathLength={100}
            strokeDasharray={`${normalizedRate} 100`}
          />
          <text x="100" y="13" className={styles.gaugeTick}>50</text>
          <text x="34" y="40" className={styles.gaugeTick}>25</text>
          <text x="166" y="40" className={styles.gaugeTick}>75</text>
          <text x="12" y="116" className={styles.gaugeTick}>0</text>
          <text x="188" y="116" className={styles.gaugeTick}>100</text>
        </svg>
        <div className={styles.gaugeValue}>
          <span>{passRate.replace('%', '')}</span>
          <span className={styles.gaugeUnit}>%</span>
        </div>
        <div className={styles.gaugeTrend}>
          <span>较上次检测</span>
          <span className={styles.trendValue}>
            <IconCaretUpGreen />
            2.3
          </span>
        </div>
      </div>
    );
  };

  const renderCombinedOverviewCard = () => {
    const notInvolvedCard = overviewCards.find((card) => card.key === 'not-involved') ?? OVERVIEW_CARDS[3];
    const exemptCard = overviewCards.find((card) => card.key === 'exempt') ?? OVERVIEW_CARDS[2];

    return (
      <div className={styles.comboKpiCard}>
        <div className={styles.passRatePane}>
          <div className={styles.passRateHeader}>
            <span className={styles.kpiTitle}>稽核通过率</span>
            <Tooltip content="稽核通过条目 /（稽核总条目 - 不参与稽核）">
              <IconQuestionCircle className={styles.kpiInfoIcon} />
            </Tooltip>
          </div>
          {renderPassRateGauge()}
        </div>
        <div className={styles.sideMetricPane}>
          {renderMetricMiniCard(
            notInvolvedCard,
            <div className={styles.metricAssist}>
              <span>生效豁免：<span className={styles.mediumEmphasis}>2</span></span>
              <span>24h 内到期：<span className={styles.mediumEmphasis}>1</span></span>
            </div>,
          )}
          {renderMetricMiniCard(exemptCard)}
        </div>
      </div>
    );
  };

  const renderSignalOverviewCard = (card: OverviewCardData) => {
    const statusIcon = card.accentType === 'hard'
      ? <IconErrorFill className={styles.hardStatusIcon} />
      : <IconWarningFill className={styles.softStatusIcon} />;

    return (
      <div
        key={card.key}
        className={`${styles.signalKpiCard} ${styles[card.accentType]}`}
        role="button"
        tabIndex={0}
        onClick={() => scrollToDetail(card.filter)}
        onKeyDown={(event) => handleOverviewKeyDown(event, card.filter)}
      >
        <div className={styles.signalHeader}>
          <div className={styles.signalTitleGroup}>
            {statusIcon}
            <span className={styles.signalTitle}>{card.title}</span>
            <span className={styles.signalDesc}>{card.desc}</span>
          </div>
          <IconRight className={styles.metricArrow} />
        </div>
        <div className={styles.signalValue}>{card.value.toLocaleString()}</div>
        <div className={styles.signalRuleList}>
          {(card.rules ?? []).map((r) => (
            <div
              key={r.rule}
              className={styles.signalRuleItem}
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                scrollToDetail(card.filter);
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
                handleOverviewKeyDown(event, card.filter);
              }}
            >
              <span className={styles.signalRuleName}>
                <span className={styles.signalRuleCode}>{r.rule}</span>
                <span>{getRuleLabel(r.rule)}</span>
              </span>
              <span className={styles.signalRuleCount}>{r.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hardBlockCard = overviewCards.find((card) => card.key === 'hard-block') ?? OVERVIEW_CARDS[0];
  const softAlertCard = overviewCards.find((card) => card.key === 'soft-alert') ?? OVERVIEW_CARDS[1];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <PageHeader.PageHeaderPro
          title="推量异常数据看板"
          backIcon
          onBack={() => navigate(-1)}
          extra={
            <div className={styles.headerActions}>
              <Select
                className={styles.headerProduct}
                addBefore="商品"
                showSearch
                allowClear
                placeholder="请选择"
                options={PRODUCT_OPTIONS}
                value={selectedProduct}
                onChange={(v) => setSelectedProduct(v as string)}
              />
              <PeriodRangePicker
                className={styles.headerPeriod}
                style={{ width: 332, minWidth: 332, maxWidth: 332, flex: '0 0 332px' }}
                value={periodRange}
                onChange={setPeriodRange}
              />
            </div>
          }
        />
        <Divider className={styles.headerDivider} />
      </div>

      <div className={styles.content}>
        <div className={styles.collapseCard}>
          {renderCollapseHeader()}
          {collapseExpanded && (
            <div className={styles.collapseContent}>
              <Alert
                type="info"
                showIcon
                content="仅对非预估日账单生效；草稿/调价环境的日账单同样生效；预估账单与月账单不生效。负值/返利保持既有默认硬校验，不通过策略降级。"
                style={{ marginBottom: 16 }}
              />

              <Tabs
                type="line"
                activeTab={activeRuleTab}
                onChange={(k) => setActiveRuleTab(k as RuleTabKey)}
                className={styles.ruleTabs}
              >
                <Tabs.TabPane key="strategy" title="策略规则" />
                <Tabs.TabPane key="exclude" title={<Tabs.TabsBadge title="不参与稽核" num={excludeSiteCount} />} />
                <Tabs.TabPane key="exempt" title={<Tabs.TabsBadge title="豁免规则" num={exemptFlavorCount} />} />
              </Tabs>

              <div className={styles.ruleTabContent}>
                {activeRuleTab === 'strategy' && (
                  <Table
                    border={false}
                    columns={strategyColumns}
                    data={STRATEGY_RULES}
                    rowKey="rule"
                    pagination={false}
                  />
                )}
                {activeRuleTab === 'exclude' && (
                  <div className={styles.excludeInfo}>
                    未配置排除，全部推量正常参与稽核。
                    <span className={styles.subText}>（若已配置，此处会列出被排除的站点，如"boe 站点整体排除"。）</span>
                  </div>
                )}
                {activeRuleTab === 'exempt' && (
                  <Table
                    border={false}
                    columns={exemptColumns}
                    data={EXEMPT_RULES}
                    rowKey="id"
                    pagination={false}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.overviewBlock}>
          <div className={styles.overviewHeader}>
            <span className={styles.moduleTitle}>推量数据概览</span>
          </div>
          <div className={styles.overviewSection}>
            {renderCombinedOverviewCard()}
            {renderSignalOverviewCard(hardBlockCard)}
            {renderSignalOverviewCard(softAlertCard)}
          </div>
        </div>

        <div ref={detailRef} className={styles.detailSection}>
          <div className={styles.detailHeader}>
            <span className={styles.moduleTitle}>稽核明细</span>
          </div>

          <div className={styles.detailFilterBar}>
            <Select
              className={styles.filterItem}
              addBefore="计费项"
              mode="multiple"
              allowClear
              showSearch
              placeholder="请选择"
              options={FLAVOR_OPTIONS}
              value={detailFilters.flavors}
              onChange={(v) => handleDetailFilterChange('flavors', v as string[])}
            />
            <Input
              className={styles.filterItem}
              addBefore="PSM"
              allowClear
              placeholder="请输入 PSM 关键字"
              value={detailFilters.psm}
              onChange={(v) => handleDetailFilterChange('psm', v)}
            />
            <Select
              className={styles.filterItem}
              addBefore="是否入账"
              allowClear
              placeholder="全部"
              options={[
                { label: '是', value: 'yes' },
                { label: '否', value: 'no' },
              ]}
              value={detailFilters.booked === 'all' ? undefined : detailFilters.booked}
              onChange={(v) => handleDetailFilterChange('booked', (v as 'yes' | 'no') ?? 'all')}
            />
            <Select
              className={styles.filterItem}
              addBefore="稽核结果"
              allowClear
              placeholder="全部"
              options={RESULT_OPTIONS}
              value={detailFilters.result === 'all' ? undefined : detailFilters.result}
              onChange={(v) => handleDetailFilterChange('result', (v as AuditResult) ?? 'all')}
            />
            <div className={styles.filterActions}>
              <Tooltip content="导出当前结果">
                <Button type="outline" icon={<IconDownload />} iconOnly onClick={handleExport} />
              </Tooltip>
              <Button type="outline" icon={<IconBulb />} onClick={() => setSuggestionDrawerVisible(true)}>
                查看处理建议
              </Button>
            </div>
          </div>

          <Table
            border
            columns={detailColumns}
            data={filteredRecords}
            rowKey="id"
            scroll={{ x: true }}
            pagination={{
              pageSize: 10,
              showTotal: true,
            }}
            noDataElement={<div className={styles.placeholder}>暂无数据</div>}
          />
        </div>
      </div>

      <Drawer
        title="处理建议"
        visible={suggestionDrawerVisible}
        onCancel={() => setSuggestionDrawerVisible(false)}
        width={520}
        footer={null}
      >
        <div className={styles.suggestionDrawer}>
          <div className={styles.suggestionList}>
            {ERROR_ADVICE_TABLE_DATA.map((item) => (
              <div key={item.rule} className={styles.suggestionCard}>
                <div className={styles.suggestionHeader}>
                  <div className={styles.suggestionHeaderMain}>
                    {renderRuleCodeTag(item.rule, { type: 'error', mode: 'outline' })}
                    <span className={styles.suggestionTitle}>{item.desc}</span>
                  </div>
                  <span className={styles.suggestionCount}>{`命中 ${drawerRuleHitCountMap[item.rule] ?? 0} 条`}</span>
                </div>
                <ul className={styles.repairList}>
                  {item.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default PushAbnormalDashboard;
