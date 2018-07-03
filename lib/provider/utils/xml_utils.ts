import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as xml2js from 'xml2js';

import { isExpired } from './file_manager';
import { curlCommand, initOptions, JsonObject } from './http_utils';
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
    let contents = await requestXml(xmlUrl, fileName);
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
 * Reads the xml file.
 * @param fileName The xml filename to read.
 */
export function readXml(fileName: string): JsonObject | null {
  try {
    let contents = fs.readFileSync(fileName).toString();
    return convertXml2js(contents);
  } catch (err) {
    return null;
  }
}

/**
 * Request the XML url.
 * @param xmlUrl The xml url.
 * @param fileName The xml filename.
 */
export function requestXml(
    xmlUrl: string,
    fileName: string): Promise<string> {

  let options = initOptions(xmlUrl);
  console.log(curlCommand(options, fileName));

  return new Promise((resolve, reject) => {
    let req = request(options);
    req.on('response', response => {
      if (response.statusCode === 200) {
        let output = '';
        response.on('data', (data) => {
          output += data;
        });
        response.on('end', () => {
          resolve(output);
        });
      } else {
        reject(new Error('response status code is not 200'));
      }
    });
    req.on('error', error => {
      reject(error);
    });
  });
}

/**
 * Convert the xml file to an object.
 * @param content The xml contents.
 */
export function convertXml2js(
  content: string): JsonObject | null {
  let retResult: JsonObject = null;
  xml2js.parseString(content, (err, result) => {
    retResult = result;
  });
  return retResult;
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