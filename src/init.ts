const defaultBasename = '/consistency-trend-chart';
const encodedBasename = encodeURI(defaultBasename);

// Recover GitHub Pages SPA redirects back into a normal browser path
// before React Router boots.
const redirectParams = new URLSearchParams(window.location.search);
const redirectedPath = redirectParams.get('__gh_path');
if (redirectedPath) {
  const redirectedSearch = redirectParams.get('__gh_search');
  const redirectedHash = redirectParams.get('__gh_hash');
  const basePath = window.location.pathname.replace(/\/$/, '');
  const normalizedPath = redirectedPath.startsWith('/')
    ? redirectedPath
    : `/${redirectedPath}`;
  const nextUrl = `${basePath}${normalizedPath}${redirectedSearch ? `?${redirectedSearch}` : ''}${redirectedHash ? `#${redirectedHash}` : ''}`;
  window.history.replaceState(null, '', nextUrl);
}

const resolvedBasename = window.location.pathname.startsWith(encodedBasename)
  ? encodedBasename
  : window.location.pathname.startsWith(defaultBasename)
    ? defaultBasename
    : '';

window.routeInfo = { routes: [], basename: resolvedBasename };
