class Utils {
  static sleep(second = 3) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, second * 1000);
    });
  }

  static now() {
    const date = new Date();
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hour = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);

    return year + '/' + month + '/' + day + ' ' + hour + ':' + minutes + ':' + seconds;
  }
}

module.exports = Utils;
