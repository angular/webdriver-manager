import * as fs from 'fs';
import * as log from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as yargs from 'yargs';
import * as rimraf from 'rimraf';
import { status } from './status';
import { constructAllProviders } from './utils';

log.setLevel('debug');
const tmpDir = path.resolve(os.tmpdir(), 'test');
const argv: yargs.Arguments = {
  _: ['foobar'],
  out_dir: tmpDir,
  '$0': 'bin\\webdriver-manager'
};
let options = constructAllProviders(argv);
for (let provider of options.providers) {
  (provider.binary as any).osType = 'Linux';
}
(options.server.binary as any).osType = 'Linux';

describe('status cmd', () => {
  describe('with files', () => {
    beforeAll(() => {
      // create the directory
      try {
        fs.mkdirSync(tmpDir);
      } catch (err) {}
      let contents = {
        last: 'chromedriver_2.41',
        all: ['chromedriver_2.20', 'chromedriver_2.41']
      };
      fs.writeFileSync(path.resolve(tmpDir, 'chromedriver.config.json'),
        JSON.stringify(contents));
    });

    afterAll(() => {
      try {
        rimraf.sync(tmpDir);
      } catch (err) {}
    });

    it('should get the status for chromedriver', () => {
      let lines = status(options).split('\n');
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('chromedriver: 2.20, 2.41 (latest)')
    });
  });
});