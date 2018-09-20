import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {checkConnectivity} from '../../spec/support/helpers/test_utils';
import {GeckoDriver} from './geckodriver';
import {convertJsonToVersionList} from './utils/github_json';
import {getVersion} from './utils/version_list';

describe('geckodriver', () => {
  const tmpDir = path.resolve(os.tmpdir(), 'test');
  const origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  describe('class GeckoDriver', () => {
    describe('updateBinary', () => {
      beforeAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
      });

      afterAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
      });

      beforeEach(() => {
        try {
          fs.mkdirSync(tmpDir);
        } catch (err) {
        }
      });

      afterEach(() => {
        try {
          rimraf.sync(tmpDir);
        } catch (err) {
        }
      });

      it('should download the latest for MacOS', async () => {
        if (await checkConnectivity('update binary for mac test')) {
          const geckodriver = new GeckoDriver({outDir: tmpDir, osType: 'Darwin'});
          await geckodriver.updateBinary();
  
          const configFile = path.resolve(tmpDir, 'geckodriver.config.json');
          const jsonFile = path.resolve(tmpDir, 'geckodriver.json');
          expect(fs.statSync(configFile).size).toBeTruthy();
          expect(fs.statSync(jsonFile).size).toBeTruthy();
  
          const versionList = convertJsonToVersionList(jsonFile);
          const versionObj = getVersion(versionList, 'macos');
          const executableFile =
              path.resolve(tmpDir, 'geckodriver_' + versionObj.version);
          expect(fs.statSync(executableFile).size).toBeTruthy(); 
        }
      });

      it('should download the latest for Windows x64', async () => {
        if (await checkConnectivity('update binary for win64 test')) {
          const geckodriver = new GeckoDriver(
            {outDir: tmpDir, osType: 'Windows_NT', osArch: 'x64'});
          await geckodriver.updateBinary();

          const configFile = path.resolve(tmpDir, 'geckodriver.config.json');
          const jsonFile = path.resolve(tmpDir, 'geckodriver.json');
          expect(fs.statSync(configFile).size).toBeTruthy();
          expect(fs.statSync(jsonFile).size).toBeTruthy();

          const versionList = convertJsonToVersionList(jsonFile);
          const versionObj = getVersion(versionList, 'win64');
          const executableFile =
              path.resolve(tmpDir, 'geckodriver_' + versionObj.version + '.exe');
          expect(fs.statSync(executableFile).size).toBeTruthy();
        }
      });

      it('should download the latest for Windows x32', async () => {
        if (await checkConnectivity('update binary for win32 test')) {
          const geckodriver = new GeckoDriver(
            {outDir: tmpDir, osType: 'Windows_NT', osArch: 'x32'});
          await geckodriver.updateBinary();

          const configFile = path.resolve(tmpDir, 'geckodriver.config.json');
          const jsonFile = path.resolve(tmpDir, 'geckodriver.json');
          expect(fs.statSync(configFile).size).toBeTruthy();
          expect(fs.statSync(jsonFile).size).toBeTruthy();

          const versionList = convertJsonToVersionList(jsonFile);
          const versionObj = getVersion(versionList, 'win64');
          const executableFile =
              path.resolve(tmpDir, 'geckodriver_' + versionObj.version + '.exe');
          expect(fs.statSync(executableFile).size).toBeTruthy();
        }
      });

      it('should download the latest for Linux x64', async () => {
        if (await checkConnectivity('update binary for linux64 test')) {
          const geckodriver =
              new GeckoDriver({outDir: tmpDir, osType: 'Linux', osArch: 'x64'});
          await geckodriver.updateBinary();

          const configFile = path.resolve(tmpDir, 'geckodriver.config.json');
          const jsonFile = path.resolve(tmpDir, 'geckodriver.json');
          expect(fs.statSync(configFile).size).toBeTruthy();
          expect(fs.statSync(jsonFile).size).toBeTruthy();

          const versionList = convertJsonToVersionList(jsonFile);
          const versionObj = getVersion(versionList, 'linux64');
          const executableFile =
              path.resolve(tmpDir, 'geckodriver_' + versionObj.version);
          expect(fs.statSync(executableFile).size).toBeTruthy(); 
        }
      });

      it('should download the latest for Linux x32', async () => {
        if (await checkConnectivity('update binary for linux32 test')) {
          const geckodriver =
              new GeckoDriver({outDir: tmpDir, osType: 'Linux', osArch: 'x32'});
          await geckodriver.updateBinary();

          const configFile = path.resolve(tmpDir, 'geckodriver.config.json');
          const jsonFile = path.resolve(tmpDir, 'geckodriver.json');
          expect(fs.statSync(configFile).size).toBeTruthy();
          expect(fs.statSync(jsonFile).size).toBeTruthy();

          const versionList = convertJsonToVersionList(jsonFile);
          const versionObj = getVersion(versionList, 'linux32');
          const executableFile =
              path.resolve(tmpDir, 'geckodriver_' + versionObj.version);
          expect(fs.statSync(executableFile).size).toBeTruthy();  
        }
      });
    });
  });
});