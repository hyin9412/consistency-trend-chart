const defaultBasename = '/consistency-trend-chart';
const encodedBasename = encodeURI(defaultBasename);
const resolvedBasename = window.location.pathname.startsWith(encodedBasename)
  ? encodedBasename
  : window.location.pathname.startsWith(defaultBasename)
    ? defaultBasename
    : '';

window.routeInfo = { routes: [], basename: resolvedBasename };
