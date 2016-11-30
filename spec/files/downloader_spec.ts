import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {Config} from '../../lib/config';
import {Downloader} from '../../lib/files';

describe('downloader', () => {
  let fileUrlHttp = 'http://foobar.com';
  let fileUrlHttps = 'https://foobar.com';
  let argProxy = 'http://foobar.arg';
  let envNoProxy = 'http://foobar.com';
  let envHttpProxy = 'http://foobar.env';
  let envHttpsProxy = 'https://foobar.env';

  it('should return undefined when proxy arg is not used', () => {
    let proxy = Downloader.resolveProxy_(fileUrlHttp);
    expect(proxy).toBeUndefined();
  });

  describe('proxy arg', () => {
    let opt_proxy = 'http://bar.foo';
    it('should return the proxy arg', () => {
      let proxy = Downloader.resolveProxy_(fileUrlHttp, opt_proxy);
      expect(proxy).toBe(opt_proxy);
    });

    it('should always return the proxy arg with env var set', () => {
      Config.httpProxy_ = envHttpProxy;
      Config.httpsProxy_ = envHttpsProxy;
      Config.noProxy_ = envNoProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttp, opt_proxy);
      expect(proxy).toBe(opt_proxy);
    });
  });

  describe('environment variables', () => {
    beforeEach(() => {
      Config.httpProxy_ = undefined;
      Config.httpsProxy_ = undefined;
      Config.noProxy_ = undefined;
    });

    it('should return the HTTP env variable', () => {
      Config.httpProxy_ = envHttpProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttp);
      expect(proxy).toBe(envHttpProxy);
    });

    it('should return the HTTPS env variable for https protocol', () => {
      Config.httpProxy_ = envHttpsProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttps);
      expect(proxy).toBe(envHttpsProxy);
    });

    it('should return the HTTP env variable for https protocol', () => {
      Config.httpProxy_ = envHttpProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttps);
      expect(proxy).toBe(envHttpProxy);
    });

    describe('NO_PROXY environment variable', () => {
      beforeEach(() => {
        Config.noProxy_ = undefined;
      });

      it('should return undefined when the NO_PROXY matches the fileUrl', () => {
        Config.noProxy_ = envNoProxy;
        let proxy = Downloader.resolveProxy_(fileUrlHttp);
        expect(proxy).toBeUndefined();
      });

      it('should return undefined when the no_proxy matches the fileUrl', () => {
        Config.noProxy_ = envNoProxy;
        let proxy = Downloader.resolveProxy_(fileUrlHttp);
        expect(proxy).toBeUndefined();
      });
    });
  });

  describe('get file', () => {
    let fileUrl =
        'https://selenium-release.storage.googleapis.com/3.0/selenium-server-standalone-3.0.0.jar';
    let fileName = 'foobar.jar';
    let outputDir = path.resolve('selenium_test');
    let actualContentLength = 22138949;
    let contentLength: number;

    beforeEach(() => {
      try {
        // if the folder does not exist, it will throw an error on statSync
        if (fs.statSync(outputDir).isDirectory()) {
          rimraf.sync(outputDir);
        }
      } catch (err) {
        // do nothing, the directory does not exist
      }
      fs.mkdirSync(outputDir);
    });

    it('should download a file with mismatch content length', (done) => {
      contentLength = 0;
      Downloader.getFile(null, fileUrl, fileName, outputDir, contentLength)
          .then(result => {
            expect(result).toBeTruthy();
            let file = path.resolve(outputDir, fileName);
            let stat = fs.statSync(file);
            expect(stat.size).toEqual(actualContentLength);
            rimraf.sync(file);
            done();
          })
          .catch(error => {
            console.log(error);
            done.fail();
          });
    });

    it('should not download a file if the content lengths match', (done) => {
      contentLength = actualContentLength;
      Downloader.getFile(null, fileUrl, fileName, outputDir, contentLength)
          .then(result => {
            expect(result).not.toBeTruthy();
            let file = path.resolve(outputDir, fileName);
            try {
              let access = fs.accessSync(file);
            } catch (err) {
              (err as any).code === 'ENOENT'
            }
            done();
          })
          .catch(error => {
            console.log(error);
            done.fail();
          });
    });
  });
});
