import * as path from 'path';
import * as rimraf from 'rimraf';
import {StandaloneXml} from '../../lib/binaries/standalone_xml';

describe('standalone xml reader', () => {
  let out_dir = path.resolve('selenium_test');

  afterAll(() => {
    rimraf.sync(out_dir);
  });

  it('should get a list', (done) => {
    let standaloneXml = new StandaloneXml();
    standaloneXml.out_dir = out_dir;
    standaloneXml.getVersionList().then(list => {
      for (let item of list) {
        expect(item).toContain('/selenium-server-standalone');
      }
      done();
    });
  });

  it('should get version 2.53.1', (done) => {
    let standaloneXml = new StandaloneXml();
    standaloneXml.out_dir = out_dir;
    standaloneXml.getUrl('2.53.1').then(binaryUrl => {
      expect(binaryUrl.url)
          .toBe(
              'https://selenium-release.storage.googleapis.com/2.53/selenium-server-standalone-2.53.1.jar');
      done();
    });
  });

  it('should get version 3.0.0-beta3', (done) => {
    let standaloneXml = new StandaloneXml();
    standaloneXml.out_dir = out_dir;
    standaloneXml.getUrl('3.0.0-beta3').then(binaryUrl => {
      expect(binaryUrl.url)
          .toBe(
              'https://selenium-release.storage.googleapis.com/3.0-beta3/selenium-server-standalone-3.0.0-beta3.jar');
      done();
    });
  });
});
