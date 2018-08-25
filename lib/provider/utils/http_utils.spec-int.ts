import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as log from 'loglevel';
import * as os from 'os';
import * as path from 'path';

import {httpBaseUrl} from '../../../spec/server/env';
import {spawnProcess} from '../../../spec/support/helpers/test_utils';
import {requestBinary, requestBody} from './http_utils';

log.setLevel('debug');

const tmpDir = path.resolve(os.tmpdir(), 'test');
const fileName = path.resolve(tmpDir, 'bar.zip');
const binaryUrl = httpBaseUrl + '/spec/support/files/bar.zip';
const fooJsonUrl = httpBaseUrl + '/spec/support/files/foo_json.json';
const fooArrayUrl = httpBaseUrl + '/spec/support/files/foo_array.json';
const fooXmlUrl = httpBaseUrl + '/spec/support/files/foo.xml';
const barZipSize = 171;

describe('binary_utils', () => {
  const origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  let proc: childProcess.ChildProcess;

  beforeAll((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    proc = spawnProcess('node', ['dist/spec/server/http_server.js']);
    log.debug('http-server: ' + proc.pid);
    setTimeout(done, 3000);

    try {
      fs.mkdirSync(tmpDir);
    } catch (err) {
    }
    try {
      fs.unlinkSync(fileName);
    } catch (err) {
    }
  });

  afterAll((done) => {
    try {
      fs.unlinkSync(fileName);
      fs.rmdirSync(tmpDir);
    } catch (err) {
    }

    process.kill(proc.pid);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
    setTimeout(done, 5000);
  });

  describe('requestBinary', () => {
    it('should download the file if no file exists or ' +
           'the content lenght is different',
       (done) => {
         requestBinary(binaryUrl, {fileName, fileSize: 0})
             .then((result) => {
               expect(result).toBeTruthy();
               expect(fs.statSync(fileName).size).toBe(barZipSize);
               done();
             })
             .catch(err => {
               done.fail(err);
             });
       });

    it('should not download the file if the file exists', (done) => {
      requestBinary(binaryUrl, {fileName, fileSize: barZipSize})
          .then((result) => {
            expect(result).toBeFalsy();
            expect(fs.statSync(fileName).size).toBe(barZipSize);
            done();
          })
          .catch(err => {
            done.fail(err);
          });
    });
  });

  describe('requestBody', () => {
    it('should download a json object file', async () => {
      const foo = await requestBody(fooJsonUrl, {});
      const fooJson = JSON.parse(foo);
      expect(fooJson['foo']).toBe('abc');
      expect(fooJson['bar']).toBe(123);
    });

    it('should download a json array file', async () => {
      const foo = await requestBody(fooArrayUrl, {});
      const fooJson = JSON.parse(foo);
      expect(fooJson.length).toBe(3);
      expect(fooJson[0]['foo']).toBe('abc');
      expect(fooJson[1]['foo']).toBe('def');
      expect(fooJson[2]['foo']).toBe('ghi');
    });

    it('should get the xml file', async () => {
      const text = await requestBody(fooXmlUrl, {});
      expect(text.length).toBeGreaterThan(0);
    });
  });
});