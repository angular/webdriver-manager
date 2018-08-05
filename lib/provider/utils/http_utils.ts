import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';

export interface RequestOptionsValue extends request.OptionsWithUrl {
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
    // Check to see if it exists and equal to empty string is to help with testing
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
export function curlCommand(requestOptions: RequestOptionsValue,
    fileName?: string) {
  let curl = `${requestOptions.url}`;
  if (requestOptions.proxy) {
    let pathUrl = url.parse(requestOptions.url.toString()).path;
    let host = url.parse(requestOptions.url.toString()).host;
    if (requestOptions.proxy) {
      let modifiedUrl = url.resolve(requestOptions.proxy, pathUrl);
      curl = `'${modifiedUrl}' -H 'host: ${host}'`;
    }
    
    for (let headerName in Object.keys(requestOptions.headers)) {
      curl += ` -H "${headerName}: ${requestOptions.headers[headerName]}`;
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
export function addHeader(options: RequestOptionsValue, name: string,
    value: string|number): RequestOptionsValue {
  if (!options.headers) {
    options.headers = {};
  }
  options.headers[name] = value;
  return options;
}

/**
 * The request to download the binary.
 * @param binaryUrl The download url for the binary.
 * @param fileName The file path to save the binary.
 * @param fileSize The file size used for validation.
 * @param headers Optional headers object of key-values.
 */
export function requestBinary(binaryUrl: string,
    fileName: string, fileSize: number,
    headers?: {[key:string]: string|number}): Promise<boolean> {
  let options = initOptions(binaryUrl);
  if (headers) {
    for(let key of Object.keys(headers)) {
      addHeader(options, key, headers[key]);
    }
  }
  options.followRedirect = true;
  console.log(curlCommand(options, fileName));

  return new Promise<boolean>((resolve, reject) => {
    let req = request(options);
    req.on('response', response => {
      let contentLength: number;
      if (response.statusCode === 200) {
        // Check to see if the size is the same.
        // If the file size is the same, do not download and stop here.
        contentLength = +response.headers['content-length'];
        if (contentLength === fileSize) {
          response.destroy();
          resolve(false);
        } else {
          // Only pipe if the headers are different length.
          let dir = path.dirname(fileName);
          try {
            fs.mkdirSync(dir);
          } catch (err) {}
          let file = fs.createWriteStream(fileName);
          req.pipe(file);
          file.on('close', () => {
            fs.stat(fileName, (error, stats) => {
              if (error) {
                reject(error);
              }
              if (stats.size != contentLength) {
                fs.unlinkSync(fileName);
                reject(error);
              }
              resolve(true);
            });
          });
        }
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
 * @param headers Optional headers object of key-values.
 * @param fileName An optional json filename.
 * @returns A promise string of the response body.
 */
export function requestBody(
    requestUrl: string,
    headers?: {[key:string]: string|number},
    fileName?: string,): Promise<string> {
  let options = initOptions(requestUrl);
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