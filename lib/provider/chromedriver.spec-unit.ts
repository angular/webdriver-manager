import * as xmlUtils from './downloader/xml_utils';
import { convertXmlToVersionList, getVersionObj, osHelper } from './chromedriver';
import { getVersion, VersionList } from './version_list';

const xmlJs = {
  'ListBucketResult': {
    '$': { xmlns: 'http://doc.s3.amazonaws.com/2006-03-01' },
    'Name': [ 'chrome_driver' ],
    'Contents': [{
      'Key': [ '2.0/chromedriver_linux32.zip' ],
      'Size': [ '7262134' ]
    }, {
      'Key': [ '2.0/chromedriver_linux64.zip' ],
      'Size': [ '7433593' ]
    }, {
      'Key': [ '2.0/chromedriver_mac32.zip' ],
      'Size': [ '7614601' ]
    }, {
      'Key': [ '2.0/chromedriver_win32.zip' ],
      'Size': [ '3048831' ]
    }, {
      'Key': [ '2.10/chromedriver_linux32.zip' ],
      'Size': [ '2439424' ]
    }, {
      'Key': [ '2.10/chromedriver_linux64.zip' ],
      'Size': [ '2301804' ]
    }, {
      'Key': [ '2.10/chromedriver_mac32.zip' ],
      'Size': [ '4116418' ]
    }, {
      'Key': [ '2.10/chromedriver_win32.zip' ],
      'Size': [ '2843903' ]
    }]
  },
};

describe('chromedriver', () => {
  describe('convertXmlToVersionList', () => {
    it ('should convert an xml file an object from the xml file', () => {
      spyOn(xmlUtils, 'readXml').and.returnValue(xmlJs);
      let versionList = convertXmlToVersionList('foo');
      expect(Object.keys(versionList).length).toBe(2);
      expect(versionList['2.0.0']).toBeTruthy();
      expect(versionList['2.10.0']).toBeTruthy();
      expect(Object.keys(versionList['2.0.0']).length).toBe(4);
      expect(Object.keys(versionList['2.10.0']).length).toBe(4);
      expect(versionList['2.0.0']['chromedriver_linux32.zip']['size']).toBe(7262134);
      expect(versionList['2.10.0']['chromedriver_linux32.zip']['size']).toBe(2439424);
    });

    it('should return null when the method to read an xml file returns null', () => {
      spyOn(xmlUtils, 'readXml').and.returnValue(null);
      let versionList = convertXmlToVersionList('foo');
      expect(versionList).toBeNull();
    });
  });

  describe('osHelper', () => {
    it('should work for linux', () => {
      expect(osHelper('Darwin', 'x64')).toBe('mac');
    });
    it('should work for windows', () => {
      expect(osHelper('Windows_NT', 'x32')).toBe('win32');
      expect(osHelper('Windows_NT', 'x64')).toBe('win64');
    });
    it('should work for mac', () => {
      expect(osHelper('Linux', 'x32')).toBe('linux32');
      expect(osHelper('Linux', 'x64')).toBe('linux64');
    });
  });

  describe('getVersionObj', () => {
    let versionList: VersionList;

    beforeAll(() => {
      spyOn(xmlUtils, 'readXml').and.returnValue(xmlJs);
      versionList = convertXmlToVersionList('foo');
    });

    it('should get the partial url for mac', () => {
      let versionObjMap = getVersion(versionList);
      let versionObj = getVersionObj(versionObjMap, 'Darwin', 'x64');
      expect(versionObj.url).toBe('2.10/chromedriver_mac32.zip');
      expect(versionObj.size).toBe(4116418);
    });

    it('should get the partial url for windows', () => {
      let versionObjMap = getVersion(versionList);
      let versionObj = getVersionObj(versionObjMap, 'Windows_NT', 'x32');
      expect(versionObj.url).toBe('2.10/chromedriver_win32.zip');
      expect(versionObj.size).toBe(2843903);
    });

    it('should get the partial url for linux', () => {
      let versionObjMap = getVersion(versionList);
      let versionObj = getVersionObj(versionObjMap, 'Linux', 'x64');
      expect(versionObj.url).toBe('2.10/chromedriver_linux64.zip');
      expect(versionObj.size).toBe(2301804);
    });
  });
});