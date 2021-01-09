import * as path from 'path';
import * as rimraf from 'rimraf';
import {ChromeXml} from '../../lib/binaries/chrome_xml';

describe('chrome xml reader', () => {
  let out_dir = path.resolve('selenium_test');

  afterAll(() => {
    rimraf.sync(out_dir);
  });

  it('should get a list', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Darwin';
    chromeXml.osarch = 'x64';
    chromeXml.getVersionList().then(list => {
      for (let item of list) {
        expect(item).toContain('/chromedriver_mac');
        expect(item).not.toContain('m1');
      }
      done();
    });
  });

  it('should get the 2.27, 64-bit version (arch = x64)', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Darwin';
    chromeXml.osarch = 'x64';
    chromeXml.getUrl('2.27').then(binaryUrl => {
      expect(binaryUrl.url).toContain('2.27/chromedriver_mac64.zip');
      done();
    });
  });

  it('should get the 2.27, 64-bit version (arch = x86)', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Darwin';
    chromeXml.osarch = 'x86';
    chromeXml.getUrl('2.27').then(binaryUrl => {
      expect(binaryUrl.url).toEqual('');
      done();
    });
  });

  it('should get the 2.20, 32-bit version (arch = x64)', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Darwin';
    chromeXml.osarch = 'x64';
    chromeXml.getUrl('2.20').then(binaryUrl => {
      expect(binaryUrl.url).toContain('2.20/chromedriver_mac32.zip');
      done();
    });
  });

  it('should get the 2.20, 32-bit version (arch = x86)', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Darwin';
    chromeXml.osarch = 'x86';
    chromeXml.getUrl('2.20').then((binaryUrl) => {
      expect(binaryUrl.url).toContain('2.20/chromedriver_mac32.zip');
      done();
    });
  });

  // This test case covers a bug when all the following conditions were true.
  //  arch was 64 with multiple major versions available.
  it('should not get the 85.0.4183.38, 32-bit version (arch = x64)', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Windows_NT';
    chromeXml.osarch = 'x64';
    chromeXml.getUrl('85.0.4183.87').then((binaryUrl) => {
      expect(binaryUrl.url).toContain('85.0.4183.87/chromedriver_win32.zip');
      done();
    });
  });

  it('should get the 87.0.4280.88, 64-bit, m1 version (arch = arm64)', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Darwin';
    chromeXml.osarch = 'arm64';
    chromeXml.getUrl('87.0.4280.88').then((binaryUrl) => {
      expect(binaryUrl.url).toContain('87.0.4280.88/chromedriver_mac64_m1.zip');
      done();
    });
  });
});
