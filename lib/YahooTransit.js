/**
 * Yahoo!路線情報(http://transit.yahoo.co.jp/)より指定した路線の運行状況を返すクラス.
 */
const co = require('co');
const client = require('cheerio-httpcli');

/**
 * Yahoo!路線情報のURLかどうかチェックする関数.
 * @param  {string} line_url Yahoo!路線情報URL
 * @return {bool} 判定結果
 */
const checkUrl = (line_url) => {
  if (line_url.match(/^http:\/\/transit\.yahoo\.co\.jp\//)) {
    return true;
  } else {
    return false;
  }
};

class YahooTransit {

  /**
   * 引数で指定したURLの運行状況を返す関数.
   *
   * @param {string} line_url 路線のURL.
   * @return {object} lineStatus 運行状況.
   */
  static getStatus(line_url) {
    return co(function*() {
      // 戻り値の初期値.
      let lineStatus = {
        name: null,     // 路線名.
        color: null,    // slackへ出力する時の色設定.
        url: line_url,  // 運行状況URL.
        status: null,   // 運行状況概要.
        message: null,  // 運行状況詳細メッセージ.
        error: null,    // エラーメッセージ.
      };

      if (!checkUrl(line_url)) {
        lineStatus.color = 'danger';
        lineStatus.error = '正しいURLを指定してください。';
        return lineStatus;
      }

      // 路線のURLをもとにYahoo!路線情報より運行状況のhtmlを取得.
      const result = yield client.fetch(line_url);
      if (!('error' in result) && ('$' in result)) {
        // 正常に取得できた場合の処理.
        const $ = result.$;
        const trainName = $('h1.title').text().replace(/\n/g, '');  // 路線名.
        const trainStatus = $('#mdServiceStatus dt').text().replace($('#mdServiceStatus dt span').text(), '').replace(/\n/g, ''); // 運行状況概要.
        const trainMessage = $('#mdServiceStatus dd').text().replace(/\n/g, '');  // 運行状況詳細.

        // 運行状況に応じてslack通知用の色を設定する.
        let color = 'good';
        if (trainStatus === '運転見合わせ') {
          color = 'danger';
        } else if (trainMessage !== '現在､事故･遅延に関する情報はありません。') {
          color = 'warning';
        }

        // 戻り値に値を設定.
        lineStatus.name = trainName;
        lineStatus.color = color;
        lineStatus.status = trainStatus;
        lineStatus.message = trainMessage;
      } else {
        // データ酒時に失敗した場合の処理.
        lineStatus.color = 'danger';
        lineStatus.error = '遅延情報取得に失敗しました。';
      }

      // データを返す.
      return lineStatus;
    });
  }
}

module.exports = YahooTransit;
