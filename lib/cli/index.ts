import * as clean from '../cmds/clean';
import * as start from '../cmds/start';
import * as status from '../cmds/status';
import * as update from '../cmds/update';

// Not using yargs type definitions due to:
// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/28061#issuecomment-412365576
// Although the fix is to cast all my objects into a yargs.Options
// objects, the error is not obvious to debug if an error occurs.
const yargs = require('yargs');

const CHROME = 'chrome';
const chromeOption = {
  describe: 'Install or update chromedriver.',
  default: true,
  type: 'boolean'
};
const GECKO = 'gecko';
const geckoOption = {
  describe: 'Install or update geckodriver.',
  default: true,
  type: 'boolean'
};
const IEDRIVER = 'iedriver';
const ieOption = {
  describe: 'Install or update ie driver.',
  default: false,
  type: 'boolean'
};
const IGNORE_SSL = 'ignore_ssl';
const ignoreSSLOption = {
  describe: 'Ignore SSL certificates.',
  type: 'boolean'
};
const OUT_DIR = 'out_dir';
let outDirOption = {
  describe: 'Location of output.',
  default: 'downloads',
  type: 'string'
};
const PROXY = 'proxy';
const proxyOption = {
  describe: 'Use a proxy server to download files.',
  type: 'string'
};
const STANDALONE = 'standalone';
const standaloneOption = {
  describe: 'Install or update selenium server standalone.',
  default: true,
  type: 'boolean'
};
const VERSIONS_CHROME = 'versions.chrome';
const versionsChromeOption = {
  describe: 'The chromedriver version.',
  type: 'string'
};
const VERSIONS_GECKO = 'versions.gecko';
const versionsGeckoOption = {
  describe: 'The geckodriver version.',
  type: 'string'
};
const VERSIONS_IE = 'versions.ie';
const versionsIeOption = {
  describe: 'The ie driver version.',
  type: 'string'
};
const VERSIONS_STANDALONE = 'versions.standalone';
const versionsStandaloneOption = {
  describe: 'The selenium server standalone version.',
  type: 'string'
};

yargs
  .command('clean', 'Removes downloaded files from the out_dir.',
    (yargs: any) => {
      return yargs.option(OUT_DIR, outDirOption)
    }, (argv: any) => {
      clean.handler(argv);
    })
  .command('start', 'Start up the selenium server.',
    (yargs: any) => {
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
    }, (argv: any) => {
      start.handler(argv);
    })
  .command('status', 'List the current available binaries.',
    (yargs: any) => {
      return yargs.option(OUT_DIR, outDirOption)
    }, (argv: any) => {
      status.handler(argv);
    })
  .command('update', 'Install or update selected binaries.',
    (yargs: any) => {
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
    }, (argv: any) => {
      update.handler(argv);
    })
  .help()
  .argv;