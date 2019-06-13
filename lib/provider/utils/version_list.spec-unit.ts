import {getVersionObj, getVersionObjs, VersionList} from './version_list';

const versionList: VersionList = {
  '1.0.0': {
    'foo_mac32': {url: '1.0.0/foo_mac32', size: 10000},
    'foo_win32': {url: '1.0.0/foo_win32', size: 10001},
    'foo_linux64': {url: '1.0.0/foo_linux64', size: 10002}
  },
  '1.0.1': {
    'foo_mac32': {url: '1.0.1/foo_mac32', size: 10100},
    'foo_win32': {url: '1.0.1/foo_win32', size: 10101},
    'foo_linux64': {url: '1.0.1/foo_linux64', size: 10102}
  },
  '2.0.1': {
    'foo_mac32': {url: '2.0.1/foo_mac32', size: 20100},
    'foo_win32': {url: '2.0.1/foo_win32', size: 20101},
    'foo_linux64': {url: '2.0.1/foo_linux64', size: 20102}
  },
  '3.0.1': {
    'foo_mac32': {url: '3.0.1/foo_mac32', size: 30100},
    'foo_win32': {url: '3.0.1/foo_win32', size: 30101},
    'foo_linux64': {url: '3.0.1/foo_linux64', size: 30102}
  }
};

describe('version_list', () => {
  describe('getVersion', () => {
    it('should return the latest version when no version provided', () => {
      const version = getVersionObjs(versionList);
      expect(Object.keys(version).length).toBe(3);
      expect(version['foo_mac32']['size']).toBe(30100);
      expect(version['foo_win32']['size']).toBe(30101);
      expect(version['foo_linux64']['size']).toBe(30102);
    });

    it('should return the latest version with latest option', () => {
      const version = getVersionObjs(versionList, 'latest');
      expect(Object.keys(version).length).toBe(3);
      expect(version['foo_mac32']['size']).toBe(30100);
      expect(version['foo_win32']['size']).toBe(30101);
      expect(version['foo_linux64']['size']).toBe(30102);
    });

    it('should return version 1.0.1', () => {
      const version = getVersionObjs(versionList, '1.0.1');
      expect(Object.keys(version).length).toBe(3);
      expect(version['foo_mac32']['size']).toBe(10100);
      expect(version['foo_win32']['size']).toBe(10101);
      expect(version['foo_linux64']['size']).toBe(10102);
    });

    it('should return the max version for "2."', () => {
      const version = getVersionObjs(versionList, null, '2.');
      expect(Object.keys(version).length).toBe(3);
      expect(version['foo_mac32']['size']).toBe(20100);
      expect(version['foo_win32']['size']).toBe(20101);
      expect(version['foo_linux64']['size']).toBe(20102);
    });

    it('should return undefined with a max version of "4."', () => {
      const version = getVersionObjs(versionList, null, '4.');
      expect(version).toBeUndefined();
    });
  });

  describe('getVersionObj', () => {
    it('should get the partial url for mac', () => {
      const versionObjMap = getVersionObjs(versionList);
      const versionObj = getVersionObj(versionObjMap, 'mac32');
      expect(versionObj.url).toBe('3.0.1/foo_mac32');
      expect(versionObj.size).toBe(30100);
    });

    it('should get the partial url for windows', () => {
      const versionObjMap = getVersionObjs(versionList);
      const versionObj = getVersionObj(versionObjMap, 'win32');
      expect(versionObj.url).toBe('3.0.1/foo_win32');
      expect(versionObj.size).toBe(30101);
    });

    it('should get the partial url for linux', () => {
      const versionObjMap = getVersionObjs(versionList);
      const versionObj = getVersionObj(versionObjMap, 'linux64');
      expect(versionObj.url).toBe('3.0.1/foo_linux64');
      expect(versionObj.size).toBe(30102);
    });
  });
});