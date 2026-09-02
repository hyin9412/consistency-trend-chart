---
name: "vchart-chart-style-constraints"
description: "为 VChart 图表应用统一的间距、Token、Tooltip、网格线、图标和 Legend 样式约束。生成或调整 VChart 图表时调用，柱状图和饼图专属规范后续补充。"
---

# VChart 图表样式规范约束

## 目标

在生成、还原或调整 VChart 图表时，统一应用当前项目已经确认的视觉与交互规范。当前版本覆盖跨图表通用规范，以及折线图专属规范；不要自行推导柱状图、饼图等图表的专属样式。

## 触发条件

以下场景必须调用本 Skill：

- 用户要求生成或修改 VChart 图表。
- 用户要求还原 VChart 图表的间距、样式、Tooltip、图标或 Legend。
- 用户要求把已有 VChart 折线图的视觉规范迁移到其他图表。
- 用户要求统一多个 VChart 图表的视觉表现。

## 规范适用范围

### 所有 VChart 图表均适用

- 页面、卡片和图表容器的外部间距。
- 颜色、字体和边框 Token。
- Tooltip 的字体、行高、Marker 尺寸和行间距。
- 坐标轴标签间距，以及笛卡尔坐标系的网格线风格。
- 图表卡片的全屏按钮和图标按钮尺寸。
- 自定义 Legend 的基础布局、色块和交互状态。

### 折线图及面积图适用

- 折线宽度。
- 数据点默认隐藏、Hover 时显示。
- X 轴 Crosshair。

### 暂不覆盖

- 柱状图的柱宽、圆角、堆叠间距和标签规则。
- 饼图或环形图的扇区间距、圆角、中心文案和引导线规则。
- 未在本文件明确说明的图表类型专属视觉规则。

## 页面和容器间距

优先通过 React 外层容器和 CSS Module 控制空间，避免把页面布局间距全部写入 VChart spec。

```scss
.content {
  padding: 20px 32px 24px;
  gap: 16px;
}

.chartStage {
  min-height: 360px;
  padding: 0;
}
```

图表 spec 默认使用：

```ts
{
  autoFit: true,
  padding: 0,
}
```

图表自身的高度应由稳定的容器或组件样式控制。普通状态推荐 `360px`，全屏状态推荐 `560px`，并确保切换时容器不会因内容变化发生布局跳动。

## 颜色、字体和 Token

- 优先使用项目设计 Token，不要在图表配置中重复硬编码同一类颜色。
- 边框和网格线优先读取 `--color-border-2`。
- 主要文本优先读取 `--color-text-1` 或 `--color-text-2`。
- 辅助文本和 Tooltip 标题优先读取 `--color-text-3`。
- 中文字体使用 `PingFang SC`，英文和数字使用 `Roboto`。
- Tooltip 推荐字体栈：

```ts
const TOOLTIP_FONT_FAMILY = 'Roboto, "PingFang SC", sans-serif';
```

如果图表配置需要读取 CSS Token，应提供服务端或无 DOM 环境下的回退值，避免 SSR 或测试环境报错。

## 坐标轴和网格线

对于折线图、面积图以及其他笛卡尔坐标图：

- X 轴标签 `space` 默认 `2`。
- Y 轴标签 `space` 默认 `4`。
- 不展示无业务价值的坐标轴标题。
- 网格线使用 Token 边框色。
- 网格线默认使用 `[4, 2]` 虚线，线宽为 `1`。

```ts
{
  axes: [
    {
      orient: 'bottom',
      label: { visible: true, space: 2 },
      title: { visible: false },
    },
    {
      orient: 'left',
      label: { visible: true, space: 4 },
      grid: {
        visible: true,
        style: {
          stroke: colorBorder2,
          lineDash: [4, 2],
          lineWidth: 1,
        },
      },
      title: { visible: false },
    },
  ],
}
```

## Tooltip 规范

Tooltip 应保持信息密度紧凑、文字垂直居中：

- 使用 HTML 渲染模式，便于字体和布局控制。
- 字号 `12px`，行高 `20px`。
- Marker 尺寸 `12px`。
- Marker 与文字间距 `10px`。
- Tooltip 行间距 `2px`。
- 标题和数值使用项目文本 Token。
- 百分比等业务格式应通过格式化函数处理，不要依赖字符串拼接散落在渲染逻辑中。
- 当前项目使用 `1.54px` 圆角的方形 Marker；迁移到其他图表时保持形状语义一致，颜色仍应跟随系列色。

```ts
{
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
}
```

## 折线图专属规范

折线图默认遵循：

- 普通折线宽度为 `2px`。
- 数据点默认不可见，避免大量数据点造成噪声。
- Hover 或维度联动时显示 `8px` 圆点。
- Hover 点使用白色描边，描边宽度为 `1px`。
- X 轴显示纵向 Crosshair，宽度为 `1px`，颜色使用中性边框色。
- Y 轴 Crosshair 默认关闭，除非业务明确需要横向定位。

```ts
{
  line: {
    style: { lineWidth: 2 },
  },
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
    },
  },
}
```

## 图标规范

- 全屏、退出全屏等明确动作使用项目图标库中的图标，不手写同义的复杂 SVG。
- 图标按钮优先采用 `iconOnly`，固定尺寸 `28px × 28px`，内置图标约 `16px`。
- 图标按钮保持 `4px` 圆角，颜色使用 `--color-text-2`。
- Legend 分页箭头属于简单的上下方向符号，可以使用轻量 SVG；如果项目图标库已有对应图标，应优先替换为图标库图标。
- 所有仅图标按钮必须提供 `aria-label`，不使用可见文本替代明确图标动作。

## 自定义 Legend 规范

当系列数量较多，或需要分页、选择上限、外部筛选联动时，使用 React 自定义 Legend：

```ts
{
  legends: {
    visible: false,
  },
}
```

自定义 Legend 基础样式：

- Legend 位于图表下方。
- 色块尺寸 `12px × 12px`。
- 色块圆角约 `1.71px`。
- 色块与文字间距 `8px`。
- 同一行项目间距 `16px`。
- 行间距 `4px`。
- 文本字号 `12px`，行高 `20px`。
- 未选中项使用约 `0.42` 透明度。
- 颜色必须与图表系列颜色一一对应。
- Legend 容器宽度变化时重新计算换行和分页，不能依赖固定列数。

交互规则：

- 点击 Legend 项切换对应系列的可见状态。
- 需要限制同时展示数量时，达到上限后未选中项置灰并阻止点击。
- 禁用项 Hover 时显示原因 Tooltip。
- 外部预设筛选器切换时，必须同步更新选中系列和 Legend 排序。
- 用户手动修改后不再匹配预设集合时，预设选择器回填为“请选择”。
- Legend 排序变化后分页回到第 `1` 页。

如果仅需要基础勾选，不需要分页或数量上限，可使用 VChart 原生 Legend；不要为了复用当前实现而引入不必要的自定义状态管理。

## 实现检查清单

生成或修改图表后逐项确认：

- [ ] 页面内容区域使用 `20px 32px 24px`，模块间距为 `16px`。
- [ ] 图表 spec 使用 `autoFit: true` 和 `padding: 0`，外部容器负责布局留白。
- [ ] 字体、边框、辅助文本使用项目 Token 和统一字体栈。
- [ ] 坐标轴标签、网格线和 Tooltip 间距符合本规范。
- [ ] 折线图应用 `2px` 线宽、Hover 点和 X 轴 Crosshair。
- [ ] 图标按钮使用项目图标、固定尺寸并提供无障碍名称。
- [ ] 自定义 Legend 仅在确有分页、上限或联动需求时启用。
- [ ] 自定义 Legend 的颜色、色块、间距和选中态与图表系列保持一致。
- [ ] 未把折线图专属规则误套用到柱状图或饼图。
- [ ] 交互状态变化后没有布局跳动、Tooltip 遮挡或文字溢出。

## 后续扩展

后续补充柱状图、饼图等规范时，按以下结构追加：

1. 明确图表类型和适用范围。
2. 记录尺寸、间距、颜色、状态和交互规则。
3. 给出 VChart spec 示例。
4. 更新“规范适用范围”和“实现检查清单”。

