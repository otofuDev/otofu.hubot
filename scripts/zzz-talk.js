const request = require('request');
const END_POINT_URL = 'https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue';

module.exports = (robot) => {
  robot.respond(/(.+)/i, (msg) => {
    const message = msg.match[1];
    const request_options = {
      uri: END_POINT_URL,
      qs: {
        APIKEY: process.env.DOCOMO_API_KEY,
      },
      json: {
        utt: message,
        t: 20,
      },
    };
    request.post(request_options, (err, res, body) => {
      if (!err) {
        msg.send(body['utt']);
      }
    });
  });
};
