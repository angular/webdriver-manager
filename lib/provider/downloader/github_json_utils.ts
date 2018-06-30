import * as fs from 'fs';
import * as request from 'request';
import { addHeader, curlCommand, initOptions, JsonObject } from './http_utils';

/**
 * Get the GitHub rate limit with the oauth token.
 * @param oauthToken An optional oauth token.
 * @returns A promised string of the response body.
 */
export function requestRateLimit(oauthToken?: string): Promise<string> {
  let rateLimitUrl = 'https://api.github.com/rate_limit';
  return requestGitHubJson(rateLimitUrl, null, oauthToken);
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
    oauthToken?: string): Promise<string> {
  let headers: {[key:string]: string|number} = {};
  headers['User-Agent'] = 'angular/webdriver-manager';
  if (oauthToken) {
    headers['Authorization'] = 'token ' + oauthToken;
  } else if (process.env['GITHUB_TOKEN']) {
    headers['Authorization'] = 'token ' + process.env['GITHUB_TOKEN'];
  }
  return requestJson(jsonUrl, fileName, headers);
}

/**
 * Request the json url and log the curl.
 * @param jsonUrl The json url.
 * @param fileName An optional json filename.
 * @param headers Optional headers object of key-values.
 * @returns A promise string of the response body.
 */
export function requestJson(
    jsonUrl: string,
    fileName?: string,
    headers?: {[key:string]: string|number}): Promise<string> {
  let options = initOptions(jsonUrl);
  if (headers) {
    for(let key of Object.keys(headers)) {
      addHeader(options, key, headers[key]);
    }
  }
  console.log(curlCommand(options, fileName));

  return new Promise((resolve, reject) => {
    let req = request(options);
    req.on('response', response => {
      if (response.statusCode === 200) {
        let output = '';
        response.on('data', (data) => {
          output += data;
        });
        response.on('end', () => {
          resolve(output);
        });
      } else {
        reject(new Error('response status code is not 200'));
      }
    });
    req.on('error', error => {
      reject(error);
    });
  });
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