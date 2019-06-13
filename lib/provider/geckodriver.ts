import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {OUT_DIR, ProviderClass, ProviderConfig, ProviderInterface} from './provider';
import {changeFilePermissions, generateConfigFile, getBinaryPathFromConfig, removeFiles, renameFileWithVersion, tarFileList, uncompressTarball, unzipFile, zipFileList,} from './utils/file_utils';
import {convertJsonToVersionList, updateJson} from './utils/github_json';
import {requestBinary} from './utils/http_utils';
import {getVersion} from './utils/version_list';

export interface GeckoDriverProviderConfig extends ProviderConfig {
  oauthToken?: string;
}

export class GeckoDriver extends ProviderClass implements ProviderInterface {
  cacheFileName = 'geckodriver.json';
  configFileName = 'geckodriver.config.json';
  ignoreSSL = false;
  oauthToken: string;
  osType = os.type();
  osArch = os.arch();
  outDir = OUT_DIR;
  proxy: string = null;
  requestUrl = 'https://api.github.com/repos/mozilla/geckodriver/releases';
  seleniumFlag = '-Dwebdriver.gecko.driver';
  version: string = null;
  maxVersion: string = null;

  constructor(config?: GeckoDriverProviderConfig) {
    super();
    this.cacheFileName = this.setVar('cacheFileName', this.cacheFileName, config);
    this.configFileName = this.setVar('configFileName', this.configFileName, config);
    this.ignoreSSL = this.setVar('ignoreSSL', this.ignoreSSL, config);
    this.osArch = this.setVar('osArch', this.osArch, config);
    this.osType = this.setVar('osType', this.osType, config);
    this.outDir = this.setVar('outDir', this.outDir, config);
    this.proxy = this.setVar('proxy', this.proxy, config);
    this.requestUrl = this.setVar('requestUrl', this.requestUrl, config);
    this.oauthToken = this.setVar('oauthToken', this.oauthToken, config);
    this.version = this.setVar('version', this.version, config);
    this.maxVersion = this.setVar('maxVersion', this.version, config);
  }

  /**
   * Should update the cache and download, find the version to download,
   * then download that binary.
   * @param version Optional to provide the version number or latest.
   * @param maxVersion Optional to provide the max version.
   */
  async updateBinary(version?: string, maxVersion?: string): Promise<void> {
    if (!version) {
      version = this.version;
    }
    if (!maxVersion) {
      maxVersion = this.maxVersion;
    }
    await updateJson(
        this.requestUrl, {
          fileName: path.resolve(this.outDir, this.cacheFileName),
          ignoreSSL: this.ignoreSSL,
          proxy: this.proxy
        },
        this.oauthToken);

    const versionList =
        convertJsonToVersionList(path.resolve(this.outDir, this.cacheFileName));
    const versionObj =
        getVersion(versionList, osHelper(this.osType, this.osArch), version,
        maxVersion);

    const geckoDriverUrl = versionObj.url;
    const geckoDriverCompressed = path.resolve(this.outDir, versionObj.name);

    // We should check the zip file size if it exists. The size will
    // be used to either make the request, or quit the request if the file
    // size matches.
    let fileSize = 0;
    try {
      fileSize = fs.statSync(geckoDriverCompressed).size;
    } catch (err) {
    }
    await requestBinary(geckoDriverUrl, {
      fileName: geckoDriverCompressed,
      fileSize,
      ignoreSSL: this.ignoreSSL,
      proxy: this.proxy
    });

    // Uncompress tarball (for linux and mac) or unzip the file for Windows.
    // Rename all the files (a grand total of 1) and set the permissions.
    let fileList: string[];
    if (this.osType === 'Windows_NT') {
      fileList = zipFileList(geckoDriverCompressed);
    } else {
      fileList = await tarFileList(geckoDriverCompressed);
    }
    const fileItem = path.resolve(this.outDir, fileList[0]);

    if (this.osType === 'Windows_NT') {
      unzipFile(geckoDriverCompressed, this.outDir);
    } else {
      await uncompressTarball(geckoDriverCompressed, this.outDir);
    }

    const renamedFileName =
        renameFileWithVersion(fileItem, '_' + versionObj.version);

    changeFilePermissions(renamedFileName, '0755', this.osType);
    generateConfigFile(
        this.outDir, path.resolve(this.outDir, this.configFileName),
        matchBinaries(this.osType), renamedFileName);
    return Promise.resolve();
  }

  /**
   * Gets the binary file path.
   * @param version Optional to provide the version number or latest.
   */
  getBinaryPath(version?: string): string|null {
    try {
      const configFilePath = path.resolve(this.outDir, this.configFileName);
      return getBinaryPathFromConfig(configFilePath, version);
    } catch (_) {
      return null;
    }
  }

  /**
   * Gets a comma delimited list of versions downloaded. Also has the "latest"
   * downloaded noted.
   */
  getStatus(): string|null {
    try {
      const configFilePath = path.resolve(this.outDir, this.configFileName);
      const configJson = JSON.parse(fs.readFileSync(configFilePath).toString());
      const versions: string[] = [];
      for (const binaryPath of configJson['all']) {
        let version = '';
        let regex = /.*geckodriver_(\d+.\d+.\d+.*)/g;
        if (this.osType === 'Windows_NT') {
          regex = /.*geckodriver_(\d+.\d+.\d+.*).exe/g;
        }
        try {
          const exec = regex.exec(binaryPath);
          if (exec && exec[1]) {
            version = exec[1];
          }
        } catch (_) {
        }

        if (configJson['last'] === binaryPath) {
          version += ' (latest)';
        }
        versions.push(version);
      }
      return versions.join(', ');
    } catch (_) {
      return null;
    }
  }

  /**
   * Get a line delimited list of files removed.
   */
  cleanFiles(): string {
    return removeFiles(this.outDir, [/geckodriver.*/g]);
  }
}

/**
 * Helps translate the os type and arch to the download name associated
 * with composing the download link.
 * @param ostype The operating stystem type.
 * @param osarch The chip architecture.
 * @returns The download name associated with composing the download link.
 */
export function osHelper(ostype: string, osarch: string): string {
  if (ostype === 'Darwin') {
    return 'macos';
  } else if (ostype === 'Windows_NT') {
    if (osarch === 'x64') {
      return 'win64';
    } else if (osarch === 'x32') {
      return 'win32';
    }
  } else if (ostype === 'Linux') {
    if (osarch === 'x64') {
      return 'linux64';
    } else if (osarch === 'x32') {
      return 'linux32';
    }
  }
  return null;
}

/**
 * Matches the installed binaries depending on the operating system.
 * @param ostype The operating stystem type.
 */
export function matchBinaries(ostype: string): RegExp|null {
  if (ostype === 'Darwin' || ostype === 'Linux') {
    return /geckodriver_\d+.\d+.\d+/g;
  } else if (ostype === 'Windows_NT') {
    return /geckodriver_\d+.\d+.\d+.exe/g;
  }
  return null;
}