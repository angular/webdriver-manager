import * as path from 'path';

/**
 * Dictionary map of the different binaries.
 */
export interface ConfigFile {
  selenium?: string;
  chrome?: string;
  ie?: string;
}

/**
 * The configuration for webdriver-manager.
 */
export class Config {
  static CONFIG_PATH: string = '../config.json';
  static PACKAGE_PATH: string = '../package.json';
  static BASE_DIR: string = path.resolve(__dirname, '../../');
  static SELENIUM_DIR: string = path.resolve(Config.BASE_DIR, 'selenium');

  /**
   * Get the binary versions from the configuration file.
   * @returns A map of the versions defined in the configuration file.
   */
  static binaryVersions(): ConfigFile {
    let configFile = require(Config.CONFIG_PATH);
    let configVersions: ConfigFile = {};
    configVersions.selenium = configFile.webdriverVersions.selenium;
    configVersions.chrome = configFile.webdriverVersions.chromedriver;
    configVersions.ie = configFile.webdriverVersions.iedriver;
    return configVersions;
  }

  /**
   * Get the CDN urls from the configuration file.
   * @returns A map of the CDN versions defined in the configuration file.
   */
  static cdnUrls(): ConfigFile {
    let configFile = require(Config.CONFIG_PATH);
    let configCdnUrls: ConfigFile = {};
    configCdnUrls.selenium = configFile.cdnUrls.selenium;
    configCdnUrls.chrome = configFile.cdnUrls.chromedriver;
    configCdnUrls.ie = configFile.cdnUrls.iedriver;
    return configCdnUrls;
  }

  /**
   * Get the current version of webdriver-manager from the package.json
   * @returns The webdriver-manager version.
   */
  static version(): string {
    let packageJson = require(Config.PACKAGE_PATH);
    return packageJson.version;
  }
}
