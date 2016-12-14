import * as path from 'path';
import * as rimraf from 'rimraf';
import {GeckoDriver} from '../../lib/binaries/gecko_driver';

describe('gecko driver', () => {
  let out_dir = path.resolve('selenium_test');

  afterAll(() => {
    rimraf.sync(out_dir);
  });

  it('should get id', () => {
    expect(new GeckoDriver().id()).toEqual('gecko');
  });

  it('should get url for 0.13.0', (done) => {
    let geckoDriver = new GeckoDriver();
    geckoDriver.configSource.out_dir = out_dir;
    geckoDriver.getUrl('v0.13.0').then(binaryUrl => {
      expect(binaryUrl.url)
          .toContain(
              'https://github.com/mozilla/geckodriver/releases/download/v0.13.0/geckodriver-v');
      done();
    });
  });

  it('should get the version list', (done) => {
    let geckoDriver = new GeckoDriver();
    geckoDriver.configSource.out_dir = out_dir;
    geckoDriver.getVersionList().then(list => {
      expect(list.length).toBeGreaterThan(0);
      done();
    });
  });
});
