import * as os from 'os';
import * as webdriver from 'selenium-webdriver';
import {AndroidSDK} from '../lib/binaries'

let browsers: string[] = require('./target_browsers')[os.type()];
let versions: {androidsdk: string, appium: string} = require('../config.json').webdriverVersions;


describe('browser smoke tests', () => {
  browsers.forEach((browserName) => {
    if (browserName == 'android') {
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
      }, 60 * 1000);
    } else {
      it('should be able to boot up ' + browserName, (done) => {
        let driver = new webdriver.Builder()
                         .usingServer('http://localhost:4444/wd/hub')
                         .withCapabilities({browserName: browserName})
                         .build();
        driver.get('http://localhost:4444/selenium-server/driver/?cmd=getLogMessages')
            .then(() => {
              return driver.getPageSource();
            })
            .then((source: string) => {
              expect(source).toContain('OK');
              return driver.quit();
            })
            .then(() => {
              done();
            });
      });
    }
  });
});
