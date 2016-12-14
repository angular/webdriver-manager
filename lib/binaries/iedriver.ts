import {Config} from '../config';

import {Binary, BinaryUrl, OS} from './binary';
import {IEDriverXml} from './iedriver_xml';

export class IEDriver extends Binary {
  static id = 'ie';
  static isDefault32 = false;
  static isDefault64 = false;
  static os = [OS.Windows_NT];
  static versionDefault = Config.binaryVersions().ie;

  constructor(opt_alternativeCdn?: string) {
    super(opt_alternativeCdn || Config.cdnUrls().ie);
    this.configSource = new IEDriverXml();
    this.name = 'IEDriverServer';
    this.versionDefault = IEDriver.versionDefault;
    this.versionCustom = this.versionDefault;
  }

  id(): string {
    return IEDriver.id;
  }

  prefix(): string {
    return 'IEDriverServer';
  }

  suffix(): string {
    return '.zip';
  }

  getUrl(version?: string): Promise<BinaryUrl> {
    if (this.alternativeDownloadUrl != null) {
      return Promise.resolve({url: '', version: ''});
    } else {
      return this.getVersionList().then(() => {
        version = version || Config.binaryVersions().ie;
        return this.configSource.getUrl(version).then(binaryUrl => {
          this.versionCustom = binaryUrl.version;
          return {url: Config.cdnUrls().ie + binaryUrl.url, version: binaryUrl.version};
        });
      });
    }
  }

  getVersionList(): Promise<string[]> {
    if (this.alternativeDownloadUrl != null) {
      return Promise.resolve([]);
    } else {
      return this.configSource.getVersionList();
    }
  }
}
