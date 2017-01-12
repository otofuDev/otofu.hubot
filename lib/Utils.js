class Utils {
  sleep(second = 3) {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve();
      }, second * 1000);
    });
  }
}

module.exports = Utils;
