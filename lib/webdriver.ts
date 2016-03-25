#!/usr/bin/env node

import * as minimist from 'minimist';
import * as clean from './cmds/clean';
import * as start from './cmds/start';
import * as status from './cmds/status';
import * as update from './cmds/update';

import {Cli} from './cli';
import {Config} from './config';

let commandline = new Cli()
              .usage('webdriver-tool <command> [options]')
              .setVersion(Config.version())
              .program(clean.program)
              .program(start.program)
              .program(status.program)
              .program(update.program);

let minimistOptions = commandline.getMinimistOptions();
let argv = minimist(process.argv.slice(2), minimistOptions);
let cmd = argv._;
if (commandline.programs[cmd[0]]) {
  if (cmd[0] === 'version') {
    commandline.printVersion();
  }
  else if (cmd[0] === 'help') {
    commandline.printHelp();
  }
  else if (cmd[1] === 'help' || argv['help'] || argv['h']) {
    commandline.programs[cmd[0]].printHelp();
  } else {
    commandline.programs[cmd[0]].run(argv);
  }
} else if (argv['version'] || argv['v']) {
  commandline.printVersion();
} else {
  commandline.printHelp();
}

export var cli = commandline;
