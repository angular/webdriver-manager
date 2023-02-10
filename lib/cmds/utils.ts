import * as yargs from 'yargs';
import {ChromeDriver} from '../provider/chromedriver';
import {GeckoDriver} from '../provider/geckodriver';
import {IEDriver} from '../provider/iedriver';
import {ProviderConfig} from '../provider/provider';
import {SeleniumServer, SeleniumServerProviderConfig} from '../provider/selenium_server';

import {BrowserDriver, BrowserDriverName, Options} from './options';
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
 * For the clean and status commands ONLY.
 * Create the options with all providers.
 * @param argv
 */
export function convertArgs2AllOptions(argv: yargs.Arguments): Options {
  return {
    browserDrivers: [
      {name: 'chromedriver'},
      {name: 'geckodriver'},
      {name: 'iedriver'}
    ],
    server: {name: 'selenium'},
    outDir: argv['out_dir'] as string
  };
}

/**
 * For the update and start commands ONLY.
 * Create the options with providers depending on argv's.
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

  if (argv['chromedriver'] as boolean) {
    setVersions('chromedriver', argv, options.browserDrivers);
  }
  if (argv['geckodriver'] as boolean) {
    setVersions('geckodriver', argv, options.browserDrivers);
  }
  if (argv['iedriver'] as boolean) {
    setVersions('iedriver', argv, options.browserDrivers);
  }
  if (argv['selenium']) {
    options.server = {};
    options.server.name = 'selenium';
    options.server.runAsNode = argv['selenium_node'] as boolean;
    options.server.runAsDetach = argv.detach as boolean;
    options.server.version = argv['versions'] && argv['versions']['selenium'] ?
      argv['versions']['selenium'] as string : undefined;
    options.server.maxVersion = argv['max_versions']
      && argv['max_versions']['selenium'] ?
      argv['versions']['selenium'] as string : undefined;
    options.server.chromeLogs = argv.chrome_logs as string;
    options.server.edge = argv.edge as string;
    options.server.port = argv.seleniumPort as number;
    options.server.logLevel = argv.seleniumLogLevel as string;
  }
  return options;
}

function setVersions(name: BrowserDriverName,
    argv: yargs.Arguments, browserDrivers: BrowserDriver[]): BrowserDriver[] {
  const version = argv['versions'] && argv['versions'][name] ?
    argv['versions'][name] as string : undefined;
  const maxVersion = argv['max_versions'] && argv['max_versions'][name] ?
    argv['max_versions'][name] as string : undefined;
  browserDrivers.push({name, version, maxVersion});
  return browserDrivers;
}