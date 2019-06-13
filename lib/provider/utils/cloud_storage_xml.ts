import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import {convertXml2js, isExpired, readXml} from './file_utils';
import {HttpOptions, JsonObject, requestBody} from './http_utils';
import {VersionList} from './version_list';

/**
 * Read the xml file from cache. If the cache time has been exceeded or the
 * file does not exist, make an http request and write it to the file.
 * @param xmlUrl The xml url.
 * @param httpOptions The http options for the request.
 */
export async function updateXml(
    xmlUrl: string, httpOptions: HttpOptions): Promise<JsonObject> {
  if (isExpired(httpOptions.fileName)) {
    const contents = await requestBody(xmlUrl, httpOptions);
    const dir = path.dirname(httpOptions.fileName);
    try {
      fs.mkdirSync(dir);
    } catch (err) {
    }
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
    fileName: string, matchFile: string,
    versionParser: (key: string) => string | null,
    semanticVersionParser: (key: string) => string): VersionList|null {
  const xmlJs = readXml(fileName);
  if (!xmlJs) {
    return null;
  }
  const versionList: VersionList = {};
  for (const content of xmlJs['ListBucketResult']['Contents']) {
    const key = content['Key'][0] as string;
    if (key.includes(matchFile)) {
      const version = versionParser(key);
      if (version) {
        const semanticVersion = semanticVersionParser(key);
        if (!semver.valid(semanticVersion)) {
          continue;
        }
        const name = key.split('/')[1];
        const size = +content['Size'][0];
        if (!versionList[semanticVersion]) {
          versionList[semanticVersion] = {};
        }
        versionList[semanticVersion][name] = {name, size, url: key, version};
      }
    }
  }
  return versionList;
}