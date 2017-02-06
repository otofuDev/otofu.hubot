const ScreenShot = require('../lib/ScreenShot');
const CronJob = require('cron').CronJob;
const co = require('co');

const OKUIBUKI_INFO_URL = 'https://snow.gnavi.co.jp/guide/htm/r0244s.htm';
const OKUIBUKI_WEATHER_URL = 'https://snow.gnavi.co.jp/guide/htm/r0244we.htm';

module.exports = (robot) => {
  robot.respond(/奥伊吹/i, (msg) => {
    co(function*() {
      // 奥伊吹スキー場の積雪情報を取得.
      const info_res = yield ScreenShot.capture(OKUIBUKI_INFO_URL, '.weather_infoBox');
      const info_attachments = {
        fallback: '奥伊吹スキー場 積雪情報',
        title: '奥伊吹スキー場 積雪情報',
        image_url: info_res.url,
      };

      // 奥伊吹スキー場の気象情報を取得.
      const weather_res = yield ScreenShot.capture(OKUIBUKI_WEATHER_URL, '#weather');
      const weather_attachments = {
        fallback: '奥伊吹スキー場 気象情報',
        title: '奥伊吹スキー場 気象情報',
        image_url: weather_res.url,
      };

      const client = robot.adapter.client;
      client.web.chat.postMessage(msg.envelope.room, '', {as_user: true, attachments: [info_attachments]});
      client.web.chat.postMessage(msg.envelope.room, '', {as_user: true, attachments: [weather_attachments]});
    });
    msg.finish();
  });

//  const cron_execute = /^production$/i.test(process.env.NODE_ENV);
//  new CronJob('0 0 9 * * *', () => {
//    co(function*() {
//      // 奥伊吹スキー場の積雪情報を取得.
//      const info_res = yield ScreenShot.capture(OKUIBUKI_INFO_URL, '.weather_infoBox');
//      const info_attachments = {
//        fallback: '奥伊吹スキー場 積雪情報',
//        title: '奥伊吹スキー場 積雪情報',
//        image_url: info_res.url,
//      };
//
//      // 奥伊吹スキー場の気象情報を取得.
//      const weather_res = yield ScreenShot.capture(OKUIBUKI_WEATHER_URL, '#weather');
//      const weather_attachments = {
//        fallback: '奥伊吹スキー場 気象情報',
//        title: '奥伊吹スキー場 気象情報',
//        image_url: weather_res.url,
//      };
//
//      const client = robot.adapter.client;
//      const channel_id = robot.adapter.client.rtm.dataStore.getChannelOrGroupByName('-general').name;
//      client.web.chat.postMessage(channel_id, '', {as_user: true, attachments: [info_attachments]});
//      client.web.chat.postMessage(channel_id, '', {as_user: true, attachments: [weather_attachments]});
//    });
//  }, null, cron_execute);
};
