import {Config} from '../config';

import {Binary, BinaryUrl, OS} from './binary';
import {GeckoDriverGithub} from './gecko_driver_github';

type StringMap = {
  [key: string]: string
};
type SuffixMap = {
  [key: string]: StringMap
};

export class GeckoDriver extends Binary {
  static id = 'gecko';
  static isDefault = true;
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static versionDefault = Config.binaryVersions().gecko;
  private static suffixes: SuffixMap = {
    'Darwin': {'x64': '-macos.tar.gz'},
    'Linux': {'x64': '-linux64.tar.gz', 'ia32': '-linux32.tar.gz'},
    'Windows_NT': {
      'x64': '-win64.zip',
      'ia32': '-win32.zip',
    }
  };

  constructor(opt_alternativeCdn?: string) {
    super(opt_alternativeCdn || Config.cdnUrls().gecko);
    this.configSource = new GeckoDriverGithub();
    this.name = 'geckodriver';
    this.versionDefault = GeckoDriver.versionDefault;
    this.versionCustom = this.versionDefault;
  }

  id(): string {
    return GeckoDriver.id;
  }

  prefix(): string {
    return 'geckodriver-';
  }

  suffix(): string {
    if (this.ostype === 'Windows_NT') {
      return '.zip';
    } else {
      return '.tar.gz';
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
