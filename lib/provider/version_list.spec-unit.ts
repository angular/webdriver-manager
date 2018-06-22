import { getVersion, VersionList } from './version_list';

describe('version_list', () => {
  describe('getVersion', () => {
    let versionList: VersionList = {
      '1.0.0': {
        '1.0.0/foo': 10000,
        '1.0.0/bar': 10001
      },
      '1.0.1': {
        '1.0.1/foo': 10100,
        '1.0.1/bar': 10101,
      },
      '2.0.1': {
        '2.0.1/foo': 20100,
        '2.0.1/bar': 20101,
      },
      '3.0.1': {
        '3.0.1/foo': 30100,
        '3.0.1/bar': 30101,
      },
    };

    it('should return the latest version when no version provided', () => {
      let version = getVersion(versionList);
      expect(Object.keys(version).length).toBe(2);
      expect(version['3.0.1/foo']).toBe(30100);
      expect(version['3.0.1/bar']).toBe(30101);
    });

    it('should return the latest version with latest option', () => {
      let version = getVersion(versionList, 'latest');
      expect(Object.keys(version).length).toBe(2);
      expect(version['3.0.1/foo']).toBe(30100);
      expect(version['3.0.1/bar']).toBe(30101);
    });

    it('should return version 1.0.1', () => {
      let version = getVersion(versionList, '1.0.1');
      expect(Object.keys(version).length).toBe(2);
      expect(version['1.0.1/foo']).toBe(10100);
      expect(version['1.0.1/bar']).toBe(10101);
    });
  });
});