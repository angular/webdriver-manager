import { VersionList } from './version_list';
import { JsonObject } from './downloader/http_utils';
import * as githubJsonUtils from './downloader/github_json_utils';

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