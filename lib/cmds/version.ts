import * as minimist from 'minimist';
import {Logger, Options, Program} from '../cli';
import {Config} from '../config';

import * as Opt from './';
import {Opts} from './opts';

let logger = new Logger('version');

let prog = new Program().command('version', 'get the current version').action(getVersion);

export let program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'version-run') {
  prog.run(JSON.parse(JSON.stringify(argv)));
}

function getVersion(): void {
  logger.info('webdriver-manager', Config.getVersion());
}
