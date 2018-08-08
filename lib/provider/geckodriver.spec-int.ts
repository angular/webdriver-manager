import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { GeckoDriver } from './geckodriver';
import { convertJsonToVersionList } from './utils/github_json';
import { getVersion } from './utils/version_list';
import { checkConnectivity } from '../../spec/support/helpers/test_utils';

describe('geckodriver', () => {
  let tmpDir = path.resolve(os.tmpdir(), 'test');
  let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  
  describe('class GeckoDriver', () => {
    describe('updateBinary', () => {
      beforeEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        try {
          fs.mkdirSync(tmpDir);
        } catch (err) {}
      });
    
      afterEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
        try {
          rimraf.sync(tmpDir);
        } catch (err) {}
      });

      it('should download the latest for MacOS',  async(done) => {
        if (!await checkConnectivity('update binary for mac test')) {
          done();
        }
        let geckodriver = new GeckoDriver(
          { outDir: tmpDir, osType: 'Darwin' });
        await geckodriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'geckodriver.config.json');
        let jsonFile = path.resolve(tmpDir, 'geckodriver.json');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(jsonFile).size).toBeTruthy();

        let versionList = convertJsonToVersionList(jsonFile);
        let versionObj = getVersion(versionList, 'macos');
        let executableFile = path.resolve(tmpDir,
          'geckodriver_' + versionObj.version);
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });

      it('should download the latest for Windows x64',  async(done) => {
        if (!await checkConnectivity('update binary for win64 test')) {
          done();
        }
        let geckodriver = new GeckoDriver();
        geckodriver.outDir = tmpDir;
        geckodriver.osType = 'Windows_NT';
        geckodriver.osArch = 'x64';
        await geckodriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'geckodriver.config.json');
        let jsonFile = path.resolve(tmpDir, 'geckodriver.json');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(jsonFile).size).toBeTruthy();

        let versionList = convertJsonToVersionList(jsonFile);
        let versionObj = getVersion(versionList, 'win64');
        let executableFile = path.resolve(tmpDir,
          'geckodriver_' + versionObj.version + '.exe');
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });

      it('should download the latest for Windows x32',  async(done) => {
        if (!await checkConnectivity('update binary for win32 test')) {
          done();
        }
        let geckodriver = new GeckoDriver();
        geckodriver.outDir = tmpDir;
        geckodriver.osType = 'Windows_NT';
        geckodriver.osArch = 'x32';
        await geckodriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'geckodriver.config.json');
        let jsonFile = path.resolve(tmpDir, 'geckodriver.json');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(jsonFile).size).toBeTruthy();

        let versionList = convertJsonToVersionList(jsonFile);
        let versionObj = getVersion(versionList, 'win64');
        let executableFile = path.resolve(tmpDir,
          'geckodriver_' + versionObj.version + '.exe');
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });

      it('should download the latest for Linux x64',  async(done) => {
        if (!await checkConnectivity('update binary for linux64 test')) {
          done();
        }
        let geckodriver = new GeckoDriver();
        geckodriver.outDir = tmpDir;
        geckodriver.osType = 'Linux';
        geckodriver.osArch = 'x64';
        await geckodriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'geckodriver.config.json');
        let jsonFile = path.resolve(tmpDir, 'geckodriver.json');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(jsonFile).size).toBeTruthy();

        let versionList = convertJsonToVersionList(jsonFile);
        let versionObj = getVersion(versionList, 'linux64');
        let executableFile = path.resolve(tmpDir,
          'geckodriver_' + versionObj.version);
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });

      it('should download the latest for Linux x32',  async(done) => {
        if (!await checkConnectivity('update binary for linux32 test')) {
          done();
        }
        let geckodriver = new GeckoDriver();
        geckodriver.outDir = tmpDir;
        geckodriver.osType = 'Linux';
        geckodriver.osArch = 'x32';
        await geckodriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'geckodriver.config.json');
        let jsonFile = path.resolve(tmpDir, 'geckodriver.json');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(jsonFile).size).toBeTruthy();

        let versionList = convertJsonToVersionList(jsonFile);
        let versionObj = getVersion(versionList, 'linux32');
        let executableFile = path.resolve(tmpDir,
          'geckodriver_' + versionObj.version);
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });
    });
  });
});