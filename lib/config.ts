import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {Logger} from './cli';


let logger = new Logger('config');

export interface ConfigFile {
  [key: string]: string;
  selenium?: string;
  chrome?: string;
  gecko?: string;
  ie?: string;
  android?: string;
  appium?: string;
  maxChrome?: string;
}

/**
 * The configuration for webdriver-manager
 *
 * The config.json, package.json, and selenium directory are found in the
 * same location at the root directory in webdriver-manager.
 *
 */
export class Config {
  static runCommand: string;

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

  static osArch_ = os.arch();
  static osType_ = os.type();
  static noProxy_ = process.env.NO_PROXY || process.env.no_proxy;
  static httpsProxy_ = process.env.HTTPS_PROXY || process.env.https_proxy;
  static httpProxy_ = process.env.HTTP_PROXY || process.env.http_proxy;

  static osArch(): string {
    return Config.osArch_;
  }

  static osType(): string {
    return Config.osType_;
  }

  static noProxy(): string {
    return Config.noProxy_;
  }

  static httpProxy(): string {
    return Config.httpProxy_;
  }

  static httpsProxy(): string {
    return Config.httpsProxy_;
  }

  static getConfigFile_(): string {
    return path.resolve(Config.dir, '..', Config.configFile);
  }

  static getPackageFile_(): string {
    return path.resolve(Config.dir, '..', Config.packageFile)
  }

  static getSeleniumDir(): string {
    return path.resolve(Config.dir, '..', '..', 'selenium/');
  }
  static getBaseDir(): string {
    return path.resolve(Config.dir, '..', '..');
  }

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
    configVersions.maxChrome = configFile.webdriverVersions.maxChromedriver;
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
