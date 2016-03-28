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
  static configPath: string = '../config.json';
  static packagePath: string = '../package.json';
  static baseDir: string = path.resolve(__dirname, '../../');
  static seleniumDir: string = path.resolve(Config.baseDir, 'selenium');

  /**
   * Get the binary versions from the configuration file.
   * @returns A map of the versions defined in the configuration file.
   */
  static binaryVersions(): ConfigFile {
    let configFile = require(Config.configPath);
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
    let configFile = require(Config.configPath);
    let configCdnUrls: ConfigFile = {};
    configCdnUrls.selenium = configFile.cdnUrls.selenium;
    configCdnUrls.chrome = configFile.cdnUrls.chromedriver;
    configCdnUrls.ie = configFile.cdnUrls.iedriver;
    return configCdnUrls;
  }

  /**
   * If installed as a node module, return the local version.
   */
  static localVersion(): string {
    try {
      if (fs.statSync(Config.packagePath).isFile()) {
        let packageJson = require(Config.packagePath);
        return packageJson.version;
      }
    } catch(err) {
      return null;
    }
  }

  /**
   * If running from the project directory, get the project's version.
   */
  static projectVersion(): string {
    let projectPath = path.resolve('.');
    let projectPackagePath = path.resolve(projectPath, 'package.json');
    try {
      if (fs.statSync(projectPackagePath).isFile()) {
        let projectJson = require(projectPackagePath);
        return projectJson.version;
      }
    } catch(err) {
      return null;
    }
  }

  /**
   * If installed, returns the globally installed webdriver-tool.
   */
  static globalVersion(): string {
    let globalNpm = process.env.NPM_BIN || process.env.NVM_BIN;
    let globalPackagePath = path.resolve(globalNpm, '../lib/node_modules/webdriver-tool/built/package.json');
    try {
      if (fs.statSync(globalPackagePath).isFile()) {
        let globalPackageJson = require(globalPackagePath);
        return globalPackageJson.version;
      }
    } catch(err) {
      return null;
    }
  }
}
