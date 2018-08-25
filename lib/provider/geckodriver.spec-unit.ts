import * as fs from 'fs';
import {GeckoDriver, osHelper} from './geckodriver';

describe('geckodriver', () => {
  describe('osHelper', () => {
    it('should work for mac', () => {
      expect(osHelper('Darwin', 'x64')).toBe('macos');
    });
    it('should work for windows', () => {
      expect(osHelper('Windows_NT', 'x32')).toBe('win32');
      expect(osHelper('Windows_NT', 'x64')).toBe('win64');
    });
    it('should work for linux', () => {
      expect(osHelper('Linux', 'x32')).toBe('linux32');
      expect(osHelper('Linux', 'x64')).toBe('linux64');
    });
    it('should return null when the type / arch is not known', () => {
      expect(osHelper('FooBarOS', '')).toBeNull();
      expect(osHelper('Windows_NT', 'arm')).toBeNull();
      expect(osHelper('Linux', 'arm64')).toBeNull();
    });
  });

  describe('class GeckoDriver', () => {
    describe('getStatus', () => {
      it('should get the status from the config file for Windows', () => {
        const configCache = `{
          "last": "/path/to/geckodriver_100.1.0.exe",
          "all": [
            "/path/to/geckodriver_90.0.0.exe",
            "/path/to/geckodriver_99.0.0-beta.exe",
            "/path/to/geckodriver_100.1.0.exe"
          ]
        }`;
        spyOn(fs, 'readFileSync').and.returnValue(configCache);
        const geckodriver = new GeckoDriver({osType: 'Windows_NT'});
        expect(geckodriver.getStatus())
            .toBe('90.0.0, 99.0.0-beta, 100.1.0 (latest)');
      });

      it('should get the status from the config file for not Windows', () => {
        const configCache = `{
          "last": "/path/to/geckodriver_100.1.0",
          "all": [
            "/path/to/geckodriver_90.0.0",
            "/path/to/geckodriver_99.0.0-beta",
            "/path/to/geckodriver_100.1.0"
          ]
        }`;
        spyOn(fs, 'readFileSync').and.returnValue(configCache);
        const geckodriver = new GeckoDriver({osType: 'Darwin'});
        expect(geckodriver.getStatus())
            .toBe('90.0.0, 99.0.0-beta, 100.1.0 (latest)');
      });
    });
  });
});
