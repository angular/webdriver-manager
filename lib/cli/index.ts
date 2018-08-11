import * as yargs from 'yargs';
import * as clean from '../cmds/clean';
import * as start from '../cmds/start';
import * as status from '../cmds/status';
import * as update from '../cmds/update';

const chrome = {
  describe: 'Install or update chromedriver.',
  default: true
};
const gecko = {
  describe: 'Install or update geckodriver.',
  default: true
};
const ie = {
  describe: 'Install or update ie driver.',
  default: false
};
const ignoreSSL = {
  describe: 'Ignore SSL certificates.'
}
const outDir = {
  describe: 'Location of output.',
  default: 'downloads'
};
const proxy = {
  describe: 'Use a proxy server to download files.'
};
const standalone = {
  describe: 'Install or update selenium server standalone.',
  default: true
};
const versionsChrome = {
  describe: 'The chromedriver version.'
};
const versionsGecko = {
  describe: 'The geckodriver version.',
};
const versionsIe = {
  describe: 'The ie driver version.'
};
const versionsStandalone = {
  describe: 'The selenium server standalone version.'
};

yargs
  .command('clean', 'Removes downloaded files from the out_dir', {
    'out_dir': outDir
  }, (argv: yargs.Arguments) => {
    clean.handler(argv);
  })
  .command('start', 'Start up the selenium server.', {
      'chrome': chrome,
      'gecko': gecko,
      'ie': ie,
      'out_dir': outDir,
      'standalone': standalone,
      'versions_chrome': versionsChrome,
      'versions_gecko': versionsGecko,
      'versions_ie': versionsIe,
      'versions_standalone': versionsStandalone,
    }, (argv: yargs.Arguments) => {
      start.handler(argv);
    })
  .command('status', 'List the current available binaries.', {
      'out_dir': outDir
    }, (argv: yargs.Arguments) => {
      status.handler(argv);
    })
  .command('update', 'Install or update selected binaries.', {
      'chrome': chrome,
      'gecko': gecko,
      'ie': ie,
      'ignore_ssl': ignoreSSL,
      'out_dir': outDir,
      'proxy': proxy,
      'standalone': standalone,
      'versions.chrome': versionsChrome,
      'versions.gecko': versionsGecko,
      'versions.ie': versionsIe,
      'versions.standalone': versionsStandalone,
    }, (argv: yargs.Arguments) => {
      update.handler(argv);
    })
  .help()
  .argv;