import { VersionList } from './utils/version_list';
import { JsonObject } from './utils/http_utils';
import * as githubJsonUtils from './utils/github_json_utils';

/**
 * Returns a list of versions and the partial url paths.
 * @param fileName the location of the xml file to read.
 * @returns the version list from the xml file.
 */
export function convertJsonToVersionList(fileName: string): VersionList | null {
  let githubJson = githubJsonUtils.readJson(fileName) as JsonObject[];
  if (!githubJson) {
    return null;
  }
  let versionList: VersionList = {};
  for(let githubObj of githubJson) {
    let assets = githubObj['assets'];
    let version = githubObj['tag_name'].replace('v', '');
    versionList[version] = {};
    for (let asset of assets) {
      let name = asset['name'];
      let downloadUrl = asset['url'];
      let size = asset['size'];
      versionList[version][name] = {
        size: size,
        url: downloadUrl
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
    return 'macos';
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