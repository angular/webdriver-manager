import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {Downloader} from '../../lib/files';

describe('downloader', () => {
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

    xit('should download a file with mismatch content length', (done) => {
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
