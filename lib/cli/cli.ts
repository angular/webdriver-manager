import * as chalk from 'chalk';
import * as path from 'path';

import {Config} from '../config';

import {MinimistArgs, Options} from './options';
import {Program, Programs} from './programs';



/**
 * The Cli contains the usage and the collection of programs.
 *
 * Printing help for all the programs in the following order:
 * usage, commands, and options. If the options are used in multiple programs,
 * it will list it once.
 */
export class Cli {
  programs: Programs = {};
  usageText: string;
  version: string;

  /**
   * Register a program to the command line interface.
   * @returns The cli for method chaining.
   */
  program(prog: Program): Cli {
    this.programs[prog.cmd] = prog;
    return this;
  }

  /**
   * Add a usage for the command line interface.
   * @returns The cli for method chaining.
   */
  usage(usageText: string): Cli {
    this.usageText = usageText;
    return this;
  }

  /**
   * Prints help for the programs registered to the cli.
   */
  printHelp(): void {
    console.log('Usage: ' + this.usageText);
    console.log('\nCommands:');
    let cmdDescriptionPos = this.posCmdDescription();
    for (let cmd in this.programs) {
      let prog = this.programs[cmd];
      prog.printCmd(cmdDescriptionPos);
    }
    let descriptionPos = this.posDescription();
    let defaultPos = this.posDefault();
    let extOptions: Options = {};
    console.log('\nOptions:');
    // print all options
    for (let cmd in this.programs) {
      let prog = this.programs[cmd];
      prog.printOptions(descriptionPos, defaultPos, extOptions);
    }
  }

  /**
   * For commands, gets the position where the description should start so they
   * are aligned.
   * @returns The position where the command description should start.
   */
  posCmdDescription(): number {
    let position = -1;
    for (let cmd in this.programs) {
      position = Math.max(position, cmd.length + 6);
    }
    return position;
  }

  /**
   * For options, gets the position where the description should start so they
   * are aligned.
   * @returns The position where the option description should start.
   */
  posDescription(): number {
    let position = -1;
    for (let cmd in this.programs) {
      let prog = this.programs[cmd];
      position = Math.max(position, prog.posDescription());
    }
    return position;
  }

  /**
   * For options, get the position where the default values should start so they
   * are aligned.
   * @returns The position where the option default values should start.
   */
  posDefault(): number {
    let position = -1;
    for (let cmd in this.programs) {
      let prog = this.programs[cmd];
      position = Math.max(position, prog.posDefault());
    }
    return position;
  }

  /**
   * Go through all programs and add options to the collection.
   * @returns The options used in the programs.
   */
  getOptions(): Options {
    let allOptions: Options = {};
    for (let cmd in this.programs) {
      let prog = this.programs[cmd];
      allOptions = prog.getOptions_(allOptions);
    }
    return allOptions;
  }

  /**
   * Get the options used by the programs and create the minimist options
   * to ensure that minimist parses the values properly.
   * @returns The options for minimist.
   */
  getMinimistOptions(): Object {
    let allOptions = this.getOptions();
    let minimistOptions: MinimistArgs = {};
    let minimistBoolean: string[] = [];
    let minimistString: string[] = [];
    let minimistNumber: string[] = [];
    let minimistDefault: any = {};
    for (let opt in allOptions) {
      let option = allOptions[opt];
      if (option.type === 'boolean') {
        minimistBoolean.push(option.opt);
      } else if (option.type === 'string') {
        minimistString.push(option.opt);
      } else if (option.type === 'number') {
        minimistNumber.push(option.opt);
      }
      if (typeof option.defaultValue !== 'undefined') {
        minimistDefault[option.opt] = option.defaultValue;
      }
    }
    minimistOptions['boolean'] = minimistBoolean;
    minimistOptions['string'] = minimistString;
    minimistOptions['number'] = minimistNumber;
    minimistOptions['default'] = minimistDefault;
    return minimistOptions;
  }
}
