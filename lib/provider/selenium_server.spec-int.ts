import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {checkConnectivity} from '../../spec/support/helpers/test_utils';
import {SeleniumServer, semanticVersionParser, versionParser} from './selenium_server';
import {convertXmlToVersionList} from './utils/cloud_storage_xml';
import {getVersion} from './utils/version_list';

describe('selenium_server', () => {
  describe('class Selenium Server', () => {
    const tmpDir = path.resolve(os.tmpdir(), 'test');
    const origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

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

    it('should download the file', async () => {
      if (await checkConnectivity('update binary for mac test')) {
        const seleniumServer = new SeleniumServer({outDir: tmpDir});
        await seleniumServer.updateBinary();
  
        const configFile = path.resolve(tmpDir, 'selenium-server.config.json');
        const xmlFile = path.resolve(tmpDir, 'selenium-server.xml');
        expect(fs.statSync(configFile).size).toBeTruthy();
        expect(fs.statSync(xmlFile).size).toBeTruthy();
  
        const versionList = convertXmlToVersionList(
            xmlFile, 'selenium-server-standalone', versionParser,
            semanticVersionParser);
        const versionObj = getVersion(versionList, '');
        const executableFile = path.resolve(
            tmpDir, 'selenium-server-standalone-' + versionObj.version + '.jar');
        expect(fs.statSync(executableFile).size).toBeTruthy();  
      }
    });
  });
});