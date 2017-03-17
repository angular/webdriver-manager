import * as path from 'path';
import * as rimraf from 'rimraf';

import {Config} from '../config';

import {Binary, BinaryUrl, OS} from './binary';


/**
 * The appium binary.
 */
export class Appium extends Binary {
  static os = [OS.Windows_NT, OS.Linux, OS.Darwin];
  static id = 'appium';
  static versionDefault = Config.binaryVersions().appium;
  static isDefault = false;

  constructor(alternativeDownloadUrl?: string) {
    super(alternativeDownloadUrl);
    this.name = 'appium';
    this.versionCustom = Appium.versionDefault;
  }

  id(): string {
    return Appium.id;
  }

  prefix(): string {
    return 'appium';
  }

  version_concatenator(): string {
    return '-';
  }

  suffix(): string {
    return '';
  }

  executableSuffix(): string {
    return '';
  }

  getUrl(version?: string): Promise<BinaryUrl> {
    return Promise.resolve({url: '', version: this.versionCustom});
  }

  getVersionList(): Promise<string[]> {
    return null;
  }

  remove(sdkPath: string): void {
    rimraf.sync(sdkPath);
  }
}
