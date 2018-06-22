import { convertXmlToVersionList, osHelper } from './chromedriver';

describe('chromedriver', () => {
  describe('convertXmlToVersionList', () => {
    it ('should convert an xml file an object from the xml file', () => {
      let versionList = convertXmlToVersionList('spec/support/files/chromedriver.xml');
      expect(Object.keys(versionList).length).toBe(3);
      expect(versionList['2.0.0']).toBeTruthy();
      expect(versionList['2.10.0']).toBeTruthy();
      expect(versionList['2.20.0']).toBeTruthy();
      expect(Object.keys(versionList['2.0.0']).length).toBe(4);
      expect(Object.keys(versionList['2.10.0']).length).toBe(4);
      expect(Object.keys(versionList['2.20.0']).length).toBe(4);
      expect(versionList['2.0.0']['2.0/chromedriver_linux32.zip']).toBe(7262134);
      expect(versionList['2.10.0']['2.10/chromedriver_linux32.zip']).toBe(2439424);
      expect(versionList['2.20.0']['2.20/chromedriver_linux32.zip']).toBe(2612186);
    });

    it('should return a null value if the file does not exist', () => {
      let versionList = convertXmlToVersionList('spec/support/files/does_not_exist.xml');
      expect(versionList).toBeNull();
    });
  });
});