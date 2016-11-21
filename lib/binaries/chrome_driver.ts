import * as semver from 'semver';

import {Config} from '../config';

import {Binary, OS} from './binary';


/**
 * The chrome driver binary.
 */
export class ChromeDriver extends Binary {
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static id = 'chrome';
  static versionDefault = Config.binaryVersions().chrome;
  static isDefault = true;
  static shortName = ['chrome'];

  constructor(alternateCDN?: string) {
    super(alternateCDN || Config.cdnUrls().chrome);

    this.name = 'chromedriver';
    this.versionCustom = ChromeDriver.versionDefault;
    this.prefixDefault = 'chromedriver_';
    this.suffixDefault = '.zip';
  }

  id(): string {
    return ChromeDriver.id;
  }

  versionDefault(): string {
    return ChromeDriver.versionDefault;
  }

  suffix(ostype: string, arch: string): string {
    if (ostype === 'Darwin') {
      let version: string = this.version();

      if (version.split('.').length === 2) {
        // we need to make the version valid semver since there is only a major and a minor
        version = `${version}.0`;
      }

      if (semver.gt(version, '2.23.0')) {
        // after chromedriver version 2.23, the name of the binary changed
        // They no longer provide a 32 bit binary
        return 'mac64' + this.suffixDefault;
      } else {
        return 'mac32' + this.suffixDefault;
      }
    } else if (ostype === 'Linux') {
      if (arch === 'x64') {
        return 'linux64' + this.suffixDefault;
      } else {
        return 'linux32' + this.suffixDefault;
      }
    } else if (ostype === 'Windows_NT') {
      return 'win32' + this.suffixDefault;
    }
  }

  url(ostype: string, arch: string): string {
    let urlBase = this.cdn + this.version() + '/';
    let filename = this.prefix() + this.suffix(ostype, arch);
    return urlBase + filename;
  }
}
