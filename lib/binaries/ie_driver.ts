import * as os from 'os';

import {Binary, OS} from './binary';
import {Config} from '../config';

/**
 * The internet explorer binary.
 */
export class IEDriver extends Binary {
  static os = [OS.Windows_NT];
  static id = 'ie';
  static versionDefault = Config.binaryVersions().ie;
  static isDefault = false;
  static shortName = ['ie', 'ie32'];

  constructor() {
    super();
    this.name = 'IEDriver';
    this.versionCustom = IEDriver.versionDefault;
    this.prefixDefault = 'IEDriverServer';
    this.suffixDefault = '.zip';
    this.cdn = Config.cdnUrls().ie;
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
        ;
      }
    }
    return '';
  }

  url(): string {
    let urlBase = this.cdn + this.shortVersion(this.version()) + '/';
    let filename = this.prefix() + this.version() + this.suffix();
    return urlBase + filename;
  }
}
