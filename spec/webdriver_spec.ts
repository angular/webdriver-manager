/// <reference path = "../typings/main/ambient/jasmine/index.d.ts"/>

import * as child_process from 'child_process';
import * as path from 'path';
import {cli} from '../lib/webdriver';

function runSpawn(task: string, opt_arg: Array<string>): Array<string> {
  opt_arg = typeof opt_arg !== 'undefined' ? opt_arg : [];
  let child = child_process.spawnSync(task, opt_arg, {stdio: 'pipe'});
  return child.output[1].toString().split('\n');
};

describe('cli', () => {
  describe('help', () => {
    it ('should have usage and commands', () => {
      let lines = runSpawn('node', ['built/lib/webdriver.js', 'help']);

      // very specific to make sure the
      let index = 0
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
