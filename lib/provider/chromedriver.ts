import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Flag } from '../flags';
import { renameFileWithVersion, unzipFile } from './utils/file_utils';
import { requestBinary } from './utils/http_utils';
import { convertXmlToVersionList, updateXml } from './utils/cloud_storage_xml';
import { getVersion } from './utils/version_list';


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

  /**
   * Should update the cache and download, find the version to download,
   * then download that binary.
   * @param version Optional to provide the version number or latest.
   */
  async updateBinary(version?: string): Promise<any> {
    await updateXml(this.requestUrl, path.resolve(this.outDir, this.fileName));
    let versionList = convertXmlToVersionList(path.resolve(this.outDir, this.fileName));
    let versionObj = getVersion(versionList, osHelper(this.osType, this.osArch), version);

    let chromeDriverUrl = this.requestUrl + versionObj.url;
    let chromeDriverZip = path.resolve(this.outDir, versionObj.name);

    // We should check the zip file size if it exists. The size will be used to either
    // make the request, or quit the request if the file size matches.
    let size = 0;
    try {
      size = fs.statSync(chromeDriverZip).size;
    } catch (err) {}
    await requestBinary(chromeDriverUrl, chromeDriverZip, size);

    // Unzip and rename all the files (a grand total of 1)
    let fileList = unzipFile(chromeDriverZip, this.outDir);
    for (let fileItem of fileList) {
      renameFileWithVersion(fileItem, '_' + versionObj.version)
    }

    // TODO(cnishina): Change permissions on the ChromeDriver file to be executable.

    // TODO(cnishina): Symbolic link chromedriver to chromedriver_version.
    // This might be better than  doing an update config json.
    return Promise.resolve();

  }

  // TODO(cnishina): A list of chromedriver versions downloaded

  // TODO(cnishina): Remove files downloaded
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
