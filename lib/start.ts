import { ChromeDriver } from './provider/chromedriver';
import { GeckoDriver } from './provider/geckodriver';
import { IEDriver } from './provider/iedriver';
import { SeleniumServer } from './provider/selenium_server';
import { Provider } from './provider/provider';

let seleniumServer: SeleniumServer;

/**
 * An options object to update and start the server.
 */
export interface Options {
  providers?: Array<{
    name?: string,
    version?: null,
    binary?: Provider
  }>,
  server?: {
    name?: string,
    version?: null,
    binary?: Provider
  },
  proxy?: string,
  ignoreSSL?: boolean,
  outDir?: string
}
let options: Options = {
  providers: [{
    name: 'chromedriver',
    version: null
  }],
  server: {
    name: 'selenium',
    version: null
  },
  proxy: null,
  ignoreSSL: false,
  outDir: null,
}

export function constructProviders(options: Options) {
  let providerConfig = {
    outDir: options.outDir,
    proxy: options.proxy,
    ignoreSSL: options.ignoreSSL
  };
  for (let provider of options.providers) {
    if ((provider.name as string).match('chromedriver')) {
      provider.binary = new ChromeDriver(providerConfig)
    } else if ((provider.name as string).match('gecko')) {
      provider.binary = new GeckoDriver(providerConfig);
    } else if ((provider.name as string).match('ie')) {
      provider.binary = new IEDriver(providerConfig);
    }
  }
  if (options.server) {
    options.server.binary = new SeleniumServer(providerConfig);
    seleniumServer = options.server.binary as SeleniumServer;
  }
}

export function update(options: Options): Promise<any> {
  let promises = [];
  for (let provider of options.providers) {
    promises.push(provider.binary.updateBinary(provider.version));
  }
  promises.push(options.server.binary.updateBinary(options.server.version));
  return Promise.all(promises);
}

export function start(options: Options): Promise<any> {
  let javaOpts: {[key: string]: string} = {};
  for (let provider of options.providers) {
    javaOpts[provider.binary.seleniumFlag] = provider.binary.getBinaryPath(provider.version);
  }
  return seleniumServer.startServer(javaOpts, options.server.version);
}

constructProviders(options);
update(options).then(() => {
  start(options).then(() => {
    console.log('indefinitely wait');
  });
});