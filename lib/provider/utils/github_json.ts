import * as fs from 'fs';
import * as path from 'path';
import { isExpired, readJson } from './file_utils';
import { JsonObject, requestBody } from './http_utils';
import { VersionList } from './version_list';

export interface RequestMethod {
  (jsonUrl: string, fileName?: string, oauthToken?: string):
    Promise<string|null>;
}

/**
 * Read the json file from cache. If the cache time has been exceeded or the
 * file does not exist, make an http request and write it to the file.
 * @param jsonUrl The json url.
 * @param fileName The json filename.
 * @param oauthToken An optional oauth token.
 */
export async function updateJson(
    jsonUrl: string,
    fileName: string,
    oauthToken?: string): Promise<JsonObject|null> {

  if (isExpired(fileName)) {
    let contents: string;

    // Create the folder to store the cache.
    let dir = path.dirname(fileName);
    try {
      fs.mkdirSync(dir);
    } catch (err) {}

    // Check the rate limit and if there is quota for this request.
    if (await hasQuota(oauthToken)) {
      contents = await requestGitHubJson(jsonUrl, fileName, oauthToken);
      fs.writeFileSync(fileName, contents);
      return JSON.parse(contents);
    } else {
      return null;
    }
  } else {
    return readJson(fileName);
  }
}


/**
 * Get the GitHub rate limit with the oauth token.
 * @param oauthToken An optional oauth token.
 * @param requestMethod An overriding requesting method.
 * @returns A promised string of the response body.
 */
export function requestRateLimit(
    oauthToken?: string,
    requestMethod?: RequestMethod): Promise<string|null> {
  let rateLimitUrl = 'https://api.github.com/rate_limit';
  if (requestMethod) {
    return requestMethod(rateLimitUrl, null, oauthToken);
  } else {
    return requestGitHubJson(rateLimitUrl, null, oauthToken);
  }
}

/**
 * Request the GitHub json url and log the curl.
 * @param jsonUrl The json url.
 * @param fileName An optional json filename.
 * @param oauthToken An optional oauth token.
 * @returns A promised string of the response body.
 */
export function requestGitHubJson(
    jsonUrl: string,
    fileName?: string,
    oauthToken?: string): Promise<string|null> {
  let headers: {[key:string]: string|number} = {};
  headers['User-Agent'] = 'angular/webdriver-manager';
  if (oauthToken) {
    headers['Authorization'] = 'token ' + oauthToken;
  } else if (process.env['GITHUB_TOKEN'] || process.env['github_token']) {
    let token = process.env['GITHUB_TOKEN'] || process.env['github_token'];
    headers['Authorization'] = 'token ' + token;
  }
  return requestBody(jsonUrl, headers, fileName);
}

/**
 * Check quota for remaining GitHub requests.
 * @param oauthToken An optional oauth token.
 * @param requestMethod An overriding requesting method.
 */
export async function hasQuota(
    oauthToken?: string,
    requestMethod?: RequestMethod): Promise<boolean> {
  try {
    let requesteRateLimit = await requestRateLimit(oauthToken, requestMethod);
    if (!requesteRateLimit) {
      throw new Error('Request encountered an error. Received null, expecting json.')
    }
    let rateLimit = JSON.parse(requesteRateLimit);
    if (rateLimit['resources']['core']['remaining'] === 0) {
      if (oauthToken) {
        console.warn('[WARN] No remaining quota for requests to GitHub.');
      } else {
        console.warn('[WARN] Provide an oauth token. ' +
          'See https://github.com/settings/tokens');
      }
      console.warn('[WARN] Stopping updates for gecko driver.');
      return false;
    }
    return true;
  } catch (err) {
    console.error('[ERROR]: ', err);
    return false;
  }
}

/**
 * Returns a list of versions and the partial url paths.
 * @param fileName the location of the xml file to read.
 * @returns the version list from the xml file.
 */
export function convertJsonToVersionList(fileName: string): VersionList | null {
  let githubJson = readJson(fileName) as JsonObject[];
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
      let downloadUrl = asset['browser_download_url'];
      let size = asset['size'];
      versionList[version][name] = {
        name: name,
        size: size,
        url: downloadUrl,
        version: version
      };
    }
  }
  return versionList;
}