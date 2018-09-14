
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as loglevel from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import {httpBaseUrl} from '../../../spec/server/env';
import {spawnProcess} from '../../../spec/support/helpers/test_utils';
import {convertXmlToVersionList, updateXml} from './cloud_storage_xml';

const log = loglevel.getLogger('webdriver-manager-test');
log.setLevel('debug');

function chromedriverVersionParser(key: string): string {
  const regex = /([0-9]*.[0-9]*)\/chromedriver_.*.zip/g;
  try {
    return regex.exec(key)[1];
  } catch (_) {
    return null;
  }
}

function chromedriverSemanticVersionParser(key: string): string {
  const regex = /([0-9]*.[0-9]*)\/chromedriver_.*.zip/g;
  try {
    return regex.exec(key)[1] + '.0';
  } catch (_) {
    return null;
  }
}

describe('cloud_storage_xml', () => {
  const tmpDir = path.resolve(os.tmpdir(), 'test');
  let proc: childProcess.ChildProcess;
  const origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    proc = spawnProcess('node', ['dist/spec/server/http_server.js']);
    log.debug('http-server: ' + proc.pid);
    setTimeout(done, 3000);
  });

  afterAll((done) => {
    process.kill(proc.pid);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
    setTimeout(done, 5000);
  });

  describe('updateXml', () => {
    const fileName = path.resolve(tmpDir, 'foo.xml');
    const xmlUrl = httpBaseUrl + '/spec/support/files/foo.xml';

    beforeAll(() => {
      try {
        fs.mkdirSync(tmpDir);
      } catch (err) {
      }
      try {
        fs.unlinkSync(fileName);
      } catch (err) {
      }
    });

    afterAll(() => {
      try {
        fs.unlinkSync(fileName);
        fs.rmdirSync(tmpDir);
      } catch (err) {
      }
    });

    it('should request and write the file if it does not exist', (done) => {
      try {
        fs.statSync(fileName);
        done.fail('file should not exist.');
      } catch (err) {
        updateXml(xmlUrl, {fileName})
            .then(xmlContent => {
              expect(fs.statSync(fileName).size).toBeGreaterThan(0);
              expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
                  .toBe('2.0/foobar.zip');
              done();
            })
            .catch(_ => {
              done.fail('thrown error from update xml');
            });
      }
    });

    it('should request and write the file if it is expired', (done) => {
      const mtime = Date.now() - (60 * 60 * 1000) - 5000;
      const initialStats = fs.statSync(fileName);

      // Maintain the fs.statSync method before being spyed on.
      // Spy on the fs.statSync method and return fake values.
      const fsStatSync = fs.statSync;
      spyOn(fs, 'statSync').and.returnValue({size: 1000, mtime});

      try {
        updateXml(xmlUrl, {fileName})
            .then(xmlContent => {
              expect(fsStatSync(fileName).size).toBeGreaterThan(0);
              expect(fsStatSync(fileName).size).not.toBe(1000);
              expect(fsStatSync(fileName).mtime.getMilliseconds())
                  .toBeGreaterThan(initialStats.mtime.getMilliseconds());
              expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
                  .toBe('2.0/foobar.zip');
              done();
            })
            .catch(_ => {
              done.fail('thrown error from update xml');
            });
      } catch (err) {
        done.fail('debugging required');
      }
    });

    it('should read the file when it is not expired', (done) => {
      const initialStats = fs.statSync(fileName);
      const mtime = Date.now();

      // Maintain the fs.statSync method before being spyed on.
      // Spy on the fs.statSync method and return fake values.
      const fsStatSync = fs.statSync;
      spyOn(fs, 'statSync').and.returnValue({size: 1000, mtime});

      try {
        updateXml(xmlUrl, {fileName})
            .then(xmlContent => {
              expect(fsStatSync(fileName).size).toBe(initialStats.size);
              expect(fsStatSync(fileName).mtime.getMilliseconds())
                  .toBe(initialStats.mtime.getMilliseconds());
              expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
                  .toBe('2.0/foobar.zip');
              done();
            })
            .catch(err => {
              done.fail('thrown error from update xml');
            });
      } catch (err) {
        done.fail('debugging required');
      }
    });
  });

  describe('convertXmlToVersionList', () => {
    const fileName = 'spec/support/files/chromedriver.xml';

    it('should convert an xml file an object from the xml file', () => {
      const versionList = convertXmlToVersionList(
          fileName, '.zip', chromedriverVersionParser,
          chromedriverSemanticVersionParser);
      expect(Object.keys(versionList).length).toBe(3);
      expect(versionList['2.0.0']).toBeTruthy();
      expect(versionList['2.10.0']).toBeTruthy();
      expect(versionList['2.20.0']).toBeTruthy();
      expect(Object.keys(versionList['2.0.0']).length).toBe(4);
      expect(Object.keys(versionList['2.10.0']).length).toBe(4);
      expect(Object.keys(versionList['2.20.0']).length).toBe(4);
      expect(versionList['2.0.0']['chromedriver_linux32.zip']['size'])
          .toBe(7262134);
      expect(versionList['2.10.0']['chromedriver_linux32.zip']['size'])
          .toBe(2439424);
      expect(versionList['2.20.0']['chromedriver_linux32.zip']['size'])
          .toBe(2612186);
    });

    it('should return a null value if the file does not exist', () => {
      const versionList = convertXmlToVersionList(
          'spec/support/files/does_not_exist.xml', '.zip',
          chromedriverVersionParser, chromedriverSemanticVersionParser);
      expect(versionList).toBeNull();
    });
  });
});