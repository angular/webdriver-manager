import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {
  ChromeDriver,
  semanticVersionParser,
  versionParser
} from './chromedriver';
import { convertXmlToVersionList } from './utils/cloud_storage_xml';
import { getVersion } from './utils/version_list';
import { checkConnectivity } from '../../spec/support/helpers/test_utils';

describe('chromedriver', () => {
  let tmpDir = path.resolve(os.tmpdir(), 'test');

  describe('class ChromeDriver', () => {
    let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

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
        let chromedriver = new ChromeDriver(
          { outDir: tmpDir, osType: 'Darwin' });
        await chromedriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'chromedriver.config.json');
        let xmlFile = path.resolve(tmpDir, 'chromedriver.xml');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(xmlFile).size).toBeTruthy();

        let versionList = convertXmlToVersionList(xmlFile, '.zip',
          versionParser, semanticVersionParser);
        let versionObj = getVersion(versionList, 'mac');
        let executableFile = path.resolve(tmpDir,
          'chromedriver_' + versionObj.version);
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });

      it('should download the latest for Windows x64',  async(done) => {
        if (!await checkConnectivity('update binary for win x64 test')) {
          done();
        }
        let chromedriver = new ChromeDriver(
          { outDir: tmpDir, osType: 'Windows_NT', osArch: 'x64'});
        await chromedriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'chromedriver.config.json');
        let xmlFile = path.resolve(tmpDir, 'chromedriver.xml');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(xmlFile).size).toBeTruthy();

        let versionList = convertXmlToVersionList(xmlFile, '.zip',
          versionParser, semanticVersionParser);
        let versionObj = getVersion(versionList, 'win32');
        let executableFile = path.resolve(tmpDir,
          'chromedriver_' + versionObj.version + '.exe');
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });

      it('should download the latest for Windows x32',  async(done) => {
        if (!await checkConnectivity('update binary for win x32 test')) {
          done();
        }
        let chromedriver = new ChromeDriver(
          { outDir: tmpDir, osType: 'Windows_NT', osArch: 'x32'});
        await chromedriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'chromedriver.config.json');
        let xmlFile = path.resolve(tmpDir, 'chromedriver.xml');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(xmlFile).size).toBeTruthy();

        let versionList = convertXmlToVersionList(xmlFile, '.zip',
          versionParser, semanticVersionParser);
        let versionObj = getVersion(versionList, 'win32');
        let executableFile = path.resolve(tmpDir,
          'chromedriver_' + versionObj.version + '.exe');
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });

      it('should download the latest for Linux x64',  async(done) => {
        if (!await checkConnectivity('update binary for linux x64 test')) {
          done();
        }
        let chromedriver = new ChromeDriver(
          { outDir: tmpDir, osType: 'Linux', osArch: 'x64'});
        await chromedriver.updateBinary();

        let configFile = path.resolve(tmpDir, 'chromedriver.config.json');
        let xmlFile = path.resolve(tmpDir, 'chromedriver.xml');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(xmlFile).size).toBeTruthy();

        let versionList = convertXmlToVersionList(xmlFile, '.zip',
          versionParser, semanticVersionParser);
        let versionObj = getVersion(versionList, 'linux64');
        let executableFile = path.resolve(tmpDir,
          'chromedriver_' + versionObj.version);
        expect(fs.statSync(executableFile).size).toBeTruthy();
        done();
      });

      it('should not download for Linux x32', async(done) => {
        if (!await checkConnectivity('update binary for linux x32 test')) {
          done();
        }
        let chromedriver = new ChromeDriver(
          { outDir: tmpDir, osType: 'Linux', osArch: 'x32' });
        chromedriver.updateBinary().then(() => {
          done.fail();
        }).catch(() => {
          done();
        });
      });
    });
  });
});
