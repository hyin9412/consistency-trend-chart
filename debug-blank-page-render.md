# Debug Session: blank-page-render [OPEN]

## Symptom
- 页面打开后显示空白

## Hypotheses
1. `window.routeInfo` 未初始化，导致 `createBrowserRouter` 构造阶段抛错。
2. 入口依赖的样式或脚本资源加载失败，页面未能完成挂载。
3. `App` 或首屏布局组件渲染时访问了未定义数据，触发运行时异常。
4. 路由或初始化文件执行顺序有问题，导致根组件没有成功渲染。
5. 预览页实际已返回 HTML，但浏览器控制台或网络层存在阻断错误。

## Evidence
- Browser console warning: `<Router basename="/tod-starter"> is not able to match the URL "/" because it does not start with the basename, so the <Router> won't render anything.`
- Browser navigation to `http://127.0.0.1:3099/tod-starter` renders successfully and redirects to `/tod-starter/home`.
- No blocking JS runtime error was observed in the console; network requests were not the cause of the blank page.

## Next
- 调整 `basename` 初始化逻辑，使本地 `/` 与 `/tod-starter` 两种访问方式都可用
