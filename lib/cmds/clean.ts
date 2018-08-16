import * as log from 'loglevel';
import * as yargs from 'yargs';
import { Options } from './options';
import { constructAllProviders } from './utils';

/**
 * Handles removing files that were downloaded and logs the files.
 * @param argv The argv from yargs.
 */
export function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  let options = constructAllProviders(argv);
  log.info(clean(options));
}

/**
 * Goes through all the providers and removes the downloaded files.
 * @param options The constructed options.
 * @returns A list of deleted files.
 */
export function clean(options: Options): string {
  let filesCleaned: string[] = [];
  for (let provider of options.providers) {
    let cleanedFiles = provider.binary.cleanFiles();
    if (cleanedFiles) {
      filesCleaned.push(cleanedFiles);
    }
  }
  if (options.server && options.server.binary) {
    let cleanedFiles = options.server.binary.cleanFiles();
    if (cleanedFiles) {
      filesCleaned.push(cleanedFiles);
    }
  }
  return (filesCleaned.sort()).join('\n');
}
