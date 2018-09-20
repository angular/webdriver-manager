import * as fs from 'fs';
import {SeleniumServer, semanticVersionParser, versionParser,} from './selenium_server';

describe('selenium_server', () => {
  describe('verisonParser', () => {
    it('should generate a semantic version', () => {
      let version =
          versionParser('10.1/selenium-server-standalone-10.1.200.jar');
      expect(version).toBe('10.1.200');

      version =
          versionParser('10.1/selenium-server-standalone-10.1.200-beta.jar');
      expect(version).toBe('10.1.200-beta');
    });
  });

  describe('semanticVerisonParser', () => {
    it('should generate a semantic version', () => {
      let version =
          semanticVersionParser('10.1/selenium-server-standalone-10.1.200.jar');
      expect(version).toBe('10.1.200');

      version = semanticVersionParser(
          '10.1/selenium-server-standalone-10.1.200-beta.jar');
      expect(version).toBe('10.1.200');
    });
  });

  describe('class SeleniumServer', () => {
    describe('getCmdStartServer', () => {
      const configBinaries = `{
        "last": "path/to/selenium-server-3.0.jar",
        "all": ["path/to/selenium-server-1.0.jar",
                "path/to/selenium-server-2.0.jar",
                "path/to/selenium-server-3.0.jar"
        ]
      }`;
      const javaArgs = '-role node ' +
          '-servlet org.openqa.grid.web.servlet.LifecycleServlet ' +
          '-registerCycle 0 -port 4444';
      const javaArgsPort = '-port 4444';
      it('should use a selenium server with no options', () => {
        spyOn(fs, 'readFileSync').and.returnValue(configBinaries);
        const seleniumServer = new SeleniumServer();
        expect(seleniumServer.getCmdStartServer(null).join(' '))
            .toContain('-jar path/to/selenium-server-3.0.jar ' + javaArgsPort);
        expect(seleniumServer.getCmdStartServer({}).join(' '))
            .toContain('-jar path/to/selenium-server-3.0.jar ' + javaArgsPort);
      });

      it('should use a selenium server with options', () => {
        spyOn(fs, 'readFileSync').and.returnValue(configBinaries);
        const seleniumServer = new SeleniumServer();
        const cmd = seleniumServer.getCmdStartServer(
            {'-Dwebdriver.chrome.driver': 'path/to/chromedriver'});
        expect(cmd.join(' '))
            .toContain(
                '-Dwebdriver.chrome.driver=path/to/chromedriver ' +
                '-jar path/to/selenium-server-3.0.jar ' + javaArgsPort);
      });

      it('should use a selenium server with node options', () => {
        spyOn(fs, 'readFileSync').and.returnValue(configBinaries);
        const seleniumServer = new SeleniumServer();
        seleniumServer.runAsDetach = true;
        seleniumServer.runAsNode = true;
        const cmd = seleniumServer.getCmdStartServer(
            {'-Dwebdriver.chrome.driver': 'path/to/chromedriver'});
        expect(cmd.join(' '))
            .toContain(
                '-Dwebdriver.chrome.driver=path/to/chromedriver ' +
                '-jar path/to/selenium-server-3.0.jar ' + javaArgs);
      });
    });

    describe('getStatus', () => {
      it('should get the status from the config file', () => {
        const configCache = `{
          "last": "/path/to/selenium-server-standalone-100.1.0.jar",
          "all": [
            "/path/to/selenium-server-standalone-90.0.0.jar",
            "/path/to/selenium-server-standalone-99.0.0-beta.jar",
            "/path/to/selenium-server-standalone-100.1.0.jar"
          ]
        }`;
        spyOn(fs, 'readFileSync').and.returnValue(configCache);
        const seleniumServer = new SeleniumServer();
        expect(seleniumServer.getStatus())
            .toBe('90.0.0, 99.0.0-beta, 100.1.0 (latest)');
      });
    });
  });
});