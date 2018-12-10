
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

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
  });

  describe('with a http server', () => {
    beforeAll(async () => {
      proc = spawnProcess('node', ['dist/spec/server/http_server.js']);
      log.debug('http-server: ' + proc.pid);
      await new Promise((resolve, _) => {
        setTimeout(resolve, 3000);
      });
    });

    afterAll(async () => {
      process.kill(proc.pid);
      await new Promise((resolve, _) => {
        setTimeout(resolve, 5000);
      });
    });

    describe('updateXml', () => {
      const fileName = path.resolve(tmpDir, 'foo.xml');
      const xmlUrl = httpBaseUrl + '/spec/support/files/foo.xml';

      beforeAll(() => {
        try {
          fs.mkdirSync(tmpDir);
        } catch (_) {
          // If the directory already exists, we are in the desired state.
        }
        try {
          fs.unlinkSync(fileName);
        } catch (_) {
          // If the file does not exist, we are in the desired state.
        }
      });

      afterAll(() => {
        try {
          fs.unlinkSync(fileName);
          fs.rmdirSync(tmpDir);
        } catch (_) {
        }
      });

      it('should request and write the file if it does not exist', async () => {
        try {
          fs.statSync(fileName);
          expect('file should not exist.').toBeFalsy();
        } catch (_) {
          try {
            const xmlContent = await updateXml(xmlUrl, {fileName});
            expect(fs.statSync(fileName).size).toBeGreaterThan(0);
            expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
                .toBe('2.0/foobar.zip');
          } catch (_) {
            expect('thrown error from update xml.').toBeFalsy();
          }
        }
      });

      it('should request and write the file if it is expired', async () => {
        try {
          // try to create the file before trying to calling fs.statSync.
          fs.closeSync(fs.openSync(path.resolve(fileName), 'w'));
        } catch (_) {
          // If the file already exists, do nothing.
        }

        const mtime = Date.now() - (60 * 60 * 1000) - 5000;
        const initialStats = fs.statSync(fileName);

        // Maintain the fs.statSync method before being spyed on.
        // Spy on the fs.statSync method and return fake values.
        const fsStatSync = fs.statSync;
        spyOn(fs, 'statSync').and.returnValue({size: 1000, mtime});

        try {
          const xmlContent = await updateXml(xmlUrl, {fileName});
          expect(fsStatSync(fileName).size).toBeGreaterThan(0);
          expect(fsStatSync(fileName).size).not.toBe(1000);
          expect(fsStatSync(fileName).mtime.getMilliseconds())
              .toBeGreaterThan(initialStats.mtime.getMilliseconds());
          expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
              .toBe('2.0/foobar.zip');
        } catch (_) {
          expect('debugging required').toBeFalsy();
        }
      });

      it('should read the file when it is not expired', async () => {
        const initialStats = fs.statSync(fileName);
        const mtime = Date.now();

        // Maintain the fs.statSync method before being spyed on.
        // Spy on the fs.statSync method and return fake values.
        const fsStatSync = fs.statSync;
        spyOn(fs, 'statSync').and.returnValue({size: 1000, mtime});

        try {
          const xmlContent = await updateXml(xmlUrl, {fileName});
          expect(fsStatSync(fileName).size).toBe(initialStats.size);
          expect(fsStatSync(fileName).mtime.getMilliseconds())
              .toBe(initialStats.mtime.getMilliseconds());
          expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
              .toBe('2.0/foobar.zip');
        } catch (_) {
          expect('debugging required').toBeFalsy();
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
});