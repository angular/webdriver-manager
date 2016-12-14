import * as path from 'path';
import * as rimraf from 'rimraf';

import {Config} from '../config';
import {spawnSync} from '../utils';

import {Binary, BinaryUrl, OS} from './binary';

function getAndroidArch(): string {
  switch (Config.osArch()) {
    case 'arm':
      return 'armeabi-v7a';
    case 'arm64':
      return 'arm64-v8a';
    case 'x86':
    case 'x32':
    case 'ia32':
    case 'ppc':
      return 'x86';
    case 'x86-64':
    case 'x64':
    case 'ia64':
    case 'ppc64':
      return 'x86_64';
    default:
      return Config.osArch();
  }
}

/**
 * The android sdk binary.
 */
export class AndroidSDK extends Binary {
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static id = 'android';
  static versionDefault = Config.binaryVersions().android;
  static isDefault = false;
  static DEFAULT_API_LEVELS = '24';
  static DEFAULT_ARCHITECTURES = getAndroidArch();
  static DEFAULT_PLATFORMS = 'google_apis';
  static VERSIONS: {[api_level: number]: string} = {
    // Before 24 is not supported
    24: '7.0',
    25: '7.1'
  }

  constructor(alternateCDN?: string) {
    super(alternateCDN || Config.cdnUrls().android);

    this.name = 'android-sdk';
    this.versionCustom = AndroidSDK.versionDefault;
  }

  id(): string {
    return AndroidSDK.id;
  }

  prefix(): string {
    return 'android-sdk_r';
  }

  suffix(): string {
    if (this.ostype === 'Darwin') {
      return '-macosx.zip';
    } else if (this.ostype === 'Linux') {
      return '-linux.tgz';
    } else if (this.ostype === 'Windows_NT') {
      return '-windows.zip';
    }
  }

  getUrl(): Promise<BinaryUrl> {
    return Promise.resolve({url: this.cdn + this.filename(), version: this.versionCustom});
  }

  getVersionList(): Promise<string[]> {
    return null;
  }

  url(ostype: string): string {
    return this.cdn + this.filename();
  }

  zipContentName(): string {
    if (this.ostype === 'Darwin') {
      return this.name + '-macosx';
    } else if (this.ostype === 'Linux') {
      return this.name + '-linux';
    } else if (this.ostype === 'Windows_NT') {
      return this.name + '-windows';
    }
  }

  executableSuffix(): string {
    return '';
  }

  remove(sdkPath: string): void {
    try {
      let avds = <string[]>require(path.resolve(sdkPath, 'available_avds.json'));
      let version = path.basename(sdkPath).slice(this.prefix().length);
      avds.forEach((avd: string) => {
        spawnSync(
            path.resolve(sdkPath, 'tools', 'android'),
            ['delete', 'avd', '-n', avd + '-v' + version + '-wd-manager']);
      });
    } catch (e) {
    }
    rimraf.sync(sdkPath);
  }
}
