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

  it('should get 76.0.3809.68 version', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Windows_NT';
    chromeXml.osarch = 'x64';
    chromeXml.getUrl('76.0.3809.68').then((binaryUrl) => {
      expect(binaryUrl.url).toContain('76.0.3809.68/chromedriver_win32.zip');
      done();
    });
  });

  it('should get 76.0.3809.12 version', (done) => {
    let chromeXml = new ChromeXml();
    chromeXml.out_dir = out_dir;
    chromeXml.ostype = 'Windows_NT';
    chromeXml.osarch = 'x64';
    chromeXml.getUrl('76.0.3809.12').then((binaryUrl) => {
      expect(binaryUrl.url).toContain('76.0.3809.12/chromedriver_win32.zip');
      done();
    });
  });
});
