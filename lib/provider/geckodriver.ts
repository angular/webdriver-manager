import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  changeFilePermissions,
  renameFileWithVersion,
  symbolicLink,
  uncompressTarball,
  unzipFile
} from './utils/file_utils';
import { convertJsonToVersionList, updateJson } from './utils/github_json';
import { requestBinary } from './utils/http_utils';
import { getVersion } from './utils/version_list';

export class GeckoDriver {
  requestUrl: string;
  outDir: string;
  fileName: string;
  osType: string;
  osArch: string;
  oauthToken: string;

  constructor() {
    this.requestUrl = 'https://api.github.com/repos/mozilla/geckodriver/releases';
    this.fileName = 'geckodriver.json'
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
    await updateJson(this.requestUrl, path.resolve(this.outDir, this.fileName),
      this.oauthToken);
    let versionList = convertJsonToVersionList(
      path.resolve(this.outDir, this.fileName));
    let versionObj = getVersion(
      versionList, osHelper(this.osType, this.osArch), version);

    let geckoDriverUrl = versionObj.url;
    let geckoDriverCompressed = path.resolve(this.outDir, versionObj.name);

    // We should check the zip file size if it exists. The size will
    // be used to either make the request, or quit the request if the file
    // size matches.
    let size = 0;
    try {
      size = fs.statSync(geckoDriverCompressed).size;
    } catch (err) {}
    await requestBinary(geckoDriverUrl, geckoDriverCompressed, size);

    // Uncompress tarball (for linux and mac) or unzip the file for Windows.
    // Rename all the files (a grand total of 1) and set the permissions.
    let fileList: string[];
    let fileItem: string;
    if (this.osType === 'Windows_NT') {
      fileList = unzipFile(geckoDriverCompressed, this.outDir);
    } else {
      fileList = await uncompressTarball(geckoDriverCompressed, this.outDir);
    }
    fileItem = fileList[0];
    let renamedFilename = renameFileWithVersion(
      fileItem, '_' + versionObj.version);

    changeFilePermissions(renamedFilename, '0755', this.osType);
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
  if (ostype === 'Darwin') {
    return 'macos';
  } else if (ostype === 'Windows_NT') {
    if (osarch === 'x64')  {
      return 'win64';
    }
    else if (osarch === 'x32') {
      return 'win32';
    }
  } else if (ostype == 'Linux') {
    if (osarch === 'x64') {
      return 'linux64';
    } else if (osarch === 'x32') {
      return 'linux32';
    }
  }
  return null;
}