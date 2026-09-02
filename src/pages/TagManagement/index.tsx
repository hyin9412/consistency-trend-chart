import {
  Alert,
  Button,
  Input,
  Link,
  Message,
  Modal,
  PageHeader,
  Radio,
  Select,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from '@tod-m/materials/ve-o';
import React, { useCallback, useMemo, useState } from 'react';
import FixedFooter from 'components/FixedFooter';
import styles from './index.module.scss';

type ViewTabKey = 'api' | 'tag';
type BatchActionMode = 'remove' | 'add';
type AddTagScheme = 'schemeA' | 'schemeB' | 'schemeC' | 'schemeD';

interface SchemeBRow {
  id: string;
  key?: string;
  value?: string;
}

interface ApiTag {
  key: string;
  value: string;
}

interface TagValueOption {
  value: string;
  label: string;
  description: string;
  creator: string;
  updater: string;
  updatedAt: string;
}

interface TagKeyOption {
  key: string;
  label: string;
  values: TagValueOption[];
}

interface ApiItem {
  id: string;
  name: string;
  component: string;
  method: string;
  owner: string;
  updatedAt: string;
  tags: ApiTag[];
}

interface LabelItem {
  id: string;
  key: string;
  keyLabel: string;
  value: string;
  description: string;
  apiCount: number;
  creator: string;
  updatedAt: string;
  updater: string;
}

interface ApiFilters {
  components: string[];
  methods: string[];
  tags: string[];
  keyword: string;
}

interface TagSummary extends ApiTag {
  count: number;
}

const API_PAGE_SIZE = 5;
const MAX_BATCH_SELECT_COUNT = 50;

const TAG_LIBRARY: TagKeyOption[] = [
  {
    key: 'serviceLevel',
    label: '服务等级',
    values: [
      {
        value: 'P0',
        label: 'P0',
        description: '核心链路接口，需要最高优先级保障。',
        creator: '王晨',
        updater: '王晨',
        updatedAt: '2026-07-22 10:30:12',
      },
      {
        value: 'P1',
        label: 'P1',
        description: '重要链路接口，需要重点监控。',
        creator: '王晨',
        updater: '李玥',
        updatedAt: '2026-07-22 16:08:19',
      },
      {
        value: 'P2',
        label: 'P2',
        description: '常规业务接口，按标准 SLA 维护。',
        creator: '王晨',
        updater: '李玥',
        updatedAt: '2026-07-21 14:22:40',
      },
    ],
  },
  {
    key: 'environment',
    label: '环境',
    values: [
      {
        value: '线上',
        label: '线上',
        description: '正式流量环境。',
        creator: '刘涛',
        updater: '刘涛',
        updatedAt: '2026-07-20 11:20:05',
      },
      {
        value: '测试',
        label: '测试',
        description: '联调和验证环境。',
        creator: '刘涛',
        updater: '吴越',
        updatedAt: '2026-07-20 18:12:41',
      },
    ],
  },
  {
    key: 'businessLine',
    label: '核心业务线',
    values: [
      {
        value: '交易',
        label: '交易',
        description: '直接服务交易链路的接口。',
        creator: '陈希',
        updater: '陈希',
        updatedAt: '2026-07-19 09:11:23',
      },
      {
        value: '履约',
        label: '履约',
        description: '服务履约执行和状态同步。',
        creator: '陈希',
        updater: '王晨',
        updatedAt: '2026-07-21 17:49:18',
      },
      {
        value: '运营',
        label: '运营',
        description: '服务运营配置和分析场景。',
        creator: '陈希',
        updater: '王晨',
        updatedAt: '2026-07-18 19:42:55',
      },
    ],
  },
  {
    key: 'ownerTeam',
    label: '责任部门',
    values: [
      {
        value: '开放平台',
        label: '开放平台',
        description: '开放平台团队维护。',
        creator: '胡垠',
        updater: '胡垠',
        updatedAt: '2026-07-22 15:20:11',
      },
      {
        value: '交易平台',
        label: '交易平台',
        description: '交易平台团队维护。',
        creator: '胡垠',
        updater: '吴越',
        updatedAt: '2026-07-23 09:42:38',
      },
      {
        value: '治理平台',
        label: '治理平台',
        description: '治理平台团队维护。',
        creator: '胡垠',
        updater: '陈希',
        updatedAt: '2026-07-22 20:18:02',
      },
    ],
  },
];

const INITIAL_API_DATA: ApiItem[] = [
  {
    id: 'api-1',
    name: 'queryOrderList',
    component: 'OrderOverview',
    method: 'GET',
    owner: '开放平台',
    updatedAt: '2026-07-23 10:12:11',
    tags: [
      { key: 'serviceLevel', value: 'P0' },
      { key: 'environment', value: '线上' },
      { key: 'businessLine', value: '交易' },
    ],
  },
  {
    id: 'api-2',
    name: 'batchBindLabels',
    component: 'ApiBatchAction',
    method: 'POST',
    owner: '治理平台',
    updatedAt: '2026-07-23 09:58:44',
    tags: [
      { key: 'serviceLevel', value: 'P1' },
      { key: 'businessLine', value: '交易' },
      { key: 'ownerTeam', value: '治理平台' },
    ],
  },
  {
    id: 'api-3',
    name: 'syncTagDefinitions',
    component: 'TagDefinitionDrawer',
    method: 'PUT',
    owner: '治理平台',
    updatedAt: '2026-07-23 08:42:31',
    tags: [
      { key: 'environment', value: '测试' },
      { key: 'ownerTeam', value: '治理平台' },
    ],
  },
  {
    id: 'api-4',
    name: 'queryFulfillmentEvent',
    component: 'FulfillmentTable',
    method: 'GET',
    owner: '交易平台',
    updatedAt: '2026-07-22 20:11:05',
    tags: [
      { key: 'serviceLevel', value: 'P0' },
      { key: 'environment', value: '线上' },
      { key: 'businessLine', value: '履约' },
    ],
  },
  {
    id: 'api-5',
    name: 'replayCallbackMessage',
    component: 'CallbackPanel',
    method: 'POST',
    owner: '开放平台',
    updatedAt: '2026-07-22 18:15:33',
    tags: [],
  },
  {
    id: 'api-6',
    name: 'publishOpsNotice',
    component: 'OpsWorkbench',
    method: 'POST',
    owner: '治理平台',
    updatedAt: '2026-07-22 15:06:48',
    tags: [
      { key: 'businessLine', value: '运营' },
      { key: 'ownerTeam', value: '治理平台' },
    ],
  },
  {
    id: 'api-7',
    name: 'queryApiAuditTrail',
    component: 'AuditHistory',
    method: 'GET',
    owner: '治理平台',
    updatedAt: '2026-07-21 22:40:17',
    tags: [],
  },
  {
    id: 'api-8',
    name: 'updateRouteConfig',
    component: 'GatewayConfig',
    method: 'PUT',
    owner: '开放平台',
    updatedAt: '2026-07-21 17:29:56',
    tags: [
      { key: 'serviceLevel', value: 'P1' },
      { key: 'environment', value: '测试' },
      { key: 'ownerTeam', value: '开放平台' },
    ],
  },
];

const DEFAULT_API_FILTERS: ApiFilters = {
  components: [],
  methods: [],
  tags: [],
  keyword: '',
};

const serializeTag = (tag: ApiTag) => `${tag.key}::${tag.value}`;
const createSchemeBRow = (key?: string, value?: string): SchemeBRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  key,
  value,
});

const TagManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewTabKey>('api');
  const [apiData, setApiData] = useState<ApiItem[]>(INITIAL_API_DATA);
  const [tagLibrary, setTagLibrary] = useState<TagKeyOption[]>(TAG_LIBRARY);
  const [apiFilters, setApiFilters] = useState<ApiFilters>(DEFAULT_API_FILTERS);
  const [labelKeyword, setLabelKeyword] = useState('');
  const [batchSelectMode, setBatchSelectMode] = useState(false);
  const [selectedApiKeys, setSelectedApiKeys] = useState<string[]>([]);
  const [batchVisible, setBatchVisible] = useState(false);
  const [batchActionMode, setBatchActionMode] = useState<BatchActionMode>('remove');
  const [addTagScheme, setAddTagScheme] = useState<AddTagScheme>('schemeA');
  const [activeBatchKey, setActiveBatchKey] = useState(tagLibrary[0]?.key ?? '');
  const [batchKeyKeyword, setBatchKeyKeyword] = useState('');
  const [batchValueKeyword, setBatchValueKeyword] = useState('');
  const [draftAddKey, setDraftAddKey] = useState<string | undefined>();
  const [draftAddValue, setDraftAddValue] = useState<string | undefined>();
  const [schemeBRows, setSchemeBRows] = useState<SchemeBRow[]>([]);
  const [schemeDPickerVisible, setSchemeDPickerVisible] = useState(false);
  const [schemeDSelectedKeys, setSchemeDSelectedKeys] = useState<string[]>([]);
  const [pendingTagChanges, setPendingTagChanges] = useState<Record<string, string>>({});
  const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);

  const tagMetaMap = useMemo(() => {
    const keyLabelMap = new Map<string, string>();
    const valueMap = new Map<string, TagValueOption>();

    tagLibrary.forEach((item) => {
      keyLabelMap.set(item.key, item.label);
      item.values.forEach((value) => {
        valueMap.set(`${item.key}::${value.value}`, value);
      });
    });

    return { keyLabelMap, valueMap };
  }, [tagLibrary]);

  const getTagText = useCallback(
    (tag: ApiTag) => {
      const keyLabel = tagMetaMap.keyLabelMap.get(tag.key) ?? tag.key;
      const valueLabel = tagMetaMap.valueMap.get(serializeTag(tag))?.label ?? tag.value;
      return `${keyLabel}:${valueLabel}`;
    },
    [tagMetaMap],
  );

  const applyDraftToTags = useCallback(
    (tags: ApiTag[]) => {
      if (batchActionMode === 'remove') {
        return tags.filter((item) => !pendingRemovals.includes(serializeTag(item)));
      }

      const nextTags = [...tags];
      const existingKeys = new Set(nextTags.map((item) => item.key));

      Object.entries(pendingTagChanges).forEach(([key, value]) => {
        if (!existingKeys.has(key)) {
          nextTags.push({ key, value });
          existingKeys.add(key);
        }
      });

      const uniqueMap = new Map<string, ApiTag>();
      nextTags.forEach((item) => {
        uniqueMap.set(item.key, item);
      });

      return Array.from(uniqueMap.values()).sort((prev, next) => prev.key.localeCompare(next.key));
    },
    [batchActionMode, pendingRemovals, pendingTagChanges],
  );

  const labelRecords = useMemo<LabelItem[]>(
    () =>
      tagLibrary.flatMap((item) =>
        item.values.map((valueItem) => ({
          id: `${item.key}-${valueItem.value}`,
          key: item.key,
          keyLabel: item.label,
          value: valueItem.label,
          description: valueItem.description,
          apiCount: apiData.filter((api) => api.tags.some((tag) => tag.key === item.key && tag.value === valueItem.value)).length,
          creator: valueItem.creator,
          updatedAt: valueItem.updatedAt,
          updater: valueItem.updater,
        })),
      ),
    [apiData, tagLibrary],
  );

  const componentOptions = useMemo(
    () => Array.from(new Set(apiData.map((item) => item.component))).map((item) => ({ label: item, value: item })),
    [apiData],
  );

  const methodOptions = useMemo(
    () => Array.from(new Set(apiData.map((item) => item.method))).map((item) => ({ label: item, value: item })),
    [apiData],
  );

  const tagOptions = useMemo(
    () =>
      labelRecords.map((item) => ({
        label: `${item.keyLabel}:${item.value}`,
        value: `${item.key}::${item.value}`,
      })),
    [labelRecords],
  );

  const filteredApis = useMemo(() => {
    const keyword = apiFilters.keyword.trim().toLowerCase();

    return apiData.filter((item) => {
      if (apiFilters.components.length && !apiFilters.components.includes(item.component)) {
        return false;
      }

      if (apiFilters.methods.length && !apiFilters.methods.includes(item.method)) {
        return false;
      }

      if (apiFilters.tags.length) {
        const currentTagSet = new Set(item.tags.map((tag) => serializeTag(tag)));
        const hasMatchedTag = apiFilters.tags.some((tag) => currentTagSet.has(tag));
        if (!hasMatchedTag) {
          return false;
        }
      }

      if (!keyword) {
        return true;
      }

      return [item.name, item.component, item.owner, item.method]
        .join(' ')
        .toLowerCase()
        .includes(keyword) || item.tags.some((tag) => getTagText(tag).toLowerCase().includes(keyword));
    });
  }, [apiData, apiFilters, getTagText]);

  const filteredLabels = useMemo(() => {
    const keyword = labelKeyword.trim().toLowerCase();
    if (!keyword) {
      return labelRecords;
    }

    return labelRecords.filter((item) =>
      [item.keyLabel, item.value, item.description, item.creator, item.updater].some((field) =>
        field.toLowerCase().includes(keyword),
      ),
    );
  }, [labelKeyword, labelRecords]);

  const selectedApis = useMemo(
    () => apiData.filter((item) => selectedApiKeys.includes(item.id)),
    [apiData, selectedApiKeys],
  );

  const tagSummaries = useMemo(() => {
    const full: TagSummary[] = [];
    const partial: TagSummary[] = [];

    if (!selectedApis.length) {
      return { full, partial };
    }

    tagLibrary.forEach((group) => {
      group.values.forEach((valueItem) => {
        const count = selectedApis.filter((api) =>
          api.tags.some((tag) => tag.key === group.key && tag.value === valueItem.value),
        ).length;

        if (count === selectedApis.length) {
          full.push({ key: group.key, value: valueItem.value, count });
        } else if (count > 0) {
          partial.push({ key: group.key, value: valueItem.value, count });
        }
      });
    });

    return { full, partial };
  }, [selectedApis, tagLibrary]);

  const activeKeyValues = useMemo(
    () => tagLibrary.find((item) => item.key === activeBatchKey)?.values ?? [],
    [activeBatchKey, tagLibrary],
  );

  const draftAddKeyValues = useMemo(
    () => tagLibrary.find((item) => item.key === draftAddKey)?.values ?? [],
    [draftAddKey, tagLibrary],
  );

  const filteredBatchKeys = useMemo(() => {
    const keyword = batchKeyKeyword.trim().toLowerCase();
    if (!keyword) {
      return tagLibrary;
    }

    return tagLibrary.filter((item) => [item.label, item.key].some((field) => field.toLowerCase().includes(keyword)));
  }, [batchKeyKeyword, tagLibrary]);

  const filteredBatchValues = useMemo(() => {
    const keyword = batchValueKeyword.trim().toLowerCase();
    if (!keyword) {
      return activeKeyValues;
    }

    return activeKeyValues.filter((item) =>
      [item.label, item.value, item.description].some((field) => field.toLowerCase().includes(keyword)),
    );
  }, [activeKeyValues, batchValueKeyword]);

  const pendingChangeTags = useMemo<ApiTag[]>(
    () => Object.entries(pendingTagChanges).map(([key, value]) => ({ key, value })),
    [pendingTagChanges],
  );

  const addableKeyOptions = useMemo(
    () =>
      tagLibrary.map((item) => ({
        label: pendingTagChanges[item.key] ? `${item.label}（已选择）` : item.label,
        value: item.key,
        disabled: Boolean(pendingTagChanges[item.key]),
      })),
    [pendingTagChanges, tagLibrary],
  );

  const draftAddValueOptions = useMemo(
    () => draftAddKeyValues.map((item) => ({ label: item.label, value: item.value })),
    [draftAddKeyValues],
  );

  const schemeCOptions = useMemo(
    () =>
      tagLibrary.flatMap((item) =>
        item.values.map((valueItem) => ({
          label: `${item.label}: ${valueItem.label}`,
          value: `${item.key}::${valueItem.value}`,
          disabled: Boolean(pendingTagChanges[item.key]),
        })),
      ),
    [pendingTagChanges, tagLibrary],
  );

  const pendingRemovalTags = useMemo<ApiTag[]>(
    () =>
      pendingRemovals.map((item) => {
        const [key, value] = item.split('::');
        return { key, value };
      }),
    [pendingRemovals],
  );

  const hasPendingChanges = batchActionMode === 'remove' ? pendingRemovalTags.length > 0 : pendingChangeTags.length > 0;
  const hasCrossPageSelection = selectedApiKeys.length > API_PAGE_SIZE;
  const hasReachedBatchSelectLimit = selectedApiKeys.length >= MAX_BATCH_SELECT_COUNT;

  const handleApiFilterChange = useCallback(<K extends keyof ApiFilters>(field: K, value: ApiFilters[K]) => {
    setApiFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const syncPendingTagChangesFromRows = useCallback((rows: SchemeBRow[]) => {
    const next: Record<string, string> = {};

    rows.forEach((row) => {
      if (row.key && row.value) {
        next[row.key] = row.value;
      }
    });

    setPendingTagChanges(next);
  }, []);

  const createSchemeRowsFromChanges = useCallback(
    (changes: Record<string, string>) => Object.entries(changes).map(([key, value]) => createSchemeBRow(key, value)),
    [],
  );

  const resetBatchDraft = useCallback(() => {
    setBatchActionMode('remove');
    setAddTagScheme('schemeA');
    setPendingTagChanges({});
    setPendingRemovals([]);
    setActiveBatchKey(tagLibrary[0]?.key ?? '');
    setBatchKeyKeyword('');
    setBatchValueKeyword('');
    setDraftAddKey(undefined);
    setDraftAddValue(undefined);
    setSchemeBRows([]);
    setSchemeDPickerVisible(false);
    setSchemeDSelectedKeys([]);
  }, [tagLibrary]);

  const handleOpenBatchModal = useCallback(
    (keys?: string[]) => {
      const nextKeys = keys ?? selectedApiKeys;
      if (!nextKeys.length) {
        Message.error('请先选择需要打标的 API');
        return;
      }

      setSelectedApiKeys(nextKeys);
      resetBatchDraft();
      setBatchVisible(true);
    },
    [resetBatchDraft, selectedApiKeys],
  );

  const handleCloseBatchModal = useCallback(() => {
    setBatchVisible(false);
    resetBatchDraft();
  }, [resetBatchDraft]);

  const handleEnterBatchSelectMode = useCallback(() => {
    setBatchSelectMode(true);
  }, []);

  const handleExitBatchSelectMode = useCallback(() => {
    setBatchSelectMode(false);
    setSelectedApiKeys([]);
  }, []);

  const handleToggleRemovalTag = useCallback((tag: ApiTag) => {
    const serializedTag = serializeTag(tag);

    setPendingRemovals((prev) =>
      prev.includes(serializedTag) ? prev.filter((item) => item !== serializedTag) : [...prev, serializedTag],
    );
  }, []);

  const handleDraftValueChange = useCallback((value: string) => {
    setPendingTagChanges((prev) => ({ ...prev, [activeBatchKey]: value }));
  }, [activeBatchKey]);

  const handleBatchActionModeChange = useCallback((mode: BatchActionMode) => {
    setBatchActionMode(mode);
    setPendingTagChanges({});
    setPendingRemovals([]);
    setAddTagScheme('schemeA');
    setBatchKeyKeyword('');
    setBatchValueKeyword('');
    setDraftAddKey(undefined);
    setDraftAddValue(undefined);
    setSchemeBRows([]);
    setSchemeDPickerVisible(false);
    setSchemeDSelectedKeys([]);
  }, []);

  const handleAddTagSchemeChange = useCallback((scheme: AddTagScheme) => {
    setAddTagScheme(scheme);
    setBatchKeyKeyword('');
    setBatchValueKeyword('');
    setDraftAddKey(undefined);
    setDraftAddValue(undefined);
    setSchemeDPickerVisible(false);
    setSchemeDSelectedKeys([]);
    setSchemeBRows(scheme === 'schemeB' || scheme === 'schemeD' ? createSchemeRowsFromChanges(pendingTagChanges) : []);
  }, [createSchemeRowsFromChanges, pendingTagChanges]);

  const handleDraftAddKeyChange = useCallback((value?: string) => {
    setDraftAddKey(value);
    setDraftAddValue(undefined);
  }, []);

  const handleAppendDraftTag = useCallback(() => {
    if (!draftAddKey || !draftAddValue) {
      return;
    }

    setPendingTagChanges((prev) => ({ ...prev, [draftAddKey]: draftAddValue }));
    setDraftAddKey(undefined);
    setDraftAddValue(undefined);
  }, [draftAddKey, draftAddValue]);

  const handleAppendSchemeCTag = useCallback((value?: string) => {
    if (!value) {
      return;
    }

    const [key, tagValue] = value.split('::');
    if (!key || !tagValue) {
      return;
    }

    setPendingTagChanges((prev) => ({ ...prev, [key]: tagValue }));
  }, []);

  const handleSchemeBAddRow = useCallback(() => {
    setSchemeBRows((prev) => [...prev, createSchemeBRow()]);
  }, []);

  const handleSchemeBDeleteRow = useCallback((rowId: string) => {
    setSchemeBRows((prev) => {
      const nextRows = prev.filter((row) => row.id !== rowId);
      syncPendingTagChangesFromRows(nextRows);
      return nextRows;
    });
  }, [syncPendingTagChangesFromRows]);

  const handleSchemeBKeyChange = useCallback((rowId: string, nextKey?: string) => {
    setSchemeBRows((prev) => {
      const nextRows = prev.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const nextValues = tagLibrary.find((item) => item.key === nextKey)?.values ?? [];
        const keepValue = row.key === nextKey && row.value && nextValues.some((item) => item.value === row.value);

        return {
          ...row,
          key: nextKey,
          value: keepValue ? row.value : undefined,
        };
      });

      syncPendingTagChangesFromRows(nextRows);
      return nextRows;
    });
  }, [syncPendingTagChangesFromRows, tagLibrary]);

  const handleSchemeBValueChange = useCallback((rowId: string, nextValue?: string) => {
    setSchemeBRows((prev) => {
      const nextRows = prev.map((row) => (row.id === rowId ? { ...row, value: nextValue } : row));
      syncPendingTagChangesFromRows(nextRows);
      return nextRows;
    });
  }, [syncPendingTagChangesFromRows]);

  const handleClearDraftKey = useCallback((key: string) => {
    setPendingTagChanges((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleAppendSchemeDRows = useCallback((keys: string[]) => {
    if (!keys.length) {
      return;
    }

    setSchemeBRows((prev) => {
      const existingKeys = new Set(prev.map((row) => row.key).filter(Boolean) as string[]);
      const appendedRows = keys
        .filter((key) => !existingKeys.has(key))
        .map((key) => {
          const defaultValue = tagLibrary.find((item) => item.key === key)?.values[0]?.value;
          return createSchemeBRow(key, defaultValue);
        });
      const nextRows = [...prev, ...appendedRows];
      syncPendingTagChangesFromRows(nextRows);
      return nextRows;
    });
  }, [syncPendingTagChangesFromRows, tagLibrary]);

  const handleSchemeDVisibleChange = useCallback((visible: boolean) => {
    setSchemeDPickerVisible(visible);

    if (!visible) {
      handleAppendSchemeDRows(schemeDSelectedKeys);
      setSchemeDSelectedKeys([]);
    }
  }, [handleAppendSchemeDRows, schemeDSelectedKeys]);

  const handleApplyBatch = useCallback(() => {
    if (!hasPendingChanges) {
      return;
    }

    setApiData((prev) =>
      prev.map((item) => {
        if (!selectedApiKeys.includes(item.id)) {
          return item;
        }

        return {
          ...item,
          tags: applyDraftToTags(item.tags),
          updatedAt: '2026-07-23 16:20:00',
        };
      }),
    );

    setBatchVisible(false);
    resetBatchDraft();
    Message.success(batchActionMode === 'remove' ? '批量移除成功' : '批量新增成功');
  }, [applyDraftToTags, batchActionMode, hasPendingChanges, resetBatchDraft, selectedApiKeys]);

  const handleDeleteLabel = useCallback((record: LabelItem) => {
    Modal.confirm({
      title: '确认删除标签',
      content: `删除后会同步移除所有 API 上的标签 ${record.keyLabel}:${record.value}，请确认是否继续。`,
      okButtonProps: { status: 'danger' },
      onOk: () => {
        setTagLibrary((prev) =>
          prev
            .map((item) =>
              item.key === record.key
                ? {
                    ...item,
                    values: item.values.filter((valueItem) => valueItem.label !== record.value),
                  }
                : item,
            )
            .filter((item) => item.values.length > 0),
        );

        setApiData((prev) =>
          prev.map((item) => ({
            ...item,
            tags: item.tags.filter((tag) => !(tag.key === record.key && getTagText(tag) === `${record.keyLabel}:${record.value}`)),
          })),
        );

        setPendingRemovals((prev) => prev.filter((item) => item !== `${record.key}::${record.value}`));
        setPendingTagChanges((prev) => {
          if (prev[record.key] !== record.value) {
            return prev;
          }

          const next = { ...prev };
          delete next[record.key];
          return next;
        });
        setSelectedApiKeys((prev) => [...prev]);
        Message.success('删除成功');
      },
    });
  }, [getTagText]);

  const handleEditLabel = useCallback((record: LabelItem) => {
    Message.success(`编辑标签入口已预留：${record.keyLabel}:${record.value}`);
  }, []);

  const apiColumns = useMemo(
    () => [
      {
        title: 'API 名称',
        dataIndex: 'name',
        width: 220,
        render: (value: string) => <span className={styles.apiName}>{value}</span>,
      },
      {
        title: '组件',
        dataIndex: 'component',
        width: 180,
      },
      {
        title: 'Method',
        dataIndex: 'method',
        width: 100,
      },
      {
        title: '责任部门',
        dataIndex: 'owner',
        width: 140,
      },
      {
        title: '当前标签',
        dataIndex: 'tags',
        render: (_: unknown, record: ApiItem) =>
          record.tags.length ? (
            <div className={styles.tagList}>
              {record.tags.map((tag) => (
                <Tag key={`${record.id}-${serializeTag(tag)}`}>{getTagText(tag)}</Tag>
              ))}
            </div>
          ) : (
            <span className={styles.placeholder}>-</span>
          ),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 180,
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 100,
        fixed: 'right' as const,
        render: (_: unknown, record: ApiItem) => (
          <Link onClick={() => handleOpenBatchModal([record.id])}>打标</Link>
        ),
      },
    ],
    [getTagText, handleOpenBatchModal],
  );

  const labelColumns = useMemo(
    () => [
      {
        title: 'Key',
        dataIndex: 'keyLabel',
        width: 140,
        render: (value: string, record: LabelItem) => (
          <div>
            <div>{value}</div>
            <div className={styles.subText}>{record.key}</div>
          </div>
        ),
      },
      {
        title: 'Value',
        dataIndex: 'value',
        width: 120,
      },
      {
        title: '描述',
        dataIndex: 'description',
      },
      {
        title: '打标 API 个数',
        dataIndex: 'apiCount',
        width: 140,
      },
      {
        title: '创建人',
        dataIndex: 'creator',
        width: 120,
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 180,
      },
      {
        title: '更新人',
        dataIndex: 'updater',
        width: 120,
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 160,
        fixed: 'right' as const,
        render: (_: unknown, record: LabelItem) => (
          <div className={styles.actionLinks}>
            <Link onClick={() => handleEditLabel(record)}>编辑</Link>
            <Link className={styles.dangerLink} onClick={() => handleDeleteLabel(record)}>
              删除
            </Link>
          </div>
        ),
      },
    ],
    [handleDeleteLabel, handleEditLabel],
  );

  const renderStatusChip = useCallback(
    (tag: TagSummary, isPartial: boolean) => {
      const serializedTag = serializeTag(tag);
      const isSelected = pendingRemovals.includes(serializedTag);

      return (
        <button
          key={serializedTag}
          type="button"
          className={isSelected ? styles.tagChipSelected : isPartial ? styles.partialTagChip : styles.tagChip}
          onClick={() => handleToggleRemovalTag(tag)}
        >
          <span className={styles.tagChipLabel}>
            {isPartial ? `${getTagText(tag)} (${tag.count}/${selectedApis.length})` : getTagText(tag)}
          </span>
          <span className={styles.tagChipClose}>×</span>
        </button>
      );
    },
    [getTagText, handleToggleRemovalTag, pendingRemovals, selectedApis.length],
  );

  const renderConfirmButton = () => {
    if (hasPendingChanges) {
      return (
        <Button type="primary" onClick={handleApplyBatch}>
          确认应用
        </Button>
      );
    }

    return (
      <Tooltip content={batchActionMode === 'remove' ? '请先选择要移除的标签' : '请先选择要新增的标签'}>
        <span>
          <Button type="primary" disabled>
            确认应用
          </Button>
        </span>
      </Tooltip>
    );
  };

  const renderAddSchemeA = () => (
    <>
      <div className={styles.addHint}>
        新增模式不会替换已存在的同 Key 标签，只会为缺少该 Key 的 API 补充新标签。
      </div>
      <div className={styles.selectorPanel}>
        <div className={styles.keyPanel}>
          <div className={styles.panelTitle}>选择 Key</div>
          <Input
            className={styles.panelSearch}
            allowClear
            placeholder="搜索 Key"
            value={batchKeyKeyword}
            onChange={setBatchKeyKeyword}
          />
          <div className={styles.keyList}>
            {filteredBatchKeys.length ? (
              filteredBatchKeys.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={item.key === activeBatchKey ? styles.keyItemActive : styles.keyItem}
                  onClick={() => setActiveBatchKey(item.key)}
                >
                  <span>{item.label}</span>
                  {pendingTagChanges[item.key] ? (
                    <span className={styles.keyValueHint}>
                      {tagMetaMap.valueMap.get(`${item.key}::${pendingTagChanges[item.key]}`)?.label}
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <div className={styles.panelEmpty}>未找到匹配的 Key</div>
            )}
          </div>
        </div>
        <div className={styles.valuePanel}>
          <div className={styles.panelTitle}>选择 Value（同 Key 单选）</div>
          <Input
            className={styles.panelSearch}
            allowClear
            placeholder="搜索 Value"
            value={batchValueKeyword}
            onChange={setBatchValueKeyword}
          />
          <Radio.Group value={pendingTagChanges[activeBatchKey]} onChange={(value) => handleDraftValueChange(value as string)}>
            <div className={styles.valueList}>
              {filteredBatchValues.length ? (
                filteredBatchValues.map((item) => (
                  <label key={item.value} className={styles.valueCard}>
                    <Radio value={item.value}>{item.label}</Radio>
                    <span className={styles.valueDesc}>{item.description}</span>
                  </label>
                ))
              ) : (
                <div className={styles.panelEmpty}>未找到匹配的 Value</div>
              )}
            </div>
          </Radio.Group>
        </div>
      </div>

      <div className={styles.pendingGroup}>
        <div className={styles.pendingTitle}>即将新增的标签</div>
        {pendingChangeTags.length ? (
          <div className={styles.pendingTagList}>
            {pendingChangeTags.map((tag) => (
              <div key={tag.key} className={styles.pendingTagChip}>
                <span>{getTagText(tag)}</span>
                <button type="button" className={styles.tagChipClose} onClick={() => handleClearDraftKey(tag.key)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.stateEmpty}>暂未选择要新增的标签</div>
        )}
      </div>
    </>
  );

  const renderAddSchemeB = () => (
    <>
      <div className={styles.addHint}>
        方案 B 采用级联添加，已选标签可直接切换同 Key 下的 Value，适合和产品一起评估轻量交互。
      </div>

      <div className={styles.pendingGroup}>
        <div className={styles.pendingTitle}>添加新标签</div>
        {schemeBRows.length ? (
          <div className={styles.schemeBTagList}>
            {schemeBRows.map((row) => {
              const rowValueOptions =
                tagLibrary.find((item) => item.key === row.key)?.values.map((item) => ({
                  label: item.label,
                  value: item.value,
                })) ?? [];
              const usedKeys = new Set(
                schemeBRows
                  .filter((item) => item.id !== row.id && item.key)
                  .map((item) => item.key as string),
              );

              return (
                <div key={row.id} className={styles.schemeBTagItem}>
                  <Select
                    className={styles.schemeBComposerField}
                    allowClear
                    showSearch
                    placeholder="请选择标签 Key"
                    value={row.key}
                    options={tagLibrary.map((item) => ({
                      label: item.label,
                      value: item.key,
                      disabled: usedKeys.has(item.key),
                    }))}
                    onChange={(value) => handleSchemeBKeyChange(row.id, value as string | undefined)}
                  />
                  <Select
                    className={styles.schemeBComposerField}
                    allowClear
                    showSearch
                    placeholder="请选择标签 Value"
                    value={row.value}
                    options={rowValueOptions}
                    disabled={!row.key}
                    onChange={(value) => handleSchemeBValueChange(row.id, value as string | undefined)}
                  />
                  <Button type="text" size="small" onClick={() => handleSchemeBDeleteRow(row.id)}>
                    删除
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.stateEmpty}>暂未添加标签行</div>
        )}
        <div className={styles.schemeBAddRow}>
          <Button type="secondary" onClick={handleSchemeBAddRow}>
            + 添加标签
          </Button>
        </div>
        <div className={styles.schemeBHint}>每一行都可以单独修改 Key 和 Value，已选择的 Key 会在其他行中置灰。</div>
      </div>
    </>
  );

  const renderAddSchemeC = () => (
    <>
      <div className={styles.addHint}>
        方案 C 使用单个选择器逐个追加标签，选择后结果直接沉淀到下方区域，适合快速串行添加。
      </div>

      <div className={styles.pendingGroup}>
        <div className={styles.pendingTitle}>标签单选选择器</div>
        <Select
          className={styles.schemeCSelect}
          allowClear
          showSearch
          placeholder="请选择或搜索标签（Key: Value）"
          value={undefined}
          options={schemeCOptions}
          onChange={(value) => handleAppendSchemeCTag(value as string | undefined)}
        />
        <div className={styles.schemeBHint}>已选择的 Key 会在下拉菜单中置灰，支持按 Key 或 Value 模糊搜索。</div>
      </div>

      <div className={styles.pendingGroup}>
        <div className={styles.pendingTitle}>即将新增的标签</div>
        {pendingChangeTags.length ? (
          <div className={styles.pendingTagList}>
            {pendingChangeTags.map((tag) => (
              <div key={tag.key} className={styles.pendingTagChip}>
                <span>{getTagText(tag)}</span>
                <button type="button" className={styles.tagChipClose} onClick={() => handleClearDraftKey(tag.key)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.stateEmpty}>暂未选择要新增的标签</div>
        )}
      </div>
    </>
  );

  const renderAddSchemeD = () => (
    <>
      <div className={styles.addHint}>
        方案 D 延续方案 B 的多行编辑布局，但通过“添加标签”按钮触发多选下拉，收起后一次性补齐多行。
      </div>

      <div className={styles.pendingGroup}>
        <div className={styles.pendingTitle}>添加新标签</div>
        {schemeBRows.length ? (
          <div className={styles.schemeBTagList}>
            {schemeBRows.map((row) => {
              const rowValueOptions =
                tagLibrary.find((item) => item.key === row.key)?.values.map((item) => ({
                  label: item.label,
                  value: item.value,
                })) ?? [];
              const usedKeys = new Set(
                schemeBRows
                  .filter((item) => item.id !== row.id && item.key)
                  .map((item) => item.key as string),
              );

              return (
                <div key={row.id} className={styles.schemeBTagItem}>
                  <Select
                    className={styles.schemeBComposerField}
                    allowClear
                    showSearch
                    placeholder="请选择标签 Key"
                    value={row.key}
                    options={tagLibrary.map((item) => ({
                      label: item.label,
                      value: item.key,
                      disabled: usedKeys.has(item.key),
                    }))}
                    onChange={(value) => handleSchemeBKeyChange(row.id, value as string | undefined)}
                  />
                  <Select
                    className={styles.schemeBComposerField}
                    allowClear
                    showSearch
                    placeholder="请选择标签 Value"
                    value={row.value}
                    options={rowValueOptions}
                    disabled={!row.key}
                    onChange={(value) => handleSchemeBValueChange(row.id, value as string | undefined)}
                  />
                  <Button type="text" size="small" onClick={() => handleSchemeBDeleteRow(row.id)}>
                    删除
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.stateEmpty}>暂未添加标签行</div>
        )}
        <div className={styles.schemeBAddRow}>
          <Select
            mode="multiple"
            popupVisible={schemeDPickerVisible}
            value={schemeDSelectedKeys}
            options={tagLibrary.map((item) => ({
              label: item.label,
              value: item.key,
              disabled: schemeBRows.some((row) => row.key === item.key),
            }))}
            showSearch
            allowClear
            placeholder="请选择要新增的标签 Key"
            triggerElement={
              <Button type="secondary">
                + 添加标签
              </Button>
            }
            onChange={(value) => setSchemeDSelectedKeys(value as string[])}
            onVisibleChange={handleSchemeDVisibleChange}
            notFoundContent="暂无可添加的标签 Key"
          />
        </div>
        <div className={styles.schemeBHint}>可在下拉中一次勾选多个 Key，收起后会新增多行，并默认选中该 Key 的第一个 Value。</div>
      </div>
    </>
  );

  const renderApiView = () => (
    <>
      <div className={styles.filterBar}>
        <div className={styles.filterFields}>
          <Select
            addBefore="组件"
            mode="multiple"
            allowClear
            showSearch
            placeholder="请选择组件"
            options={componentOptions}
            value={apiFilters.components}
            onChange={(value) => handleApiFilterChange('components', value as string[])}
            style={{ width: 285 }}
          />
          <Select
            addBefore="Method"
            mode="multiple"
            allowClear
            showSearch
            placeholder="请选择请求方法"
            options={methodOptions}
            value={apiFilters.methods}
            onChange={(value) => handleApiFilterChange('methods', value as string[])}
            style={{ width: 285 }}
          />
          <Select
            addBefore="标签"
            mode="multiple"
            allowClear
            showSearch
            placeholder="请选择标签"
            options={tagOptions}
            value={apiFilters.tags}
            onChange={(value) => handleApiFilterChange('tags', value as string[])}
            style={{ width: 285 }}
          />
          <Input
            className={styles.keywordInput}
            addBefore="关键词"
            allowClear
            placeholder="请输入 API 名称 / 责任部门 / 标签关键词"
            value={apiFilters.keyword}
            onChange={(value) => handleApiFilterChange('keyword', value)}
          />
        </div>
      </div>

      <div className={styles.module}>
        <div className={styles.moduleActionsStandalone}>
          <Button onClick={() => Message.success('操作记录入口已预留')}>操作记录</Button>
          {!batchSelectMode ? (
            <Button type="primary" onClick={handleEnterBatchSelectMode}>
              批量打标
            </Button>
          ) : null}
        </div>
        <Table
          border
          columns={apiColumns}
          data={filteredApis}
          rowKey="id"
          scroll={{ x: true }}
          rowSelection={
            batchSelectMode
              ? {
                  type: 'checkbox',
                  selectedRowKeys: selectedApiKeys,
                  onChange: (keys) => setSelectedApiKeys(keys as string[]),
                  checkboxProps: (record: ApiItem) => ({
                    disabled: hasReachedBatchSelectLimit && !selectedApiKeys.includes(record.id),
                  }),
                  renderCell: (originNode: React.ReactNode, _checked: boolean, record: ApiItem) => {
                    const disabled = hasReachedBatchSelectLimit && !selectedApiKeys.includes(record.id);

                    if (!disabled) {
                      return originNode;
                    }

                    return (
                      <Tooltip content="单次仅支持最多50个API批量打标">
                        <span className={styles.checkboxTooltipWrap}>{originNode}</span>
                      </Tooltip>
                    );
                  },
                }
              : undefined
          }
          pagination={{
            pageSize: API_PAGE_SIZE,
            showTotal: true,
          }}
          noDataElement={<div className={styles.emptyState}>未找到匹配结果</div>}
        />
      </div>
    </>
  );

  const renderTagView = () => (
    <>
      <div className={styles.filterBar}>
        <div className={styles.filterFields}>
          <Input
            className={styles.tagSearchInput}
            addBefore="关键词"
            allowClear
            placeholder="请输入 Key / Value / 描述"
            value={labelKeyword}
            onChange={setLabelKeyword}
          />
        </div>
      </div>

      <div className={styles.module}>
        <div className={styles.moduleActionsStandalone}>
          <Button onClick={() => Message.success('新建标签入口已预留')}>新建标签</Button>
        </div>
        <Table
          border
          columns={labelColumns}
          data={filteredLabels}
          rowKey="id"
          scroll={{ x: true }}
          pagination={{
            pageSize: API_PAGE_SIZE,
            showTotal: true,
          }}
          noDataElement={<div className={styles.emptyState}>暂无数据</div>}
        />
      </div>
    </>
  );

  return (
    <div className={styles.page}>
      <PageHeader.PageHeaderPro title="标签管理" />
      <Tabs
        type="card-gutter"
        activeTab={activeTab}
        onChange={(key) => setActiveTab(key as ViewTabKey)}
        className={styles.globalTabs}
      >
        <Tabs.TabPane key="api" title="API视图" />
        <Tabs.TabPane key="tag" title="标签视图" />
      </Tabs>
      <div className={styles.tabContent}>{activeTab === 'api' ? renderApiView() : renderTagView()}</div>

      {activeTab === 'api' && batchSelectMode && (
        <FixedFooter>
          <div className={styles.batchBar}>
            <span>{`已选${selectedApiKeys.length}/${MAX_BATCH_SELECT_COUNT}条`}</span>
            <Button type="text" onClick={handleExitBatchSelectMode}>
              退出批量选择
            </Button>
            <Button type="primary" onClick={() => handleOpenBatchModal()}>
              批量打标
            </Button>
          </div>
        </FixedFooter>
      )}

      <Modal
        title={`批量管理标签（已选中 ${selectedApiKeys.length} 个 API）`}
        visible={batchVisible}
        onCancel={handleCloseBatchModal}
        footer={
          <div className={styles.modalFooter}>
            <Button onClick={handleCloseBatchModal}>取消</Button>
            {renderConfirmButton()}
          </div>
        }
        style={{ width: 800 }}
      >
        <div className={styles.batchModal}>
          <Alert
            type="info"
            showIcon
            content={
              <div>
                <div>{`修改将同步应用到选中的所有 ${selectedApiKeys.length} 个 API 上。`}</div>
                {hasCrossPageSelection ? <div>当前选择包含跨页 API，请确认影响范围。</div> : null}
              </div>
            }
          />

          <div className={styles.batchActionSwitch}>
            <Radio.Group
              type="button"
              value={batchActionMode}
              onChange={(value) => handleBatchActionModeChange(value as BatchActionMode)}
            >
              <Radio value="remove">批量移除标签</Radio>
              <Radio value="add">批量新增标签</Radio>
            </Radio.Group>
          </div>

          {batchActionMode === 'remove' ? (
            <div className={styles.batchSection}>
              <div className={styles.sectionTitle}>当前选中 API 的标签状态</div>
              {tagSummaries.full.length === 0 && tagSummaries.partial.length === 0 ? (
                <div className={styles.emptyBlock}>当前选中的 API 没有可移除的标签。</div>
              ) : (
                <div className={styles.stateGroups}>
                  <div className={styles.stateGroup}>
                    <div className={styles.stateTitle}>
                      完全包含
                      <span className={styles.stateMeta}>所有选中 API 都带有该标签，点击可加入待移除列表</span>
                    </div>
                    {tagSummaries.full.length ? (
                      <div className={styles.stateTagList}>{tagSummaries.full.map((tag) => renderStatusChip(tag, false))}</div>
                    ) : (
                      <div className={styles.stateEmpty}>暂无完全包含标签</div>
                    )}
                  </div>
                  <div className={styles.stateGroup}>
                    <div className={styles.stateTitle}>
                      部分包含
                      <span className={styles.stateMeta}>仅部分选中 API 带有该标签，点击后仅从命中的 API 中移除</span>
                    </div>
                    {tagSummaries.partial.length ? (
                      <div className={styles.stateTagList}>{tagSummaries.partial.map((tag) => renderStatusChip(tag, true))}</div>
                    ) : (
                      <div className={styles.stateEmpty}>暂无部分包含标签</div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.pendingGroup}>
                <div className={styles.pendingTitle}>即将移除的标签</div>
                {pendingRemovalTags.length ? (
                  <div className={styles.pendingTagList}>
                    {pendingRemovalTags.map((tag) => (
                      <div key={serializeTag(tag)} className={styles.pendingRemoveChip}>
                        <span>{getTagText(tag)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.stateEmpty}>暂未选择要移除的标签</div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.batchSection}>
              <div className={styles.sectionTitle}>添加标签</div>
              <div className={styles.addSchemeSwitch}>
                <span className={styles.schemeSwitchLabel}>新增标签方案</span>
                <Radio.Group
                  type="button"
                  value={addTagScheme}
                  onChange={(value) => handleAddTagSchemeChange(value as AddTagScheme)}
                >
                  <Radio value="schemeA">方案 A</Radio>
                  <Radio value="schemeB">方案 B</Radio>
                  <Radio value="schemeC">方案 C</Radio>
                  <Radio value="schemeD">方案 D</Radio>
                </Radio.Group>
              </div>
              {addTagScheme === 'schemeA'
                ? renderAddSchemeA()
                : addTagScheme === 'schemeB'
                  ? renderAddSchemeB()
                  : addTagScheme === 'schemeC'
                    ? renderAddSchemeC()
                    : renderAddSchemeD()}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TagManagement;
