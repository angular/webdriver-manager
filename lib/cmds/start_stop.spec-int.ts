import * as fs from 'fs';
import * as http from 'http';
import * as loglevel from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {ChromeDriver} from '../provider/chromedriver';
import {SeleniumServer} from '../provider/selenium_server';
import {OptionsBinary} from './options_binary';
import {findPort} from '../../spec/support/helpers/port_finder';
import {shutdownBinary} from './shutdown';
import {startBinary} from './start';
import {updateBinary} from './update';

const log = loglevel.getLogger('webdriver-manager-test');
log.setLevel('debug');
loglevel.getLogger('webdriver-manager').setLevel('info');
const tmpDir = path.resolve(os.tmpdir(), 'test');
const selenium =
    new SeleniumServer({outDir: tmpDir, runAsDetach: true, runAsNode: true});

const optionsBinary: OptionsBinary = {
  outDir: tmpDir,
  browserDrivers: [{binary: new ChromeDriver({outDir: tmpDir})}],
  server: {binary: selenium, runAsDetach: true, runAsNode: true}
};
let port: number;

describe('start and stop cmd', () => {
  const origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 40000;
    try {
      fs.mkdirSync(tmpDir);
    } catch (err) {
    }
  });

  afterAll(() => {
    try {
      rimraf.sync(tmpDir);
    } catch (err) {
    }
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
  });

  describe('start', () => {
    beforeAll(async () => {
      await updateBinary(optionsBinary);
    });

    it('should run the detached server', async () => {
      port = await findPort(4000, 5000);
      optionsBinary.server.port = port;
      (optionsBinary.server.binary as SeleniumServer).port = port;
      await startBinary(optionsBinary);
      const hubUrl = `http://localhost:${port}/wd/hub/static/resource/hub.html`;
      const responseCode = new Promise((resolve, reject) => {
        http.get(hubUrl, res => {
          if (res.statusCode === 200) {
            resolve(res.statusCode);
          } else {
            reject('Should be 200');
          }
        });
      });
      expect(await responseCode).toBe(200);
    });
  });

  describe('stop', () => {
    it('should shutdown the detached server', async () => {
      const hubUrl = `http://localhost:${port}/wd/hub/static/resource/hub.html`;
      await shutdownBinary(optionsBinary);
      await new Promise((resolve, _) => {
        setTimeout(resolve, 3000);
      });
      // tslint:disable-next-line:no-any
      const noResponse = new Promise<any>((resolve, _) => {
        http.get(hubUrl, _ => {}).on('error', (err) => {
          resolve(err);
        });
      });
      expect((await noResponse)['code']).toBe('ECONNREFUSED');
    });
  });
});