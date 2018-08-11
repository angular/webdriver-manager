import * as yargs from 'yargs';
import { Options } from './options';
import { ChromeDriver } from '../provider/chromedriver';
import { GeckoDriver } from '../provider/geckodriver';
import { IEDriver } from '../provider/iedriver';
import { SeleniumServer } from '../provider/selenium_server';

export function constructAllProviders(argv: yargs.Arguments): Options {
  let providerConfig = {
    ignoreSSL: argv.ignore_ssl,
    outDir: argv.out_dir,
    proxy: argv.proxy
  };
  return {
    providers: [{
      name: 'chromedriver',
      binary: new ChromeDriver(providerConfig),
      version: argv.versions_chrome
    }, {
      name: 'geckodriver',
      binary: new GeckoDriver(providerConfig),
      version: argv.versions_gecko
    }, {
      name: 'iedriver',
      binary: new IEDriver(providerConfig),
      version: argv.versions_ie
    }],
    server: {
      name: 'selenium',
      binary: new SeleniumServer(providerConfig),
      version: argv.versions_standalone
    },
    ignoreSSL: argv.ignore_ssl,
    outDir: argv.out_dir,
    proxy: argv.proxy,
  };
}

export function constructProviders(argv: yargs.Arguments): Options {
  let options: Options = {
    providers: [],
    server: {},
    ignoreSSL: argv.ignore_ssl,
    outDir: argv.out_dir,
    proxy: argv.proxy,
  };

  let providerConfig = {
    outDir: options.outDir,
    proxy: options.proxy,
    ignoreSSL: options.ignoreSSL
  };

  if (argv.chrome) {
    options.providers.push({
      name: 'chromedriver',
      binary: new ChromeDriver(providerConfig),
      version: argv.versions_chrome
    });
  }
  if (argv.gecko) {
    options.providers.push({
      name: 'geckodriver',
      binary: new GeckoDriver(providerConfig),
      version: argv.versions_gecko
    });
  }
  if (argv.ie) {
    options.providers.push({
      name: 'iedriver',
      binary: new IEDriver(providerConfig),
      version: argv.versions_ie
    });
  }
  if (argv.standalone) {
    options.server.name = 'selenium';
    options.server.binary = new SeleniumServer(providerConfig);
    options.server.version = argv.versions_standalone;
  }
  return options;
}