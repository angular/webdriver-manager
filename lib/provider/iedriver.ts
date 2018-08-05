import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { convertXmlToVersionList, updateXml } from './utils/cloud_storage_xml';
import {
  renameFileWithVersion,
  unzipFile,
  zipFileList,
  generateConfigFile,
} from './utils/file_utils';
import { requestBinary } from './utils/http_utils';
import { getVersion } from './utils/version_list';

export class IEDriver {
  requestUrl: string;
  outDir: string;
  cacheFileName: string;
  configFileName: string;
  osType: string;
  osArch: string;

  constructor() {
    this.requestUrl = 'https://selenium-release.storage.googleapis.com/';
    this.cacheFileName = 'iedriver.xml';
    this.configFileName = 'iedriver.config.json';
    this.osType = os.type();
    this.osArch = os.arch();
    this.outDir = path.resolve('.');
  }

  /**
   * Should update the cache and download, find the version to download,
   * then download that binary.
   * @param version Optional to provide the version number or latest.
   */
  async updateBinary(version?: string): Promise<any> {
    await updateXml(this.requestUrl,
      { fileName: path.resolve(this.outDir, this.cacheFileName) });
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
      { fileName: chromeDriverZip, fileSize });

    // Unzip and rename all the files (a grand total of 1) and set the
    // permissions.
    let fileList = zipFileList(chromeDriverZip);
    let fileItem = path.resolve(this.outDir, fileList[0]);

    unzipFile(chromeDriverZip, this.outDir);
    let renamedFileName = renameFileWithVersion(
      fileItem, '_' + versionObj.version);
    generateConfigFile(this.outDir,
      path.resolve(this.outDir, this.configFileName),
      matchBinaries(this.osType), renamedFileName);
    return Promise.resolve();
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
    if (osarch === 'x64')  {
      return 'Win32';
    }
    else if (osarch === 'x32') {
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
  let regex = /.*\/IEDriverServer_[a-zA-Z0-9]*_([0-9]*.[0-9]*.[0-9]*).zip/g
  try {
    return regex.exec(xmlKey)[1];
  } catch(_) {
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
  let regex = /.*\/IEDriverServer_[a-zA-Z0-9]*_([0-9]*.[0-9]*.[0-9]*).zip/g
  try {
    return regex.exec(xmlKey)[1];
  } catch(_) {
    return null;
  }
}

/**
 * Matches the installed binaries depending on the operating system.
 * @param ostype The operating stystem type.
 */
export function matchBinaries(ostype: string): RegExp | null {
  if (ostype === 'Windows_NT') {
    return /IEDriverServer_\d+.\d+.\d+.exe/g
  }
  return null;
}
