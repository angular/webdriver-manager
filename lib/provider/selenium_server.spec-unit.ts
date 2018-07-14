import { semanticVersionParser, versionParser } from './selenium_server';

describe('selenium_server', () => {
  describe('verisonParser', () => {
    it('should generate a semantic version', () => {
      let version = versionParser(
        '10.1/selenium-server-standalone-10.1.200.jar');
      expect(version).toBe('10.1.200');

      version = versionParser(
        '10.1/selenium-server-standalone-10.1.200-beta.jar');
      expect(version).toBe('10.1.200-beta');
    });
  });

  describe('semanticVerisonParser', () => {
    it('should generate a semantic version', () => {
      let version = semanticVersionParser(
        '10.1/selenium-server-standalone-10.1.200.jar');
      expect(version).toBe('10.1.200');

      version = semanticVersionParser(
        '10.1/selenium-server-standalone-10.1.200-beta.jar');
      expect(version).toBe('10.1.200');
    });
  });
});