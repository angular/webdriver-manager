import * as fs from 'fs';
import * as path from 'path';

import {Logger} from './cli';


let logger = new Logger('config');
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
 * Locally installed: when webdriver-manager is used as a dependency
 * Project: when we are in the project folder
 */
export class Config {
  static configFile: string = 'config.json';
  static packageFile: string = 'package.json';

  static cwd = process.cwd();

  static nodeModuleName = 'webdriver-manager';
  static localInstall: string;
  static parentPath = path.resolve(Config.cwd, '..');
  static dir = __dirname;
  static folder = Config.cwd.replace(Config.parentPath, '').substring(1);

  static isProjectVersion = Config.folder === Config.nodeModuleName;
  static isLocalVersion = false;

  static setupLocal() {
    if (Config.localInstall) {
      return;
    }
    try {
      Config.localInstall = path.resolve(Config.cwd, 'node_modules', Config.nodeModuleName);
      Config.isLocalVersion = fs.statSync(Config.localInstall).isDirectory();
    } catch(e) {
    }
  }

  static getFile_(jsonFile: string): string {
    // project version
    if (Config.folder === Config.nodeModuleName) {
      return path.resolve(jsonFile);
    }

    // local version
    else if (Config.isLocalVersion) {
      return path.resolve(Config.localInstall, jsonFile);
    }

    // global version
    else {
      return path.resolve(Config.dir, '../..', jsonFile);
    }
  }

  /**
   * In the project folder, if there is a config file provided, use it over the
   * default one.
   */
  static getConfigFile_(): string {
    Config.setupLocal();
    // Get the default configuration file
    let pathConfig = Config.getFile_(Config.configFile);

    if (Config.isLocalVersion) {

      // The file is local project folder. For project foo/ the file is foo/config.json.
      let opt_localPath = path.resolve(Config.cwd, Config.configFile);
      try {
        fs.statSync(opt_localPath).isFile();
        pathConfig = opt_localPath;
      } catch (e) {
        // Do nothing, use the default config file.
      }
    }
    return pathConfig;
  }

  /**
   * Get the package.json file from the default location
   */
  static getPackageFile_(): string {
    Config.setupLocal();
    return Config.getFile_(Config.packageFile)
  }

  /**
   * Gets the path to the folder
   */
  static getFolder_(folder: string): string {
    // project version
    if (Config.folder === Config.nodeModuleName) {
      return path.resolve(folder);
    }

    // local version should always create the selenium directory int he project
    // and not under the node_modules/webdriver-manager/selenium folder
    else if (Config.isLocalVersion) {
      return path.resolve(Config.cwd, folder);
    }

    // global version
    else {
      return path.resolve(Config.dir, '../..', folder);
    }
  }

  static getSeleniumDir(): string {
    Config.setupLocal();
    return Config.getFolder_('selenium/');
  }

  static getBaseDir(): string {
    Config.setupLocal();
    return Config.getFolder_('/');
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
    configVersions.ie = configFile.webdriverVersions.iedriver;
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
    configCdnUrls.ie = configFile.cdnUrls.iedriver;
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
