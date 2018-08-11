import { Options } from './options';
import { constructProviders } from './utils';
import { SeleniumServer } from '../provider/selenium_server';

let options: Options = {
  providers: [
    { name: 'chromedriver'},
    { name: 'geckodriver' }
  ],
  server: {
    name: 'selenium',
  },
}

export function start(options: Options): Promise<any> {
  let javaOpts: {[key: string]: string} = {};
  for (let provider of options.providers) {
    javaOpts[provider.binary.seleniumFlag] =
      provider.binary.getBinaryPath(provider.version);
  }
  return (options.server.binary as SeleniumServer)
    .startServer(javaOpts, options.server.version);
}

options = constructProviders(options);
start(options).then(() => {});
