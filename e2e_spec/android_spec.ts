import * as os from 'os';
import * as webdriver from 'selenium-webdriver';
import {AndroidSDK} from '../lib/binaries'

let versions: { androidsdk: string, appium: string } = require('../config.json').webdriverVersions;

describe('browser smoke tests', () => {
  it('should be able to boot up android chrome', (done) => {
    let driver =
        new webdriver.Builder()
            .usingServer('http://localhost:4723/wd/hub')
            .withCapabilities({
              browserName: 'chrome',
              platformName: 'Android',
              platformVersion:
                  AndroidSDK.VERSIONS[parseInt(AndroidSDK.DEFAULT_API_LEVELS.split(',')[0])],
              deviceName: 'Android Emulator'
            })
            .build();
    driver.get('http://10.0.2.2:4723/wd/hub/status')
        .then(() => {
          return driver.getPageSource();
        })
        .then((source: string) => {
          expect(source).toContain('"status":0');
          return driver.quit();
        })
        .then(() => {
          done();
        });
  }, 10 * 60 * 1000);
});
