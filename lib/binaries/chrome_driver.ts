import {Config} from '../config';

import {Binary, BinaryUrl, OS} from './binary';
import {ChromeXml} from './chrome_xml';

export class ChromeDriver extends Binary {
  static id = 'chrome';
  static isDefault = true;
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static versionDefault = Config.binaryVersions().chrome;

  constructor(opt_alternativeCdn?: string) {
    super(opt_alternativeCdn || Config.cdnUrls().chrome);
    this.configSource = new ChromeXml();
    this.name = 'chromedriver';
    this.versionDefault = ChromeDriver.versionDefault;
    this.versionCustom = this.versionDefault;
  }

  id(): string {
    return ChromeDriver.id;
  }

  prefix(): string {
    return 'chromedriver_';
  }

  suffix(): string {
    return '.zip';
  }

  getUrl(version?: string): Promise<BinaryUrl> {
    if (this.alternativeDownloadUrl != null) {
      return Promise.resolve({url: '', version: ''});
    } else {
      return this.getVersionList().then(() => {
        version = version || Config.binaryVersions().chrome;
        return this.configSource.getUrl(version).then(binaryUrl => {
          this.versionCustom = binaryUrl.version;
          return {url: Config.cdnUrls().chrome + binaryUrl.url, version: binaryUrl.version};
        });
      });
    }
  }

  getVersionList(): Promise<string[]> {
    // If an alternative cdn is set, return an empty list.
    if (this.alternativeDownloadUrl != null) {
      Promise.resolve([]);
    } else {
      return this.configSource.getVersionList();
    }
  }
}
