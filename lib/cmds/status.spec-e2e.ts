import * as fs from 'fs';
import * as log from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { constructAllProviders } from './utils';
import { status } from './status';

log.setLevel('debug');

describe('using the cli', () => {
  let tmpDir = path.resolve(os.tmpdir(), 'test');

  afterEach(() => {
    try {
      rimraf.sync(tmpDir);
    } catch (err) {}
  });

  describe('a user runs status', () => {
    it('should log an empty string when folder does not exist', () => {
      let argv = {
        _: ['foobar'],
        out_dir: tmpDir,
        '$0': 'bin\\webdriver-manager'
      };
      let options = constructAllProviders(argv);
      let statusLog = status(options);
      expect(statusLog).toBe('');
    });

    it('should log an empty string when folder is empty', () => {
      fs.mkdirSync(tmpDir);
      let argv = {
        _: ['foobar'],
        out_dir: tmpDir,
        '$0': 'bin\\webdriver-manager'
      };
      let options = constructAllProviders(argv);
      let statusLog = status(options);
      expect(statusLog).toBe('');
    });
  });
});