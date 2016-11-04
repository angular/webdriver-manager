import * as path from 'path';
import * as semver from 'semver';

import {Config} from '../config';

import {Binary, OS} from './binary';

type StringMap = {
  [key: string]: string
};
type SuffixMap = {
  [key: string]: StringMap
};

/**
 * The gecko driver binary.
 */
export class GeckoDriver extends Binary {
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static id = 'gecko';
  static versionDefault = Config.binaryVersions().gecko;
  static isDefault = true;
  static shortName = ['gecko'];

  private static suffixes: SuffixMap = {
    'Darwin': {'x64': '-macos.tar.gz'},
    'Linux': {'x64': '-linux64.tar.gz', 'ia32': '-linux32.tar.gz'},
    'Windows_NT': {
      'x64': '-win64.zip',
      'ia32': '-win32.zip',
    }
  };

  constructor(alternateCDN?: string) {
    super(alternateCDN || Config.cdnUrls().gecko);

    this.name = 'geckodriver';
    this.versionCustom = GeckoDriver.versionDefault;
    this.prefixDefault = 'geckodriver-';
  }

  id(): string {
    return GeckoDriver.id;
  }

  versionDefault(): string {
    return GeckoDriver.versionDefault;
  }

  suffix(ostype: string, arch: string): string {
    if (!GeckoDriver.suffixes[ostype][arch]) {
      throw new Error('GeckoDriver doesn\'t support ${ostype} ${arch}!');
    }

    let version: string = this.version();

    // No 32-bit builds before 0.10.0
    if (semver.lte(version, '0.10.0')) {
      if (arch === 'x64') {
        throw new Error('GeckoDriver doesn\'t support ${ostype} ${arch}!');
      }
    }

    // Special case old versions on Mac for the name change.
    if (semver.lte(version, '0.9.0')) {
      if (ostype === 'Darwin') {
        return '-mac.tar.gz';
      }
    }

    return GeckoDriver.suffixes[ostype][arch];
  }

  static supports(ostype: string, arch: string): boolean {
    return !!GeckoDriver.suffixes[ostype][arch];
  }

  url(ostype: string, arch: string): string {
    let urlBase = this.cdn + this.version() + '/';
    let filename = this.prefix() + this.version() + this.suffix(ostype, arch);
    return urlBase + filename;
  }
}
