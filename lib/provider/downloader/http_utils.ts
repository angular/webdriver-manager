import {OptionsWithUrl} from 'request';
import * as url from 'url';

export interface RequestOptionsValue extends OptionsWithUrl {
  proxy?: string;
  ignoreSSL?: boolean;
}

export interface JsonObject {
  [key:string]: any;
}

/**
 * Initialize the request options.
 * @param url 
 * @param opt_ignoreSSL 
 * @param opt_proxy 
 */
export function initOptions(
    url: string,
    opt_ignoreSSL?: boolean,
    opt_proxy?: string): RequestOptionsValue {

  let options: RequestOptionsValue = {
    url: url,
    // default Linux can be anywhere from 20-120 seconds
    // increasing this arbitrarily to 4 minutes
    timeout: 240000
  };
  options = optionsSSL(options, opt_ignoreSSL);
  options = optionsProxy(options, url, opt_proxy);
  return options;
}

/**
 * Set ignore SSL option.
 * @param options The HTTP options
 * @param opt_ignoreSSL The ignore SSL option.
 */
export function optionsSSL(
    options: RequestOptionsValue,
    opt_ignoreSSL: boolean): RequestOptionsValue {

  if (opt_ignoreSSL) {
    // console.log('ignoring SSL certificate');
    options.strictSSL = !opt_ignoreSSL;
    (options as any).rejectUnauthorized = !opt_ignoreSSL;
  }
  return options;
}

export function optionsProxy(
    options: RequestOptionsValue,
    requestUrl: string,
    opt_proxy: string): RequestOptionsValue {

  if (opt_proxy) {
    options.proxy = resolveProxy(requestUrl, opt_proxy);
    if (url.parse(requestUrl).protocol === 'https:') {
      options.url = requestUrl.replace('https:', 'http:');
    }
  }
  return options;
}

/**
 * Resolves proxy based on values set.
 * @param requestUrl The url to download the file.
 * @param opt_proxy The proxy to connect to to download files.
 * @return Either undefined or the proxy.
 */
export function resolveProxy(
    requestUrl: string,
    opt_proxy: string): string {

  if (opt_proxy) {
    return opt_proxy;
  } else {
    let protocol = url.parse(requestUrl).protocol;
    let hostname = url.parse(requestUrl).hostname;
    // If the NO_PROXY environment variable exists and matches the host name,
    // to ignore the resolve proxy.
    // the checks to see if it exists and equal to empty string is to help with testing
    const noProxy: string = process.env.NO_PROXY || process.env.no_proxy;
    if (noProxy) {
      // array of hostnames/domain names listed in the NO_PROXY environment variable
      let noProxyTokens = noProxy.split(',');
      // check if the fileUrl hostname part does not end with one of the
      // NO_PROXY environment variable's hostnames/domain names
      for (let noProxyToken of noProxyTokens) {
        if (hostname.indexOf(noProxyToken) !== -1) {
          return undefined;
        }
      }
    }

    // If the HTTPS_PROXY and HTTP_PROXY environment variable is set, use that as the proxy
    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
    if (protocol === 'https:') {
      return httpsProxy || httpProxy;
    } else if (protocol === 'http:') {
      return httpProxy;
    }
  }
  return undefined;
}

/**
 * Builds a curl command for logging purposes.
 * @param requestOptions The request options.
 * @param fileName The file name path.
 * @returns The curl command.
 */
export function curlCommand(requestOptions: RequestOptionsValue,
    fileName: string) {
  let curl = `${fileName} ${requestOptions.url}`;
  if (requestOptions.proxy) {
    let pathUrl = url.parse(requestOptions.url.toString()).path;
    let host = url.parse(requestOptions.url.toString()).host;
    let newFileUrl = url.resolve(requestOptions.proxy, pathUrl);
    curl = `${fileName} '${newFileUrl}' -H 'host: ${host}'`;
  }
  if (requestOptions.ignoreSSL) {
    curl = `'k ${curl}`;
  }
  return `curl -o ${curl}`;
}