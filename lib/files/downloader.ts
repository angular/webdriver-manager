import * as fs from 'fs';
import * as path from 'path';
import * as q from 'q';
import * as request from 'request';
import * as url from 'url';

import {Binary} from '../binaries';
import {Logger} from '../cli';
import {Config} from '../config';
import {HttpUtils} from '../http_utils';

let logger = new Logger('downloader');

/**
 * The file downloader.
 */
export class Downloader {
  /**
   * Http get the file. Check the content length of the file before writing the file.
   * If the content length does not match, remove it and download the file.
   *
   * @param binary The binary of interest.
   * @param fileName The file name.
   * @param outputDir The directory where files are downloaded and stored.
   * @param contentLength The content length of the existing file.
   * @param opt_proxy The proxy for downloading files.
   * @param opt_callback Callback method to be executed after the file is downloaded.
   * @returns Promise<boolean> Resolves true = downloaded. Resolves false = not downloaded.
   *          Rejected with an error.
   */
  static getFile(
      binary: Binary, fileUrl: string, fileName: string, outputDir: string, contentLength: number,
      callback?: Function): Promise<boolean> {
    let filePath = path.resolve(outputDir, fileName);
    let file: any;

    let options = HttpUtils.initOptions(fileUrl);

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
                   let curl = outputDir + '/' + fileName + ' ' + options.url;
                   if (HttpUtils.requestOpts.proxy) {
                     let pathUrl = url.parse(options.url.toString()).path;
                     let host = url.parse(options.url.toString()).host;
                     let newFileUrl = url.resolve(HttpUtils.requestOpts.proxy, pathUrl);
                     curl = outputDir + '/' + fileName + ' \'' + newFileUrl +
                         '\' -H \'host:' + host + '\'';
                   }
                   if (HttpUtils.requestOpts.ignoreSSL) {
                     curl = 'k ' + curl;
                   }
                   logger.info('curl -o' + curl);

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
          logger.error((error as any).msg || (error as any).message);
        });
  }
}
