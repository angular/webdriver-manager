import { requestBody } from './http_utils';

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
  } else if (process.env['GITHUB_TOKEN'] || process.env['github_token']) {
    let token = process.env['GITHUB_TOKEN'] || process.env['github_token'];
    headers['Authorization'] = 'token ' + token;
  }
  return requestBody(jsonUrl, fileName, headers);
}
