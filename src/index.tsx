import './init';
import React from 'react';
import { ConfigProvider } from '@arco-design/web-react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './app';
import '@arco-design/theme-ve-o-design/index.less';
import '@tod-m/materials/ve-o/es/style/index.less';
import '@tod-m/materials/es/style/index.less';
import '@tod-m/materials/es/XTopMenu/style/index.css';
import '@tod-m/materials/es/XSideMenu/style/index.css';
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
import 'styles/global.scss';

const Root = () => (
  <ConfigProvider componentConfig={{ Card: { bordered: false } }}>
    <App />
  </ConfigProvider>
);

const router = createBrowserRouter([{ path: '*', Component: Root }], {
  basename: window.routeInfo.basename,
});

export default function () {
  return (
    <React.Suspense fallback={null}>
      <RouterProvider router={router} />
    </React.Suspense>
  );
}
