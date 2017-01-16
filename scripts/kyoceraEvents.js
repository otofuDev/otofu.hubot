// Description:
//   京セラドーム イベント通知.
//
// Author:
//   0tofu <otofu.xxx@gmail.com>

const co = require('co');
const CronJob = require('cron').CronJob;
const client = require('cheerio-httpcli');
const Utils = require('../lib/Utils');

const getKyoceraDomeEvents = () => {
  return co(function*() {
    const RetryCount = 3;
    for (let i = 1; i <= RetryCount; i++) {
      try {
        const eventLists = [];
        const result = yield client.fetch('http://www.kyoceradome-osaka.jp/schedule');
        const $ = result.$;

        $('.event-box').each(function() {
          const event = $(this);

          let eventStart = event.find('.btm li.date p:nth-child(2)').text().replace(/[\r|\n]/g, '');
          eventStart = eventStart.match(/開始時間[：|:](.+)$/i);
          if (eventStart.index !== 0) {
            eventStart = eventStart[1].trim();
          } else {
            eventStart = '';
          }

          const eventInfo = {
            date: event.attr('id').replace(/event/i, '').replace(/-/g, '/'),
            start: eventStart,
            artist: event.find('.top h1').text(),
            name: event.find('.top h2').text(),
            genre: event.find('.top span').text(),
          };
          eventLists.push(eventInfo);
        });
        return eventLists;
      } catch (e) {
        console.error(e);
        if (i === RetryCount) {
          return {error: 'Retry Error'};
        }
        yield Utils.sleep(3);
      }
    }
  });
};

module.exports = (robot) => {
  const cron_execute = /^production$/i.test(process.env.NODE_ENV);
  new CronJob('0 0 17 * * 1-5', () => {
    co(function*() {
      const eventLists = yield getKyoceraDomeEvents();
      if (!('error' in eventLists)) {
        const date = new Date();
        const formatDate = date.getFullYear() + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + ('0' + date.getDate()).slice(-2);
        const todayEventLists = eventLists.filter((eventList) => {
          return (eventList.date == formatDate && eventList.genre == 'コンサート');
        });

        for (const event of todayEventLists) {
          const channel_id = robot.adapter.client.rtm.dataStore.getChannelOrGroupByName('kyocera').name;
          const message = {
            as_user: true,
            attachments: [{
              fallback: '[' + event.name + '] ' + event.start,
              title: '京セラドームイベント情報(' + event.date + ')',
              text: event.name + ' [' + event.artist + '] 開始時間：' + event.start,
              color: 'danger',
            }],
          };
          const client = robot.adapter.client;
          client.web.chat.postMessage(channel_id, '', message);
        }
      }
    });
  }, null, cron_execute);
};
