import {Config} from '../config';

import {Binary, BinaryUrl, OS} from './binary';
import {ConfigSource} from './config_source';
import {StandaloneXml} from './standalone_xml';

export class Standalone extends Binary {
  static id = 'standalone';
  static isDefault = true;
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static versionDefault = Config.binaryVersions().selenium;

  constructor(opt_alternativeCdn?: string) {
    super(opt_alternativeCdn || Config.cdnUrls().selenium);
    this.configSource = new StandaloneXml();
    this.name = 'selenium standalone';
    this.versionDefault = Standalone.versionDefault;
    this.versionCustom = this.versionDefault;
  }

  id(): string {
    return Standalone.id;
  }

  prefix(): string {
    return 'selenium-server-standalone-';
  }

  suffix(): string {
    return '.jar';
  }

  executableSuffix(): string {
    return '.jar';
  }

  getUrl(version?: string): Promise<BinaryUrl> {
    if (this.alternativeDownloadUrl != null) {
      return Promise.resolve({url: '', version: ''});
    } else {
      return this.getVersionList().then(() => {
        version = version || Config.binaryVersions().selenium;
        return this.configSource.getUrl(version).then(binaryUrl => {
          this.versionCustom = binaryUrl.version;
          return {url: Config.cdnUrls().selenium + binaryUrl.url, version: binaryUrl.version};
        });
      });
    }
  }

  getVersionList(): Promise<string[]> {
    // If an alternative cdn is set, return an empty list.
    if (this.alternativeDownloadUrl != null) {
      return Promise.resolve([]);
    } else {
      return this.configSource.getVersionList();
    }
  }
}
