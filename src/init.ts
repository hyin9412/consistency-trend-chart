const defaultBasename = '/一致性趋势图';
const encodedBasename = encodeURI(defaultBasename);
const resolvedBasename = window.location.pathname.startsWith(encodedBasename)
  ? encodedBasename
  : window.location.pathname.startsWith(defaultBasename)
    ? defaultBasename
    : '';

window.routeInfo = { routes: [], basename: resolvedBasename };
