# 内部平台 TOD 设计规范

本文档记录内部平台（PaaS / Neptune / Quota / FaaS 等）业务场景下专属的设计规范，包含组件名称、组件使用场景和场景对应的组件交互或样式。

***

## 物料库选型策略

内部平台业务使用的物料库为 `@tod-m/materials`（主库，含两条路径）与 `@arco-design/web-react`（兜底库）。

- **选型策略**：优先使用 `@tod-m/materials` 组件；若该库无等价能力，再使用 `@arco-design/web-react` 兜底。
- **选型优先级**：
  1. `@tod-m/materials/ve-o` — 通用 UI 组件（Modal、Table、Form、Select、Button、Tabs、Tag 等，对齐源力设计体系）
  2. `@tod-m/materials` — X 前缀专用业务组件（XSideMenu、XSearchForm、XConditions、XAvatar、XOverflowItems、XOverflowText、XEditableText 等）
  3. 各 app 内的业务封装组件（如 BaseGrid、PsmSelect、ClusterSelect 等）
  4. `@arco-design/web-react` — 兜底，仅在以上三层均无等价组件时使用
- **图标**：统一使用 `@arco-design/iconbox-react-ve-o-design` 图标库。

***

## 页面布局容器

内部平台页面的整体布局规范。全局页面布局由 `Layout`（`@tod-m/materials/ve-o`）+ 侧导航 + 主内容区组合而成，本章约束业务场景下的布局组合规则。

| **使用场景** | **对应组件的交互样式** |
| :--- | :--- |
| 全局布局骨架 | `Layout` + `Layout.Sider`（含 `XSideMenu`）+ `Layout.Content`（主内容区） |
| 页面标题区域 | 主内容区顶部使用 `PageHeader.PageHeaderPro`（标题 18px），承载标题 + 全局操作按钮；禁止使用基础 `PageHeader`（会被主题 token 覆盖为 16px） |
| 纯内容页面（无侧导航） | 直接使用 `Layout.Content` 撑满整体宽度，不渲染 `Layout.Sider` |
| 需要固定底部操作的页面（配置页/选配页） | 底部操作区吸底固定，与主内容区通过 1px 分割线分隔；左侧放辅助信息，右侧放操作按钮组 |

> 业务约束：
> - 页面标题区域与第一个内容模块之间间距为 0px（紧贴）；配置页/详情页等全页面以及抽屉场景模块与模块之间纵向间距统一 40px；弹窗内模块间距统一 24px；
> - 如需在标题区域放置全局操作按钮，按钮不超过 2 个，主操作使用 `primary` 类型，次操作使用 `default` 类型；
> - 当页头已有面包屑（`breadcrumb`）时，禁止同时显示返回按钮（`backIcon`）；面包屑本身提供了层级导航能力，二者互斥，仅在无面包屑的详情页场景下才使用返回按钮；
> - 页头标题必须使用 `PageHeader.PageHeaderPro`（标题字号 18px），禁止使用基础 `PageHeader`（字号 16px）；
> - 配置页/详情页等二级页面的页头区域必须吸顶（`position: sticky; top: 0`），滚动时页头固定在视口顶部；
> - 页头描述文字行（subTitle / Description）中各描述项之间间距为 20px；描述项格式为"label：value"，label 使用 `--color-text-3` 色值，value 使用 `--color-text-1` 色值；描述行整体与标题之间间距为 8px；
> - 底部操作区仅用于"提交类"页面（创建/编辑/配置），列表页和详情页不使用吸底操作区；
> - 步骤条（Steps）场景下，底部操作区的按钮组固定在右侧（左侧放步骤指示器或辅助信息，右侧放"上一步"/"下一步"/"提交"等操作按钮）。

***

## 弹窗与抽屉

弹窗使用 `Modal`（`@tod-m/materials/ve-o`），抽屉使用 `Drawer`（`@tod-m/materials/ve-o`）。

| **使用场景** | **对应组件的交互样式** |
| :--- | :--- |
| 轻量确认/信息展示（内容 ≤3 个字段） | 使用 `Modal`，宽度 480px |
| 表单录入（3-8 个字段） | 使用 `Modal`，宽度 520-640px |
| 复杂表单/多步操作/需要保留上下文 | 使用 `Drawer`，宽度 640-960px |
| 详细信息展示（含表格/长列表） | 使用 `Drawer`，宽度按内容自适应（最大 960px） |
| 危险操作二次确认 | 使用 `Modal.confirm` 或 `Modal` + 红色主按钮，标题含"确认"字样 |

> 业务约束：
> - 弹窗/抽屉内的表单提交成功后必须自动关闭并刷新父页面数据；
> - 弹窗标题使用"动词 + 对象"格式（如"创建服务"、"编辑配置"），不使用空泛标题；
> - 同一页面同一层级不允许弹窗套弹窗，需要多步操作时优先用抽屉或步骤表单；
> - 取消/关闭操作时如已有用户输入，需弹出二次确认（"是否放弃已填写内容？"）；
> - 抽屉/弹窗内使用 `Descriptions`（`layout="vertical"`）展示详情时：label 与 value 之间间距为 4px（通过 `labelStyle={{ paddingBottom: 4 }}`），不同字段行之间间距为 20px（通过 `valueStyle={{ paddingBottom: 20 }}`）；
> - 抽屉/弹窗内使用 `Descriptions` 时必须设置 `tableLayout="fixed"` 保证各列等宽左对齐；
> - 抽屉/弹窗内不同分区模块之间间距为 24px。

***

## XSideMenu 左侧导航

内部平台侧导航的场景规范。基于 `XSideMenu`（`@tod-m/materials`）构建。

| **使用场景** | **对应组件的交互样式** |
| :--- | :--- |
| 标准应用导航 | 默认展开态，`showOverview={false}`；菜单项使用 `menuOptions` 数组配置 |
| 一级菜单 + 二级子菜单 | 一级菜单点击展开/收起二级列表；当前选中项高亮（`selectedKeys`） |
| 可收缩侧导航 | 支持 `onCollapse` 收缩为图标模式，主内容区自适应宽度变化 |
| 菜单项命名规范 | 一级菜单 ≤ 6 字，二级菜单 ≤ 10 字；使用"名词"或"名词 + 管理"格式 |

> 业务约束：
> - 侧导航选中态必须与当前 URL 路由保持同步，刷新页面后选中状态不丢失；
> - 一级菜单项数量控制在 3-8 个之间，超出应归类分组；
> - 同一产品内侧导航结构保持一致，不因用户角色差异改变菜单顺序（仅做权限隐藏）。

***

## Table 表格

> 详见 [Table 表格](./components/detail/Table.md)

***

## XSearchForm 筛选表单

> 详见 [XSearchForm 筛选表单](./components/detail/XSearchForm.md)

***

## XConditions 条件组

> 详见 [XConditions 条件组](./components/detail/XConditions.md)

***

## XOverflowText / XOverflowItems 溢出展示

> 详见 [XOverflowText / XOverflowItems 溢出展示](./components/detail/XOverflowText.md)

***

## XAvatar 用户展示

> 详见 [XAvatar 用户展示](./components/detail/XAvatar.md)

***

## XEditableText 行内编辑

> 详见 [XEditableText 行内编辑](./components/detail/XEditableText.md)

***

## Tabs 选项卡

> 详见 [Tabs 选项卡](./components/detail/Tabs.md)

***

## 状态展示

> 详见 [状态展示](./components/detail/状态展示.md)

***

## 表单规范

> 详见 [表单规范](./components/detail/表单规范.md)

***

## disabled 状态交互

> 详见 [disabled 状态交互](./components/detail/disabled状态交互.md)

***

## 提示与反馈

> 详见 [提示与反馈](./components/detail/提示与反馈.md)

***

## Design Token 语义分类

内部平台中 CSS 变量 / Design Token 的使用规范。

| **Token 类别** | **使用场景** | **常用变量** |
| :--- | :--- | :--- |
| `--color-bg-*` | 容器背景、卡片背景、区域分层 | `--color-bg-1`（页面底）、`--color-bg-2`（卡片底）、`--color-bg-3`（内嵌区块底）、`--color-bg-4`（更深层嵌套） |
| `--color-fill-*` | 交互态填充（hover / active / selected） | `--color-fill-1`（hover 底）、`--color-fill-2`（active/selected 底）、`--color-fill-3`（重度填充） |
| `--color-border-*` | 边框、分割线 | `--color-border-1`（常规边框）、`--color-border-2`（轻边框） |
| `--color-text-*` | 文字层级 | `--color-text-1`（主文本）、`--color-text-2`（次文本）、`--color-text-3`（占位/禁用） |

> 业务约束：
> - 容器 / 卡片 / 区域背景色统一使用 `--color-bg-*` 系列，禁止使用 `--color-fill-*` 作为静态背景；
> - 顶部导航菜单项 hover 背景使用 `var(--color-bg-3)`，禁止使用 `--color-fill-1`（颜色过深）；
> - `--color-fill-*` 仅用于组件内部交互态（如 Select 选项高亮），页面级 hover 统一用 `--color-bg-3`；
> - 弹窗 / 抽屉内的分区背景使用 `var(--color-bg-3)`，不使用 `var(--color-fill-1)`。

***

## 模块小标题（蓝标）

内部平台中内容区域模块标题的规范。用于详情页、配置页等场景下区分不同内容模块。

| **使用场景** | **对应组件的交互样式** |
| :--- | :--- |
| 内容模块标题 | 标题文字左侧带蓝色竖条标识（宽 3px、高 12px、圆角 1px、颜色 `rgb(var(--primary-6))`），通过 CSS `::before` 伪元素实现 |
| 标题 + 操作按钮 | 标题与操作按钮同行，标题 `flex: 1` 靠左，按钮靠右 |

**实现方式**（无独立组件，使用 CSS 伪元素）：

```scss
.moduleTitle {
  position: relative;
  padding-left: 11px;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: var(--color-text-1);

  &::before {
    position: absolute;
    top: 5px;
    left: 0;
    width: 3px;
    height: 12px;
    background: rgb(var(--primary-6));
    border-radius: 1px;
    content: '';
  }
}
```

> 业务约束：
> 业务约束：
> - 所有内容模块标题必须带蓝色竖条标识，禁止使用纯文字标题；
> - 蓝标尺寸固定为 3×12px，颜色使用 `rgb(var(--primary-6))`（主题色），不使用硬编码色值；
> - 标题与蓝标间距为 8px（`padding-left: 11px` = 3px 蓝标宽 + 8px 间距）；
> - 模块标题下方与模块内容之间间距为 12px。

***

## 批量操作栏

内部平台中表格批量操作的规范。基于 `FixedFooter`（`components/FixedFooter`）组件构建。

| **使用场景** | **对应组件的交互样式** |
| :--- | :--- |
| 表格勾选后批量操作 | 使用 `FixedFooter` 组件吸底固定，浅蓝色背景（`rgba(236, 242, 255, 1)`），内容为"已选 N 条" + "取消选择"文本按钮 + 操作按钮组 |
| 无勾选时 | 不渲染批量操作栏，通过条件判断 `selectedRowKeys.length > 0` 控制显隐 |

**用法示例**：

```tsx
import FixedFooter from 'components/FixedFooter';

{selectedRowKeys.length > 0 && (
  <FixedFooter>
    <div className={styles.batchBar}>
      <span>已选 {selectedRowKeys.length} 条</span>
      <Button type="text" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
      <Button type="primary" status="danger" onClick={handleBatchDelete}>批量删除</Button>
    </div>
  </FixedFooter>
)}
```

> 业务约束：
> - 批量操作栏必须在勾选行后出现在页面底部（吸底固定），使用 `FixedFooter` 组件实现；禁止将批量操作按钮放在筛选栏、表格上方或自定义 sticky 容器中；
> - 批量操作栏必须横贯页面全宽（通栏），`FixedFooter` 必须放在页面最外层容器（`.page`）内，禁止放在有 padding 的内容容器内（否则宽度会被 padding 收窄）；
> - 内容格式固定为：`[已选 N 条] [取消选择（文本按钮）] [操作按钮组]`，水平排列，gap 为 16px，padding 为 `16px 24px`；
> - `FixedFooter` 提供 `leftOffset`/`rightOffset` prop 用于避开侧导航偏移；
> - 危险操作按钮（删除/移除）使用 `type="primary" status="danger"`。

***

## 常见问题与避坑经验

### 页头描述行必须使用 `subTitle` prop

`PageHeaderPro` 组件自带 `subTitle` 属性，支持传入 `subTitleItem[]` 数组（`{ label: ReactNode, value: ReactNode }`）来渲染标题下方的描述信息行。

> - 禁止在 PageHeader 外部使用自定义 div + Space 手动排列描述信息行（会导致间距/缩进与 PageHeader 内部不一致）；
> - `subTitle` 数组中的 `label` 和 `value` 均支持 ReactNode，可以传入 `Tag.TagPro`、`XAvatar.LarkUserGroup` 等组件；
> - 组件内部自动追加中文冒号（`：`）在 label 后面，因此 label 值本身不要包含冒号。

### Tab 下方内容区必须有 padding

Tab 切换后的内容区域必须设置水平内边距（`padding: 20px 32px 24px`），与 PageHeader/Tabs 的内边距保持对齐。

> - 禁止内容区域紧贴容器边缘（padding 为 0）；
> - 左右 padding 统一为 32px，与页面标题区域的内边距一致。

### 胶囊 Tab 位置

当胶囊 Tab 与模块标题同行时，标题在最左侧（带蓝标），胶囊 Tab 靠右（`margin-left: auto`），操作按钮在胶囊 Tab 右侧。

> - 禁止胶囊 Tab 独占一行或与标题分行展示（除非有独立的筛选栏场景）；
> - 布局使用 flex 容器：`[蓝标标题] [胶囊Tabs margin-left:auto] [操作按钮]`。

### 页面宽度与表格横向滚动

内容区域宽度必须自适应浏览器视口宽度，禁止设置 `min-width` 导致页面超出视口产生横向滚动条。

> - 内容容器使用 `min-width: 0` + `flex: 1`，让宽度由父级 flex 容器决定；
> - 当表格列总宽超过容器宽度时，必须启用表格内部横向滚动：`<Table scroll={{ x: true }} />`；
> - 禁止让整个页面产生横向滚动条，横向溢出只能在表格内部滚动。

### 步骤条必须使用 Steps 组件

弹窗或页面中的步骤条/进度指示，必须使用 `Steps` 组件（`@tod-m/materials/ve-o`），禁止手写自定义步骤圆圈 + 连线。

> - 用法：`<Steps current={currentStep + 1}><Steps.Step title="步骤一" /><Steps.Step title="步骤二" /></Steps>`；
> - `current` 属性值从 1 开始计数；
> - 禁止手动实现步骤圆圈、颜色、连线等视觉样式，组件自带完整的激活/未激活/完成状态样式。
