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
 * @returns The renamed file name.
 */
export function renameFileWithVersion(
    srcFileName: string,
    versionNumber: string): string {
  let dirName = path.dirname(srcFileName);
  let extName = path.extname(srcFileName);
  let baseName = path.basename(srcFileName, extName);
  let dstFileName = path.resolve(dirName, baseName + versionNumber + extName);
  fs.renameSync(srcFileName, dstFileName);
  return dstFileName;
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
export async function uncompressTarball(
    tarball: string,
    dstDir: string): Promise<string[]> {
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

/**
 * Change the permissions for Linux and MacOS with chmod.
 * @param fileName The full path to the filename to change permissions.
 * @param mode The number to modify.
 * @param osType The OS type to decide if we need to change permissions on the file.
 */
export function changeFilePermissions(
    fileName: string,
    mode: string,
    osType: string) {
  if (osType === 'Darwin' || osType === 'Linux') {
    fs.chmodSync(path.resolve(fileName), mode);
  }
}

/**
 * Writes a config file that matches the regex pattern.
 * @param outDir The output directory.
 * @param fileName The full path to the file name.
 * @param fileBinaryPathRegex The regExp to match files in the outDir.
 * @param lastFileBinaryPath The full path to the last binary file downloaded.
 */
export function generateConfigFile(
    outDir: string,
    fileName: string,
    fileBinaryPathRegex: RegExp,
    lastFileBinaryPath?: string) {
  let configData: JsonObject = {};
  if (lastFileBinaryPath) {
    configData['last'] = lastFileBinaryPath;
  }
  configData['all'] = getMatchingFiles(outDir, fileBinaryPathRegex);
  fs.writeFileSync(fileName, JSON.stringify(configData));
}

/**
 * Gets matching files form the outDir and returns it as an array.
 * @param outDir The output directory.
 * @param fileBinaryPathRegex The regExp to match files in the outDir.
 */
export function getMatchingFiles(
    outDir: string,
    fileBinaryPathRegex: RegExp): string[] {
  let existFiles = fs.readdirSync(outDir);
  let matchingFiles: string[] = [];
  for (let existFile of existFiles) {
    if (existFile.match(fileBinaryPathRegex)) {
      matchingFiles.push(path.resolve(outDir, existFile));
    }
  }
  return matchingFiles;
}

/**
 * Get the binary path from the configuration file. The configuration file
 * should be formatted as { 'last': string, 'all': string[] }. In the 'all'
 * array, we should match the 'version'. The version does not necessarily have
 * to be a valid semantic version.
 * @param cacheFilePath The cache file path.
 * @param version An optional version that is not necessarily semver.
 */
export function getBinaryPathFromConfig(
    cacheFilePath: string,
    version?: string): string|null {
  let cacheJson = JSON.parse(fs.readFileSync(cacheFilePath).toString());
  let binaryPath = null;
  if (!version) {
    binaryPath = cacheJson['last'];
  } else {
    for (let cachePath of cacheJson['all']) {
      if (cachePath.match(version)) {
        binaryPath = cachePath;
      }
    }
  }
  return binaryPath;
}

/**
 * Removes the files that match the regular expressions and returns a string
 * of removed files.
 * @param outDir The output directory.
 * @param fileRegexes The regExp to match files to remove in the outDir.
 */
export function removeFiles(outDir: string, fileRegexes: RegExp[]): string {
  let existFiles = fs.readdirSync(outDir);
  let removedFiles: string[] = [];
  for (let fileRegex of fileRegexes) {
    for (let existFile of existFiles) {
      if (existFile.match(fileRegex)) {
        removedFiles.push(existFile);
        fs.unlinkSync(path.resolve(outDir, existFile));
      }
    }
  }
  return (removedFiles.sort()).join('\n');
}