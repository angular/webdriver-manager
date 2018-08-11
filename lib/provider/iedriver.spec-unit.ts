import * as fs from 'fs';
import { IEDriver } from './iedriver';

describe('iedriver', () => {
  describe('class IEDriver', () => {
    describe('getStatus', () => {
      it('should get the status from the config file for Windows', () => {
        const configCache = `{
          "last": "/path/to/IEDriverServer_100.1.0.exe",
          "all": [
            "/path/to/IEDriverServer_90.0.0.exe",
            "/path/to/IEDriverServer_99.0.0-beta.exe",
            "/path/to/IEDriverServer_100.1.0.exe"
          ]
        }`;
        spyOn(fs, 'readFileSync').and.returnValue(configCache);
        let iedriver = new IEDriver({osType: 'Windows_NT'});
        expect(iedriver.getStatus())
          .toBe('90.0.0, 99.0.0-beta, 100.1.0 (latest)');
      });
    });
  });
});