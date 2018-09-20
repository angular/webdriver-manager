import * as loglevel from 'loglevel';
import * as yargs from 'yargs';
import {Options} from './options';
import {OptionsBinary} from './options_binary';
import {addOptionsBinary, convertArgs2AllOptions} from './utils';

const log = loglevel.getLogger('webdriver-manager');

/**
 * Handles removing files that were downloaded and logs the files.
 * @param argv The argv from yargs.
 */
export function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  const options = convertArgs2AllOptions(argv);
  log.info(clean(options));
}

/**
 * Goes through all the providers and removes the downloaded files.
 * @param options The constructed set of all options.
 * @returns A list of deleted files.
 */
export function clean(options: Options): string {
  const optionsBinary = addOptionsBinary(options);
  return cleanBinary(optionsBinary);
}

/**
 * Goes through all the providers and removes the downloaded files.
 * @param optionsBinary The constructed set of all options with binaries.
 * @returns A list of deleted files.
 */
export function cleanBinary(optionsBinary: OptionsBinary): string {
  const filesCleaned: string[] = [];
  for (const browserDriver of optionsBinary.browserDrivers) {
    const cleanedFiles = browserDriver.binary.cleanFiles();
    if (cleanedFiles) {
      filesCleaned.push(cleanedFiles);
    }
  }
  if (optionsBinary.server && optionsBinary.server.binary) {
    const cleanedFiles = optionsBinary.server.binary.cleanFiles();
    if (cleanedFiles) {
      filesCleaned.push(cleanedFiles);
    }
  }
  return (filesCleaned.sort()).join('\n');
}