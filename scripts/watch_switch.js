const aa = require('aa');
const CronJob = require('cron').CronJob;
const client = require('cheerio-httpcli');
const Utils = require('../lib/Utils');

const yodobashi_url = 'http://www.yodobashi.com/%E4%BB%BB%E5%A4%A9%E5%A0%82-Nintendo-Nintendo-Switch-Joy-Con-L-%E3%83%8D%E3%82%AA%E3%83%B3%E3%83%96%E3%83%AB%E3%83%BC-R-%E3%83%8D%E3%82%AA%E3%83%B3%E3%83%AC%E3%83%83%E3%83%89-Nintendo-Switch%E6%9C%AC%E4%BD%93/pd/100000001003431566/';

const getResult = (url) => {
  return aa(function*() {
    for (let i = 0; i < 3; i++) {
      try {
        const result = yield client.fetch(url);
        return result.$;
      } catch (err) {
        if (i == 2) { return {error: 'ScreenShot Error...'}; }
        yield Utils.sleep(3);
      }
    }
  });
};

const sendAttachments = (robot, room, attachments) => {
  const client = robot.adapter.client;
  const message = {
    as_user: true,
    attachments: [attachments],
  };
  client.web.chat.postMessage(room, '', message);
};

module.exports = (robot) => {
  const cron_execute = /^production$/i.test(process.env.NODE_ENV);
  new CronJob('0 */1 * * * *', () => {
    aa(function*() {
      const $ = yield getResult(yodobashi_url);
      if (!('error' in $)) {
        const salesInfo = $('.buyBoxMain .salesInfo').text();
        const redis_salesInfo = robot.brain.get('yodobashi_switch') || '';

        if (salesInfo !== redis_salesInfo) {
          robot.brain.set('yodobashi_switch', salesInfo);
          const channel_id = robot.adapter.client.rtm.dataStore.getChannelOrGroupByName('watch_switch').name;
          const attachments = {
            fallback: 'ヨドバシカメラ [' + salesInfo  + ']',
            title: 'ヨドバシカメラ [' + salesInfo  + ']',
            title_link: yodobashi_url,
          };
          sendAttachments(robot, channel_id, attachments);
        }
      }
    });
  }, null, cron_execute);
};
