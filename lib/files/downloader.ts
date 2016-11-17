import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as q from 'q';
import * as request from 'request';
import * as url from 'url';

import {Binary} from '../binaries/binary';
import {Logger} from '../cli';

let logger = new Logger('downloader');

/**
 * The file downloader.
 */
export class Downloader {
  /**
   * Download the binary file.
   * @param binary The binary of interest.
   * @param outputDir The directory where files are downloaded and stored.
   * @param opt_proxy The proxy for downloading files.
   * @param opt_ignoreSSL To ignore SSL.
   * @param opt_callback Callback method to be executed after the file is downloaded.
   */
  static downloadBinary(
      binary: Binary, outputDir: string, opt_proxy?: string, opt_ignoreSSL?: boolean,
      opt_callback?: Function): void {
    logger.info(binary.name + ': downloading version ' + binary.version());
    var url = binary.url(os.type(), os.arch());
    if (!url) {
      logger.error(binary.name + ' v' + binary.version() + ' is not available for your system.');
      return;
    }
    Downloader.httpGetFile_(
        url, binary.filename(os.type(), os.arch()), outputDir, opt_proxy, opt_ignoreSSL,
        (filePath: string) => {
          if (opt_callback) {
            opt_callback(binary, outputDir, filePath);
          }
        });
  }

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
      let noProxy: string = process.env.NO_PROXY || process.env.no_proxy;
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
        return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY ||
            process.env.http_proxy;
      } else if (protocol === 'http:') {
        return process.env.HTTP_PROXY || process.env.http_proxy;
      }
    }
    return null;
  }

  static httpHeadContentLength(fileUrl: string, opt_proxy?: string, opt_ignoreSSL?: boolean):
      q.Promise<any> {
    let deferred = q.defer();
    if (opt_ignoreSSL) {
      logger.info('ignoring SSL certificate');
    }

    let options = {
      method: 'GET',
      url: fileUrl,
      strictSSL: !opt_ignoreSSL,
      rejectUnauthorized: !opt_ignoreSSL,
      proxy: Downloader.resolveProxy_(fileUrl, opt_proxy)
    };

    request(options).on('response', (response) => {
      if (response.headers['Location']) {
        let urlLocation = response.headers['Location'];
        deferred.resolve(Downloader.httpHeadContentLength(urlLocation, opt_proxy, opt_ignoreSSL));
      } else if (response.headers['content-length']) {
        let contentLength = response.headers['content-length'];
        deferred.resolve(contentLength);
      }
      response.destroy();
    });
    return deferred.promise;
  }

  /**
   * Ceates the GET request for the file name.
   * @param fileUrl The url to download the file.
   * @param fileName The name of the file to download.
   * @param opt_proxy The proxy to connect to to download files.
   * @param opt_ignoreSSL To ignore SSL.
   */
  static httpGetFile_(
      fileUrl: string, fileName: string, outputDir: string, opt_proxy?: string,
      opt_ignoreSSL?: boolean, callback?: Function): void {
    logger.info('curl -o ' + outputDir + '/' + fileName + ' ' + fileUrl);
    let filePath = path.resolve(outputDir, fileName);
    let file = fs.createWriteStream(filePath);
    let contentLength = 0;

    interface Options {
      url: string;
      timeout: number;
      strictSSL?: boolean;
      rejectUnauthorized?: boolean;
      proxy?: string;
      headers?: {[key: string]: any};
      [key: string]: any;
    }

    let options: Options = {
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
      if (options.url.indexOf('https://') === 0) {
        options.url = options.url.replace('https://', 'http://');
      }
    }

    request(options)
        .on('response',
            (response) => {
              if (response.statusCode !== 200) {
                fs.unlinkSync(filePath);
                logger.error('Error: Got code ' + response.statusCode + ' from ' + fileUrl);
              }
              contentLength = response.headers['content-length'];
            })
        .on('error',
            (error) => {
              if ((error as any).code === 'ETIMEDOUT') {
                logger.error('Connection timeout downloading: ' + fileUrl);
                logger.error('Default timeout is 4 minutes.');

              } else if ((error as any).connect) {
                logger.error('Could not connect to the server to download: ' + fileUrl);
              }
              logger.error(error);
              fs.unlinkSync(filePath);
            })
        .pipe(file);

    file.on('close', function() {
      fs.stat(filePath, function(err, stats) {
        if (err) {
          logger.error('Error: Got error ' + err + ' from ' + fileUrl);
          return;
        }
        if (stats.size != contentLength) {
          logger.error(
              'Error: corrupt download for ' + fileName +
              '. Please re-run webdriver-manager update');
          fs.unlinkSync(filePath);
          return;
        }
        if (callback) {
          callback(filePath);
        }
      });
    });
  }
}
