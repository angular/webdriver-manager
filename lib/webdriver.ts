import * as minimist from 'minimist';

import {cli as commandline} from './cli_instance';

let minimistOptions = commandline.getMinimistOptions();
let argv = minimist(process.argv.slice(2), minimistOptions);
let cmd = argv._;
if (commandline.programs[cmd[0]]) {
  if (cmd[0] === 'help') {
    commandline.printHelp();
  } else if (cmd[1] === 'help' || argv['help'] || argv['h']) {
    commandline.programs[cmd[0]].printHelp();
  } else {
    commandline.programs[cmd[0]].run(JSON.parse(JSON.stringify(argv)));
  }
} else {
  commandline.printHelp();
}
