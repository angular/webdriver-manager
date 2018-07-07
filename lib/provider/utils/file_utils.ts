import * as AdmZip from 'adm-zip';
import * as tar from 'tar';
import * as fs from 'fs';
import * as path from 'path';
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

/**
 * Renames a file with a semantic version.
 * @param srcFileName The full path to the original file name.
 * @param versionNumber The semver number.
 */
export function renameFileWithVersion(srcFileName: string, versionNumber: string) {
  let dirName = path.dirname(srcFileName);
  let extName = path.extname(srcFileName);
  let baseName = path.basename(srcFileName, extName);
  let dstFileName = path.resolve(dirName, baseName + versionNumber + extName);
  fs.renameSync(srcFileName, dstFileName);
}

/**
 * Gets a list of files in the zip file.
 * @param zipFileName The zip file.
 * @returns A list of files in the zip file.
 */
export function zipFileList(zipFileName: string): string[] {
  let fileList: string[] = [];
  let zip = new AdmZip(zipFileName);
  zip.getEntries().forEach(entry => {
    fileList.push(entry.name);
  });
  return fileList;
}

/**
 * Uncompress the zip file to a destination directory.
 * @param zipFileName The zip file.
 * @param dstDir The destination directory for the contents of the zip file.
 * @returns A list of uncompressed files.
 */
export function unzipFile(zipFileName: string, dstDir: string): string[] {
  let fileList: string[] = [];
  let zip = new AdmZip(zipFileName);
  zip.extractAllTo(dstDir, true);
  for (let fileItem of zipFileList(zipFileName)) {
    fileList.push(path.resolve(dstDir, fileItem));
  }
  return fileList;
}

/**
 * Gets a list of files in the tarball file.
 * @param tarball The tarball file.
 * @returns A lsit of files in the tarball file.
 */
export function tarFileList(tarball: string): Promise<string[]> {
  let fileList: string[] = [];
  return tar.list({
    file: tarball,
    onentry: entry => {
      fileList.push(entry['path'].toString());
    }
   }).then(() => {
    return fileList;
   });
}

/**
 * Uncompress the tar file to a destination directory.
 * @param tarball The tarball file.
 * @param dstDir The destination directory for the contents of the zip file.
 * @returns A list of uncompressed files.
 */
export async function untarFile(tarball: string, dstDir: string): Promise<string[]> {
  try {
    fs.mkdirSync(path.resolve(dstDir));
  } catch (err) { }
  
  let fileList = await tarFileList(tarball);
  return tar.extract({
    file: tarball
  }).then(() => {
    let dstFiles: string[] = [];
    for (let fileItem of fileList) {
      let dstFileName = path.resolve(dstDir, fileItem);
      fs.renameSync(path.resolve(fileItem), dstFileName);
      dstFiles.push(dstFileName);
    }
    return dstFiles;
  });
}
