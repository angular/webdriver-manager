import * as os from 'os';
import * as path from 'path';

import { Flag } from '../flags';
import { requestBinary } from './utils/http_utils';
import { convertXmlToVersionList, updateXml } from './utils/cloud_storage_xml';
import { getVersion, getVersionObj } from './utils/version_list';


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
    await updateXml(this.requestUrl, path.resolve(this.outDir, this.fileName));
    let versionList = convertXmlToVersionList(path.resolve(this.outDir, this.fileName));
    let versionObjMap = getVersion(versionList, version);
    let versionObj = getVersionObj(versionObjMap, osHelper(this.osType, this.osArch));
    let chromeDriverUrl = this.requestUrl + versionObj.url;
    let chromeDriverZip = path.resolve(this.outDir, 'chromedriver.zip');
    return await requestBinary(chromeDriverUrl, chromeDriverZip, 0);
  }
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
  } else if (ostype == 'Linux') {
    if (osarch === 'x64') {
      return 'linux64';
    } else if (osarch === 'x32') {
      return 'linux32';
    }
  }
  return null;
}
