import * as yargs from 'yargs';
import { Options } from './options';
import { constructProviders } from './utils';

/**
 * Updates / downloads the providers binaries.
 * @param argv The argv from yargs.
 */
export function handler(argv: yargs.Arguments) {
  let options = constructProviders(argv);
  update(options).then(() => {});
}

/**
 * Updates / downloads the providers binaries.
 * @param options The constructed options.
 * @returns Promise when binaries are all downloaded.
 */
export function update(options: Options): Promise<any> {
  let promises = [];
  for (let provider of options.providers) {
    promises.push(provider.binary.updateBinary(provider.version));
  }
  if (options.server && options.server.binary) {
    promises.push(options.server.binary.updateBinary(options.server.version));
  }
  return Promise.all(promises);
}