#!/usr/bin/env node

import * as minimist from 'minimist';
import * as clean from './cmds/clean';
import * as start from './cmds/start';
import * as status from './cmds/status';
import * as update from './cmds/update';

import {Cli} from './cli';

let commandline = new Cli()
              .usage('webdriver-tool <command> [options]')
              .program(clean.program)
              .program(start.program)
              .program(status.program)
              .program(update.program);

let minimistOptions = commandline.getMinimistOptions();
let argv = minimist(process.argv.slice(2), minimistOptions);
let cmd = argv._;
if (commandline.programs[cmd[0]]) {
  if (cmd[1] === 'help') {
    commandline.programs[cmd[0]].printHelp();
  } else {
    commandline.programs[cmd[0]].run(argv);
  }
} else if (cmd[0] === 'help'){
  commandline.printHelp();
} else {
  // do nothing
}

export var cli = commandline;
