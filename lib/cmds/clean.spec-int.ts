import * as fs from 'fs';
import * as log from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as yargs from 'yargs';

import {clean} from './clean';
import {constructAllProviders} from './utils';

log.setLevel('debug');
const tmpDir = path.resolve(os.tmpdir(), 'test');
const argv: yargs.Arguments = {
  _: ['foobar'],
  out_dir: tmpDir,
  '$0': 'bin\\webdriver-manager'
};
const options = constructAllProviders(argv);

describe('clean cmd', () => {
  describe('with files', () => {
    beforeAll(() => {
      // create the directory
      try {
        fs.mkdirSync(tmpDir);
      } catch (err) {
      }
      // create files that should be deleted.
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'chromedriver_2.41'), 'w'));
      fs.closeSync(
          fs.openSync(path.resolve(tmpDir, 'chromedriver_foo.zip'), 'w'));
      fs.closeSync(
          fs.openSync(path.resolve(tmpDir, 'chromedriver.config.json'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'chromedriver.xml'), 'w'));
    });

    afterAll(() => {
      try {
        rimraf.sync(tmpDir);
      } catch (err) {
      }
    });

    it('should remove the files', () => {
      expect(fs.readdirSync(tmpDir).length).toBe(4);
      const cleanList = clean(options).split('\n');
      expect(cleanList.length).toBe(4);
      expect(fs.readdirSync(tmpDir).length).toBe(0);
    });
  });

  describe('with no files', () => {
    it('should return nothing', () => {
      spyOn(fs, 'unlinkSync');
      expect(clean(options)).toBe('');
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});