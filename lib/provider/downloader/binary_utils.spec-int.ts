import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { requestBinary } from './binary_utils';
import { spawnProcess } from '../../../spec/support/helpers/test_utils';

const tmpDir = path.resolve(os.tmpdir(), 'test');
const fileName = path.resolve(tmpDir, 'bar.zip');
const binaryUrl = 'http://127.0.0.1:8812/spec/support/files/bar.zip';
const barZipSize = 171;
const barSize = 30;

describe('binary_utils', () => {
  let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  let proc: childProcess.ChildProcess;

  beforeAll((done) => {  
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    proc = spawnProcess('node', ['dist/spec/server/http_server.js']);
    console.log('http-server: ' + proc.pid);
    setTimeout(done, 3000);

    try {
      fs.mkdirSync(tmpDir);
    } catch (err) {}
    try {
      fs.unlinkSync(fileName);
    } catch (err) {}
  });

  afterAll((done) => {
    try {
      fs.unlinkSync(fileName);
      fs.rmdirSync(tmpDir);
    } catch (err) {}

    spawnProcess('kill', ['-TERM', proc.pid.toString()]);
    setTimeout(done, 5000);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
  });

  describe('requestBinary', () => {
    it('should download the file if no file exists or ' +
        'the content lenght is different', (done) => {
      requestBinary(binaryUrl, fileName, 0).then((result) => {
        expect(result).toBeTruthy();
        expect(fs.statSync(fileName).size).toBe(barZipSize);
        done();
      }).catch(err => {
        done.fail(err);
      });
    });

    it('should not download the file if the file exists', (done) => {
      requestBinary(binaryUrl, fileName, barZipSize).then((result) => {
        expect(result).toBeFalsy();
        expect(fs.statSync(fileName).size).toBe(barZipSize);
        done();
      }).catch(err => {
        done.fail(err);
      });
    });
  });
});