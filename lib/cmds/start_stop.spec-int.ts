import * as fs from 'fs';
import * as http from 'http';
import * as loglevel from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {ChromeDriver} from '../provider/chromedriver';
import {SeleniumServer} from '../provider/selenium_server';
import {Options} from './options';
import {shutdown} from './shutdown';
import {start} from './start';
import {update} from './update';

const log = loglevel.getLogger('webdriver-manager-test');
log.setLevel('debug');
const tmpDir = path.resolve(os.tmpdir(), 'test');
const selenium = new SeleniumServer({outDir: tmpDir});
selenium.runAsNode = true;

const options: Options = {
  outDir: tmpDir,
  providers: [{binary: new ChromeDriver({outDir: tmpDir})}],
  server: {binary: selenium, runAsDetach: true, runAsNode: true}
};

describe('start cmd', () => {
  const origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 40000;
    try {
      fs.mkdirSync(tmpDir);
    } catch (err) {
    }
    await update(options);
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
  });

  afterEach(() => {
    try {
      rimraf.sync(tmpDir);
    } catch (err) {
    }
  });

  it('should run the detached server', async () => {
    await start(options);
    const hubUrl = 'http://127.0.0.1:4444/wd/hub/static/resource/hub.html';
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
    await shutdown(options);
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