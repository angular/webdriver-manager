/// <reference path = "../../typings/main/ambient/jasmine/index.d.ts"/>

import * as fs from 'fs';
import * as path from 'path';
import {Binary, ChromeDriver, IEDriver, StandAlone} from '../../lib/binaries';
import {DownloadedBinary, FileManager} from '../../lib/files';


describe('file manager', () => {

  describe('setting up for windows', () => {
    let osType = 'Windows_NT';

    it('should find correct binaries', () => {
      expect(FileManager.checkOS_(osType, ChromeDriver)).toBe(true);
      expect(FileManager.checkOS_(osType, IEDriver)).toBe(true);
      expect(FileManager.checkOS_(osType, StandAlone)).toBe(true);
    });

    it('should return the binary array', () => {
      let binaries = FileManager.compileBinaries_(osType);
      expect(binaries[StandAlone.id].name).toBe((new StandAlone()).name);
      expect(binaries[ChromeDriver.id].name).toBe((new ChromeDriver()).name);
      expect(binaries[IEDriver.id].name).toBe((new IEDriver()).name);
    });
  });

  describe('setting up for linux', () => {
    let osType = 'Linux';

    it('should find correct binaries', () => {
      expect(FileManager.checkOS_(osType, ChromeDriver)).toBe(true);
      expect(FileManager.checkOS_(osType, IEDriver)).toBe(false);
      expect(FileManager.checkOS_(osType, StandAlone)).toBe(true);
    });

    it('should return the binary array', () => {
      let binaries = FileManager.compileBinaries_(osType);
      expect(binaries[StandAlone.id].name).toBe((new StandAlone()).name);
      expect(binaries[ChromeDriver.id].name).toBe((new ChromeDriver()).name);
      expect(binaries[IEDriver.id]).toBeUndefined();
    });
  });

  describe('setting up for mac', () => {
    let osType = 'Darwin';

    it('should find correct binaries', () => {
      expect(FileManager.checkOS_(osType, ChromeDriver)).toBe(true);
      expect(FileManager.checkOS_(osType, IEDriver)).toBe(false);
      expect(FileManager.checkOS_(osType, StandAlone)).toBe(true);
    });

    it('should return the binary array', () => {
      let binaries = FileManager.compileBinaries_(osType);
      expect(binaries[StandAlone.id].name).toBe((new StandAlone()).name);
      expect(binaries[ChromeDriver.id].name).toBe((new ChromeDriver()).name);
      expect(binaries[IEDriver.id]).toBeUndefined();
    });
  });

  describe('downloaded version checks', () => {
    let existingFiles: string[];
    let selenium = new StandAlone();
    let chrome = new ChromeDriver();
    let ie = new IEDriver();
    let ostype: string;
    let arch: string;

    function setup(osType: string): void {
      ostype = osType;
      arch = 'x64';
      existingFiles = [
        selenium.prefix() + '2.51.0' + selenium.executableSuffix(),
        selenium.prefix() + '2.52.0' + selenium.executableSuffix()];
        existingFiles.push(chrome.prefix() + '2.20' + chrome.suffix(ostype, arch));
        existingFiles.push(chrome.prefix() + '2.20' + chrome.executableSuffix(ostype));
        existingFiles.push(chrome.prefix() + '2.21' + chrome.suffix(ostype, arch));
        existingFiles.push(chrome.prefix() + '2.21' + chrome.executableSuffix(ostype));
      if (ostype == 'Windows_NT') {
        existingFiles.push(ie.prefix() + '_Win32_2.51.0' + ie.suffix());
        existingFiles.push(ie.prefix() + '_Win32_2.51.0' + ie.executableSuffix(ostype));
        existingFiles.push(ie.prefix() + '_x64_2.51.0' + ie.suffix());
        existingFiles.push(ie.prefix() + '_x64_2.51.0' + ie.executableSuffix(ostype));
        existingFiles.push(ie.prefix() + '_Win32_2.52.0' + ie.suffix());
        existingFiles.push(ie.prefix() + '_Win32_2.52.0' + ie.executableSuffix(ostype));
        existingFiles.push(ie.prefix() + '_x64_2.52.0' + ie.suffix());
        existingFiles.push(ie.prefix() + '_x64_2.52.0' + ie.executableSuffix(ostype));
      }
    }

    describe('versions for selenium', () => {
      it('should find the correct version for windows', () => {
        setup('Windows_NT');
        let downloaded = FileManager.downloadedVersions_(selenium, ostype, arch, existingFiles);
        expect(downloaded.versions.length).toBe(2);
        expect(downloaded.versions[0]).toBe('2.51.0');
        expect(downloaded.versions[1]).toBe('2.52.0');
      });
      it('should find the correct version for mac', () => {
        setup('Darwin');
        let downloaded = FileManager.downloadedVersions_(selenium, ostype, arch, existingFiles);
        expect(downloaded.versions.length).toBe(2);
        expect(downloaded.versions[0]).toBe('2.51.0');
        expect(downloaded.versions[1]).toBe('2.52.0');
      });
      it('should find the correct version for mac', () => {
        setup('Linux');
        let downloaded = FileManager.downloadedVersions_(selenium, ostype, arch, existingFiles);
        expect(downloaded.versions.length).toBe(2);
        expect(downloaded.versions[0]).toBe('2.51.0');
        expect(downloaded.versions[1]).toBe('2.52.0');
      });
    });

    describe('versions for chrome', () => {
      it('should find the correct version for windows', () => {
        setup('Windows_NT');
        let downloaded = FileManager.downloadedVersions_(chrome, ostype, arch, existingFiles);
        expect(downloaded.versions.length).toBe(2);
        expect(downloaded.versions[0]).toBe('2.20');
        expect(downloaded.versions[1]).toBe('2.21');
      });
      it('should find the correct version for mac', () => {
        setup('Darwin');
        let downloaded = FileManager.downloadedVersions_(chrome, ostype, arch, existingFiles);
        expect(downloaded.versions.length).toBe(2);
        expect(downloaded.versions[0]).toBe('2.20');
        expect(downloaded.versions[1]).toBe('2.21');
      });
      it('should find the correct version for linux', () => {
        setup('Linux');
        let downloaded = FileManager.downloadedVersions_(chrome, ostype, arch, existingFiles);
        expect(downloaded.versions.length).toBe(2);
        expect(downloaded.versions[0]).toBe('2.20');
        expect(downloaded.versions[1]).toBe('2.21');
      });
    });

    describe('versions for ie on windows', () => {
      it('should find the correct version for windows', () => {
        setup('Windows_NT');
        let downloaded = FileManager.downloadedVersions_(ie, ostype, arch, existingFiles);
        expect(downloaded.versions.length).toBe(4);
        expect(downloaded.versions[0]).toBe('Win32_2.51.0');
        expect(downloaded.versions[1]).toBe('x64_2.51.0');
        expect(downloaded.versions[2]).toBe('Win32_2.52.0');
        expect(downloaded.versions[3]).toBe('x64_2.52.0');
      });
    });
  });
});
