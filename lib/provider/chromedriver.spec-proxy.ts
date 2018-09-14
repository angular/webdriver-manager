import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as loglevel from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {proxyBaseUrl} from '../../spec/server/env';
import {spawnProcess} from '../../spec/support/helpers/test_utils';
import {checkConnectivity} from '../../spec/support/helpers/test_utils';
import {ChromeDriver, semanticVersionParser, versionParser} from './chromedriver';
import {convertXmlToVersionList} from './utils/cloud_storage_xml';
import {getVersion} from './utils/version_list';

const log = loglevel.getLogger('webdriver-manager-test');
log.setLevel('debug');

describe('chromedriver', () => {
  const tmpDir = path.resolve(os.tmpdir(), 'test');

  describe('class ChromeDriver', () => {
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
        const chromeDriver = new ChromeDriver({
          ignoreSSL: true,
          osType: 'Darwin',
          osArch: 'x64',
          outDir: tmpDir,
          proxy: proxyBaseUrl
        });
        await chromeDriver.updateBinary();
        const configFile = path.resolve(tmpDir, 'chromedriver.config.json');
        const xmlFile = path.resolve(tmpDir, 'chromedriver.xml');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(xmlFile).size).toBeTruthy();

        const versionList = convertXmlToVersionList(
            xmlFile, '.zip', versionParser, semanticVersionParser);
        const versionObj = getVersion(versionList, 'mac');
        const executableFile =
            path.resolve(tmpDir, 'chromedriver_' + versionObj.version);
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });
    });
  });
});