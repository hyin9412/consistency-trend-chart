

import _render from './render.development.js'



window._reactAppRoot = _render({ root: window._reactAppRoot })?.root



if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}