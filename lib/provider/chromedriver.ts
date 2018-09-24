import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {OUT_DIR, ProviderConfig, ProviderInterface} from './provider';
import {convertXmlToVersionList, updateXml} from './utils/cloud_storage_xml';
import {changeFilePermissions, generateConfigFile, getBinaryPathFromConfig, removeFiles, renameFileWithVersion, unzipFile, zipFileList,} from './utils/file_utils';
import {requestBinary} from './utils/http_utils';
import {getVersion} from './utils/version_list';

export class ChromeDriver implements ProviderInterface {
  cacheFileName = 'chromedriver.xml';
  configFileName = 'chromedriver.config.json';
  ignoreSSL = false;
  osType = os.type();
  osArch = os.arch();
  outDir = OUT_DIR;
  proxy: string = null;
  requestUrl = 'https://chromedriver.storage.googleapis.com/';
  seleniumFlag = '-Dwebdriver.chrome.driver';

  constructor(providerConfig?: ProviderConfig) {
    if (providerConfig) {
      if (providerConfig.cacheFileName) {
        this.cacheFileName = providerConfig.cacheFileName;
      }
      if (providerConfig.configFileName) {
        this.configFileName = providerConfig.configFileName;
      }
      this.ignoreSSL = providerConfig.ignoreSSL;
      if (providerConfig.osArch) {
        this.osArch = providerConfig.osArch;
      }
      if (providerConfig.osType) {
        this.osType = providerConfig.osType;
      }
      if (providerConfig.outDir) {
        this.outDir = providerConfig.outDir;
      }
      if (providerConfig.proxy) {
        this.proxy = providerConfig.proxy;
      }
      if (providerConfig.requestUrl) {
        this.requestUrl = providerConfig.requestUrl;
      }
    }
  }

  /**
   * Should update the cache and download, find the version to download,
   * then download that binary.
   * @param version Optional to provide the version number or latest.
   */
  async updateBinary(version?: string): Promise<void> {
    await updateXml(this.requestUrl, {
      fileName: path.resolve(this.outDir, this.cacheFileName),
      ignoreSSL: this.ignoreSSL,
      proxy: this.proxy
    });

    const versionList = convertXmlToVersionList(
        path.resolve(this.outDir, this.cacheFileName), '.zip', versionParser,
        semanticVersionParser);
    if (version) {
      version = version + '.0';
    }
    const versionObj =
        getVersion(versionList, osHelper(this.osType, this.osArch), version);

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
        let regex = /.*chromedriver_(\d+.\d+.*)/g;
        if (this.osType === 'Windows_NT') {
          regex = /.*chromedriver_(\d+.\d+.*).exe/g;
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
    return removeFiles(this.outDir, [/chromedriver.*/g]);
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
    return 'mac';
  } else if (ostype === 'Windows_NT') {
    if (osarch === 'x64') {
      return 'win32';
    } else if (osarch === 'x32') {
      return 'win32';
    }
  } else if (ostype === 'Linux') {
    if (osarch === 'x64') {
      return 'linux64';
    } else if (osarch === 'x32') {
      return null;
    }
  }
  return null;
}

/**
 * Captures the version name which includes the semantic version and extra
 * metadata. So an example for 12.34/chromedriver_linux64.zip,
 * the version is 12.34.
 *
 * The new version is 70.0.3538.16/chromedriver_linux64.zip. This will return
 * 70.0.3538.16.
 * @param xmlKey The xml key including the partial url.
 */
export function versionParser(xmlKey: string) {
  const newRegex = /([0-9]*\.[0-9]*\.[0-9]*\.[0-9]*)\/chromedriver_.*\.zip/g;
  try {
    const exec = newRegex.exec(xmlKey);
    if (exec) {
      return exec[1];
    }
  } catch (_) {
  }
  const oldRegex = /([0-9]*\.[0-9]*)\/chromedriver_.*\.zip/g;
  try {
    const exec = oldRegex.exec(xmlKey);
    if (exec) {
      return exec[1];
    }
  } catch (_) {
  }
  return null;
}

/**
 * Captures the version name which includes the semantic version and extra
 * metadata. So an example for 12.34/chromedriver_linux64.zip,
 * the version is 12.34.0.
 *
 * The new version is 70.0.3538.16/chromedriver_linux64.zip. This will return
 * 70.0.3538.
 * @param xmlKey The xml key including the partial url.
 */
export function semanticVersionParser(xmlKey: string): string|null {
  const newRegex = /([0-9]*\.[0-9]*\.[0-9]*).[0-9]*\/chromedriver_.*\.zip/g;
  try {
    const exec = newRegex.exec(xmlKey);
    if (exec) {
      return exec[1];
    }
  } catch (_) {
  }
  const oldRegex = /([0-9]*\.[0-9]*)\/chromedriver_.*\.zip/g;
  try {
    const exec = oldRegex.exec(xmlKey);
    if (exec) {
      return exec[1] + '.0';
    }
  } catch (_) {
  }
  return null;
}

/**
 * Matches the installed binaries depending on the operating system.
 * @param ostype The operating stystem type.
 */
export function matchBinaries(ostype: string): RegExp|null {
  if (ostype === 'Darwin' || ostype === 'Linux') {
    return /chromedriver_\d+.\d+.*/g;
  } else if (ostype === 'Windows_NT') {
    return /chromedriver_\d+.\d+.*.exe/g;
  }
  return null;
}