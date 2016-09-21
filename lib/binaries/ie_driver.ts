import * as os from 'os';

import {Config} from '../config';

import {Binary, OS} from './binary';


/**
 * The internet explorer binary.
 */
export class IEDriver extends Binary {
  static os = [OS.Windows_NT];
  static id = 'ie';
  static versionDefault = Config.binaryVersions().ie;
  static isDefault = false;
  static shortName = ['ie', 'ie32'];

  constructor(alternateCDN?: string) {
    super(alternateCDN || Config.cdnUrls().ie);

    this.name = 'IEDriverServer';
    this.versionCustom = IEDriver.versionDefault;
    this.prefixDefault = 'IEDriverServer';
    this.suffixDefault = '.zip';
    this.arch = os.arch();
  }

  id(): string { return IEDriver.id; }

  versionDefault(): string { return IEDriver.versionDefault; }

  version(): string {
    if (os.type() == 'Windows_NT') {
      if (this.arch == 'x64') {
        return '_x64_' + this.versionCustom;
      } else {
        return '_Win32_' + this.versionCustom;
      }
    }
    return '';
  }

  url(): string {
    let urlBase = this.cdn + this.shortVersion(this.versionCustom) + '/';
    let filename = this.prefix() + this.version() + this.suffix();
    return urlBase + filename;
  }
}
