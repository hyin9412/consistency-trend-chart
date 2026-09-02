# XOverflowText / XOverflowItems 溢出展示

内部平台中文本/列表溢出的处理规范。基于 `XOverflowText` 和 `XOverflowItems`（`@tod-m/materials`）构建。

| **使用场景** | **对应组件的交互样式** |
| :--- | :--- |
| 单行文本溢出 | 使用 `XOverflowText`，设置 `maxWidth`，超出显示省略号 + hover Tooltip 展示完整内容 |
| Tooltip 自定义内容 | 通过 `tooltipProps.content` 自定义气泡展示内容（如带格式的完整信息） |
| 标签/列表溢出折叠 | 使用 `XOverflowItems`，设置 `showCount` 控制最多展示个数，超出以"+N"折叠 |
| 折叠项展开 | hover "+N" 触发 Popover 展示完整列表 |
| 自定义渲染项 | 通过 `itemRender` 自定义每一项的渲染（如 Tag、用户头像等） |

> 业务约束：
> - 列表页表格单元格内使用 `XOverflowText` 时，`maxWidth` 不超过 200px；
> - `XOverflowItems` 的 `showCount` 根据容器宽度动态确定，表格单元格内通常为 1-3；
> - 折叠项的 Popover 内容按每行一项排列，限高 320px 后可滚动；
> - 字段值为空时统一展示 `-` 占位，不触发溢出与气泡。
