import {Config} from '../config';
import {Cli, Option, Options} from '../cli';
import {ChromeDriver, IEDriver, StandAlone} from '../binaries';

/**
 * The options used by the commands.
 */
export class Opts {
  static outputDir = new Option('out_dir', 'Location to output/expect', 'string', Config.seleniumDir);
  static seleniumPort = new Option('seleniumPort', 'Optional port for the selenium standalone server', 'string');
  static ignoreSsl = new Option('ignore_ssl', 'Ignore SSL certificates', 'boolean', false);
  static proxy = new Option('proxy', 'Proxy to use for the install or update command', 'string');
  static alternateCdn = new Option('alternate_cnd', 'Alternate CDN to binaries', 'string');
  static standalone = new Option('standalone', 'Install or update selenium standalone', 'boolean', StandAlone.isDefault);
  static chrome = new Option('chrome', 'Install or update chromedriver', 'boolean', ChromeDriver.isDefault);
  static ie = new Option('ie', 'Install or update ie driver', 'boolean', IEDriver.isDefault);
  static ie32 = new Option('ie32', 'Install or update 32-bit ie driver', 'boolean', IEDriver.isDefault);
  static versionsChrome = new Option('versions_chrome', 'Optional chrome driver version', 'string', ChromeDriver.versionDefault);
  static versionsStandAlone = new Option('versions_standalone', 'Optional seleniuim standalone server version', 'string', StandAlone.versionDefault);
  static versionsIe = new Option('versions_ie', 'Optional internet explorer driver version', 'string', IEDriver.versionDefault);
}
