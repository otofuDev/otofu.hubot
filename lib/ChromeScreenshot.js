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

async function exec(url, targetDom = 'body') {
  let chrome = null;
  let client = null;

  try {
    chrome = await chromeLauncher.launch(chromeOptions);

    client = await CDP();

    await Promise.all([
      client.Network.enable(),
      client.Page.enable(),
      client.DOM.enable(),
      client.CSS.enable(),
      client.Security.enable(),
    ]);

    const Page = client.Page;
    const DOM = client.DOM;

    await Page.navigate({url: url});
    await Page.loadEventFired();

    const document = await DOM.getDocument();
    let node = document.root;
    if (node.nodeName === 'IFRAME' && node.contentDocument) {
      node = node.contentDocument;
    }
    const selector = await DOM.querySelector({
      nodeId: node.nodeId,
      selector: targetDom,
    });
    const boxModel = await DOM.getBoxModel({nodeId: selector.nodeId});

    screenshotOptions.clip = {
      x: boxModel.model.margin[0],
      y: boxModel.model.margin[1],
      width: boxModel.model.width,
      height: boxModel.model.height,
      scale: 1,
    };
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
