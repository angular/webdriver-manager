import * as fs from 'fs';
import * as loglevel from 'loglevel';
import * as path from 'path';
import * as request from 'request';
import * as url from 'url';

const log = loglevel.getLogger('webdriver-manager');

/**
 * The request options that extend the request. This is not exported
 * in preference to build an HttpOptions object with extra metadata
 * and the http_utils methods will help build this object.
 */
export interface RequestOptionsValue extends request.OptionsWithUrl {
  proxy?: string;
  ignoreSSL?: boolean;
}

/**
 * A json object interface.
 */
export interface JsonObject {
  // tslint:disable-next-line:no-any
  [key: string]: any;
}

/**
 * The http option interface to build the request.
 */
export interface HttpOptions {
  // The full file path.
  fileName?: string;
  // The file size or content length fo the file.
  fileSize?: number;
  // Headers to send with the request.
  headers?: {[key: string]: string|number|string[]};
  // When making the request, to ignore SSL.
  ignoreSSL?: boolean;
  // When making the request, use the proxy url provided.
  proxy?: string;
}

/**
 * Initialize the request options.
 * @param requestUrl The request url.
 * @param httpOptions The http options for the request.
 */
export function initOptions(
    requestUrl: string, httpOptions: HttpOptions): RequestOptionsValue {
  let options: RequestOptionsValue = {
    url: requestUrl,
    // default Linux can be anywhere from 20-120 seconds
    // increasing this arbitrarily to 4 minutes
    timeout: 240000
  };
  options = optionsSSL(options, httpOptions.ignoreSSL);
  options = optionsProxy(options, requestUrl, httpOptions.proxy);
  if (httpOptions.headers) {
    for (const key of Object.keys(httpOptions.headers)) {
      options = addHeader(options, key, httpOptions.headers[key]);
    }
  }
  return options;
}

/**
 * Set ignore SSL option.
 * @param options The HTTP options
 * @param optIgnoreSSL The ignore SSL option.
 */
export function optionsSSL(
    options: RequestOptionsValue, optIgnoreSSL: boolean): RequestOptionsValue {
  if (optIgnoreSSL) {
    options.strictSSL = !optIgnoreSSL;
    options.rejectUnauthorized = !optIgnoreSSL;
  }
  return options;
}

export function optionsProxy(
    options: RequestOptionsValue, requestUrl: string,
    optProxy: string): RequestOptionsValue {
  if (optProxy) {
    options.proxy = resolveProxy(requestUrl, optProxy);
    if (url.parse(options.proxy).protocol === 'http:') {
      options.url = requestUrl.replace('https:', 'http:');
    }
  }
  return options;
}

/**
 * Resolves proxy based on values set.
 * @param requestUrl The url to download the file.
 * @param optProxy The proxy to connect to to download files.
 * @return Either undefined or the proxy.
 */
export function resolveProxy(requestUrl: string, optProxy: string): string {
  if (optProxy) {
    return optProxy;
  } else {
    const protocol = url.parse(requestUrl).protocol;
    const hostname = url.parse(requestUrl).hostname;
    // If the NO_PROXY environment variable exists and matches the host name,
    // to ignore the resolve proxy.
    // Check to see if it exists and equal to empty string is to help with
    // testing
    const noProxy: string = process.env.NO_PROXY || process.env.no_proxy;
    if (noProxy) {
      // array of hostnames/domain names listed in the NO_PROXY environment
      // variable
      const noProxyTokens = noProxy.split(',');
      // check if the fileUrl hostname part does not end with one of the
      // NO_PROXY environment variable's hostnames/domain names
      for (const noProxyToken of noProxyTokens) {
        if (hostname.indexOf(noProxyToken) !== -1) {
          return undefined;
        }
      }
    }

    // If the HTTPS_PROXY and HTTP_PROXY environment variable is set,
    // use that as the proxy
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
export function curlCommand(
    requestOptions: RequestOptionsValue, fileName?: string) {
  let curl = `${requestOptions.url}`;
  if (requestOptions.proxy) {
    const pathUrl = url.parse(requestOptions.url.toString()).path;
    const host = url.parse(requestOptions.url.toString()).host;
    if (requestOptions.proxy) {
      const modifiedUrl = url.resolve(requestOptions.proxy, pathUrl);
      curl = `"${modifiedUrl}" -H "host: ${host}"`;
    }
  }
  if (requestOptions.headers) {
    for (const headerName of Object.keys(requestOptions.headers)) {
      curl += ` -H "${headerName}: ${requestOptions.headers[headerName]}"`;
    }
  }
  if (requestOptions.ignoreSSL) {
    curl = `-k ${curl}`;
  }
  if (fileName) {
    curl = `-o ${fileName} ${curl}`;
  }
  return `curl ${curl}`;
}

/**
 * Add a header to the request.
 * @param options The options to add a header.
 * @param name The key name of the header.
 * @param value The value of the header.
 * @returns The modified options object.
 */
export function addHeader(
    options: RequestOptionsValue, name: string,
    value: string|number|string[]): RequestOptionsValue {
  if (!options.headers) {
    options.headers = {};
  }
  options.headers[name] = value;
  return options;
}

/**
 * The request to download the binary.
 * @param binaryUrl The download url for the binary.
 * @param httpOptions The http options for the request.
 * @param isLogInfo Log info or debug
 */
export function requestBinary(
    binaryUrl: string, httpOptions: HttpOptions,
    isLogInfo = true): Promise<boolean> {
  const options = initOptions(binaryUrl, httpOptions);
  options.followRedirect = false;
  options.followAllRedirects = false;
  if (isLogInfo) {
    log.info(curlCommand(options, httpOptions.fileName));
  } else {
    log.debug(curlCommand(options, httpOptions.fileName));
  }

  return new Promise<boolean>((resolve, reject) => {
    const req = request(options);
    req.on('response', response => {
      let contentLength: number;
      if (response.statusCode === 200) {
        // Check to see if the size is the same.
        // If the file size is the same, do not download and stop here.
        contentLength = +response.headers['content-length'];
        if (contentLength === httpOptions.fileSize) {
          response.destroy();
          resolve(false);
        } else {
          // Only pipe if the headers are different length.
          const dir = path.dirname(httpOptions.fileName);
          try {
            fs.mkdirSync(dir);
          } catch (err) {
          }
          const file = fs.createWriteStream(httpOptions.fileName);
          req.pipe(file);

          file.on('close', () => {
            fs.stat(httpOptions.fileName, (error, stats) => {
              if (error) {
                reject(error);
              }
              if (stats.size !== contentLength) {
                fs.unlinkSync(httpOptions.fileName);
                reject(error);
              }
              resolve(true);
            });
          });
          file.on('error', (error) => {
            reject(error);
          });
        }
      } else if (response.statusCode === 302) {
        const location = response.headers['location'] as string;
        if (!httpOptions.headers) {
          httpOptions.headers = {};
        }
        for (const header of Object.keys(response.headers)) {
          httpOptions.headers[header] = response.headers[header];
        }
        resolve(requestBinary(location, httpOptions, false));
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
 * Request the body from the url and log the curl.
 * @param requestUrl The request url.
 * @param httpOptions The http options for the request.
 * @returns A promise string of the response body.
 */
export function requestBody(
    requestUrl: string, httpOptions: HttpOptions): Promise<string> {
  const options = initOptions(requestUrl, httpOptions);
  log.info(curlCommand(options, httpOptions.fileName));
  options.followRedirect = true;
  return new Promise((resolve, reject) => {
    const req = request(options);
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