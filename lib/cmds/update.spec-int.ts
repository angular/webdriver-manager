import * as fs from 'fs';
import * as loglevel from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {ChromeDriver} from '../provider/chromedriver';
import {GeckoDriver} from '../provider/geckodriver';
import {IEDriver} from '../provider/iedriver';
import {SeleniumServer} from '../provider/selenium_server';
import {OptionsBinary} from './options_binary';
import {updateBinary} from './update';

const log = loglevel.getLogger('webdriver-manager-test');
log.setLevel('debug');

const tmpDir = path.resolve(os.tmpdir(), 'test');

describe('update cmd', () => {
  const origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
  });

  beforeEach(() => {
    // create the directory
    try {
      fs.mkdirSync(tmpDir);
    } catch (err) {
    }
  });

  afterEach(() => {
    try {
      rimraf.sync(tmpDir);
    } catch (err) {
    }
  });

  it('should download the chromdriver files', async () => {
    const optionsBinary: OptionsBinary = {
      outDir: tmpDir,
      browserDrivers: [{binary: new ChromeDriver({outDir: tmpDir})}]
    };
    await updateBinary(optionsBinary);
    expect(fs.readdirSync(tmpDir).length).toBe(4);
  });

  it('should download the geckodriver files', async () => {
    const optionsBinary: OptionsBinary = {
      outDir: tmpDir,
      browserDrivers: [{binary: new GeckoDriver({outDir: tmpDir})}]
    };
    await updateBinary(optionsBinary);
    expect(fs.readdirSync(tmpDir).length).toBe(4);
  });

  it('should download selenium server files', async () => {
    const optionsBinary: OptionsBinary = {
      outDir: tmpDir,
      server: {binary: new SeleniumServer({outDir: tmpDir})}
    };
    await updateBinary(optionsBinary);
    expect(fs.readdirSync(tmpDir).length).toBe(3);
  });

  it('should download iedriver files', async () => {
    const iedriver = new IEDriver({outDir: tmpDir});
    iedriver.osType = 'Windows_NT';
    const optionsBinary:
        OptionsBinary = {outDir: tmpDir, browserDrivers: [{binary: iedriver}]};
    await updateBinary(optionsBinary);
    expect(fs.readdirSync(tmpDir).length).toBe(4);
  });

  it('should download default files', async () => {
    const optionsBinary: OptionsBinary = {
      outDir: tmpDir,
      browserDrivers: [
        {binary: new ChromeDriver({outDir: tmpDir})},
        {binary: new GeckoDriver({outDir: tmpDir})},
      ],
      server: {binary: new SeleniumServer({outDir: tmpDir})}
    };
    await updateBinary(optionsBinary);
    expect(fs.readdirSync(tmpDir).length).toBe(11);
  });
});