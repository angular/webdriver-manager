import * as os from 'os';
import * as path from 'path';

import { Flag } from '../flags';
import * as binaryUtils from './downloader/binary_utils';
import * as xmlUtils from './downloader/xml_utils';
import { getVersion, VersionList, VersionObj } from './version_list';


export const CHROME_VERSION: Flag = {
  flagName: 'versions.chrome',
  type: 'string',
  description: 'Optional chrome driver version (use \'latest\' to get the most recent version)',
  default: 'latest'
};

export class ChromeDriver {
  requestUrl = 'https://chromedriver.storage.googleapis.com/';
  outDir = path.resolve('.');
  fileName = 'chromedriver.xml';
  osType = os.type();
  osArch = os.arch();

  // TODO(cnishina): WIP, should complete the async binary download.
  /**
   * Should update the cache and download, find the version to download,
   * then download that binary.
   * @param version Optional to provide the version number or latest.
   */
  async updateBinary(version?: string): Promise<boolean> {
    await xmlUtils.updateXml(this.requestUrl, path.resolve(this.outDir, this.fileName));
    let versionList = convertXmlToVersionList(path.resolve(this.outDir, this.fileName));
    let versionObjMap = getVersion(versionList, version);
    let versionObj = getVersionObj(versionObjMap, this.osType, this.osArch);
    let chromeDriverUrl = this.requestUrl + versionObj.url;
    let chromeDriverZip = path.resolve(this.outDir, 'chromedriver.zip');
    return await binaryUtils.requestBinary(chromeDriverUrl,
      chromeDriverZip, 0);
  }
}

/**
 * Returns a list of versions and the partial url paths.
 * @param fileName the location of the xml file to read.
 * @returns the version list from the xml file.
 */
export function convertXmlToVersionList(fileName: string): VersionList | null {
  let xmlJs = xmlUtils.readXml(fileName);
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

/**
 * Helps translate the os type and arch to the download name associated
 * with composing the download link.
 * @param ostype The operating stystem type.
 * @param osarch The chip architecture.
 * @returns The download name associated with composing the download link. 
 */
export function osHelper(ostype: string, osarch: string): string {
  if (ostype === 'Darwin') {
    return 'mac';
  } else if (ostype === 'Windows_NT') {
    if (osarch === 'x64')  {
      return 'win64';
    }
    else if (osarch === 'x32') {
      return 'win32';
    }
  } else {
    if (osarch === 'x64') {
      return 'linux64';
    } else if (osarch === 'x32') {
      return 'linux32';
    }
  }
  return null;
}

/**
 * Get the version obj from the map.
 * @param versionObjs A map of partial urls to VersionObj
 * @param ostype The OS name
 * @param osarch The OS architecture.
 * @returns Either a VersionObj or null.
 */
export function getVersionObj(versionObjMap: {[key:string]: VersionObj},
    ostype: string, osarch: string): VersionObj|null {
  let osMatch = osHelper(ostype, osarch);
  for (let partialUrl of Object.keys(versionObjMap)) {
    if (partialUrl.includes(osMatch)) {
      return versionObjMap[partialUrl];
    }
  }
  return null;
}