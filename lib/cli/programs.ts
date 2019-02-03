import * as minimist from 'minimist';

import {Args, MinimistArgs, Option, Options} from './options';


/**
 * Dictionary that maps the command and the program.
 */
export interface Programs {
  [cmd: string]: Program;
}

/**
 * A program has a command, a description, options, and a run method
 */
export class Program {
  static MIN_SPACING: number = 4;
  cmd: string;
  cmdDescription: string
  options: Options = {};
  runMethod: Function;
  helpDescription: string;
  version: string;

  /**
   * Register a command and the description.
   * @param cmd The command.
   * @param cmdDescription The description of the command.
   * @returns The program for method chaining.
   */
  command(cmd: string, cmdDescription: string): Program {
    this.cmd = cmd;
    this.cmdDescription = cmdDescription;
    return this;
  }

  /**
   * Register a new option.
   * @param opt The option.
   * @param description The description of the option.
   * @param type The type of value expected: boolean, number, or string
   * @param defaultValue The option's default value.
   * @returns The program for method chaining.
   */
  option(opt: string, description: string, type: string, opt_defaultValue?: number|string|boolean):
      Program {
    this.options[opt] = new Option(opt, description, type, opt_defaultValue);
    return this;
  }

  /**
   * Adds an option to the program.
   * @param option The option.
   * @returns The program for method chaining.
   */
  addOption(option: Option): Program {
    this.options[option.opt] = option;
    return this;
  }

  /**
   * Registers a method that will be used to run the program.
   * @param runMethod The method that will be used to run the program.
   * @returns The program for method chaining.
   */
  action(runMethod: Function): Program {
    this.runMethod = runMethod;
    return this;
  }

  /**
   * Adds the value to the options and passes the updated options to the run
   * method.
   * @param args The arguments that will be parsed to run the method.
   */
  run(json: JSON): Promise<void> {
    for (let opt in this.options) {
      this.options[opt].value = this.getValue_(opt, json);
    }
    return Promise.resolve(this.runMethod(this.options));
  }

  private getValue_(key: string, json: JSON): number|boolean|string {
    let keyList: string[] = key.split('.');
    let tempJson: any = json;
    while (keyList.length > 0) {
      let keyItem = keyList[0];
      if (tempJson[keyItem] != null) {
        tempJson = tempJson[keyItem];
        keyList = keyList.slice(1);
      } else {
        return undefined;
      }
    }
    return tempJson;
  }

  /**
   * Prints the command with the description. The description will have spaces
   * between the cmd so that the starting position is "posDescription". If the
   * gap between the cmd and the description is less than MIN_SPACING or
   * posDescription is undefined, the spacing will be MIN_SPACING.
   *
   * @param opt_postDescription Starting position of the description.
   */
  printCmd(opt_posDescription?: number): void {
    let log = '  ' + this.cmd;
    let spacing = Program.MIN_SPACING;

    if (opt_posDescription) {
      let diff = opt_posDescription - log.length;
      if (diff < Program.MIN_SPACING) {
        spacing = Program.MIN_SPACING;
      } else {
        spacing = diff;
      }
    }
    log += Array(spacing).join(' ') + this.cmdDescription;
    console.log(log);
  }

  /**
   * Prints the options with the option descriptions and default values.
   * The posDescription and posDefault is the starting position for the option
   * description. If extOptions are provided, check to see if we have already
   * printed those options. Also, once we print the option, add them to the extOptions.
   *
   * @param posDescription Position to start logging the description.
   * @param posDefault Position to start logging the default value.
   * @param opt_extOptions A collection of options that will be updated.
   */
  printOptions(posDescription: number, posDefault: number, opt_extOptions?: Options): void {
    for (let opt in this.options) {
      // we have already logged it
      if (opt_extOptions && opt_extOptions[opt]) {
        continue;
      }

      let option = this.options[opt];
      let log = '  --' + option.opt;
      let spacing = Program.MIN_SPACING;

      // description
      let diff = posDescription - log.length;
      if (diff < Program.MIN_SPACING) {
        spacing = Program.MIN_SPACING;
      } else {
        spacing = diff;
      }
      log += Array(spacing).join(' ') + option.description;

      // default value
      if (option.defaultValue) {
        spacing = Program.MIN_SPACING;
        let diff = posDefault - log.length - 1;
        if (diff <= Program.MIN_SPACING) {
          spacing = Program.MIN_SPACING;
        } else {
          spacing = diff;
        }
        log += Array(spacing).join(' ');
        log += '[default: ' + option.defaultValue + ']';
      }

      console.log(log);
      if (opt_extOptions) {
        opt_extOptions[option.opt] = option;
      }
    }
  }

  /**
   * Assuming that the this program can run by itself, to print out the program's
   * help. Also assuming that the commands are called cmd-run and cmd-help.
   */
  printHelp(): void {
    console.log(
        '\n' +
        'Usage:        ' + this.cmd + ' [options]\n' +
        '              ' + this.cmd + ' help\n' +
        'Description:  ' + this.cmdDescription + '\n');
    console.log('Options:');
    this.printOptions(this.posDescription(), this.posDefault());
  }

  posDescription(): number {
    return this.lengthOf_('opt') + 2 * Program.MIN_SPACING;
  }

  posDefault(): number {
    return this.posDescription() + this.lengthOf_('description') + Program.MIN_SPACING;
  }

  lengthOf_(param: string): number {
    let maxLength = -1;
    for (let opt in this.options) {
      let option = this.options[opt];
      if (param === 'description') {
        maxLength = Math.max(maxLength, option.description.length);
      } else if (param === 'opt') {
        maxLength = Math.max(maxLength, option.opt.length);
      }
    }
    return maxLength;
  }

  /**
   * Create a collection of options used by this program.
   * @returns The options used in the programs.
   */
  getOptions_(allOptions: Options): Options {
    for (let opt in this.options) {
      allOptions[opt] = this.options[opt];
    }
    return allOptions;
  }

  /**
   * Get the options used by the program and create the minimist options
   * to ensure that minimist parses the values properly.
   * @returns The options for minimist.
   */
  getMinimistOptions() {
    let allOptions: Options = {};
    allOptions = this.getOptions_(allOptions);
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
