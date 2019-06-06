import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {OUT_DIR, ProviderClass, ProviderConfig, ProviderInterface} from './provider';
import {convertXmlToVersionList, updateXml,} from './utils/cloud_storage_xml';
import {generateConfigFile, getBinaryPathFromConfig, removeFiles, renameFileWithVersion, unzipFile, zipFileList,} from './utils/file_utils';
import {requestBinary} from './utils/http_utils';
import {getVersion} from './utils/version_list';

export class IEDriver extends ProviderClass implements ProviderInterface {
  cacheFileName = 'iedriver.xml';
  configFileName = 'iedriver.config.json';
  ignoreSSL = false;
  osType = os.type();
  osArch = os.arch();
  outDir = OUT_DIR;
  proxy: string = null;
  requestUrl = 'https://selenium-release.storage.googleapis.com/';
  seleniumFlag = '-Dwebdriver.ie.driver';
  version: string = null;
  maxVersion: string = null;

  constructor(config?: ProviderConfig) {
    super();
    this.cacheFileName = this.setVar('cacheFileName', this.cacheFileName, config);
    this.configFileName = this.setVar('configFileName', this.configFileName, config);
    this.ignoreSSL = this.setVar('ignoreSSL', this.ignoreSSL, config);
    this.osArch = this.setVar('osArch', this.osArch, config);
    this.osType = this.setVar('osType', this.osType, config);
    this.outDir = this.setVar('outDir', this.outDir, config);
    this.proxy = this.setVar('proxy', this.proxy, config);
    this.requestUrl = this.setVar('requestUrl', this.requestUrl, config);
    this.version = this.setVar('version', this.version, config);
    this.maxVersion = this.setVar('maxVersion', this.maxVersion, config);
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
    await updateXml(this.requestUrl, {
      fileName: path.resolve(this.outDir, this.cacheFileName),
      ignoreSSL: this.ignoreSSL,
      proxy: this.proxy
    });
    const versionList = convertXmlToVersionList(
        path.resolve(this.outDir, this.cacheFileName), '.zip', versionParser,
        semanticVersionParser);
    const versionObj =
        getVersion(versionList, osHelper(this.osType, this.osArch), version,
        maxVersion);

    const chromeDriverUrl = this.requestUrl + versionObj.url;
    const chromeDriverZip = path.resolve(this.outDir, versionObj.name);

    // We should check the zip file size if it exists. The size will
    // be used to either make the request, or quit the request if the file
    // size matches.
    let fileSize = 0;
    try {
      fileSize = fs.statSync(chromeDriverZip).size;
    } catch (err) {
    }
    await requestBinary(chromeDriverUrl, {
      fileName: chromeDriverZip,
      fileSize,
      ignoreSSL: this.ignoreSSL,
      proxy: this.proxy
    });

    // Unzip and rename all the files (a grand total of 1) and set the
    // permissions.
    const fileList = zipFileList(chromeDriverZip);
    const fileItem = path.resolve(this.outDir, fileList[0]);

    unzipFile(chromeDriverZip, this.outDir);
    const renamedFileName =
        renameFileWithVersion(fileItem, '_' + versionObj.version);
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
        const regex = /.*IEDriverServer_(\d+.\d+.\d+.*).exe/g;
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
    return removeFiles(this.outDir, [/IEDriverServer.*/g, /iedriver.*/g]);
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
  if (ostype === 'Windows_NT') {
    if (osarch === 'x64') {
      return 'Win32';
    } else if (osarch === 'x32') {
      return 'Win32';
    }
  }
  return null;
}

/**
 * Captures the version name which includes the semantic version and extra
 * metadata. So an example for 12.34/IEDriverServer_win32_12.34.56.zip,
 * the version is 12.34.56.
 * @param xmlKey The xml key including the partial url.
 */
export function versionParser(xmlKey: string) {
  const regex = /.*\/IEDriverServer_[a-zA-Z0-9]*_([0-9]*.[0-9]*.[0-9]*).zip/g;
  try {
    return regex.exec(xmlKey)[1];
  } catch (_) {
    return null;
  }
}

/**
 * Captures the semantic version name which includes the semantic version and
 * extra metadata. So an example for 12.34/IEDriverServer_win32_12.34.56.zip,
 * the version is 12.34.56.
 * @param xmlKey The xml key including the partial url.
 */
export function semanticVersionParser(xmlKey: string) {
  const regex = /.*\/IEDriverServer_[a-zA-Z0-9]*_([0-9]*.[0-9]*.[0-9]*).zip/g;
  try {
    return regex.exec(xmlKey)[1];
  } catch (_) {
    return null;
  }
}

/**
 * Matches the installed binaries depending on the operating system.
 * @param ostype The operating stystem type.
 */
export function matchBinaries(ostype: string): RegExp|null {
  if (ostype === 'Windows_NT') {
    return /IEDriverServer_\d+.\d+.\d+.exe/g;
  }
  return null;
}
