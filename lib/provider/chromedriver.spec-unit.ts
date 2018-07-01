import { osHelper } from './chromedriver';

describe('chromedriver', () => {
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
});