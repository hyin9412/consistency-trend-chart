# XAvatar 用户展示

内部平台中展示人员信息的规范。基于 `XAvatar`（`@tod-m/materials`）构建。

| **使用场景** | **对应组件的交互样式** |
| :--- | :--- |
| 单用户展示 | 使用 `XAvatar.LarkUser`，传入 `user` 用户名 |
| 多用户展示（负责人/成员列表） | 使用 `XAvatar.LarkUserGroup`，传入 `users` 用户名数组 |
| 控制展示数量 | 通过 `maxCount` 限制最多展示头像数（通常 2-3），超出以"+N"折叠 |
| 展示用户名 | 设置 `showUsername={true}` 在头像右侧展示用户名文字 |
| 紧凑模式 | 设置 `size="small"` 用于表格单元格等空间有限场景 |
| 名字省略 | 通过 `nameEllipsis={{ maxWidth: 60 }}` 控制用户名显示宽度 |

> 业务约束：
> - 列表页表格中人员列统一使用 `XAvatar.LarkUserGroup`，`maxCount` 设为 2-3；
> - 详情页的负责人/创建者字段使用 `XAvatar.LarkUser` + `showUsername`；
> - 头像需支持点击跳转到用户飞书主页或内部通讯录（如有对应能力）。
