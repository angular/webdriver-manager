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
      path.resolve(this.outDir, this.fileName), 'selenium-server-standalone',
      versionParser,
      semanticVersionParser);
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

/**
 * Captures the version name which includes the semantic version and extra
 * metadata. So an example for 12.34/selenium-server-standalone-12.34.56.jar,
 * the version is 12.34.56. For metadata, 
 * 12.34/selenium-server-standalone-12.34.56-beta.jar is 12.34.56-beta.
 * @param xmlKey The xml key including the partial url.
 */
export function versionParser(xmlKey: string) {
  // Capture the version name 12.34.56 or 12.34.56-beta
  let regex = /.*selenium-server-standalone-([0-9]*.[0-9]*.[0-9]*.*).jar/g
  try {
    return regex.exec(xmlKey)[1];
  } catch(_) {
    return null;
  }
}

/**
 * Captures the version name which includes the semantic version and extra
 * metadata. So an example for 12.34/selenium-server-standalone-12.34.56.jar,
 * the version is 12.34.56. For metadata, 
 * 12.34/selenium-server-standalone-12.34.56-beta.jar is still 12.34.56.
 * @param xmlKey The xml key including the partial url.
 */
export function semanticVersionParser(xmlKey: string) {
  // Only capture numbers 12.34.56
  let regex = /.*selenium-server-standalone-([0-9]*.[0-9]*.[0-9]*).*.jar/g
  try {
    return regex.exec(xmlKey)[1];
  } catch(_) {
    return null;
  }
}