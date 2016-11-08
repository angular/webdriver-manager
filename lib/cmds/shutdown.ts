import * as http from 'http';
import * as minimist from 'minimist';

import {Logger, Options, Program} from '../cli';

import * as Opt from './';
import {Opts} from './opts';


let logger = new Logger('shutdown');
let prog = new Program()
               .command('shutdown', 'shut down the selenium server')
               .action(shutdown)
               .addOption(Opts[Opt.SELENIUM_PORT]);

export var program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'shutdown-run') {
  prog.run(JSON.parse(JSON.stringify(argv)));
} else if (argv._[0] === 'shutdown-help') {
  prog.printHelp();
}

/**
 * Parses the options and starts the selenium standalone server.
 * @param options
 */
function shutdown(options: Options) {
  logger.info('Attempting to shut down selenium nicely');
  http.get(
      'http://localhost:' + options[Opt.SELENIUM_PORT].getString() +
      '/selenium-server/driver/?cmd=shutDownSeleniumServer');
}
