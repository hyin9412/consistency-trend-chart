# TOD Starter

基于 ve-o 设计规范的快速启动包。内置 `ve_o_design_tod` Skill，在 Trae IDE 中打开即可通过 AI 生成标准页面。

## 发布信息

- GitHub Repo: `https://github.com/hyin9412/consistency-trend-chart`
- GitHub Pages: `https://hyin9412.github.io/consistency-trend-chart/`
- 本地构建：`pnpm build`
- 当前发布方式：本地构建后手动推送 `main`，再将 `build/` 发布到 `gh-pages`
- Pages 子路径：React Router `basename` 固定为 `/consistency-trend-chart`

## 使用方式

1. 获取本项目（clone / 解压）
2. 确认 Node.js >= 18
3. `pnpm install`
4. `pnpm dev`（默认端口 3099）
5. 在 Trae IDE 中打开本目录，输入页面需求即可触发 skill 生成

## 技术栈

React 18 + @tod-m/materials + Tailwind CSS 3.4 + Webpack 5（@cloudcli/scripts）
