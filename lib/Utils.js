class Utils {
  static sleep(second = 3) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, second * 1000);
    });
  }
}

module.exports = Utils;
