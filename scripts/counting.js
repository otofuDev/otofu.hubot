// Description:
//   HatenaCounting通知.
//
// Commands:
//   hubot 記念日 - 登録済みHatenaCountingの日数を通知.
//
// Author:
//   0tofu <otofu.xxx@gmail.com>

const co = require('co');
const CronJob = require('cron').CronJob;
const HatenaCounting = require('../lib/HatenaCounting');

const CountLists = [
  {name: 'SUPER GT 2017 Rd.6 SUZUKA', url: 'http://counting.hatelabo.jp/count/u7pi5kfr92', channel: 'supergt2017'},
  {name: 'モータースポーツファン感謝デー', url: 'http://counting.hatelabo.jp/count/mhimq2tkf3', channel: 'supergt2017'},
];

/**
 *
 */
const setAttachments = (countInfo) => {
  return {
    fallback: countInfo.counter_name + ' ' + countInfo.counter + '日',
    title: countInfo.counter_name,
    title_link: countInfo.counter_url,
    image_url: countInfo.image,
  };
};

const sendAttachments = (robot, room, attachments) => {
  const client = robot.adapter.client;
  const message = {
    as_user: true,
    attachments: [attachments],
  };
  client.web.chat.postMessage(room, '', message);
};

/**
 * BOTスクリプト本体.
 * @param {object} robot hubot.
 */
module.exports = (robot) => {
  // BOTに対し `記念日` とメッセージを送信すると指定したHatenaCountingの日数を表示.
  robot.respond(/記念日/, (msg) => {
    co(function*() {
      for (let list of CountLists) {
        const countInfo = yield HatenaCounting.getCounterInfo(list.url);
        const attachments = setAttachments(countInfo);
        sendAttachments(robot, msg.envelope.room, attachments);
      }
    });
    msg.finish();
  });

  // 毎朝イベント日を通知する処理.
  const cron_execute = /^production$/i.test(process.env.NODE_ENV);
  new CronJob('0 0 9 * * *', () => {
    co(function*() {
      for (let list of CountLists) {
        const channel_id = robot.adapter.client.rtm.dataStore.getChannelOrGroupByName(list.channel).name;
        const countInfo = yield HatenaCounting.getCounterInfo(list.url);
        const attachments = setAttachments(countInfo);
        sendAttachments(robot, channel_id, attachments);
      }
    });
  }, null, cron_execute);
};
