// Description:
//   水曜どうでしょうおみくじ.
//
// Commands:
//   hubot おみくじ - 水曜どうでしょうのおみくじを引く.
//
// Author:
//   0tofu <otofu.xxx@gmail.com>

const co = require('co');
const ScreenShot = require('../lib/ScreenShot');

module.exports = (robot) => {
  robot.respond(/おみくじ/, (msg) => {
    co(function*(){
      const gyazo_res = yield ScreenShot.capture('http://www.htb.co.jp/suidou/omikuji.html', 'img');
      const attachments = {
        fallback: 'おみくじ',
        title: 'おみくじ',
        image_url: gyazo_res.url,
      };
      const client = robot.adapter.client;
      client.web.chat.postMessage(msg.envelope.room, '', {as_user: true, attachments: [attachments]});
    });
    msg.finish();
  });
};
