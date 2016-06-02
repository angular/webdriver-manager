/// <reference path = "../typings/index.d.ts"/>

import {Config} from '../lib/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {TestUtils} from './test_utils';
import {Logger, LogLevel} from '../lib/cli/logger';


// process.cwd() = directory that is calling the javascript to run
// __dirname = where this file is located
let date = new Date().getTime().toString();
let builtPath = path.resolve(__dirname, '../../built');
let tempDir = os.tmpdir();
let tempGlobalPath: string;
let tempLocalPath: string;
let logger = new Logger('config_spec');
Logger.logLevel = LogLevel.DEBUG;

let prevCwd: string;
let prevDir: string;
let prevFolder: string;
let prevLocalInstall: string;
let prevIsLocalVersion: boolean;

//
describe('calling a globally installed webdriver-manager', () => {
  beforeAll(() => {
    // copy the built folder to the "globally" installed location
    fs.mkdirSync(path.resolve(tempDir, 'global-' + date));
    fs.mkdirSync(path.resolve(tempDir, 'global-' + date, 'webdriver-manager'));
    tempGlobalPath = path.resolve(tempDir, 'global-' + date.toString(), 'webdriver-manager');
    TestUtils.copyRecursiveSync(builtPath, path.resolve(tempGlobalPath, 'built'));

    // copy the built folder to a location where it is used as a dependency
    fs.mkdirSync(path.resolve(tempDir, 'local-' + date));
    fs.mkdirSync(path.resolve(tempDir, 'local-' + date, 'node_modules'));
    fs.mkdirSync(path.resolve(tempDir, 'local-' + date, 'node_modules', 'webdriver-manager'));
    tempLocalPath = path.resolve(tempDir, 'local-' + date, 'node_modules', 'webdriver-manager');
    TestUtils.copyRecursiveSync(builtPath, path.resolve(tempLocalPath, 'built'));
  });

  afterAll(() => {
    // remove the "globally" installed built folder
    TestUtils.deleteRecursiveSync(path.resolve(tempDir, 'global-' + date));

    // remove the location where it is used as a dependency
    TestUtils.deleteRecursiveSync(path.resolve(tempDir, 'local-' + date));
  });

  describe('as a global instance', () => {

    // override static config properties as if webdriver-manager is being called
    // in a folder that is not the project folder and not where webdriver-manager is
    // a dependency
    beforeAll(() => {
      // directory where we are invoking the node command
      prevCwd = Config.cwd;
      Config.cwd = path.resolve(tempGlobalPath, 'foo');

      // a random location where we are calling webdriver-manager from the command line
      prevFolder = Config.folder;
      Config.folder = 'foo';
      prevDir = Config.dir;
      Config.dir = path.resolve(tempGlobalPath, 'built/lib');
      logger.debug('global path: ', tempGlobalPath)
    });

    // restore defaults
    afterAll(() => {
      Config.cwd = prevCwd;
      Config.dir = prevDir;
      Config.folder = prevFolder;
    });

    it('should find the global config.json file', () => {
      let expectedFile = path.resolve(tempGlobalPath, 'config.json');
      logger.debug('global config.json file: ' + expectedFile);
      let file = Config.getFile_('config.json');
      expect(file).toBe(expectedFile);
    });

    it('should find the global package.json file', () => {
      let expectedFile = path.resolve(tempGlobalPath, 'package.json');
      logger.debug('global package.json file: ' + expectedFile);
      let file = Config.getFile_('package.json');
      expect(file).toBe(path.resolve(tempGlobalPath, 'package.json'));
    });

    it('should find the global selenium folder', () => {
      let expectedFolder = path.resolve(tempGlobalPath, 'selenium');
      logger.debug('global selenium folder: ' + expectedFolder);
      let folder = Config.getFolder_('selenium');
      expect(folder).toBe(expectedFolder);
    });
  });

  describe('in a folder where webdriver-manager is a dependency', () => {

    beforeAll(() => {
      prevCwd = Config.cwd;
      Config.cwd = path.resolve(tempDir, 'local-' + date);

      // the project is called 'local-'+date which contains a
      // node_modules/webdriver-manager folder
      prevFolder = Config.folder;
      Config.folder = 'local-' + date;
      prevDir = Config.dir;
      Config.dir = path.resolve(tempLocalPath, 'built/lib');

      prevLocalInstall = Config.localInstall;
      prevIsLocalVersion = Config.isLocalVersion;
      Config.localInstall = tempLocalPath;
      Config.isLocalVersion = true;

      logger.debug('locally installed: ' + tempLocalPath);
    });

    afterAll(() => {
      Config.cwd = prevCwd;
      Config.dir = prevDir;
      Config.folder = prevFolder;
      Config.localInstall = prevLocalInstall;
      Config.isLocalVersion = prevIsLocalVersion;
    });

    describe('using the default config file location', () => {
      it('should find the default config.json file', () => {
        let localDefaultFile = path.resolve(tempLocalPath, 'config.json');
        logger.debug('local default config.json: ' + localDefaultFile);
        let file = Config.getFile_('config.json');
        expect(file).toBe(localDefaultFile);
      });

      it('should find the package.json file', () => {
        let localDefaultFile = path.resolve(tempLocalPath, 'package.json');
        logger.debug('local package.json: ' + localDefaultFile);
        let file = Config.getFile_('package.json');
        expect(file).toBe(localDefaultFile);
      });

      it('should find the selenium folder', () => {
        let localFolder = path.resolve(tempLocalPath, '../../selenium');
        logger.debug('local selenium folder: ' + localFolder);
        let folder = Config.getFolder_('selenium/');
        expect(folder).toBe(localFolder);
      });
    });

    describe('using a configuration file located in the project', () => {
      let projectFile: string;
      let nodeModuleFile: string;
      beforeAll(() => {
        projectFile = path.resolve(tempLocalPath, '../../config.json');
        nodeModuleFile = path.resolve(tempLocalPath, 'config.json');
        fs.linkSync(path.resolve(builtPath, 'config.json'), projectFile);
        fs.linkSync(path.resolve(builtPath, 'config.json'), nodeModuleFile);
      });

      it('should find the local config file', () => {
        logger.debug('local project config.json: ' + projectFile);
        let file = Config.getConfigFile_();
        expect(file).toBe(projectFile);
      });

      it('should find the package.json file', () => {
        let localDefaultFile = path.resolve(tempLocalPath, 'package.json');
        logger.debug('local package.json: ' + localDefaultFile);
        let file = Config.getFile_('package.json');
        expect(file).toBe(localDefaultFile);
      });

      it('should find the selenium folder', () => {
        let localFolder = path.resolve(tempLocalPath, '../../selenium');
        logger.debug('local selenium folder: ' + localFolder);
        let folder = Config.getFolder_('selenium/');
        expect(folder).toBe(localFolder);
      });
    });
  });
});
