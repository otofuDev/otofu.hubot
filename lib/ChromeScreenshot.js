const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');

const chromeOptions = {
  port: 9222,
  chromeFlags: [
    '--hide-scrollbars',
    '--ignore-certificate-errors',
    '--disable-gpu',
    '--headless',
    '--lang=ja',
  ],
};

const screenshotOptions = {
  format: 'jpeg',
  fromSurface: true,
};

const defaultScreenSize = {
  width: 1920,
  height: 1080,
};
const defaultBackground = {
  color: {r: 255, g: 255, b: 255},
};

async function exec(url, targetDom = 'body') {
  let chrome = null;
  let client = null;

  try {
    chrome = await chromeLauncher.launch(chromeOptions);

    client = await CDP();
    const {DOM, Emulation, Network, Page, Input, Runtime} = client;

    await Page.enable();
    await DOM.enable();
    await Network.enable();

    const deviceMetrics = Object.assign({
      deviceScaleFactor: 0,
      mobile: false,
      fitWindow: false,
    }, defaultScreenSize);
    await Emulation.setDeviceMetricsOverride(deviceMetrics);
    await Emulation.setVisibleSize(defaultScreenSize);
    await Emulation.setDefaultBackgroundColorOverride(defaultBackground);

    await Page.navigate({url: url});
    await Page.loadEventFired();

    const {root: {nodeId: documentNodeId}} = await DOM.getDocument();
    const {nodeId: targetNodeId} = await DOM.querySelector({
      selector: targetDom,
      nodeId: documentNodeId,
    });

    const {model: {content, width, height}} = await DOM.getBoxModel({nodeId: targetNodeId});
    await Emulation.setVisibleSize({width: width, height: height});
    await Emulation.setDeviceMetricsOverride({
      width: width,
      height: height,
      screenWidth: content[0],
      screenHeight: content[1],
      deviceScaleFactor: deviceMetrics.deviceScaleFactor,
      fitWindow: false,
      mobile: false,
    });
    await Emulation.setPageScaleFactor({pageScaleFactor: deviceMetrics.deviceScaleFactor});

    screenshotOptions.clip = {x: content[0], y: content[1], width: width, height: height, scale: deviceMetrics.deviceScaleFactor};
    const screenshot = await Page.captureScreenshot(screenshotOptions);
    return new Buffer(screenshot.data, 'base64');
  } catch (e) {
    throw new Error('Page Capture Error');
  } finally {
    if (client !== null) {await client.close();}
    if (chrome !== null) {await chrome.kill();}
  }
}

class ChromeScreenshot {
  static capture(url, selector = 'body') {
    return exec(url, selector);
  }
}

module.exports = ChromeScreenshot;
