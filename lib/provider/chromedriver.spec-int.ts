import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { convertXmlToVersionList, ChromeDriver } from './chromedriver';

describe('chromedriver', () => {
  describe('convertXmlToVersionList', () => {
    it('should convert an xml file an object from the xml file', () => {
      let versionList = convertXmlToVersionList('spec/support/files/chromedriver.xml');
      expect(Object.keys(versionList).length).toBe(3);
      expect(versionList['2.0.0']).toBeTruthy();
      expect(versionList['2.10.0']).toBeTruthy();
      expect(versionList['2.20.0']).toBeTruthy();
      expect(Object.keys(versionList['2.0.0']).length).toBe(4);
      expect(Object.keys(versionList['2.10.0']).length).toBe(4);
      expect(Object.keys(versionList['2.20.0']).length).toBe(4);
      expect(versionList['2.0.0']['chromedriver_linux32.zip']['size']).toBe(7262134);
      expect(versionList['2.10.0']['chromedriver_linux32.zip']['size']).toBe(2439424);
      expect(versionList['2.20.0']['chromedriver_linux32.zip']['size']).toBe(2612186);
    });

    it('should return a null value if the file does not exist', () => {
      let versionList = convertXmlToVersionList('spec/support/files/does_not_exist.xml');
      expect(versionList).toBeNull();
    });
  });

  describe('updateBinary', () => {
    let outDir: string;
    beforeEach(() => {
      outDir = path.resolve(os.tmpdir(), 'selenium');
    });

    afterEach(() => {
      try {
        rimraf.sync(path.resolve(outDir, 'chromedriver*'));
        fs.rmdirSync(outDir);
      } catch (err) {}
    });

    it('download the binary', async() => {
      let chromeDriver = new ChromeDriver();
      chromeDriver.outDir = outDir;
      await chromeDriver.updateBinary();
    });
  });
});