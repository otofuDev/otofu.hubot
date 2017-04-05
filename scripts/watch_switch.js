const aa = require('aa');
const CronJob = require('cron').CronJob;
const client = require('cheerio-httpcli');
const Utils = require('../lib/Utils');

const watch_lists = {
  yodobashi: {
    name: 'ヨドバシカメラ',
    url: 'http://www.yodobashi.com/%E4%BB%BB%E5%A4%A9%E5%A0%82-Nintendo-Nintendo-Switch-Joy-Con-L-%E3%83%8D%E3%82%AA%E3%83%B3%E3%83%96%E3%83%AB%E3%83%BC-R-%E3%83%8D%E3%82%AA%E3%83%B3%E3%83%AC%E3%83%83%E3%83%89-Nintendo-Switch%E6%9C%AC%E4%BD%93/pd/100000001003431566/',
    elm: '.buyBoxMain .salesInfo',
  },
};

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
    const channel_id = robot.adapter.client.rtm.dataStore.getChannelOrGroupByName('watch_switch').name;

    Object.keys(watch_lists).forEach((key) => {
      aa(function*() {
        let message = null;
        const $ = yield getResult(watch_lists[key].url);
        if (!('error' in $)) {
          const salesInfo = $(watch_lists[key].elm).text();
          const redis_salesInfo = robot.brain.get(key + '_switch') || '';

          if (salesInfo !== redis_salesInfo) {
            message = watch_lists[key].name + ' [' + salesInfo + ']';
          }
        } else {
          message = watch_lists[key].name + ' [Error]';
        }

        if (message) {
          const attachments = {
            fallback: message,
            title: message,
            title_link: watch_lists[key].url,
          };
          sendAttachments(robot, channel_id, attachments);
        }
      });
    });
  }, null, cron_execute);
};
