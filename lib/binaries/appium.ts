import * as child_process from 'child_process';
import {arch, type} from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {Config} from '../config';

import {Binary, OS} from './binary';


/**
 * The appium binary.
 */
export class Appium extends Binary {
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static id = 'appium';
  static versionDefault = Config.binaryVersions().appium;
  static isDefault = false;
  static shortName = ['appium'];

  constructor(alternateCDN?: string) {
    super(alternateCDN || Config.cdnUrls().appium);

    this.name = 'appium';
    this.versionCustom = Appium.versionDefault;
    this.prefixDefault = 'appium-';
    this.suffixDefault = '';
  }

  id(): string { return Appium.id; }

  versionDefault(): string { return Appium.versionDefault; }

  executableSuffix(): string { return ''; }

  remove(sdkPath: string): void { rimraf.sync(sdkPath); }
}
