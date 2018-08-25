import * as log from 'loglevel';
import * as yargs from 'yargs';
import {Options} from './options';
import {constructAllProviders} from './utils';

/**
 * Handles removing files that were downloaded and logs the files.
 * @param argv The argv from yargs.
 */
export function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  const options = constructAllProviders(argv);
  log.info(clean(options));
}

/**
 * Goes through all the providers and removes the downloaded files.
 * @param options The constructed set of all options.
 * @returns A list of deleted files.
 */
export function clean(options: Options): string {
  const filesCleaned: string[] = [];

  for (const provider of options.providers) {
    const cleanedFiles = provider.binary.cleanFiles();
    if (cleanedFiles) {
      filesCleaned.push(cleanedFiles);
    }
  }
  if (options.server && options.server.binary) {
    const cleanedFiles = options.server.binary.cleanFiles();
    if (cleanedFiles) {
      filesCleaned.push(cleanedFiles);
    }
  }
  return (filesCleaned.sort()).join('\n');
}
