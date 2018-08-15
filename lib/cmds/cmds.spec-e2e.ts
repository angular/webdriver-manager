import * as fs from 'fs';
import * as log from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {
  constructAllProviders,
  constructProviders,
} from './utils';
import { update } from './update';
import { status } from './status';
import { start } from './start';
import { clean } from './clean';
import { SeleniumServer } from '../provider/selenium_server';

log.setLevel('debug');

describe('using the cli', () => {
  let tmpDir = path.resolve(os.tmpdir(), 'test');
  let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    try {
      fs.mkdirSync(tmpDir);
    } catch (err) {}
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
    try {
      rimraf.sync(tmpDir);
    } catch (err) {}
  });

  describe('a user runs update', () => {
    it('should download the files', async() => {
      let argv = {
        _: ['foobar'],
        chrome: true,
        standalone: true,
        out_dir: tmpDir,
        '$0': 'bin\\webdriver-manager'
      };
      let options = constructProviders(argv);
      await update(options);
      const existFiles = fs.readdirSync(tmpDir);
      expect(existFiles.length).toBe(7);
    });
  });

  describe('a user runs status', () => {
    it('should get the list of versions', () => {
      let argv = {
        _: ['foobar'],
        out_dir: tmpDir,
        '$0': 'bin\\webdriver-manager'
      };
      let options = constructAllProviders(argv);
      let statusLog = status(options);
      log.debug(statusLog);
      let lines = statusLog.split('\n');
      expect(lines.length).toBe(2);
    });
  });

  describe('a user runs start', () => {
    it ('should start the selenium server standalone', async() => {
      let argv = {
        _: ['foobar'],
        chrome: true,
        standalone: true,
        out_dir: tmpDir,
        '$0': 'bin\\webdriver-manager'
      };
      let options = constructProviders(argv);
      // Do not await this promise to start the server since the promise is
      // never resolved by waiting, it is either killed by pid or get request.
      let startProcess = start(options);

      // Arbitrarily wait for the server to start.
      await new Promise((resolve, _) => {
        setTimeout(resolve, 3000);
      });
      let seleniumServer = (options.server.binary as SeleniumServer);
      expect(seleniumServer.seleniumProcess).toBeTruthy();
      expect(seleniumServer.seleniumProcess.pid).toBeTruthy();

      // Stop the server using the get request.
      await seleniumServer.stopServer();

      // Check to see that the exit code is 0.
      expect(await startProcess).toBe(0);
    });
  });

  describe('a user runs clean', () => {
    it('should remove the files', () => {
      let argv = {
        _: ['foobar'],
        out_dir: tmpDir,
        '$0': 'bin\\webdriver-manager'
      };
      let options = constructAllProviders(argv);
      let cleanLogs = clean(options);
      log.debug(cleanLogs);
      let lines = cleanLogs.split('\n');
      expect(lines.length).toBe(7);
      const existFiles = fs.readdirSync(tmpDir);
      expect(existFiles.length).toBe(0);
    });
  });
});
