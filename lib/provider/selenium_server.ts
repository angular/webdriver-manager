import * as fs from 'fs';
import * as path from 'path';
import {
  symbolicLink,
} from './utils/file_utils';
import { requestBinary } from './utils/http_utils';
import { convertXmlToVersionList, updateXml } from './utils/cloud_storage_xml';
import { getVersion } from './utils/version_list';

export class SeleniumServer {
  requestUrl: string;
  outDir: string;
  fileName: string;

  constructor() {
    this.requestUrl = 'https://selenium-release.storage.googleapis.com/';
    this.fileName = 'selenium-server.xml'
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
      path.resolve(this.outDir, this.fileName), 'standalone');
    let versionObj = getVersion(
      versionList, '', version);

    let seleniumServerUrl = this.requestUrl + versionObj.url;
    let seleniumServerJar = path.resolve(this.outDir, versionObj.name);

    // We should check the jar file size if it exists. The size will
    // be used to either make the request, or quit the request if the file
    // size matches.
    let size = 0;
    try {
      size = fs.statSync(seleniumServerJar).size;
    } catch (err) {}
    await requestBinary(seleniumServerUrl, seleniumServerJar, size);

    symbolicLink(seleniumServerJar,
      path.resolve(this.outDir, 'selenium-server-standalone.jar'));
    return Promise.resolve();
  }
}