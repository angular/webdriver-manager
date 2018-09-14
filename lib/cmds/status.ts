import * as loglevel from 'loglevel';
import * as yargs from 'yargs';
import {Options} from './options';
import {constructAllProviders} from './utils';

const log = loglevel.getLogger('webdriver-manager');

/**
 * Displays which versions of providers that have been downloaded.
 * @param argv The argv from yargs.
 */
export function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  const options = constructAllProviders(argv);
  console.log(status(options));
}

/**
 * Gets a list of versions for server and browser drivers.
 * @param options The constructed set of all options.
 * @returns A string of the versions downloaded.
 */
export function status(options: Options): string {
  const binaryVersions = [];
  for (const provider of options.providers) {
    const status = provider.binary.getStatus();
    if (status) {
      binaryVersions.push(`${provider.name}: ${status}`);
    }
  }
  if (options.server && options.server.binary) {
    const status = options.server.binary.getStatus();
    if (status) {
      binaryVersions.push(`${options.server.name}: ${status}`);
    }
  }
  return (binaryVersions.sort()).join('\n');
}