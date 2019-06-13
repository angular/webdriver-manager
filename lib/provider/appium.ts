import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as loglevel from 'loglevel';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as semver from 'semver';

import {ProviderClass, ProviderConfig, ProviderInterface} from './provider';
import {requestBody} from './utils/http_utils';

const log = loglevel.getLogger('webdriver-manager');

export class Appium extends ProviderClass implements ProviderInterface {
  ignoreSSL: boolean;
  outDir: string;
  outDirAppium: string;
  proxy: string;
  requestUrl = 'http://registry.npmjs.org/appium';

  constructor(config?: ProviderConfig) {
    super();
    this.ignoreSSL = this.setVar('ignoreSSL', this.ignoreSSL, config);
    this.outDir = this.setVar('outDir', this.outDir, config);
    this.proxy = this.setVar('proxy', this.proxy, config);
    this.requestUrl = this.setVar('requestUrl', this.requestUrl, config);
  }

  /**
   * If no valid version is provided get version from appium
   */
  async getVersion(): Promise<string> {
    const body = await requestBody(
        this.requestUrl, {proxy: this.proxy, ignoreSSL: this.ignoreSSL});
    return JSON.parse(body)['dist-tags']['latest'];
  }
  /**
   * Creates appium directory and package.json file.
   * @param version Optional to provide the version number or latest.
   */
  async setup(version?: string): Promise<void> {
    if (!semver.valid(version)) {
      version = await this.getVersion();
    }
    this.outDirAppium = path.resolve(this.outDir, 'appium');
    try {
      rimraf.sync(this.outDirAppium);
    } catch (err) {
    }
    fs.mkdirSync(this.outDirAppium);
    const packageJson = {
      scripts: {appium: 'appium'},
      dependencies: {appium: '^' + version}
    };
    fs.writeFileSync(
        path.resolve(this.outDirAppium, 'package.json'),
        JSON.stringify(packageJson));
  }

  /**
   * Creates an appium/package.json file and installs the appium dependency.
   * @param version Optional to provide the version number or latest.
   */
  async updateBinary(version?: string): Promise<void> {
    log.info('appium: installing appium');
    await this.setup(version);
    childProcess.execSync('npm install', {cwd: this.outDirAppium});
  }
}