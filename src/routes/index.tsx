import React, { lazy, Suspense } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import BaseLayout from 'components/Layout/BaseLayout';
import Home from 'pages/Home';

const TagManagement = lazy(() => import('pages/TagManagement'));
const PushAbnormalDashboard = lazy(() => import('pages/PushAbnormalDashboard'));
const ConsistencySpecialDetail = lazy(() => import('pages/ConsistencySpecialDetail'));
const ListDemo = lazy(() => import('pages/ListDemo'));
const DetailDemo = lazy(() => import('pages/DetailDemo'));
const ConfigDemo = lazy(() => import('pages/ConfigDemo'));
const ModalDrawer = lazy(() => import('pages/ModalDrawer'));
const VChartLineDemo = lazy(() => import('pages/VChartLineDemo'));
const CloudEChartLineDemo = lazy(() => import('pages/CloudEChartLineDemo'));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <BaseLayout />,
    children: [
      { index: true, element: <Navigate to="/vchart-line-demo" replace /> },
      { path: 'home', element: <Home /> },
      { path: 'tag-management', element: <LazyPage><TagManagement /></LazyPage> },
      { path: 'push-abnormal-dashboard', element: <LazyPage><PushAbnormalDashboard /></LazyPage> },
      { path: 'consistency-special-detail', element: <LazyPage><ConsistencySpecialDetail /></LazyPage> },
      { path: 'list-demo', element: <LazyPage><ListDemo /></LazyPage> },
      { path: 'detail-demo', element: <LazyPage><DetailDemo /></LazyPage> },
      { path: 'config-demo', element: <LazyPage><ConfigDemo /></LazyPage> },
      { path: 'modal-drawer', element: <LazyPage><ModalDrawer /></LazyPage> },
      { path: 'vchart-line-demo', element: <LazyPage><VChartLineDemo /></LazyPage> },
      { path: 'cloud-echart-line-demo', element: <LazyPage><CloudEChartLineDemo /></LazyPage> },
    ],
  },
];
