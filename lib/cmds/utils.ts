import * as yargs from 'yargs';
import {ChromeDriver} from '../provider/chromedriver';
import {GeckoDriver} from '../provider/geckodriver';
import {IEDriver} from '../provider/iedriver';
import {ProviderConfig} from '../provider/provider';
import {SeleniumServer, SeleniumServerProviderConfig} from '../provider/selenium_server';

import {Options} from './options';
import {OptionsBinary} from './options_binary';

/**
 * Converts an options object into an options binary object.
 * @param options
 */
export function addOptionsBinary(options: Options): OptionsBinary {
  if (!options) {
    return null;
  }
  const providerConfig: ProviderConfig = {
    ignoreSSL: options.ignoreSSL,
    outDir: options.outDir,
    proxy: options.proxy
  };

  const optionsBinary: OptionsBinary = options;
  if (optionsBinary.browserDrivers) {
    for (const browserDriver of optionsBinary.browserDrivers) {
      if (browserDriver.name === 'chromedriver') {
        browserDriver.binary = new ChromeDriver(providerConfig);
      } else if (browserDriver.name === 'geckodriver') {
        const geckoProviderConfig = providerConfig;
        geckoProviderConfig.oauthToken = optionsBinary.githubToken;
        browserDriver.binary = new GeckoDriver(geckoProviderConfig);
      } else if (browserDriver.name === 'iedriver') {
        browserDriver.binary = new IEDriver(providerConfig);
      }
    }
  }
  if (optionsBinary.server) {
    const seleniumProviderConfig: SeleniumServerProviderConfig = providerConfig;
    seleniumProviderConfig.outDir = optionsBinary.outDir;
    seleniumProviderConfig.port = optionsBinary.server.port;
    seleniumProviderConfig.runAsDetach = optionsBinary.server.runAsDetach;
    seleniumProviderConfig.runAsNode = optionsBinary.server.runAsNode;
    seleniumProviderConfig.logLevel = optionsBinary.server.logLevel;
    optionsBinary.server.binary = new SeleniumServer(seleniumProviderConfig);
  }
  return optionsBinary;
}

/**
 * Create the options with all providers. Used for clean and status commands.
 * @param argv
 */
export function convertArgs2AllOptions(argv: yargs.Arguments): Options {
  let versionsChrome, versionsGecko, versionsIe, versionsStandalone = undefined;
  if (argv.versions) {
    versionsChrome = argv.versions.chrome as string;
    versionsGecko = argv.versions.gecko as string;
    versionsIe = argv.versions.ie as string;
    versionsStandalone = argv.versions.standalone as string;
  }
  return {
    browserDrivers: [
      {name: 'chromedriver', version: versionsChrome},
      {name: 'geckodriver', version: versionsGecko},
      {name: 'iedriver', version: versionsIe}
    ],
    server: {
      name: 'selenium',
      version: versionsStandalone,
      runAsNode: argv.standalone_node as boolean,
      runAsDetach: argv.detach as boolean,
      chromeLogs: argv.chrome_logs as string,
      edge: argv.edge as string,
    },
    ignoreSSL: argv.ignore_ssl as boolean,
    outDir: argv.out_dir as string,
    proxy: argv.proxy as string,
    githubToken: argv.github_token as string,
  };
}

/**
 * Create the options with providers depending on argv's. Used for update and
 * start commands.
 * @param argv
 */
export function convertArgs2Options(argv: yargs.Arguments): Options {
  const options: Options = {
    browserDrivers: [],
    server: null,
    ignoreSSL: argv.ignore_ssl as boolean,
    outDir: argv.out_dir as string,
    proxy: argv.proxy as string,
    githubToken: argv.github_token as string,
  };

  let versionsChrome, versionsGecko, versionsIe, versionsStandalone = undefined;
  if (argv.versions) {
    versionsChrome = argv.versions.chrome as string;
    versionsGecko = argv.versions.gecko as string;
    versionsIe = argv.versions.ie as string;
    versionsStandalone = argv.versions.standalone as string;
  }
  if (argv.chrome as boolean) {
    options.browserDrivers.push(
        {name: 'chromedriver', version: versionsChrome});
  }
  if (argv.gecko as boolean) {
    options.browserDrivers.push({name: 'geckodriver', version: versionsGecko});
  }
  if (argv.iedriver as boolean) {
    options.browserDrivers.push({name: 'iedriver', version: versionsIe});
  }
  if (argv.standalone as boolean) {
    options.server = {};
    options.server.name = 'selenium';
    options.server.runAsNode = argv.standalone_node as boolean;
    options.server.runAsDetach = argv.detach as boolean;
    options.server.version = versionsStandalone;
    options.server.chromeLogs = argv.chrome_logs as string;
    options.server.edge = argv.edge as string;
    options.server.port = argv.seleniumPort as number;
    options.server.logLevel = argv.seleniumLogLevel as string;
  }
  return options;
}