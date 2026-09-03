const defaultBasename = '/consistency-trend-chart';
const encodedBasename = encodeURI(defaultBasename);

// Recover GitHub Pages SPA redirects like `/?/vchart-line-demo`
// back into a normal browser path before React Router boots.
if (window.location.search.startsWith('?/')) {
  const restoredPath = window.location.search
    .slice(1)
    .replace(/~and~/g, '&');
  const nextUrl = `${window.location.pathname}${restoredPath}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

const resolvedBasename = window.location.pathname.startsWith(encodedBasename)
  ? encodedBasename
  : window.location.pathname.startsWith(defaultBasename)
    ? defaultBasename
    : '';

window.routeInfo = { routes: [], basename: resolvedBasename };
