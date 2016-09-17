import {arch, type} from 'os';

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

  id(): string { return ChromeDriver.id; }

  versionDefault(): string { return ChromeDriver.versionDefault; }

  suffix(ostype: string, arch: string): string {
    if (ostype === 'Darwin') {
      return 'mac32' + this.suffixDefault;
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
