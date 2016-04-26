import * as fs from 'fs';
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
  static configFile: string = 'config.json';
  static packageFile: string = 'package.json';

  static cwd = process.cwd();

  static nodeModuleName = 'webdriver-manager';
  static localInstall = path.resolve(Config.cwd, 'node_modules', Config.nodeModuleName);
  static parentPath = path.resolve(Config.cwd, '..');
  static dir = __dirname;
  static folder = Config.cwd.replace(Config.parentPath, '').substring(1);

  static isProjectVersion = Config.folder === Config.nodeModuleName;
  static isLocalVersion = false;


  static getFile(jsonFile: string): string {
    try {
      Config.isLocalVersion = fs.statSync(Config.localInstall).isDirectory();
    } catch(e) {
    }

    // project version
    if (Config.folder === Config.nodeModuleName) {
      return path.resolve('built', jsonFile);
    }

    // local version
    else if (Config.isLocalVersion) {
      return path.resolve(Config.localInstall, 'built', jsonFile);
    }

    // global version
    else {
      return path.resolve(Config.dir, '..', jsonFile);
    }
  }

  static getFolder(folder: string): string {
    try {
      Config.isLocalVersion = fs.statSync(Config.localInstall).isDirectory();
    } catch(e) {
    }

    // project version
    if (Config.folder === Config.nodeModuleName) {
      return path.resolve(folder);
    }

    // local version
    else if (Config.isLocalVersion) {
      return path.resolve(Config.localInstall, folder);
    }

    // global version
    else {
      return path.resolve(Config.dir, folder);
    }
  }

  static getSeleniumDir(): string {
    return Config.getFolder('selenium/');
  }
  static getBaseDir(): string {
    return Config.getFolder('/');
  }

  /**
   * Get the binary versions from the configuration file.
   * @returns A map of the versions defined in the configuration file.
   */
  static binaryVersions(): ConfigFile {
    let configFile = require(Config.getFile(Config.configFile));
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
    let configFile = require(Config.getFile(Config.configFile));
    let configCdnUrls: ConfigFile = {};
    configCdnUrls.selenium = configFile.cdnUrls.selenium;
    configCdnUrls.chrome = configFile.cdnUrls.chromedriver;
    configCdnUrls.ie = configFile.cdnUrls.iedriver;
    return configCdnUrls;
  }

  /**
   * Get the package version.
   */
  static getVersion(): string {
    let packageFile = require(Config.getFile(Config.packageFile));
    return packageFile.version;
  }
}
