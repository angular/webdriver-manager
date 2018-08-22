import * as fs from 'fs';
import * as http from 'http';
import * as log from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { update } from './update';
import { Options } from './options';
import { ChromeDriver } from '../provider/chromedriver';
import { SeleniumServer } from '../provider/selenium_server';
import { start } from './start';
import { shutdown } from './shutdown';

log.setLevel('debug');
const tmpDir = path.resolve(os.tmpdir(), 'test');
let selenium = new SeleniumServer({ outDir: tmpDir });
selenium.runAsNode = true;

let options: Options = {
  outDir: tmpDir,
  providers: [
    { binary: new ChromeDriver({ outDir: tmpDir }) }
  ],
  server: {
    binary: selenium,
    runAsDetach: true,
    runAsNode: true
  }
};

describe('start cmd', () => {
  let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(async() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 40000;
    try {
      fs.mkdirSync(tmpDir);
    } catch (err) {}
    await update(options);
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
  });

  afterEach(() => {
    try {
      rimraf.sync(tmpDir);
    } catch (err) {}
  });

  it('should run the detached server', async() => {
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
    const noResponse = new Promise<any>((resolve, _) => {
      http.get(hubUrl, _ => {
      }).on('error', (err) => {
        resolve(err);
      });;
    });
    expect((await noResponse)['code']).toBe('ECONNREFUSED');
  });
});