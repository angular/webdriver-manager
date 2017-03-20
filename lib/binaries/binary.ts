import * as fs from 'fs';
import {Config} from '../config';
import {ConfigSource} from './config_source';

/**
 * operating system enum
 */
export enum OS {
  Windows_NT,
  Linux,
  Darwin
}

export interface BinaryUrl {
  url: string;
  version: string;
}

/**
 * Dictionary to map the binary's id to the binary object
 */
export interface BinaryMap<T extends Binary> { [id: string]: T; }

export abstract class Binary {
  static os: OS[];

  configSource: ConfigSource;

  ostype: string = Config.osType();
  osarch: string = Config.osArch();

  // TODO(cnishina): downloading the latest requires parsing XML or JSON that is assumed to be
  //   published and formatted in a specific way. If this is not available, let the user download
  //   the file from an alternative download URL.
  alternativeDownloadUrl: string;

  opt_ignoreSSL: boolean;  // An optional ignore ssl.
  opt_proxy: string        // An optional proxy.

  name: string;
  versionDefault: string;
  versionCustom: string;

  constructor(opt_alternativeDownloadUrl?: string) {
    // if opt_alternativeDownloadUrl is a empty string, assign null for simpler checks
    this.alternativeDownloadUrl =
        opt_alternativeDownloadUrl != null && opt_alternativeDownloadUrl.length > 0 ?
        opt_alternativeDownloadUrl :
        null;
  }

  abstract prefix(): string;
  abstract suffix(): string;
  abstract version_concatenator(): string;  // the string to concatenate prefix and version

  executableSuffix(): string {
    if (this.ostype == 'Windows_NT') {
      return '.exe';
    } else {
      return '';
    }
  }

  version(): string {
    return this.versionCustom;
  }

  filename(): string {
    let version =
        this.alternativeDownloadUrl == null ? this.version_concatenator() + this.version() : '';
    return this.prefix() + version + this.suffix();
  }

  /**
   * @param ostype The operating system.
   * @returns The file name for the executable.
   */
  executableFilename(): string {
    let version =
        this.alternativeDownloadUrl == null ? this.version_concatenator() + this.version() : '';
    return this.prefix() + version + this.executableSuffix();
  }

  /**
   * Gets the id of the binary.
   */
  abstract id(): string;

  /**
   * Gets the url to download the file set by the version. This will use the XML if available.
   * If not, it will download from an existing url.
   *
   * @param {string} version The version we are looking for. This could also be 'latest'.
   * @param {opt_proxy} string Option to get proxy URL.
   * @param {opt_ignoreSSL} boolean Option to ignore SSL.
   */
  getUrl(version?: string, opt_proxy?: string, opt_ignoreSSL?: boolean): Promise<BinaryUrl> {
    this.opt_proxy = opt_proxy == undefined ? this.opt_proxy : opt_proxy;
    this.opt_ignoreSSL = opt_ignoreSSL == undefined ? this.opt_ignoreSSL : opt_ignoreSSL;
    if (this.configSource) {
      this.configSource.opt_proxy = this.opt_proxy;
      this.configSource.opt_ignoreSSL = this.opt_ignoreSSL;
    }
    if (this.alternativeDownloadUrl != null) {
      // remove any trailing slashes on alternativeDownloadUrl
      let url = this.alternativeDownloadUrl.replace(/\/+$/, '') + '/' + this.filename();
      return Promise.resolve({url: url, version: ''});
    } else {
      return this.getVersionList().then(() => {
        version = version || Config.binaryVersions()[this.id()];
        return this.configSource.getUrl(version).then(binaryUrl => {
          this.versionCustom = binaryUrl.version;
          return {url: binaryUrl.url, version: binaryUrl.version};
        });
      });
    }
  }

  /**
   * Gets the list of available versions available based on the xml. If no XML exists, return an
   * empty list.
   */
  abstract getVersionList(): Promise<string[]>;

  /**
   * Delete an instance of this binary from the file system
   */
  remove(filename: string): void {
    fs.unlinkSync(filename);
  }

  /**
   * @param ostype The operating system.
   * @returns The file name for the file inside the downloaded zip file
   */
  zipContentName(): string {
    return this.name + this.executableSuffix();
  }
}
