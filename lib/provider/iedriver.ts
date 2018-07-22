import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { convertXmlToVersionList, updateXml } from './utils/cloud_storage_xml';
import {
  renameFileWithVersion,
  removeSymbolicLink,
  symbolicLink,
  unzipFile,
  zipFileList
} from './utils/file_utils';
import { requestBinary } from './utils/http_utils';
import { getVersion } from './utils/version_list';

export class IEDriver {
  requestUrl: string;
  outDir: string;
  fileName: string;
  osType: string;
  osArch: string;

  constructor() {
    this.requestUrl = 'https://selenium-release.storage.googleapis.com/';
    this.fileName = 'iedriver.xml'
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
    await updateXml(this.requestUrl, path.resolve(this.outDir, this.fileName));
    let versionList = convertXmlToVersionList(
      path.resolve(this.outDir, this.fileName), '.zip',
      versionParser,
      semanticVersionParser);
    let versionObj = getVersion(
      versionList, osHelper(this.osType, this.osArch), version);

    let chromeDriverUrl = this.requestUrl + versionObj.url;
    let chromeDriverZip = path.resolve(this.outDir, versionObj.name);

    // We should check the zip file size if it exists. The size will
    // be used to either make the request, or quit the request if the file
    // size matches.
    let size = 0;
    try {
      size = fs.statSync(chromeDriverZip).size;
    } catch (err) {}
    await requestBinary(chromeDriverUrl, chromeDriverZip, size);

    // Unzip and rename all the files (a grand total of 1) and set the
    // permissions.
    let fileList = zipFileList(chromeDriverZip);
    let fileItem = path.resolve(this.outDir, fileList[0]);

    removeSymbolicLink(fileItem);
    unzipFile(chromeDriverZip, this.outDir);
    let renamedFilename = renameFileWithVersion(
      fileItem, '_' + versionObj.version);
    symbolicLink(renamedFilename, fileItem);
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