import React, { isValidElement, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
const _App = lazy(() => import(/* webpackMode: 'eager' */'../src/index.tsx'));
export function _wrap(App = null, _props) {
  const props = { ...{}, ..._props, pageProps: { ...{}, ..._props?.pageProps } };
  const app = isValidElement(App) ? App : <App {...props} />;
  return <Suspense fallback={null}>{app}</Suspense>;
}
export function render({ props, container, app, root } = {}) {
  const _root = root || ReactDOM.createRoot(container || document.getElementById("root") || document.getElementById("app"));
  _root.render(_wrap(app || _App, props));
  return {
    root: _root,
    unmount: () => _root.unmount(),
  };
};
export default render;
