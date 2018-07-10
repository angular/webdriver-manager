import { osHelper } from './geckodriver';

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
});
