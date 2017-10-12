// Description:
//   電車運行状況通知.
//
// Commands:
//   hubot 遅延 - 登録済み路線の運行状況を通知.
//
// Author:
//   0tofu <otofu.xxx@gmail.com>

const co = require('co');
const CronJob = require('cron').CronJob;
const YahooTransit = require('../lib/YahooTransit');

/**
 * 遅延情報収集対象の路線.
 */
const lineLists = [
//  {name: '大阪環状線', url: 'http://transit.yahoo.co.jp/traininfo/detail/263/0/'},
//  {name: 'JR京都線', url: 'http://transit.yahoo.co.jp/traininfo/detail/267/0/'},
//  {name: 'JR琵琶湖線', url: 'http://transit.yahoo.co.jp/traininfo/detail/266/0/'},
//  {name: '大阪市営長堀鶴見緑地線', url: 'http://transit.yahoo.co.jp/traininfo/detail/327/0/'},
  {name: '名古屋市営鶴舞線', url: 'http://transit.yahoo.co.jp/traininfo/detail/242/0/'},
  {name: '名鉄犬山線', url: 'http://transit.yahoo.co.jp/traininfo/detail/220/0/'},
];

/**
 * cronで遅延情報をredisに保存する際のキーの接頭辞.
 */
const TRAIN_DELAY_KEY = process.env.TRAIN_DELAY_KEY || 'hubot_train_delay';

/**
 *
 */
const setAttachments = (lineStatus) => {
  return {
    fallback: lineStatus.name + '：[' + lineStatus.status + ']',
    color: lineStatus.color,
    title: '[' + lineStatus.name + ']の運行状況',
    title_link: lineStatus.url,
    text: '[' + lineStatus.status + ']：' + lineStatus.message,
  };
};

/**
 *
 */
const sendAttachments = (robot, room, attachments) => {
  const client = robot.adapter.client;
  const message = {
    as_user: false,
    username: '運行状況',
    icon_emoji: ':train:',
    attachments: [attachments],
  };
  client.web.chat.postMessage(room, '', message);
};

/**
 * BOTスクリプト本体.
 * @param {object} robot hubot.
 */
module.exports = (robot) => {
  // BOTに対し `遅延` とメッセージを送信すると路線リストの遅延情報を返す.
  robot.respond(/遅延/, (msg) => {
    co(function*() {
      for (let line of lineLists) {
        const lineStatus = yield YahooTransit.getStatus(line.url);
        const attachments = setAttachments(lineStatus);
        sendAttachments(robot, msg.envelope.room, attachments);
      }
    });
    msg.finish();
  });

  // 路線リストの遅延情報を取得するcronジョブ.
  const cron_execute = /^production$/i.test(process.env.NODE_ENV);
  new CronJob('0 */10 6-9,17-20 * * 1-5', () => {
    co(function*() {
      for (let line of lineLists) {
        const lineStatus = yield YahooTransit.getStatus(line.url);
        const lineNumber = line.url.replace(/[^\d]/g, '');
        const trainStatus = robot.brain.get(TRAIN_DELAY_KEY) || {};
        const beforeTrainStatus = trainStatus[lineNumber] || '';
        if (beforeTrainStatus !== lineStatus.message) {
          trainStatus[lineNumber] = lineStatus.message;
          robot.brain.set(TRAIN_DELAY_KEY, trainStatus);

          const channel_id = robot.adapter.client.rtm.dataStore.getChannelOrGroupByName('delay').name;
          const attachments = setAttachments(lineStatus);
          sendAttachments(robot, channel_id, attachments);
        }
      }
    });
  }, null, cron_execute);
};
