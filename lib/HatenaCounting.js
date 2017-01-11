const co = require('co');
const client = require('cheerio-httpcli');
const ScreenShot = require('./ScreenShot');

class HatenaCounting {
  static getCounterInfo(counting_url) {
    return co(function*() {
      let countingInfo = {};

      // 該当URLのデータをスクレイピング.
      const result = yield client.fetch(counting_url);
      const $ = result.$;
      countingInfo.counter_name = $('.count-name a').text();
      countingInfo.counter_url = $('.count-name a').url();
      countingInfo.counter = Number($('meta[name="twitter:description"]').attr('content').replace('日', ''));

      const gyazo_res = yield ScreenShot.capture(counting_url, '.main-count');
      countingInfo.image = gyazo_res.url;

      return countingInfo;
    }).then((countingInfo) => {
      return countingInfo;
    }).catch((err) => {
      return err;
    });
  }
}

module.exports = HatenaCounting;
