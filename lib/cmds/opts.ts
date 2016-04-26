import {Config} from '../config';
import {Cli, Option, Options} from '../cli';
import {ChromeDriver, IEDriver, StandAlone} from '../binaries';

export const OUT_DIR = 'out_dir';
export const SELENIUM_PORT = 'seleniumPort';
export const IGNORE_SSL = 'ignore_ssl';
export const PROXY = 'proxy';
export const ALTERNATE_CDN = 'alternate_cdn';
export const STANDALONE = 'standalone';
export const CHROME = 'chrome';
export const IE = 'ie';
export const IE32 = 'ie32';
export const VERSIONS_CHROME = 'versions.chrome';
export const VERSIONS_STANDALONE = 'versions.standalone';
export const VERSIONS_IE = 'versions.ie';
export const CHROME_LOGS = 'chrome_logs';


/**
 * The options used by the commands.
 */
var opts: Options = {};
opts[OUT_DIR] = new Option(OUT_DIR, 'Location to output/expect', 'string', Config.getSeleniumDir());
opts[SELENIUM_PORT] = new Option(SELENIUM_PORT, 'Optional port for the selenium standalone server', 'string');
opts[IGNORE_SSL] = new Option(IGNORE_SSL, 'Ignore SSL certificates', 'boolean', false);
opts[PROXY] = new Option(PROXY, 'Proxy to use for the install or update command', 'string');
opts[ALTERNATE_CDN] = new Option(ALTERNATE_CDN, 'Alternate CDN to binaries', 'string');
opts[STANDALONE] = new Option(STANDALONE, 'Install or update selenium standalone', 'boolean', StandAlone.isDefault);
opts[CHROME] = new Option(CHROME, 'Install or update chromedriver', 'boolean', ChromeDriver.isDefault);
opts[IE] = new Option(IE, 'Install or update ie driver', 'boolean', IEDriver.isDefault);
opts[IE32] = new Option(IE32, 'Install or update 32-bit ie driver', 'boolean', IEDriver.isDefault);
opts[VERSIONS_CHROME] = new Option(VERSIONS_CHROME, 'Optional chrome driver version', 'string', ChromeDriver.versionDefault);
opts[VERSIONS_STANDALONE] = new Option(VERSIONS_STANDALONE, 'Optional seleniuim standalone server version', 'string', StandAlone.versionDefault);
opts[VERSIONS_IE] = new Option(VERSIONS_IE, 'Optional internet explorer driver version', 'string', IEDriver.versionDefault);
opts[CHROME_LOGS] = new Option(CHROME_LOGS, 'File path to chrome logs', 'string', undefined);

export var Opts = opts;
