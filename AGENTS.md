# TOD Starter — AI Agent 开发规范

## 项目定位

本项目是 `ve_o_design_tod` skill 的快速启动包，用于演示和验证 TOD 设计规范下的页面生成效果。

## 技术栈

- React 18 + React Router 6
- UI 组件库：`@tod-m/materials`（X 系列 + ve-o）+ `@arco-design/web-react`（兜底）
- 主题：`@arco-design/theme-ve-o-design`
- 图标：`@arco-design/iconbox-react-ve-o-design`
- 样式：Tailwind CSS 3.4 + SCSS Modules
- 构建：Webpack 5（via @cloudcli/scripts）

## 物料库使用优先级

1. `@tod-m/materials`（X 系列业务组件）— XTable, XSideMenu, XSearchForm 等
2. `@tod-m/materials/ve-o`（ve-o 基础 UI）— Table, Modal, Form, Button 等
3. `@arco-design/web-react`（兜底库）

## 页面布局规范

- 整体布局：左侧导航 + 右侧内容区
- 左侧导航：使用 `XSideMenu` 组件，宽度 200px
- 内容区域：`padding: 20px 32px 24px`
- 页面标题：使用 `PageHeader.PageHeaderPro`（标题 18px）

## 开发约束

- 新增页面时：在 `src/routes/index.tsx` 添加路由，在 `src/constants/menu.ts` 添加菜单项
- 设计契约：生成后保存在 `docs/design-specs/` 目录下
- 禁止使用 `as any` / `@ts-ignore`
- 组件 API 必须查阅 skill reference，禁止臆造 Props

## 可用脚本

- `pnpm dev` — 启动开发服务（端口 3099）
- `pnpm build` — 构建产物
