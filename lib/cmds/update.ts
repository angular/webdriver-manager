import * as yargs from 'yargs';
import { Options } from './options';
import { constructProviders } from './utils';

export function handler(argv: yargs.Arguments) {
  let options = constructProviders(argv);
  update(options).then(() => {});
}

export function update(options: Options): Promise<any> {
  let promises = [];
  for (let provider of options.providers) {
    promises.push(provider.binary.updateBinary(provider.version));
  }
  promises.push(options.server.binary.updateBinary(options.server.version));
  return Promise.all(promises);
}