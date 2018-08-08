import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Flag } from '../flags';
import {
  OUT_DIR,
  Provider,
  ProviderConfig
} from './provider';
import {
  changeFilePermissions,
  renameFileWithVersion,
  unzipFile,
  zipFileList,
  generateConfigFile,
} from './utils/file_utils';
import { requestBinary } from './utils/http_utils';
import { convertXmlToVersionList, updateXml } from './utils/cloud_storage_xml';
import { getVersion } from './utils/version_list';


export const CHROME_VERSION: Flag = {
  flagName: 'versions.chrome',
  type: 'string',
  description: 'Optional chrome driver version (use \'latest\' ' +
    'to get the most recent version)',
  default: 'latest'
};

export class ChromeDriver implements Provider {
  requestUrl = 'https://chromedriver.storage.googleapis.com/';
  outDir = OUT_DIR;
  cacheFileName = 'chromedriver.xml';
  configFileName = 'chromedriver.config.json';
  osType = os.type();
  osArch = os.arch();
  proxy: string = null;

  constructor(providerConfig?: ProviderConfig) {
    if (providerConfig) {
      if (providerConfig.cacheFileName) {
        this.cacheFileName = providerConfig.cacheFileName;
      }
      if (providerConfig.configFileName) {
        this.configFileName = providerConfig.configFileName;
      }
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
  async updateBinary(version?: string): Promise<any> {
    await updateXml(this.requestUrl, { 
      fileName: path.resolve(this.outDir, this.cacheFileName),
      proxy: this.proxy });

    let versionList = convertXmlToVersionList(
      path.resolve(this.outDir, this.cacheFileName), '.zip',
      versionParser,
      semanticVersionParser);
    let versionObj = getVersion(
      versionList, osHelper(this.osType, this.osArch), version);

    let chromeDriverUrl = this.requestUrl + versionObj.url;
    let chromeDriverZip = path.resolve(this.outDir, versionObj.name);

    // We should check the zip file size if it exists. The size will
    // be used to either make the request, or quit the request if the file
    // size matches.
    let fileSize = 0;
    try {
      fileSize = fs.statSync(chromeDriverZip).size;
    } catch (err) {}
    await requestBinary(chromeDriverUrl,
      { fileName: chromeDriverZip, fileSize, proxy: this.proxy });

    // Unzip and rename all the files (a grand total of 1) and set the
    // permissions.
    let fileList = zipFileList(chromeDriverZip);
    let fileItem = path.resolve(this.outDir, fileList[0]);
    unzipFile(chromeDriverZip, this.outDir);
    let renamedFileName = renameFileWithVersion(
      fileItem, '_' + versionObj.version);
    changeFilePermissions(renamedFileName, '0755', this.osType);

    generateConfigFile(this.outDir,
      path.resolve(this.outDir, this.configFileName),
      matchBinaries(this.osType), renamedFileName);
    return Promise.resolve();
  }

  // TODO(cnishina): A list of chromedriver versions downloaded

  // TODO(cnishina): Remove files downloaded
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
    if (osarch === 'x64')  {
      return 'win32';
    }
    else if (osarch === 'x32') {
      return 'win32';
    }
  } else if (ostype == 'Linux') {
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
 * @param xmlKey The xml key including the partial url.
 */
export function versionParser(xmlKey: string) {
  let regex = /([0-9]*.[0-9]*)\/chromedriver_.*.zip/g
  try {
    let exec = regex.exec(xmlKey);
    if (exec) {
      return exec[1];
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Captures the version name which includes the semantic version and extra
 * metadata. So an example for 12.34/chromedriver_linux64.zip,
 * the version is 12.34.00.
 * @param xmlKey The xml key including the partial url.
 */
export function semanticVersionParser(xmlKey: string): string | null {
  let regex = /([0-9]*.[0-9]*)\/chromedriver_.*.zip/g
  try {
    let exec = regex.exec(xmlKey);
    if (exec) {
      return exec[1] + '.0';
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Matches the installed binaries depending on the operating system.
 * @param ostype The operating stystem type.
 */
export function matchBinaries(ostype: string): RegExp | null {
  if (ostype === 'Darwin' || ostype == 'Linux') {
    return /chromedriver_\d+.\d+/g
  } else if (ostype === 'Windows_NT') {
    return /chromedriver_\d+.\d+.exe/g
  }
  return null;
}