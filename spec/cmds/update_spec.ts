import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';

import {Logger, WriteTo} from '../../lib/cli/logger';
import {clearBrowserFile, program} from '../../lib/cmds/update';
import {Config} from '../../lib/config';

interface Argv {
  [key: string]: any;
}
let argv: Argv = {};

describe('update', () => {
  describe('for update-config.json', () => {
    let tmpDir = '';
    beforeEach(() => {
      Logger.writeTo = WriteTo.NONE;
      tmpDir = path.resolve('selenium_test');
      try {
        // if the folder does not exist, it will throw an error on statSync
        if (fs.statSync(tmpDir).isDirectory()) {
          rimraf.sync(tmpDir);
        }
      } catch (err) {
        // do nothing, the directory does not exist
      }
      fs.mkdirSync(tmpDir);
    });

    afterEach(() => {
      rimraf.sync(tmpDir);
      clearBrowserFile();
    });

    it('should create a file for chrome', (done) => {
      Config.osType_ = 'Linux';
      Config.osArch_ = 'x64';
      argv = {
        '_': ['update'],
        'versions': {'chrome': '2.20'},
        'standalone': false,
        'gecko': false,
        'out_dir': tmpDir
      };
      program.run(JSON.parse(JSON.stringify(argv)))
          .then(() => {
            let updateConfig =
                fs.readFileSync(path.resolve(tmpDir, 'update-config.json')).toString();
            let updateObj = JSON.parse(updateConfig);
            expect(updateObj['chrome']['last']).toContain('chromedriver_2.20');
            expect(updateObj['chrome']['all'].length).toEqual(1);
            expect(updateObj['chrome']['last']).toEqual(updateObj['chrome']['all'][0]);
            expect(updateObj['standalone']).toBeUndefined();
            expect(updateObj['ie']).toBeUndefined();
            done();
          })
          .catch((err: Error) => {done.fail()});
    });

    xit('should create a file for standalone', (done) => {
      Config.osType_ = 'Linux';
      Config.osArch_ = 'x64';
      argv = {
        '_': ['update'],
        'versions': {'standalone': '2.53.1'},
        'chrome': false,
        'gecko': false,
        'out_dir': tmpDir
      };
      program.run(JSON.parse(JSON.stringify(argv)))
          .then(() => {
            let updateConfig =
                fs.readFileSync(path.resolve(tmpDir, 'update-config.json')).toString();
            let updateObj = JSON.parse(updateConfig);
            expect(updateObj['standalone']['last']).toContain('standalone-2.53.1.jar');
            expect(updateObj['standalone']['all'].length).toEqual(1);
            expect(updateObj['standalone']['last']).toEqual(updateObj['standalone']['all'][0]);
            expect(updateObj['chrome']).toBeUndefined();
            expect(updateObj['ie']).toBeUndefined();
            done();
          })
          .catch((err: Error) => {done.fail()});
    });

    // TODO(cnishina): Create a test for Windows for IE driver. This will require rewriting
    // how programs get configurations.
  });
});
