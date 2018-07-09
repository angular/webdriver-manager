import { osHelper } from './chromedriver';

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
});