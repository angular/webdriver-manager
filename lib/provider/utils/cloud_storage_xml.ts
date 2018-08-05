import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import { convertXml2js, readXml } from './file_utils';
import { isExpired } from './file_utils';
import { HttpOptions, JsonObject, requestBody } from './http_utils';
import { VersionList } from './version_list';

/**
 * Read the xml file from cache. If the cache time has been exceeded or the
 * file does not exist, make an http request and write it to the file.
 * @param xmlUrl The xml url.
 * @param httpOptions The http options for the request.
 */
export async function updateXml(
    xmlUrl: string,
    httpOptions: HttpOptions): Promise<JsonObject> {

  if (isExpired(httpOptions.fileName)) {
    let contents = await requestBody(xmlUrl, httpOptions);
    let dir = path.dirname(httpOptions.fileName);
    try {
      fs.mkdirSync(dir);
    } catch (err) {}
    fs.writeFileSync(httpOptions.fileName, contents);
    return convertXml2js(contents);
  } else {
    return readXml(httpOptions.fileName);
  }
}


/**
 * Returns a list of versions and the partial url paths.
 * @param fileName the location of the xml file to read.
 * @returns the version list from the xml file.
 */
export function convertXmlToVersionList(
    fileName: string,
    matchFile: string,
    versionParser: (key: string) => string|null,
    semanticVersionParser: (key: string) => string): VersionList|null {
  let xmlJs = readXml(fileName);
  if (!xmlJs) {
    return null;
  }
  let versionList: VersionList = {};
  for (let content of xmlJs['ListBucketResult']['Contents']) {
    let key = content['Key'][0] as string;
    if (key.includes(matchFile)) {
      let version = versionParser(key);
      if (version) {
        let semanticVersion = semanticVersionParser(key);
        if (!semver.valid(semanticVersion)) {
          continue;
        }
        let name = key.split('/')[1];
        let size = +content['Size'][0];
        if (!versionList[semanticVersion]) {
          versionList[semanticVersion] = {};
        }
        versionList[semanticVersion][name] = {
          name: name,
          size: size,
          url: key,
          version: version
        };
      }
    }
  }
  return versionList;
}