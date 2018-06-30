import { getVersion, VersionList } from './version_list';

describe('version_list', () => {
  describe('getVersion', () => {
    let versionList: VersionList = {
      '1.0.0': {
        '1.0.0/foo': {
          url: '1.0.0/foo',
          size: 10000
        },
        '1.0.0/bar': {
          url: '1.0.0/bar',
          size: 10001
        }
      },
      '1.0.1': {
        '1.0.1/foo': {
          url: '1.0.1/foo',
          size: 10100
        },
        '1.0.1/bar': {
          url: '1.0.1/bar',
          size: 10101
        }
      },
      '2.0.1': {
        '2.0.1/foo': {
          url: '2.0.1/foo',
          size: 20100
        },
        '2.0.1/bar': {
          url: '2.0.1/bar',
          size: 20101
        },
      },
      '3.0.1': {
        '3.0.1/foo': {
          url: '3.0.1/foo',
          size: 30100
        },
        '3.0.1/bar': {
          url: '3.0.1/bar',
          size: 30101
        },
      },
    };

    it('should return the latest version when no version provided', () => {
      let version = getVersion(versionList);
      expect(Object.keys(version).length).toBe(2);
      expect(version['3.0.1/foo']['size']).toBe(30100);
      expect(version['3.0.1/bar']['size']).toBe(30101);
    });

    it('should return the latest version with latest option', () => {
      let version = getVersion(versionList, 'latest');
      expect(Object.keys(version).length).toBe(2);
      expect(version['3.0.1/foo']['size']).toBe(30100);
      expect(version['3.0.1/bar']['size']).toBe(30101);
    });

    it('should return version 1.0.1', () => {
      let version = getVersion(versionList, '1.0.1');
      expect(Object.keys(version).length).toBe(2);
      expect(version['1.0.1/foo']['size']).toBe(10100);
      expect(version['1.0.1/bar']['size']).toBe(10101);
    });
  });
});