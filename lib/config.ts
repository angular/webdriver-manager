import * as fs from 'fs';
import * as path from 'path';

import {Logger} from './cli';


let logger = new Logger('config');

export interface ConfigFile {
  selenium?: string;
  chrome?: string;
  gecko?: string;
  ie?: string;
  android?: string;
  appium?: string;
}

/**
 * The configuration for webdriver-manager
 *
 * The config.json, package.json, and selenium directory are found in the
 * same location at the root directory in webdriver-manager.
 *
 */
export class Config {
  static configFile: string = 'config.json';
  static packageFile: string = 'package.json';
  static nodeModuleName = 'webdriver-manager';

  static cwd = process.cwd();


  static localInstall: string;
  static parentPath = path.resolve(Config.cwd, '..');
  static dir = __dirname;
  static folder = Config.cwd.replace(Config.parentPath, '').substring(1);

  static isProjectVersion = Config.folder === Config.nodeModuleName;
  static isLocalVersion = false;

  static getConfigFile_(): string { return path.resolve(Config.dir, '..', Config.configFile); }

  static getPackageFile_(): string { return path.resolve(Config.dir, '..', Config.packageFile) }

  static getSeleniumDir(): string { return path.resolve(Config.dir, '..', '..', 'selenium/'); }
  static getBaseDir(): string { return path.resolve(Config.dir, '..', '..'); }

  /**
   * Get the binary versions from the configuration file.
   * @returns A map of the versions defined in the configuration file.
   */
  static binaryVersions(): ConfigFile {
    let configFile = require(Config.getConfigFile_());
    let configVersions: ConfigFile = {};
    configVersions.selenium = configFile.webdriverVersions.selenium;
    configVersions.chrome = configFile.webdriverVersions.chromedriver;
    configVersions.gecko = configFile.webdriverVersions.geckodriver;
    configVersions.ie = configFile.webdriverVersions.iedriver;
    configVersions.android = configFile.webdriverVersions.androidsdk;
    configVersions.appium = configFile.webdriverVersions.appium;
    return configVersions;
  }

  /**
   * Get the CDN urls from the configuration file.
   * @returns A map of the CDN versions defined in the configuration file.
   */
  static cdnUrls(): ConfigFile {
    let configFile = require(Config.getConfigFile_());
    let configCdnUrls: ConfigFile = {};
    configCdnUrls.selenium = configFile.cdnUrls.selenium;
    configCdnUrls.chrome = configFile.cdnUrls.chromedriver;
    configCdnUrls.gecko = configFile.cdnUrls.geckodriver;
    configCdnUrls.ie = configFile.cdnUrls.iedriver;
    configCdnUrls.android = configFile.cdnUrls.androidsdk;
    return configCdnUrls;
  }

  /**
   * Get the package version.
   */
  static getVersion(): string {
    let packageFile = require(Config.getPackageFile_());
    return packageFile.version;
  }
}
