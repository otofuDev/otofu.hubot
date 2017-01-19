const co = require('co');
const client = require('cheerio-httpcli');
const ScreenShot = require('./ScreenShot');

const replaceEmoji = [
  [/晴れ?/, ':sunny:'],
  [/曇り?/, ':cloud:'],
  [/雨/, ':umbrella:'],
  [/雪/, ':snowflake:'],
  [/時々/, ' / '],
  [/後/, ' -> '],
];

class YahooWeather {
  static getWeather(weather_url, day) {
    return co(function*() {
      let weatherInfo = {};
      // 天気情報を取得するセレクタ.
      const selector = {
        today: '.forecastCity td:first-child div',
        tomorrow: '.forecastCity td:nth-child(2) div',
        weekly: '.yjw_table',
      };

      if (day !== 'today' && day !== 'tomorrow' && day !== 'weekly') {
        return Promise.reject({message: '引数の指定が誤っています'});
      }

      const result = yield client.fetch(weather_url);
      const $ = result.$;

      // 共通項目の設定.
      weatherInfo.url = $.documentInfo().url;
      weatherInfo.area = $('title').text().replace(/の天気.*$/g, '');
      const $weather = $(selector[day]);

      // Yahoo!天気より今日・明日の天気予報をスクレイピング.
      if (day === 'today' || day === 'tomorrow') {
        let rainFall = 0;
        $weather.find('.precip td').each((idx, item) => {
          const p = $(item).text().replace(/[^\d]/g, '') || 0;
          if (p > rainFall) {
            rainFall = p;
          }
        });

        weatherInfo.date = $weather.find('.date').text();
        weatherInfo.weather = replaceEmoji.reduce((w, e) => {return w.replace.apply(w, e);}, $weather.find('.pict').text());
        weatherInfo.img = $weather.find('.pict img').url();
        weatherInfo.rainFall = rainFall;
        weatherInfo.temp_high = $weather.find('.temp .high em').text();
        weatherInfo.temp_low = $weather.find('.temp .low em').text();
      } else {
        weatherInfo.date_from = $weather.find('tr:first-child td:nth-child(2)').text();
        weatherInfo.date_to = $weather.find('tr:first-child td:nth-child(7)').text();
      }

      const gyazo_res = yield ScreenShot.capture(weather_url, selector[day]);
      weatherInfo.capture = gyazo_res.url;

      return Promise.resolve(weatherInfo);

    }).then((weatherInfo) => {
      return weatherInfo;
    }).catch((err) => {
      console.error(err);
      return {err: err};
    });
  }
}

module.exports = YahooWeather;
