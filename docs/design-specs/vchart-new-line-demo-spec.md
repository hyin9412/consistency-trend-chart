# 新建 VChart 折线图 - 设计契约

## 规范映射清单

- 页面框架命中：`Dashboard_页面框架`
- 模块命中：页面标题模块、折线图展示模块、Legend 交互模块
- 组件命中：`PageHeader.PageHeaderPro`、`Divider`、`Card`、`Select`、`Button`、`VChart`
- 核心功能命中：展示 API 请求成功率趋势，支持 7 / 14 / 30 天切换
- 交互闭环命中：切换时间范围更新数据；点击 Legend 显隐系列；至少保留一个系列；图表异常显示 `Message.error`

## 页面结构

- 使用项目既有顶部导航、左侧导航与主体内容布局。
- 页面标题下方紧贴分隔线，内容区域使用 `20px 32px 24px` 内边距。
- 内容使用单个卡片承载趋势折线图，卡片内部模块间距为 `16px`。

## 折线图规范

- `autoFit: true`、`padding: 0`，图表高度稳定为 `360px`。
- 折线宽度 `2px`，默认隐藏数据点，Hover 显示 `8px` 圆点和白色描边。
- X 轴显示纵向 Crosshair，Y 轴关闭 Crosshair。
- Y 轴网格线使用 `--color-border-2`、`[4, 2]` 虚线。
- Tooltip 使用 HTML 渲染、`12px / 20px` 字体行高、`12px` Marker。
- 颜色、文字与边框优先读取项目 Token。
