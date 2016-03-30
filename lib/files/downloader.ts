import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as request from 'request';
import * as url from 'url';
import * as q from 'q';
import * as http from 'http';

import {Binary} from '../binaries/binary';
import {Logger} from '../cli';

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
      binary: Binary, outputDir: string, opt_proxy?: string,
      opt_ignoreSSL?: boolean, opt_callback?: Function): void {
    Logger.info('downloading ' + binary.name + ' to version ' + binary.version());
    var url = binary.url(os.type(), os.arch());
    if (!url) {
      Logger.error(binary.name + ' v' + binary.version() + ' is not available for your system.');
      return;
    }
    Downloader.httpGetFile_(
        url, binary.filename(os.type(), os.arch()), outputDir, opt_proxy, opt_ignoreSSL, (downloaded: boolean) => {
          if (opt_callback) {
            opt_callback(binary, outputDir, downloaded);
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
    if (opt_proxy) {
      return opt_proxy;
    } else if (protocol === 'https:') {
      return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY ||
          process.env.http_proxy;
    } else if (protocol === 'http:') {
      return process.env.HTTP_PROXY || process.env.http_proxy;
    }
  }

  static httpHeadContentLength(fileUrl: string, opt_proxy?: string, opt_ignoreSSL?: boolean): q.Promise<any> {
    let deferred = q.defer();
    if (opt_ignoreSSL) {
      Logger.info('ignoring SSL certificate');
    }

    let options = {
      method: 'HEAD',
      url: fileUrl,
      strictSSL: !opt_ignoreSSL,
      rejectUnauthorized: !opt_ignoreSSL,
      proxy: Downloader.resolveProxy_(fileUrl, opt_proxy)
    };

    let contentLength = 0;
    request(options)
      .on('response', (response) => {
        contentLength = response.headers['content-length'];
        deferred.resolve(contentLength);
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
      fileUrl: string, fileName: string, outputDir: string, opt_proxy?: string, opt_ignoreSSL?: boolean,
      callback?: Function): void {
    Logger.info('curl -o ' + outputDir + '/' + fileName + ' ' + fileUrl);
    let filePath = path.join(outputDir, fileName);
    let file = fs.createWriteStream(filePath);
    let contentLength = 0;

    if (opt_ignoreSSL) {
      Logger.info('Ignoring SSL certificate');
    }

    let options = {
      url: fileUrl,
      strictSSL: !opt_ignoreSSL,
      rejectUnauthorized: !opt_ignoreSSL,
      proxy: Downloader.resolveProxy_(fileUrl, opt_proxy)
    };

    request(options)
        .on('response',
            (response) => {
              if (response.statusCode !== 200) {
                fs.unlink(filePath);
                Logger.error('Error: Got code ' + response.statusCode + ' from ' + fileUrl);
              }
              contentLength = response.headers['content-length'];
            })
        .on('error',
            (error) => {
              Logger.error('Error: Got error ' + error + ' from ' + fileUrl);
              fs.unlink(filePath);
            })
        .pipe(file);

    file.on('close', function() {
      fs.stat(filePath, function(err, stats) {
        if (err) {
          Logger.error('Error: Got error ' + err + ' from ' + fileUrl);
          return;
        }
        if (stats.size != contentLength) {
          Logger.error(
              'Error: corrupt download for ' + fileName +
              '. Please re-run webdriver-manager update');
          fs.unlink(filePath);
          return;
        }
        Logger.info(fileName + ' downloaded to ' + filePath);
        if (callback) {
          callback(filePath);
        }
      });
    });
  }
}
