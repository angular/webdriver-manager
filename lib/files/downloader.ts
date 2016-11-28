import * as fs from 'fs';
import * as path from 'path';
import * as q from 'q';
import * as request from 'request';
import * as url from 'url';

import {Binary} from '../binaries/binary';
import {Logger} from '../cli';
import {Config} from '../config';

let logger = new Logger('downloader');

/**
 * The file downloader.
 */
export class Downloader {
  /**
   * Resolves proxy based on values set
   * @param fileUrl The url to download the file.
   * @param opt_proxy The proxy to connect to to download files.
   * @return Either undefined or the proxy.
   */
  static resolveProxy_(fileUrl: string, opt_proxy?: string): string {
    let protocol = url.parse(fileUrl).protocol;
    let hostname = url.parse(fileUrl).hostname;

    if (opt_proxy) {
      return opt_proxy;
    } else {
      // If the NO_PROXY environment variable exists and matches the host name,
      // to ignore the resolve proxy.
      // the checks to see if it exists and equal to empty string is to help with testing
      let noProxy: string = Config.noProxy();
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
      if (protocol === 'https:') {
        return Config.httpsProxy() || Config.httpProxy();
      } else if (protocol === 'http:') {
        return Config.httpProxy();
      }
    }
    return undefined;
  }

  /**
   * Http get the file. Check the content length of the file before writing the file.
   * If the content length does not match, remove it and download the file.
   *
   * @param binary The binary of interest.
   * @param fileName The file name.
   * @param outputDir The directory where files are downloaded and stored.
   * @param contentLength The content length of the existing file.
   * @param opt_proxy The proxy for downloading files.
   * @param opt_ignoreSSL Should the downloader ignore SSL.
   * @param opt_callback Callback method to be executed after the file is downloaded.
   * @returns Promise<any> Resolves true = downloaded. Resolves false = not downloaded.
   *          Rejected with an error.
   */
  static getFile(
      binary: Binary, fileUrl: string, fileName: string, outputDir: string, contentLength: number,
      opt_proxy?: string, opt_ignoreSSL?: boolean, callback?: Function): Promise<any> {
    let filePath = path.resolve(outputDir, fileName);
    let file: any;

    let options: IOptions = {
      url: fileUrl,
      // default Linux can be anywhere from 20-120 seconds
      // increasing this arbitrarily to 4 minutes
      timeout: 240000
    }

    if (opt_ignoreSSL) {
      logger.info('ignoring SSL certificate');
      options.strictSSL = !opt_ignoreSSL;
      options.rejectUnauthorized = !opt_ignoreSSL;
    }

    if (opt_proxy) {
      options.proxy = Downloader.resolveProxy_(fileUrl, opt_proxy);
      if (url.parse(options.url).protocol === 'https:') {
        options.url = options.url.replace('https:', 'http:');
      }
    }

    let req: request.Request = null;
    let resContentLength: number;

    return new Promise<boolean>((resolve, reject) => {
             req = request(options);
             req.on('response', response => {
               if (response.statusCode === 200) {
                 resContentLength = +response.headers['content-length'];
                 if (contentLength === resContentLength) {
                   // if the size is the same, do not download and stop here
                   response.destroy();
                   resolve(false);
                 } else {
                   if (opt_proxy) {
                     let pathUrl = url.parse(options.url).path;
                     let host = url.parse(options.url).host;
                     let newFileUrl = url.resolve(opt_proxy, pathUrl);
                     logger.info(
                         'curl -o ' + outputDir + '/' + fileName + ' \'' + newFileUrl +
                         '\' -H \'host:' + host + '\'');
                   } else {
                     logger.info('curl -o ' + outputDir + '/' + fileName + ' ' + fileUrl);
                   }

                   // only pipe if the headers are different length
                   file = fs.createWriteStream(filePath);
                   req.pipe(file);
                   file.on('close', () => {
                     fs.stat(filePath, (error, stats) => {
                       if (error) {
                         (error as any).msg = 'Error: Got error ' + error + ' from ' + fileUrl;
                         return reject(error);
                       }
                       if (stats.size != resContentLength) {
                         (error as any).msg = 'Error: corrupt download for ' + fileName +
                             '. Please re-run webdriver-manager update';
                         fs.unlinkSync(filePath);
                         reject(error);
                       }
                       if (callback) {
                         callback(binary, outputDir, fileName);
                       }
                       resolve(true);
                     });
                   });
                 }

               } else {
                 let error = new Error();
                 (error as any).msg =
                     'Expected response code 200, received: ' + response.statusCode;
                 reject(error);
               }
             });
             req.on('error', error => {
               if ((error as any).code === 'ETIMEDOUT') {
                 (error as any).msg = 'Connection timeout downloading: ' + fileUrl +
                     '. Default timeout is 4 minutes.';
               } else if ((error as any).connect) {
                 (error as any).msg = 'Could not connect to the server to download: ' + fileUrl;
               }
               reject(error);
             });
           })
        .catch(error => {
          logger.error((error as any).msg);
        });
  }
}

interface IOptions {
  method?: string;
  url: string;
  timeout: number;
  strictSSL?: boolean;
  rejectUnauthorized?: boolean;
  proxy?: string;
  headers?: {[key: string]: any};
  [key: string]: any;
}
