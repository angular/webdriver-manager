import * as yargs from 'yargs';
import * as clean from '../cmds/clean';
import * as shutdown from '../cmds/shutdown';
import * as start from '../cmds/start';
import * as status from '../cmds/status';
import * as update from '../cmds/update';

const CHROMEDRIVER_ALIAS = 'chrome';
const CHROMEDRIVER = 'chromedriver';
const chromedriverOption: yargs.Options = {
  describe: 'Install or update chromedriver.',
  default: true,
  type: 'boolean'
};
const CHROMEDRIVER_LOGS_ALIAS = 'chrome_logs';
const CHROMEDRIVER_LOGS = 'chromedriver_logs';
const chromedriverLogsOption: yargs.Options = {
  describe: 'File path to chrome logs.',
  type: 'string'
};
const CHROMIUM = 'chromium';
const chromiumOptions: yargs.Options = {
  describe: 'Download chromium.',
  default: false,
  type: 'boolean'
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
const GECKODRIVER_ALIAS = 'gecko';
const GECKODRIVER = 'geckodriver';
const geckodriverOption: yargs.Options = {
  describe: 'Install or update geckodriver.',
  default: true,
  type: 'boolean'
};
const GITHUB_TOKEN = 'github_token';
const githubTokenOption: yargs.Options = {
  describe: 'Use a GitHub token to prevent rate limit issues.',
  type: 'string'
};
const IEDRIVER_ALIAS = 'ie';
const IEDRIVER = 'iedriver';
const iedriverOption: yargs.Options = {
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
};
const MAX_VERSIONS_CHROMEDRIVER_ALIAS = 'max_versions.chrome';
const MAX_VERSIONS_CHROMEDRIVER = 'max_versions.chromedriver';
const maxVersionsChromedriverOption: yargs.Options = {
  describe: 'The chromedriver max version used only for update.',
  type: 'string'
};
const MAX_VERSIONS_CHROMIUM = 'max_versions.chromium';
const maxVersionsChromiumOptions: yargs.Options = {
  describe: 'The chromium max version used only for update.',
  type: 'string'
};
const MAX_VERSIONS_GECKODRIVER_ALIAS = 'max_versions.gecko';
const MAX_VERSIONS_GECKODRIVER = 'max_versions.geckodriver';
const maxVersionsGeckodriverOption: yargs.Options = {
  describe: 'The geckodriver max version used only for update.',
  type: 'string'
};
const MAX_VERSIONS_IEDRIVER_ALIAS = 'max_versions.ie';
const MAX_VERSIONS_IEDRIVER = 'max_versions.iedriver';
const maxVersionsIedriverOption: yargs.Options = {
  describe: 'The ie driver max version used only for update.',
  type: 'string'
};
const MAX_VERSIONS_SELENIUM_ALIAS = 'max_versions.standalone';
const MAX_VERSIONS_SELENIUM = 'max_versions.selenium';
const maxVersionsSeleniumOption: yargs.Options = {
  describe: 'The selenium server standalone max version used only for update.',
  type: 'string'
};

const OUT_DIR = 'out_dir';
const outDirOption: yargs.Options = {
  describe: 'Location of output.',
  type: 'string'
};
const PROXY = 'proxy';
const proxyOption: yargs.Options = {
  describe: 'Use a proxy server to download files.',
  type: 'string'
};
const SELENIUM_PORT = 'seleniumPort';
const seleniumPort: yargs.Options = {
  describe: 'Optional port for the selenium standalone server',
  default: 4444,
  type: 'number'
};
const SELENIUM_LOG_LEVEL = 'seleniumLogLevel';
const seleniumLogLevelOption: yargs.Options = {
  describe: 'Set the -Dselenium.LOGGER.level flag when starting the server',
  type: 'string'
};
const SELENIUM_ALIAS = 'standalone';
const SELENIUM = 'selenium';
const seleniumOption: yargs.Options = {
  describe: 'Install or update selenium server standalone.',
  default: true,
  type: 'boolean'
};
const SELENIUM_NODE_ALIAS = 'standalone_node';
const SELENIUM_NODE = 'selenium_node';
const seleniumNodeOption: yargs.Options = {
  describe: 'Start the selenium server standalone with role set to "node".',
  type: 'boolean'
};
const VERSIONS_CHROMEDRIVER_ALIAS = 'versions.chrome';
const VERSIONS_CHROMEDRIVER = 'versions.chromedriver';
const versionsChromedriverOption: yargs.Options = {
  describe: 'The chromedriver version.',
  type: 'string'
};
const VERSIONS_GECKODRIVER_ALIAS = 'versions.gecko';
const VERSIONS_GECKODRIVER = 'versions.geckodriver';
const versionsGeckodriverOption: yargs.Options = {
  describe: 'The geckodriver version.',
  type: 'string'
};
const VERSIONS_IEDRIVER_ALIAS = 'versions.ie';
const VERSIONS_IEDRIVER = 'versions.iedriver';
const versionsIedriverOption: yargs.Options = {
  describe: 'The ie driver version.',
  type: 'string'
};
const VERSIONS_SELENIUM_ALIAS = 'versions.standalone';
const VERSIONS_SELENIUM = 'versions.selenium';
const versionsSeleniumOption: yargs.Options = {
  describe: 'The selenium server standalone version.',
  type: 'string'
};

// tslint:disable-next-line:no-unused-expression
yargs
    .command(
        'clean', 'Removes downloaded files from the out_dir.',
        (yargs: yargs.Argv) => {
          return yargs.option(LOG_LEVEL, logLevelOption)
              .option(OUT_DIR, outDirOption);
        },
        (argv: yargs.Arguments) => {
          clean.handler(argv);
        })
    .command(
        'shutdown', 'Shutdown a local selenium server with GET request',
        (yargs: yargs.Argv) => {
          return yargs.option(LOG_LEVEL, logLevelOption);
        },
        (argv: yargs.Arguments) => {
          shutdown.handler(argv);
        })
    .command(
        'start', 'Start up the selenium server.',
        (yargs: yargs.Argv) => {
          return yargs
              .option(CHROMEDRIVER, chromedriverOption)
              .alias(CHROMEDRIVER_ALIAS, CHROMEDRIVER)
              .option(CHROMEDRIVER_LOGS, chromedriverLogsOption)
              .alias(CHROMEDRIVER_LOGS_ALIAS, CHROMEDRIVER_LOGS)
              .option(DETACH, detachOption)
              .option(EDGE, edgeOption)
              .option(GECKODRIVER, geckodriverOption)
              .alias(GECKODRIVER_ALIAS, GECKODRIVER)
              .option(IEDRIVER, iedriverOption)
              .alias(IEDRIVER_ALIAS, IEDRIVER)
              .option(LOG_LEVEL, logLevelOption)
              .option(OUT_DIR, outDirOption)
              .option(SELENIUM, seleniumOption)
              .alias(SELENIUM_ALIAS, SELENIUM)
              .option(SELENIUM_LOG_LEVEL, seleniumLogLevelOption)
              .option(SELENIUM_NODE, seleniumNodeOption)
              .alias(SELENIUM_NODE_ALIAS, SELENIUM_NODE)
              .option(SELENIUM_PORT, seleniumPort)
              .option(VERSIONS_CHROMEDRIVER, versionsChromedriverOption)
              .alias(VERSIONS_CHROMEDRIVER_ALIAS, VERSIONS_CHROMEDRIVER)
              .option(VERSIONS_GECKODRIVER, versionsGeckodriverOption)
              .alias(VERSIONS_GECKODRIVER_ALIAS, VERSIONS_GECKODRIVER)
              .option(VERSIONS_IEDRIVER, versionsIedriverOption)
              .alias(VERSIONS_IEDRIVER_ALIAS, VERSIONS_IEDRIVER)
              .option(VERSIONS_SELENIUM, versionsSeleniumOption)
              .alias(VERSIONS_SELENIUM_ALIAS, VERSIONS_SELENIUM);
        },
        (argv: yargs.Arguments) => {
          start.handler(argv);
        })
    .command(
        'status', 'List the current available binaries.',
        (yargs: yargs.Argv) => {
          return yargs.option(LOG_LEVEL, logLevelOption)
              .option(OUT_DIR, outDirOption);
        },
        (argv: yargs.Arguments) => {
          status.handler(argv);
        })
    .command(
        'update', 'Install or update selected binaries.',
        (yargs: yargs.Argv) => {
          return yargs.option(OUT_DIR, outDirOption)
              .option(CHROMEDRIVER, chromedriverOption)
              .alias(CHROMEDRIVER_ALIAS, CHROMEDRIVER)
              .option(CHROMIUM, chromiumOptions)
              .option(GECKODRIVER, geckodriverOption)
              .alias(GECKODRIVER_ALIAS, GECKODRIVER)
              .option(GITHUB_TOKEN, githubTokenOption)
              .option(IEDRIVER, iedriverOption)
              .alias(IEDRIVER_ALIAS, IEDRIVER)
              .option(IGNORE_SSL, ignoreSSLOption)
              .option(LOG_LEVEL, logLevelOption)
              .option(MAX_VERSIONS_CHROMEDRIVER, maxVersionsChromedriverOption)
              .alias(MAX_VERSIONS_CHROMEDRIVER_ALIAS, MAX_VERSIONS_CHROMEDRIVER)
              .option(MAX_VERSIONS_CHROMIUM, maxVersionsChromiumOptions)
              .option(MAX_VERSIONS_GECKODRIVER, maxVersionsGeckodriverOption)
              .alias(MAX_VERSIONS_GECKODRIVER_ALIAS, MAX_VERSIONS_GECKODRIVER)
              .option(MAX_VERSIONS_IEDRIVER, maxVersionsIedriverOption)
              .alias(MAX_VERSIONS_IEDRIVER_ALIAS, MAX_VERSIONS_IEDRIVER)
              .option(MAX_VERSIONS_SELENIUM, maxVersionsSeleniumOption)
              .alias(MAX_VERSIONS_SELENIUM_ALIAS, MAX_VERSIONS_SELENIUM)
              .option(OUT_DIR, outDirOption)
              .option(PROXY, proxyOption)
              .option(SELENIUM, seleniumOption)
              .alias(SELENIUM_ALIAS, SELENIUM)
              .option(VERSIONS_CHROMEDRIVER, versionsChromedriverOption)
              .alias(VERSIONS_CHROMEDRIVER_ALIAS, VERSIONS_CHROMEDRIVER)
              .option(VERSIONS_GECKODRIVER, versionsGeckodriverOption)
              .alias(VERSIONS_GECKODRIVER_ALIAS, VERSIONS_GECKODRIVER)
              .option(VERSIONS_IEDRIVER, versionsIedriverOption)
              .alias(VERSIONS_IEDRIVER_ALIAS, VERSIONS_IEDRIVER)
              .option(VERSIONS_SELENIUM, versionsSeleniumOption)
              .alias(VERSIONS_SELENIUM_ALIAS, VERSIONS_SELENIUM);
        },
        (argv: yargs.Arguments) => {
          update.handler(argv);
        })
    .help()
    .argv;