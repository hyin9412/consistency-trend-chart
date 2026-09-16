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
const VChartNewLineDemo = lazy(() => import('pages/VChartNewLineDemo'));
const CloudEChartLineDemo = lazy(() => import('pages/CloudEChartLineDemo'));
const PricingResultDetail = lazy(() => import('pages/PricingResultDetail'));
const TargetTrendChartSchemes = lazy(() => import('pages/TargetTrendChartSchemes'));
const CostFlowSankey = lazy(() => import('pages/CostFlowSankey'));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <BaseLayout />,
    children: [
      { index: true, element: <Navigate to="/target-trend-chart-schemes" replace /> },
      { path: 'home', element: <Home /> },
      { path: 'tag-management', element: <LazyPage><TagManagement /></LazyPage> },
      { path: 'push-abnormal-dashboard', element: <LazyPage><PushAbnormalDashboard /></LazyPage> },
      { path: 'consistency-special-detail', element: <LazyPage><ConsistencySpecialDetail /></LazyPage> },
      { path: 'list-demo', element: <LazyPage><ListDemo /></LazyPage> },
      { path: 'detail-demo', element: <LazyPage><DetailDemo /></LazyPage> },
      { path: 'config-demo', element: <LazyPage><ConfigDemo /></LazyPage> },
      { path: 'modal-drawer', element: <LazyPage><ModalDrawer /></LazyPage> },
      { path: 'vchart-line-demo', element: <LazyPage><VChartLineDemo /></LazyPage> },
      { path: 'vchart-new-line-demo', element: <LazyPage><VChartNewLineDemo /></LazyPage> },
      { path: 'cloud-echart-line-demo', element: <LazyPage><CloudEChartLineDemo /></LazyPage> },
      { path: 'pricing-result-detail', element: <LazyPage><PricingResultDetail /></LazyPage> },
      { path: 'target-trend-chart-schemes', element: <LazyPage><TargetTrendChartSchemes /></LazyPage> },
      { path: 'cost-flow-sankey', element: <LazyPage><CostFlowSankey /></LazyPage> },
    ],
  },
];
