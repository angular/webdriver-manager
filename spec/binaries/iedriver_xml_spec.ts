import * as path from 'path';
import * as rimraf from 'rimraf';
import {IEDriverXml} from '../../lib/binaries/iedriver_xml';

describe('iedriver xml', () => {
  let out_dir = path.resolve('selenium_test');

  afterAll(() => {
    rimraf.sync(out_dir);
  });

  it('should get version 2.53.1', (done) => {
    let iedriverXml = new IEDriverXml();
    iedriverXml.out_dir = out_dir;
    iedriverXml.getUrl('2.53.1').then(binaryUrl => {
      expect(binaryUrl.url)
          .toEqual(
              'https://selenium-release.storage.googleapis.com/2.53/IEDriverServer_Win32_2.53.1.zip');
      done();
    });
  });
});
