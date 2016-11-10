import * as path from 'path';
import {cli} from '../lib/cli_instance';
import {spawnSync} from '../lib/utils';

describe('cli', () => {
  describe('help', () => {
    it('should have usage and commands', () => {
      let lines = spawnSync(process.execPath, ['built/lib/webdriver.js', 'help'], 'pipe')
                      .output[1]
                      .toString()
                      .split('\n');

      // very specific to make sure the
      let index = 0;
      expect(lines[index++].indexOf('Usage:')).toBe(0);
      index++;
      expect(lines[index++].indexOf('Commands:')).toBe(0);
      for (let cmd in cli.programs) {
        expect(lines[index++].indexOf(cmd)).toBe(2);
      }
      index++;
      expect(lines[index++].indexOf('Options:')).toBe(0);
      let options = cli.getOptions();
      for (let opt in options) {
        expect(lines[index++].indexOf('--' + opt)).toBe(2);
      }
    });
  });
});
