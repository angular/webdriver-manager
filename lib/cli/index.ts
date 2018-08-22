import * as yargs from 'yargs';
import * as clean from '../cmds/clean';
import * as shutdown from '../cmds/shutdown';
import * as start from '../cmds/start';
import * as status from '../cmds/status';
import * as update from '../cmds/update';

const CHROME = 'chrome';
const chromeOption: yargs.Options = {
  describe: 'Install or update chromedriver.',
  default: true,
  type: 'boolean'
};
const CHROME_LOGS = 'chrome_logs';
const chromeLogsOption: yargs.Options = {
  describe: 'File path to chrome logs.',
  type: 'string'
};
const DETACH = 'detach';
const detachOption: yargs.Options = {
  describe: 'Once the selenium server is up and running, return ' +
    'control to the parent process and continue running the server ' +
    'in the background.',
  default: false,
  type: 'boolean'
};
const EDGE = 'edge';
const edgeOption: yargs.Options = {
  describe: 'Use an installed Microsoft edge driver. Usually installed: ' +
    '"C:\Program Files (x86)\Microsoft Web Driver\MirosoftWebDriver.exe"',
  type: 'string'
};
const GECKO = 'gecko';
const geckoOption: yargs.Options = {
  describe: 'Install or update geckodriver.',
  default: true,
  type: 'boolean'
};
const GITHUB_TOKEN = 'github_token';
const githubTokenOption: yargs.Options = {
  describe: 'Use a GitHub token to prevent rate limit issues.',
  type: 'string'
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
const LOG_LEVEL = 'log_level';
const logLevelOption: yargs.Options = {
  describe: 'The log level of this CLI.',
  default: 'info',
  type: 'string'
}
const OUT_DIR = 'out_dir';
let outDirOption: yargs.Options = {
  describe: 'Location of output.',
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
const STANDALONE_NODE = 'standalone_node';
const standaloneNodeOption: yargs.Options = {
  describe: 'Start the selenium server standalone with role set to "node".',
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
      return yargs
        .option(LOG_LEVEL, logLevelOption)
        .option(OUT_DIR, outDirOption)
    }, (argv: yargs.Arguments) => {
      clean.handler(argv);
    })
  .command('shutdown', 'Shutdown a local selenium server with GET request',
    (yargs: yargs.Argv) => {
      return yargs
      .option(LOG_LEVEL, logLevelOption)
    }, (argv: yargs.Arguments) => {
      shutdown.handler(argv);
    })
  .command('start', 'Start up the selenium server.',
    (yargs: yargs.Argv) => {
      return yargs
        .option(CHROME, chromeOption)
        .option(CHROME_LOGS, chromeLogsOption)
        .option(DETACH, detachOption)
        .option(EDGE, edgeOption)
        .option(GECKO,  geckoOption)
        .option(IEDRIVER, ieOption)
        .option(LOG_LEVEL, logLevelOption)
        .option(OUT_DIR, outDirOption)
        .option(STANDALONE, standaloneOption)
        .option(STANDALONE_NODE, standaloneNodeOption)
        .option(VERSIONS_CHROME, versionsChromeOption)
        .option(VERSIONS_GECKO, versionsGeckoOption)
        .option(VERSIONS_IE, versionsIeOption)
        .option(VERSIONS_STANDALONE, versionsStandaloneOption);
    }, (argv: yargs.Arguments) => {
      start.handler(argv);
    })
  .command('status', 'List the current available binaries.',
    (yargs: yargs.Argv) => {
      return yargs
        .option(LOG_LEVEL, logLevelOption)
        .option(OUT_DIR, outDirOption)
    }, (argv: yargs.Arguments) => {
      status.handler(argv);
    })
  .command('update', 'Install or update selected binaries.',
    (yargs: yargs.Argv) => {
      return yargs.option(OUT_DIR, outDirOption)
        .option(CHROME, chromeOption)
        .option(GECKO,  geckoOption)
        .option(GITHUB_TOKEN, githubTokenOption)
        .option(IEDRIVER, ieOption)
        .option(IGNORE_SSL, ignoreSSLOption)
        .option(LOG_LEVEL, logLevelOption)
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