import * as yargs from 'yargs';
import * as clean from '../cmds/clean';
import * as start from '../cmds/start';
import * as status from '../cmds/status';
import * as update from '../cmds/update';

const CHROME = 'chrome';
const chromeOption: yargs.Options = {
  describe: 'Install or update chromedriver.',
  default: true,
  type: 'boolean'
};
const GECKO = 'gecko';
const geckoOption: yargs.Options = {
  describe: 'Install or update geckodriver.',
  default: true,
  type: 'boolean'
};
const IEDRIVER = 'iedriver';
const ieOption: yargs.Options = {
  describe: 'Install or update ie driver.',
  default: false,
  type: 'boolean'
};
const IGNORE_SSL = 'ignore_ssl';
const ignoreSSLOption: yargs.Options = {
  describe: 'Ignore SSL certificates.',
  type: 'boolean'
};
const OUT_DIR = 'out_dir';
let outDirOption: yargs.Options = {
  describe: 'Location of output.',
  default: 'downloads',
  type: 'string'
};
const PROXY = 'proxy';
const proxyOption: yargs.Options = {
  describe: 'Use a proxy server to download files.',
  type: 'string'
};
const STANDALONE = 'standalone';
const standaloneOption: yargs.Options = {
  describe: 'Install or update selenium server standalone.',
  default: true,
  type: 'boolean'
};
const VERSIONS_CHROME = 'versions.chrome';
const versionsChromeOption: yargs.Options = {
  describe: 'The chromedriver version.',
  type: 'string'
};
const VERSIONS_GECKO = 'versions.gecko';
const versionsGeckoOption: yargs.Options = {
  describe: 'The geckodriver version.',
  type: 'string'
};
const VERSIONS_IE = 'versions.ie';
const versionsIeOption: yargs.Options = {
  describe: 'The ie driver version.',
  type: 'string'
};
const VERSIONS_STANDALONE = 'versions.standalone';
const versionsStandaloneOption: yargs.Options = {
  describe: 'The selenium server standalone version.',
  type: 'string'
};

yargs
  .command('clean', 'Removes downloaded files from the out_dir.',
    (yargs: yargs.Argv) => {
      return yargs.option(OUT_DIR, outDirOption)
    }, (argv: yargs.Arguments) => {
      clean.handler(argv);
    })
  .command('start', 'Start up the selenium server.',
    (yargs: yargs.Argv) => {
      return yargs
        .option(CHROME, chromeOption)
        .option(GECKO,  geckoOption)
        .option(IEDRIVER, ieOption)
        .option(OUT_DIR, outDirOption)
        .option(STANDALONE, standaloneOption)
        .option(VERSIONS_CHROME, versionsChromeOption)
        .option(VERSIONS_GECKO, versionsGeckoOption)
        .option(VERSIONS_IE, versionsIeOption)
        .option(VERSIONS_STANDALONE, versionsStandaloneOption);
    }, (argv: yargs.Arguments) => {
      start.handler(argv);
    })
  .command('status', 'List the current available binaries.',
    (yargs: yargs.Argv) => {
      return yargs.option(OUT_DIR, outDirOption)
    }, (argv: yargs.Arguments) => {
      status.handler(argv);
    })
  .command('update', 'Install or update selected binaries.',
    (yargs: yargs.Argv) => {
      return yargs.option(OUT_DIR, outDirOption)
        .option(CHROME, chromeOption)
        .option(GECKO,  geckoOption)
        .option(IEDRIVER, ieOption)
        .option(IGNORE_SSL, ignoreSSLOption)
        .option(OUT_DIR, outDirOption)
        .option(PROXY, proxyOption)
        .option(STANDALONE, standaloneOption)
        .option(VERSIONS_CHROME, versionsChromeOption)
        .option(VERSIONS_GECKO, versionsGeckoOption)
        .option(VERSIONS_IE, versionsIeOption)
        .option(VERSIONS_STANDALONE, versionsStandaloneOption);
    }, (argv: yargs.Arguments) => {
      update.handler(argv);
    })
  .help()
  .argv;