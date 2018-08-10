import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { requestBinary, requestBody } from './http_utils';
import { httpBaseUrl, proxyBaseUrl } from '../../../spec/server/env';
import { spawnProcess } from '../../../spec/support/helpers/test_utils';

const tmpDir = path.resolve(os.tmpdir(), 'test');
const fileName = path.resolve(tmpDir, 'bar.zip');
const binaryUrl = proxyBaseUrl + '/spec/support/files/bar.zip';
const fooJsonUrl = proxyBaseUrl + '/spec/support/files/foo_json.json';
const fooArrayUrl = proxyBaseUrl + '/spec/support/files/foo_array.json';
const fooXmlUrl = proxyBaseUrl + '/spec/support/files/foo.xml';
const barZipSize = 171;
const headers = {'host': httpBaseUrl};

describe('binary_utils', () => {
  let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  let httpProc: childProcess.ChildProcess;
  let proxyProc: childProcess.ChildProcess;

  beforeAll((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    httpProc = spawnProcess('node', ['dist/spec/server/http_server.js']);
    console.log('http-server: ' + httpProc.pid);
    proxyProc = spawnProcess('node', ['dist/spec/server/proxy_server.js']);
    console.log('proxy-server: ' + proxyProc.pid);
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

    process.kill(httpProc.pid);
    process.kill(proxyProc.pid);
    setTimeout(done, 5000);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
  });

  describe('requestBinary', () => {
    it('should download the file if no file exists or ' +
        'the content lenght is different', (done) => {
      requestBinary(binaryUrl,
          { fileName, fileSize: 0, headers }).then((result) => {
        expect(result).toBeTruthy();
        expect(fs.statSync(fileName).size).toBe(barZipSize);
        done();
      }).catch(err => {
        done.fail(err);
      });
    });

    it('should not download the file if the file exists', (done) => {
      requestBinary(binaryUrl,
          { fileName, fileSize: barZipSize, headers }).then((result) => {
        expect(result).toBeFalsy();
        expect(fs.statSync(fileName).size).toBe(barZipSize);
        done();
      }).catch(err => {
        done.fail(err);
      });
    });
  });

  describe('requestBody', () => {
    it('should download a json object file', async() => {
      let foo  = await requestBody(fooJsonUrl, { headers });
      let fooJson = JSON.parse(foo);
      expect(fooJson["foo"]).toBe("abc");
      expect(fooJson["bar"]).toBe(123);
    });

    it('should download a json array file', async() => {
      let foo  = await requestBody(fooArrayUrl, { headers });
      let fooJson = JSON.parse(foo);
      expect(fooJson.length).toBe(3);
      expect(fooJson[0]['foo']).toBe('abc');
      expect(fooJson[1]['foo']).toBe('def');
      expect(fooJson[2]['foo']).toBe('ghi');
    });

    it('should get the xml file', async() => {
      let text = await requestBody(fooXmlUrl, { headers });
      expect(text.length).toBeGreaterThan(0);
    });
  });
});