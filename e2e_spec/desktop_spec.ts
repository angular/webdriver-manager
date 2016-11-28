import * as os from 'os';
import * as webdriver from 'selenium-webdriver';

let browsers: string[] = require('./target_browsers')[os.type()];


describe('desktop browser smoke tests', () => {
  browsers.forEach((browserName) => {
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
    }, 60 * 1000);
  });
});
