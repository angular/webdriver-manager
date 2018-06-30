import * as childProcess from 'child_process';
import * as path from 'path';
import { requestJson, requestRateLimit } from './github_json_utils';
import { spawnProcess } from '../../../spec/support/helpers/test_utils';

describe('github_json_utils', () => {
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

  describe('requestJson', () => {
    it('should download a json object file', async() => {
      let foo  = await requestJson('http://127.0.0.1:8812/spec/support/files/foo_json.json');
      let fooJson = JSON.parse(foo);
      expect(fooJson["foo"]).toBe("abc");
      expect(fooJson["bar"]).toBe(123);
    });

    it('should download a json array file', async() => {
      let foo  = await requestJson('http://127.0.0.1:8812/spec/support/files/foo_array.json');
      let fooJson = JSON.parse(foo);
      expect(fooJson.length).toBe(3);
      expect(fooJson[0]['foo']).toBe('abc');
      expect(fooJson[1]['foo']).toBe('def');
      expect(fooJson[2]['foo']).toBe('ghi');
    });
  });
});