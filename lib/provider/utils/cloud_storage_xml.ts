import * as fs from 'fs';
import * as path from 'path';


import { convertXml2js, readXml } from './file_utils';
import { isExpired } from './file_utils';
import { requestBody, JsonObject } from './http_utils';
import { VersionList } from './version_list';

/**
 * Read the xml file from cache. If the cache time has been exceeded or the
 * file does not exist, make an http request and write it to the file.
 * @param xmlUrl The xml url.
 * @param fileName The xml filename.
 */
export async function updateXml(
    xmlUrl: string,
    fileName: string): Promise<JsonObject> {

  if (isExpired(fileName)) {
    let contents = await requestBody(xmlUrl, fileName);
    let dir = path.dirname(fileName);
    try {
      fs.mkdirSync(dir);
    } catch (err) {}
    fs.writeFileSync(fileName, contents);
    return convertXml2js(contents);
  } else {
    return readXml(fileName);
  }
}


/**
 * Returns a list of versions and the partial url paths.
 * @param fileName the location of the xml file to read.
 * @returns the version list from the xml file.
 */
export function convertXmlToVersionList(fileName: string): VersionList | null {
  let xmlJs = readXml(fileName);
  if (!xmlJs) {
    return null;
  }
  let versionList: VersionList = {};
  for (let content of xmlJs['ListBucketResult']['Contents']) {
    let key = content['Key'][0] as string;
    if (key.includes('.zip')) {
      let version = key.split('/')[0] + '.0';
      let name = key.split('/')[1];
      let size = +content['Size'][0];
      if (!versionList[version]) {
        versionList[version] = {};
      }
      versionList[version][name] = {
        url: key,
        size: size
      };
    }
  }
  return versionList;
}