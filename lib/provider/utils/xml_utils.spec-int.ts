
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as xmlUtils from './xml_utils';
import { spawnProcess } from '../../../spec/support/helpers/test_utils';

describe('xmlUtils', () => {
  let tmpDir = path.resolve(os.tmpdir(), 'test');
  let proc: childProcess.ChildProcess;
  let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    proc = spawnProcess('node', ['dist/spec/server/http_server.js']);
    console.log('http-server: ' + proc.pid);
    setTimeout(done, 3000);
  });

  afterAll((done) => {
    spawnProcess('kill', ['-TERM', proc.pid.toString()]);
    setTimeout(done, 5000);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
  });

  describe('requestXml', () => {
    it('should get the xml file', async() => {
      let text = await xmlUtils.requestXml(
          'http://127.0.0.1:8812/spec/support/files/foo.xml',
          'foo.xml');
      expect(text.length).toBeGreaterThan(0);
    });
  });

  describe('updateXml', () => {
    let fileName = path.resolve(tmpDir, 'foo.xml');
    let xmlUrl = 'http://127.0.0.1:8812/spec/support/files/foo.xml';

    beforeAll(() => {
      try {
        fs.mkdirSync(tmpDir);
      } catch (err) {}
      try {
        fs.unlinkSync(fileName);
      } catch (err) {}
    });

    afterAll(() => {
      try {
        fs.unlinkSync(fileName);
        fs.rmdirSync(tmpDir);
      } catch (err) {}
    });

    it('should request and write the file if it does not exist', (done) => {
      try {
        fs.statSync(fileName);
        done.fail('file should not exist.');
      } catch (err) {
        xmlUtils.updateXml(xmlUrl, fileName).then(xmlContent => {
          expect(fs.statSync(fileName).size).toBeGreaterThan(0);
          expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
            .toBe('2.0/foobar.zip');
          done();
        }).catch(err => {
          done.fail('thrown error from update xml');
        });
      }
    });

    it('should request and write the file if it is expired', (done) => {
      let mtime = Date.now() - (60 * 60 * 1000) - 5000;
      let initialStats = fs.statSync(fileName);

      // Maintain the fs.statSync method before being spyed on.
      // Spy on the fs.statSync method and return fake values.
      let fsStatSync = fs.statSync;
      spyOn(fs, 'statSync').and.returnValue({size: 1000, mtime: mtime});

      try {
        xmlUtils.updateXml(xmlUrl, fileName).then(xmlContent => {
          expect(fsStatSync(fileName).size).toBeGreaterThan(0);
          expect(fsStatSync(fileName).size).not.toBe(1000);
          expect(fsStatSync(fileName).mtime.getMilliseconds())
            .toBeGreaterThan(initialStats.mtime.getMilliseconds());
          expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
            .toBe('2.0/foobar.zip');
          done();
        }).catch(err => {
          done.fail('thrown error from update xml');
        });
      } catch (err) {
        done.fail('debugging required');
      }
    });

    it('should read the file when it is not expired', (done) => {
      let initialStats = fs.statSync(fileName);
      let mtime = Date.now();

      // Maintain the fs.statSync method before being spyed on.
      // Spy on the fs.statSync method and return fake values.
      let fsStatSync = fs.statSync;
      spyOn(fs, 'statSync').and.returnValue({size: 1000, mtime: mtime});

      try {
        xmlUtils.updateXml(xmlUrl, fileName).then(xmlContent => {
          expect(fsStatSync(fileName).size).toBe(initialStats.size);
          expect(fsStatSync(fileName).mtime.getMilliseconds())
            .toBe(initialStats.mtime.getMilliseconds());
          expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
            .toBe('2.0/foobar.zip');
          done();
        }).catch(err => {
          done.fail('thrown error from update xml');
        });
      } catch (err) {
        done.fail('debugging required');
      }
    });
  });
});