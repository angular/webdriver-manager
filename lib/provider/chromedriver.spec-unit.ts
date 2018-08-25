import * as fs from 'fs';
import {ChromeDriver, osHelper, semanticVersionParser, versionParser,} from './chromedriver';

describe('chromedriver', () => {
  describe('osHelper', () => {
    it('should work for mac', () => {
      expect(osHelper('Darwin', 'x64')).toBe('mac');
    });
    it('should work for windows', () => {
      expect(osHelper('Windows_NT', 'x32')).toBe('win32');
      expect(osHelper('Windows_NT', 'x64')).toBe('win32');
    });
    it('should work for linux', () => {
      expect(osHelper('Linux', 'x32')).toBeNull();
      expect(osHelper('Linux', 'x64')).toBe('linux64');
    });
  });

  describe('verisonParser', () => {
    it('should generate a semantic version', () => {
      let version = versionParser('10.0/chromedriver_linux64.zip');
      expect(version).toBe('10.0');

      version = versionParser('10.100/chromedriver_linux64.zip');
      expect(version).toBe('10.100');
    });
  });

  describe('semanticVerisonParser', () => {
    it('should generate a semantic version', () => {
      let version = semanticVersionParser('10.0/chromedriver_linux64.zip');
      expect(version).toBe('10.0.0');

      version = semanticVersionParser('10.100/chromedriver_linux64.zip');
      expect(version).toBe('10.100.0');
    });
  });

  describe('class ChromeDriver', () => {
    describe('getStatus', () => {
      it('should get the status from the config file for Windows', () => {
        const configCache = `{
          "last": "/path/to/chromedriver_100.1.exe",
          "all": [
            "/path/to/chromedriver_90.0.exe",
            "/path/to/chromedriver_99.0-beta.exe",
            "/path/to/chromedriver_100.1.exe"
          ]
        }`;
        spyOn(fs, 'readFileSync').and.returnValue(configCache);
        const chromedriver = new ChromeDriver({osType: 'Windows_NT'});
        expect(chromedriver.getStatus())
            .toBe('90.0, 99.0-beta, 100.1 (latest)');
      });

      it('should get the status from the config file for not Windows', () => {
        const configCache = `{
          "last": "/path/to/chromedriver_100.1",
          "all": [
            "/path/to/chromedriver_90.0",
            "/path/to/chromedriver_99.0-beta",
            "/path/to/chromedriver_100.1"
          ]
        }`;
        spyOn(fs, 'readFileSync').and.returnValue(configCache);
        const chromedriver = new ChromeDriver({osType: 'Darwin'});
        expect(chromedriver.getStatus())
            .toBe('90.0, 99.0-beta, 100.1 (latest)');
      });
    });
  });
});