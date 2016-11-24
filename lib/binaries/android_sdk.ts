import * as path from 'path';
import * as rimraf from 'rimraf';

import {Config} from '../config';
import {spawnSync} from '../utils';

import {Binary, OS} from './binary';

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
  static shortName = ['android'];
  static DEFAULT_API_LEVELS = '24';
  static DEFAULT_ARCHITECTURES = getAndroidArch();
  static DEFAULT_PLATFORMS = 'google_apis';

  constructor(alternateCDN?: string) {
    super(alternateCDN || Config.cdnUrls().android);

    this.name = 'android-sdk';
    this.versionCustom = AndroidSDK.versionDefault;
    this.prefixDefault = 'android-sdk_r';
    this.suffixDefault = '.zip';
  }

  id(): string {
    return AndroidSDK.id;
  }

  versionDefault(): string {
    return AndroidSDK.versionDefault;
  }

  suffix(ostype: string): string {
    if (ostype === 'Darwin') {
      return '-macosx' + this.suffixDefault;
    } else if (ostype === 'Linux') {
      return '-linux.tgz';
    } else if (ostype === 'Windows_NT') {
      return '-windows' + this.suffixDefault;
    }
  }

  url(ostype: string): string {
    return this.cdn + this.filename(ostype);
  }

  zipContentName(ostype: string): string {
    if (ostype === 'Darwin') {
      return this.name + '-macosx';
    } else if (ostype === 'Linux') {
      return this.name + '-linux';
    } else if (ostype === 'Windows_NT') {
      return this.name + '-windows';
    }
  }

  executableSuffix(): string {
    return '';
  }

  remove(sdkPath: string): void {
    try {
      let avds = <string[]>require(path.resolve(sdkPath, 'available_avds.json'));
      let version = path.basename(sdkPath).slice(this.prefixDefault.length);
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
