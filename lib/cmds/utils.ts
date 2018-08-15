import * as yargs from 'yargs';
import { Options } from './options';
import { ChromeDriver } from '../provider/chromedriver';
import { GeckoDriver } from '../provider/geckodriver';
import { IEDriver } from '../provider/iedriver';
import { SeleniumServer } from '../provider/selenium_server';

/**
 * Create the options with all providers.
 * @param argv
 */
export function constructAllProviders(argv: yargs.Arguments): Options {
  let providerConfig = {
    ignoreSSL: argv.ignore_ssl,
    outDir: argv.out_dir,
    proxy: argv.proxy
  };

  let versionsChrome, versionsGecko, versionsIe, versionsStandalone = undefined;
  if (argv.versions) {
    versionsChrome = argv.versions.chrome;
    versionsGecko = argv.versions.gecko;
    versionsIe = argv.versions.ie;
    versionsStandalone = argv.versions.standalone;
  }

  return {
    providers: [{
      name: 'chromedriver',
      binary: new ChromeDriver(providerConfig),
      version: versionsChrome
    }, {
      name: 'geckodriver',
      binary: new GeckoDriver(providerConfig),
      version: versionsGecko
    }, {
      name: 'iedriver',
      binary: new IEDriver(providerConfig),
      version: versionsIe
    }],
    server: {
      name: 'selenium',
      binary: new SeleniumServer(providerConfig),
      version: versionsStandalone
    },
    ignoreSSL: argv.ignore_ssl,
    outDir: argv.out_dir,
    proxy: argv.proxy,
  };
}

/**
 * Create the options with providers depending on argv's.
 * @param argv
 */
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

  let versionsChrome, versionsGecko, versionsIe, versionsStandalone = undefined;
  if (argv.versions) {
    versionsChrome = argv.versions.chrome;
    versionsGecko = argv.versions.gecko;
    versionsIe = argv.versions.ie;
    versionsStandalone = argv.versions.standalone;
  }

  if (argv.chrome) {
    options.providers.push({
      name: 'chromedriver',
      binary: new ChromeDriver(providerConfig),
      version: versionsChrome
    });
  }
  if (argv.gecko) {
    options.providers.push({
      name: 'geckodriver',
      binary: new GeckoDriver(providerConfig),
      version: versionsGecko
    });
  }
  if (argv.ie) {
    options.providers.push({
      name: 'iedriver',
      binary: new IEDriver(providerConfig),
      version: versionsIe
    });
  }
  if (argv.standalone) {
    options.server.name = 'selenium';
    options.server.binary = new SeleniumServer(providerConfig);
    options.server.version = versionsStandalone;
  }
  return options;
}