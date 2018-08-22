import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {
  SeleniumServer,
  semanticVersionParser,
  versionParser
} from './selenium_server';
import { convertXmlToVersionList } from './utils/cloud_storage_xml';
import { getVersion } from './utils/version_list';
import { checkConnectivity } from '../../spec/support/helpers/test_utils';

describe('selenium_server', () => {
  describe('class Selenium Server', () => {
    let tmpDir = path.resolve(os.tmpdir(), 'test');
    let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

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

    it('should download the file', async(done) => {
      if (!await checkConnectivity('update binary for mac test')) {
        done();
      }
      let seleniumServer = new SeleniumServer(
        { outDir: tmpDir });
      await seleniumServer.updateBinary();

      let configFile = path.resolve(tmpDir, 'selenium-server.config.json');
      let xmlFile = path.resolve(tmpDir, 'selenium-server.xml');
      expect(fs.statSync(configFile).size).toBeTruthy();
      expect(fs.statSync(xmlFile).size).toBeTruthy();

      let versionList = convertXmlToVersionList(xmlFile,
        'selenium-server-standalone', versionParser, semanticVersionParser);
      let versionObj = getVersion(versionList, '');
      let executableFile = path.resolve(tmpDir,
        'selenium-server-standalone-' + versionObj.version + '.jar');
      expect(fs.statSync(executableFile).size).toBeTruthy();
      done();
    });
  });
});