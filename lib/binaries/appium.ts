import * as child_process from 'child_process';
import * as rimraf from 'rimraf';
import * as path from 'path';
import {arch, type} from 'os';

import {Binary, OS} from './binary';
import {Config} from '../config';

/**
 * The appium binary.
 */
export class Appium extends Binary {
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static id = 'appium';
  static versionDefault = Config.binaryVersions().appium;
  static isDefault = false;
  static shortName = ['appium'];

  constructor() {
    super();
    this.name = 'appium';
    this.versionCustom = Appium.versionDefault;
    this.prefixDefault = 'appium-';
    this.suffixDefault = '';
  }

  id(): string { return Appium.id; }

  versionDefault(): string { return Appium.versionDefault; }

  executableSuffix(): string { return ''; }

  remove(sdkPath: string): void {
    rimraf.sync(sdkPath);
  }
}
