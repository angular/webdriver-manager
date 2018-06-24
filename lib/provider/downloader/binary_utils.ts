import * as fs from 'fs';
import * as request from 'request';
import { curlCommand, initOptions } from './http_utils';

/**
 * The request to download the binary.
 * @param binaryUrl The download url for the binary.
 * @param fileName The file path to save the binary.
 * @param fileSize The file size used for validation.
 */
export function requestBinary(binaryUrl: string,
    fileName: string, fileSize: number): Promise<boolean> {
  let options = initOptions(binaryUrl);
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