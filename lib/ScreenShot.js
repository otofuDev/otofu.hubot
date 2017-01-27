const co = require('co');
const PageCapture = require('./PageCapture');
const Gyazo = require('./Gyazo');
const Utils = require('./Utils');

const GYAZO_ACCESS_TOKEN = process.env.GYAZO_ACCESS_TOKEN;

class ScreenShot {
  static capture(url, selector = null, path = null) {
    return co(function*() {
      const RetryCount = 3;
      for (let i = 1; i <= RetryCount; i++) {
        try {
          const gyazo_client = new Gyazo(GYAZO_ACCESS_TOKEN);
          const img_buf = yield PageCapture.capture(url, selector);
          const gyazo_res = yield gyazo_client.upload(img_buf);
          return gyazo_res.data;
        } catch (e) {
          console.error(Utils.now());
          console.error('ScreenShot Error... Count => ' + i);
          console.error(e);
          if (i === RetryCount) {
            return {error: 'ScreenShot Error...'};
          }
          yield Utils.sleep(3);
        }
      }
    });
  }
}

module.exports = ScreenShot;
