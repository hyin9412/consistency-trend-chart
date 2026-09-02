# Input.Group 使用注意事项

## 问题描述

`Input.Group compact` 在某些 flex 容器中会出现内部子元素断裂（不在同一行）的渲染问题。

## 正确做法

不使用 `Input.Group compact`，改用自定义 flex 容器实现前缀+输入框的组合布局：

```tsx
<div className={styles.inputGroup}>
  <Input style={{ width: 100, flexShrink: 0 }} value="/opt/tiger/" disabled />
  <Input style={{ flex: 1 }} placeholder="请输入启动脚本路径" />
</div>
```

对应样式：

```scss
.inputGroup {
  display: flex;
  gap: 0;
  align-items: stretch;
}
```

## 适用场景

- 输入框需要固定前缀（如路径前缀 `/opt/tiger/`）
- 多个输入框需要紧凑组合为一行
