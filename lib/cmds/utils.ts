import { Options } from './options';
import { ChromeDriver } from '../provider/chromedriver';
import { GeckoDriver } from '../provider/geckodriver';
import { IEDriver } from '../provider/iedriver';
import { SeleniumServer } from '../provider/selenium_server';

export function constructProviders(options: Options): Options {
  let providerConfig = {
    outDir: options.outDir,
    proxy: options.proxy,
    ignoreSSL: options.ignoreSSL
  };
  for (let provider of options.providers) {
    if ((provider.name as string).match('chromedriver')) {
      provider.binary = new ChromeDriver(providerConfig)
    } else if ((provider.name as string).match('geckodriver')) {
      provider.binary = new GeckoDriver(providerConfig);
    } else if ((provider.name as string).match('iedriver')) {
      provider.binary = new IEDriver(providerConfig);
    }
  }
  if (options.server) {
    options.server.binary = new SeleniumServer(providerConfig);
  }
  return options;
}