import * as yargs from 'yargs';
import { Options } from './options';
import { constructAllProviders } from './utils';
import { SeleniumServer } from '../provider/selenium_server';

export function handler(argv: yargs.Arguments) {
  let options = constructAllProviders(argv);
  start(options).then(() => {});
}

export function start(options: Options): Promise<any> {
  let javaOpts: {[key: string]: string} = {};
  for (let provider of options.providers) {
    if (provider.binary) {
      javaOpts[provider.binary.seleniumFlag] =
        provider.binary.getBinaryPath(provider.version);
    }
  }
  return (options.server.binary as SeleniumServer)
    .startServer(javaOpts, options.server.version);
}