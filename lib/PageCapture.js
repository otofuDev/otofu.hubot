const co = require('co');
const Nightmare = require('nightmare');

const getElementSize = (nightmare, url, selector) => {
  return nightmare
    .goto(url)
    .evaluate((_selector) => {
      const _element = document.querySelector(_selector);
      const _rect = _element.getBoundingClientRect();
      return {
        x: Math.round(_rect.left),
        y: Math.round(_rect.top),
        width: _element.scrollWidth,
        height: _element.scrollHeight,
      };
    }, selector);
};

const captureScreen = (nightmare, url, rect, viewport, path = undefined) => {
  return nightmare
    .viewport(viewport.width, viewport.height)
    .goto(url)
    .screenshot(path, rect);
};

class PageCapture {
  static capture(url, selector = null) {
    return co(function*() {
      const nightmare = Nightmare({show: false});
      const windowSize = yield getElementSize(nightmare, url, 'body');

      let selector_rect = null;
      if (selector != null) {
        selector_rect = yield getElementSize(nightmare, url, selector);
      }
      const image_buf = yield captureScreen(nightmare, url, selector_rect, windowSize);
      yield nightmare.end();
      return image_buf;
    });
  }
}

module.exports = PageCapture;
