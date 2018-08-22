import * as log from 'loglevel';
import * as yargs from 'yargs';
import { Options } from './options';
import { constructAllProviders } from './utils';

/**
 * Displays which versions of providers that have been downloaded.
 * @param argv The argv from yargs.
 */
export function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  let options = constructAllProviders(argv);
  console.log(status(options));
}

/**
 * Gets a list of versions for server and browser drivers.
 * @param options The constructed set of all options.
 * @returns A string of the versions downloaded.
 */
export function status(options: Options): string {
  let binaryVersions = [];
  for (let provider of options.providers) {
    let status = provider.binary.getStatus();
    if (status) {
      binaryVersions.push(`${provider.name}: ${status}`);
    }
  }
  if (options.server && options.server.binary) {
    let status = options.server.binary.getStatus();
    if (status) {
      binaryVersions.push(
        `${options.server.name}: ${status}`);

    }
  }
  return (binaryVersions.sort()).join('\n');
}