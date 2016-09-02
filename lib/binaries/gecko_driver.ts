import * as path from 'path';

import {Config} from '../config';

import {Binary, OS} from './binary';

/**
 * The gecko driver binary.
 */
export class GeckoDriver extends Binary {
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static id = 'gecko';
  static versionDefault = Config.binaryVersions().gecko;
  static isDefault = true;
  static shortName = ['chrome'];

  static suffixes: {[key: string]: string} = {
    'Darwin': '-mac.tar.gz',
    'Linux': '-linux64.tar.gz',
    'Windows_NT': '-win64.zip'
  };

  constructor() {
    super();
    this.name = 'geckodriver';
    this.versionCustom = GeckoDriver.versionDefault;
    this.prefixDefault = 'geckodriver-';
    this.cdn = Config.cdnUrls().gecko;
  }

  id(): string { return GeckoDriver.id; }

  versionDefault(): string { return GeckoDriver.versionDefault; }

  suffix(ostype: string, arch: string): string {
    if (!GeckoDriver.supports(ostype, arch)) {
      throw new Error('GeckoDriver doesn\'t support ${ostype} ${arch}!');
    }

    return GeckoDriver.suffixes[ostype];
  }

  static supports(ostype: string, arch: string): boolean {
    return arch == 'x64' && (ostype in GeckoDriver.suffixes);
  }

  url(ostype: string, arch: string): string {
    let urlBase = this.cdn + this.version() + '/';
    let filename = this.prefix() + this.version() + this.suffix(ostype, arch);
    return urlBase + filename;
  }
}
