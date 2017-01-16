// Description:
//   天気予報通知.
//
// Commands:
//   hubot [天気|weather] <area> <今日|today|明日|tomorrow|週|week|weekly> - 該当エリアの今日or明日or週間天気を表示.
//
// Author:
//   0tofu <otofu.xxx@gmail.com>

const co = require('co');
const CronJob = require('cron').CronJob;
const YahooWeather = require('../lib/YahooWeather');

const WeatherLists = [
  {name: '大阪', url: 'http://weather.yahoo.co.jp/weather/jp/27/6200.html', channel: 'weather'},
  {name: '名古屋', url: 'http://weather.yahoo.co.jp/weather/jp/23/5110.html', channel: 'nagoya'},
];

/**
 *
 */
const setAttachments = (weatherInfo, pattern) => {
  if (pattern === 'weekly') {
    return {
      fallback: '週間天気予報[' + weatherInfo.area + ']',
      title: '[' + weatherInfo.area + '] ' + weatherInfo.date_from + 'から' + weatherInfo.date_to + 'の天気',
      title_link: weatherInfo.url,
      image_url: weatherInfo.capture,
    };
  }
  return {
    fallback: '天気予報[' + weatherInfo.area + ']：' + weatherInfo.weather + '\n' + '最高:' + weatherInfo.temp_high + '℃　最低:' + weatherInfo.temp_low + '℃　降水:' + weatherInfo.rainFall + '％',
    title: '[' + weatherInfo.area + '] ' + weatherInfo.date + 'の天気',
    title_link: weatherInfo.url,
    text: weatherInfo.weather + '　最高気温：' + weatherInfo.temp_high + '℃　最低気温：' + weatherInfo.temp_low + '℃　降水確率：' + weatherInfo.rainFall + '％',
    image_url: weatherInfo.capture,
  };
};

const sendAttachments = (robot, room, attachments, options = {as_user: true}) => {
  const client = robot.adapter.client;
  const message = Object.assign(options, {attachments: [attachments]});
  client.web.chat.postMessage(room, '', message);
};

/**
 * BOTスクリプト本体.
 * @param {object} bot hubot.
 */
module.exports = (robot) => {
  // BOTに対し `天気 地名 取得対象` とメッセージを送信すると路線リストの遅延情報を返す.
  robot.respond(/(?:天気|weather) (.\S+)\s?(今日|today|明日|tomorrow|週|week|weekly)?/i, (msg) => {
    const area = msg.match[1];
    let pattern = msg.match[2] || 'today';

    const filterWeatherList = WeatherLists.filter((item) => {
      return (item.name == area);
    });

    if (filterWeatherList.length === 0) {
      return msg.send('[' + area + '] の天気予報取得URLは未登録です。');
    }

    if (pattern === '今日') {
      pattern = 'today';
    } else if (pattern === '明日') {
      pattern = 'tomorrow';
    } else if (pattern === '週' || pattern === 'week') {
      pattern = 'weekly';
    }

    co(function*() {
      for (let weatherList of filterWeatherList) {
        const weatherInfo = yield YahooWeather.getWeather(weatherList.url, pattern);
        const attachments = setAttachments(weatherInfo, pattern);
        const options = {as_user: true};
        if (pattern === 'today' || pattern === 'tomorrow') {
          options.as_user = false;
          options.username = 'weathernews';
          options.icon_url = weatherInfo.img;
        }
        sendAttachments(robot, msg.envelope.room, attachments, options);
      }
    });
    msg.finish();
  });

  // 毎朝天気予報を通知する処理.
  const cron_execute = /^production$/i.test(process.env.NODE_ENV);
  new CronJob('0 30 6 * * *', () => {
    co(function*(){
      for (const WeatherList of WeatherLists) {
        const channel_id = robot.adapter.client.rtm.dataStore.getChannelOrGroupByName(WeatherList.channel).name;
        const weatherInfo = yield YahooWeather.getWeather(WeatherList.url, 'today');
        const attachments = setAttachments(weatherInfo, 'today');
        const options = {
          as_user: false,
          username: 'weathernews',
          icon_url: weatherInfo.img,
        };
        sendAttachments(robot, channel_id, attachments, options);
      }
    });
  }, null, cron_execute);
};
