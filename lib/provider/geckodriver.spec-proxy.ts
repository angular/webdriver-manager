import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as log from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {proxyBaseUrl} from '../../spec/server/env';
import {spawnProcess} from '../../spec/support/helpers/test_utils';
import {checkConnectivity} from '../../spec/support/helpers/test_utils';
import {GeckoDriver} from './geckodriver';
import {convertJsonToVersionList} from './utils/github_json';
import {getVersion} from './utils/version_list';

log.setLevel('debug');

describe('geckodriver', () => {
  const tmpDir = path.resolve(os.tmpdir(), 'test');

  describe('class GeckoDriver', () => {
    const origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    let proxyProc: childProcess.ChildProcess;

    describe('updateBinary', () => {
      beforeEach((done) => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        proxyProc = spawnProcess('node', ['dist/spec/server/proxy_server.js']);
        log.debug('proxy-server: ' + proxyProc.pid);
        try {
          fs.mkdirSync(tmpDir);
        } catch (err) {
        }
        setTimeout(done, 3000);
      });

      afterEach((done) => {
        process.kill(proxyProc.pid);
        jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
        try {
          rimraf.sync(tmpDir);
        } catch (err) {
        }
        setTimeout(done, 5000);
      });

      it('should download the binary using a proxy', async (done) => {
        if (!await checkConnectivity('update binary for mac test')) {
          done();
        }
        const geckoDriver = new GeckoDriver(
            {outDir: tmpDir, osType: 'Darwin', proxy: proxyBaseUrl});
        await geckoDriver.updateBinary();

        const configFile = path.resolve(tmpDir, 'geckodriver.config.json');
        const jsonFile = path.resolve(tmpDir, 'geckodriver.json');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(jsonFile).size).toBeTruthy();

        const versionList = convertJsonToVersionList(jsonFile);
        const versionObj = getVersion(versionList, 'macos');
        const executableFile =
            path.resolve(tmpDir, 'geckodriver_' + versionObj.version);
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });
    });
  });
});