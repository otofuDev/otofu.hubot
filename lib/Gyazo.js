const fs = require('fs');
const request = require('request');
const fileType = require('file-type');

class Gyazo {
  constructor(accessToken = null) {
    this.accessToken = accessToken;
  }

  upload(image, params = {}) {
    return new Promise((resolve, reject) => {
      if (!image) throw new Error('image is undefined');

      let imagedataOptions = {};
      if (typeof image === 'string') {
        image = fs.createReadStream(image);
      } else if (typeof image === 'object') {
        const type = fileType(image);
        imagedataOptions = {
          filename: 'image' + type.ext,
          contentType: type.mime,
        };
      }
      const url = 'https://upload.gyazo.com/api/upload';
      const req = request.post({
        url: url,
      }, (err, res, body) => {
        if (err) return reject(err);
        if (res.statusCode !== 200) return reject(res.body);
        resolve({
          response: res,
          data: JSON.parse(body),
        });
      });
      const form = req.form();
      form.append('imagedata', image, imagedataOptions);
      form.append('access_token', this.accessToken);
      for (let key in params) {
        form.append(key, params[key]);
      }
    });
  }
}

module.exports = Gyazo;
