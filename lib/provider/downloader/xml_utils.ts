import * as fs from 'fs';
import * as request from 'request';
import * as url from 'url';
import * as xml2js from 'xml2js';
import { initOptions, JsonObject } from './http_utils';

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
    fs.writeFileSync(fileName, contents);
    return convertXml2js(contents);
  } else {
    return readXml(fileName);
  }
}

export function isExpired(fileName: string): boolean {
  try {
    let timestamp = new Date(fs.statSync(fileName).mtime).getTime();
    let size = fs.statSync(fileName).size;
    let now = Date.now();

    if (size > 0 && (now - (60 * 60 * 1000) < timestamp)) {
      return false;
    } else {
      return true;
    }
  } catch (err) {
    return true;
  }
}

/**
 * Reads the xml file.
 * @param fileName The xml filename to read.
 */
export function readXml(
  fileName: string): JsonObject | null {
  
  try {
    let contents = fs.readFileSync(fileName).toString();
    return convertXml2js(contents);
  } catch (err) {
    return null;
  }
}

/**
 * Request the XML url and log the curl.
 * @param xmlUrl The xml url.
 * @param fileName The xml filename.
 */
export function requestXml(
    xmlUrl: string,
    fileName: string): Promise<string> {

  let options = initOptions(xmlUrl);
  let curl = fileName + ' ' + options.url;
  if (options.proxy) {
    let pathUrl = url.parse(options.url.toString()).path;
    let host = url.parse(options.url.toString()).host;
    let newFileUrl = url.resolve(options.proxy, pathUrl);
    curl = fileName + ' \'' + newFileUrl + '\' -H \'host:' + host + '\'';
  }
  if (options.ignoreSSL) {
    curl = 'k ' + curl;
  }
  console.log('curl -o ' + curl);

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