import {Config} from '../config';

import {Binary, OS} from './binary';


/**
 * The selenium server jar.
 */
export class StandAlone extends Binary {
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static id = 'standalone';
  static versionDefault = Config.binaryVersions().selenium;
  static isDefault = true;
  static shortName = ['standalone'];

  constructor(alternateCDN?: string) {
    super(alternateCDN || Config.cdnUrls().selenium);

    this.name = 'selenium standalone';
    this.versionCustom = StandAlone.versionDefault;
    this.prefixDefault = 'selenium-server-standalone-';
    this.suffixDefault = '.jar';
  }

  id(): string {
    return StandAlone.id;
  }

  versionDefault(): string {
    return StandAlone.versionDefault;
  }

  url(): string {
    let urlBase = this.cdn + this.shortVersion(this.version()) + '/';
    let filename = this.prefix() + this.version() + this.suffix();
    return urlBase + filename;
  }

  executableSuffix(ostype?: string): string {
    return '.jar';
  }
}
