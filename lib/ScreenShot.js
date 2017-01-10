const co = require('co');
const PageCapture = require('./PageCapture');
const Gyazo = require('./Gyazo');

const GYAZO_ACCESS_TOKEN = process.env.GYAZO_ACCESS_TOKEN;

class ScreenShot {
  static capture(url, selector = null, path = null) {
    return co(function*() {
      const gyazo_client = new Gyazo(GYAZO_ACCESS_TOKEN);
      const img_buf = yield PageCapture.capture(url, selector);
      const gyazo_res = yield gyazo_client.upload(img_buf);
      return gyazo_res.data;
    });
  }
}

module.exports = ScreenShot;
