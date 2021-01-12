import {Config} from '../config';

import {Binary, BinaryUrl, OS} from './binary';
import {ChromeXml} from './chrome_xml';
import {EdgeXml} from './edge_xml';

export class EdgeDriver extends Binary {
  static id = 'edge';
  static isDefault = true;
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static versionDefault = Config.binaryVersions().edge;

  constructor(opt_alternativeCdn?: string) {
    super(opt_alternativeCdn || Config.cdnUrls().edge);
    this.configSource = new EdgeXml();
    this.name = 'msedgedriver';
    this.versionDefault = EdgeDriver.versionDefault;
    this.versionCustom = this.versionDefault;
  }

  id(): string {
    return EdgeDriver.id;
  }

  prefix(): string {
    return 'msedgewebdriver_';
  }

  suffix(): string {
    return '.zip';
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
