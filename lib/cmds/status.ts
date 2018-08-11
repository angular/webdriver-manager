import * as yargs from 'yargs';
import { Options } from './options';
import { constructAllProviders } from './utils';


export function handler(argv: yargs.Arguments) {
  let options = constructAllProviders(argv);
  console.log(status(options));
}

export function status(options: Options): string {
  let binaryVersions = [];
  for (let provider of options.providers) {
    let status = provider.binary.getStatus();
    if (status) {
      binaryVersions.push(`${provider.name}: ${status}`);
    }
  }
  binaryVersions.push(
    `${options.server.name}: ${options.server.binary.getStatus()}`);
  return (binaryVersions.sort()).join('\n');
}