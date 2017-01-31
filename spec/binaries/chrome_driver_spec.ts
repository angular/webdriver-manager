import * as path from 'path';
import * as rimraf from 'rimraf';
import {ChromeDriver} from '../../lib/binaries/chrome_driver';

describe('chrome driver', () => {
  let out_dir = path.resolve('selenium_test');

  afterAll(() => {
    rimraf.sync(out_dir);
  });

  it('should get the id', () => {
    expect(new ChromeDriver().id()).toEqual('chrome');
  });

  it('should get the url', (done) => {
    let chromeDriver = new ChromeDriver();
    chromeDriver.configSource.out_dir = out_dir;
    chromeDriver.configSource.osarch = 'x64';
    chromeDriver.configSource.ostype = 'Darwin';
    chromeDriver.getUrl('2.20').then(binaryUrl => {
      expect(binaryUrl.url).toContain('2.20/chromedriver_mac32.zip');
      done();
    });
  });

  it('should get the lists', (done) => {
    let chromeDriver = new ChromeDriver();
    chromeDriver.configSource.out_dir = out_dir;
    chromeDriver.configSource.osarch = 'x64';
    chromeDriver.configSource.ostype = 'Darwin';
    chromeDriver.getVersionList().then(list => {
      for (let item of list) {
        expect(item).toContain('chromedriver_mac');
      }
      done();
    });
  });
});
