import * as fs from 'fs';
import * as loglevel from 'loglevel';
import * as path from 'path';

import {isExpired, readJson} from './file_utils';
import {HttpOptions, JsonObject, requestBody} from './http_utils';
import {VersionList} from './version_list';

const log = loglevel.getLogger('webdriver-manager');

export interface RequestMethod {
  (jsonUrl: string, httpOptions: HttpOptions,
   oauthToken?: string): Promise<string|null>;
}

/**
 * Read the json file from cache. If the cache time has been exceeded or the
 * file does not exist, make an http request and write it to the file.
 * @param jsonUrl The json url.
 * @param httpOptions The http options for the request.
 * @param oauthToken An optional oauth token.
 */
export async function updateJson(
    jsonUrl: string, httpOptions: HttpOptions,
    oauthToken?: string): Promise<JsonObject|JsonObject[]|null> {
  if (isExpired(httpOptions.fileName)) {
    let contents: string;

    // Create the folder to store the cache.
    const dir = path.dirname(httpOptions.fileName);
    try {
      fs.mkdirSync(dir);
    } catch (err) {
    }

    // Check the rate limit and if there is quota for this request.
    if (await hasQuota(oauthToken)) {
      contents = await requestGitHubJson(jsonUrl, httpOptions, oauthToken);
      fs.writeFileSync(httpOptions.fileName, contents);
      return JSON.parse(contents);
    } else {
      return null;
    }
  } else {
    return readJson(httpOptions.fileName);
  }
}


/**
 * Get the GitHub rate limit with the oauth token.
 * @param oauthToken An optional oauth token.
 * @param requestMethod An overriding requesting method.
 * @returns A promised string of the response body.
 */
export function requestRateLimit(
    oauthToken?: string, requestMethod?: RequestMethod): Promise<string|null> {
  const rateLimitUrl = 'https://api.github.com/rate_limit';
  if (requestMethod) {
    return requestMethod(rateLimitUrl, {}, oauthToken);
  } else {
    return requestGitHubJson(rateLimitUrl, {}, oauthToken);
  }
}

/**
 * Request the GitHub json url and log the curl.
 * @param jsonUrl The json url.
 * @param httpOptions The http options for the request.
 * @param oauthToken An optional oauth token.
 * @returns A promised string of the response body.
 */
export function requestGitHubJson(
    jsonUrl: string, httpOptions: HttpOptions,
    oauthToken?: string): Promise<string|null> {
  if (!httpOptions.headers) {
    httpOptions.headers = {};
  }
  httpOptions.headers['User-Agent'] = 'angular/webdriver-manager';
  if (oauthToken) {
    httpOptions.headers['Authorization'] = 'token ' + oauthToken;
  } else if (process.env['GITHUB_TOKEN'] || process.env['github_token']) {
    const token = process.env['GITHUB_TOKEN'] || process.env['github_token'];
    httpOptions.headers['Authorization'] = 'token ' + token;
  }
  return requestBody(jsonUrl, httpOptions);
}

/**
 * Check quota for remaining GitHub requests.
 * @param oauthToken An optional oauth token.
 * @param requestMethod An overriding requesting method.
 */
export async function hasQuota(
    oauthToken?: string, requestMethod?: RequestMethod): Promise<boolean> {
  try {
    const requesteRateLimit = await requestRateLimit(oauthToken, requestMethod);
    if (!requesteRateLimit) {
      throw new Error(
          'Request encountered an error. Received null, expecting json.');
    }
    const rateLimit = JSON.parse(requesteRateLimit);
    if (rateLimit['resources']['core']['remaining'] === 0) {
      if (oauthToken) {
        log.warn('[WARN] No remaining quota for requests to GitHub.');
      } else {
        log.warn(
            '[WARN] Provide an oauth token. ' +
            'See https://github.com/settings/tokens');
      }
      log.warn('[WARN] Stopping updates for gecko driver.');
      return false;
    }
    return true;
  } catch (err) {
    log.error('[ERROR]: ', err);
    return false;
  }
}

/**
 * Returns a list of versions and the partial url paths.
 * @param fileName the location of the xml file to read.
 * @returns the version list from the xml file.
 */
export function convertJsonToVersionList(fileName: string): VersionList|null {
  const githubJson = readJson(fileName) as JsonObject[];
  if (!githubJson) {
    return null;
  }
  const versionList: VersionList = {};
  for (const githubObj of githubJson) {
    interface Asset {
      name: string;
      browser_download_url: string;
      size: number;
    }
    const assets = githubObj['assets'] as JsonObject[];
    const version = (githubObj['tag_name'] as string).replace('v', '');
    versionList[version] = {};

    for (const asset of assets) {
      const name = asset['name'] as string;
      const downloadUrl = asset['browser_download_url'];
      const size = asset['size'];
      versionList[version][name] = {name, size, url: downloadUrl, version} as
          JsonObject;
    }
  }
  return versionList;
}