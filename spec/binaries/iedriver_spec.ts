import * as path from 'path';
import * as rimraf from 'rimraf';
import {IEDriver} from '../../lib/binaries/iedriver';

describe('iedriver', () => {
  let out_dir = path.resolve('selenium_test');

  afterAll(() => {
    rimraf.sync(out_dir);
  });

  it('should get the id', () => {
    expect(new IEDriver().id()).toEqual('ie');
  });

  it('should get version 2.53.1', (done) => {
    let iedriver = new IEDriver();
    iedriver.configSource.out_dir = out_dir;
    iedriver.getUrl('2.53.1').then(binaryUrl => {
      expect(binaryUrl.url)
          .toEqual(
              'https://selenium-release.storage.googleapis.com/2.53/IEDriverServer_Win32_2.53.1.zip');
      done();
    });
  });
});
