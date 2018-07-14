import { osHelper, semanticVersionParser, versionParser } from './chromedriver';

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
});