import * as loglevel from 'loglevel';
import * as yargs from 'yargs';
import {Options} from './options';
import {OptionsBinary} from './options_binary';
import {addOptionsBinary, convertArgs2AllOptions} from './utils';

const log = loglevel.getLogger('webdriver-manager');

/**
 * Displays which versions of providers that have been downloaded.
 * @param argv The argv from yargs.
 */
export function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  const options = convertArgs2AllOptions(argv);
  console.log(status(options));
}

/**
 * Gets a list of versions for server and browser drivers.
 * @param options The constructed set of all options.
 * @returns A string of the versions downloaded.
 */
export function status(options: Options): string {
  const optionsBinary = addOptionsBinary(options);
  return statusBinary(optionsBinary);
}

/**
 * Gets a list of versions for server and browser drivers.
 * @param optionsBinary The constructed set of all options with binaries.
 * @returns A string of the versions downloaded.
 */
export function statusBinary(optionsBinary: OptionsBinary): string {
  const binaryVersions = [];
  for (const browserDriver of optionsBinary.browserDrivers) {
    const status = browserDriver.binary.getStatus();
    if (status) {
      binaryVersions.push(`${browserDriver.name}: ${status}`);
    }
  }
  if (optionsBinary.server && optionsBinary.server.binary) {
    const status = optionsBinary.server.binary.getStatus();
    if (status) {
      binaryVersions.push(`${optionsBinary.server.name}: ${status}`);
    }
  }
  return (binaryVersions.sort()).join('\n');
}