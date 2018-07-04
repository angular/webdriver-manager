import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { JsonObject } from './http_utils';

/**
 * Check to see if the modified timestamp is expired.
 * @param fileName THe xml filename.
 */
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
 * Reads the json file from file.
 * @param fileName The json filename to read.
 * @returns 
 */
export function readJson(fileName: string): JsonObject[] | JsonObject | null {
  try {
    let contents = fs.readFileSync(fileName).toString();
    return JSON.parse(contents);
  } catch (err) {
    return null;
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
