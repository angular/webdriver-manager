import * as loglevel from 'loglevel';
import * as yargs from 'yargs';
import {Options} from './options';
import {OptionsBinary} from './options_binary';
import {addOptionsBinary, convertArgs2Options} from './utils';

const log = loglevel.getLogger('webdriver-manager');

/**
 * Updates / downloads the providers binaries.
 * @param argv The argv from yargs.
 */
export async function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  const options = convertArgs2Options(argv);
  await update(options);
}

/**
 * Updates / downloads the providers binaries.
 * @param options The constructed options.
 * @returns Promise when binaries are all downloaded.
 */
export function update(options: Options): Promise<void[]> {
  const optionsBinary = addOptionsBinary(options);
  return updateBinary(optionsBinary);
}

/**
 * Updates / downloads the providers binaries.
 * @param optionsBinary The constructed options with binaries.
 * @returns Promise when binaries are all downloaded.
 */
export function updateBinary(optionsBinary: OptionsBinary): Promise<void[]> {
  const promises = [];
  if (optionsBinary.browserDrivers) {
    for (const provider of optionsBinary.browserDrivers) {
      promises.push(provider.binary.updateBinary(provider.version));
    }
  }
  if (optionsBinary.server && optionsBinary.server.binary) {
    promises.push(
        optionsBinary.server.binary.updateBinary(optionsBinary.server.version));
  }
  return Promise.all(promises);
}