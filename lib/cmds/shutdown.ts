import * as http from 'http';
import * as minimist from 'minimist';
const ps = require('ps-node');

import {Logger, Options, Program} from '../cli';

import * as Opt from './';
import {Opts} from './opts';


let logger = new Logger('shutdown');
let prog = new Program()
               .command('shutdown', 'shut down the selenium server')
               .action(shutdown)
               .addOption(Opts[Opt.SELENIUM_PORT])
               .addOption(Opts[Opt.ALREADY_OFF_ERROR]);

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
  ps.lookup({
    command: 'java',
    arguments: '-port,' + options[Opt.SELENIUM_PORT].getString()
  }, (err: any, results: any) => {
    if (err) {
      throw new Error(err);
    }

    switch (results.length) {
      case 0:
        if (!options[Opt.ALREADY_OFF_ERROR].getBoolean()) {
          logger.warn('Server does not appear to be on');
        } else {
          logger.error('Server unreachable, probably not running');
          throw new Error('Server unreachable, probably not running');
        }
        break;
      case 1:
        logger.info('Found selenium with PID:', results[0].pid);
        ps.kill(results[0].pid, 'SIGINT', (err: any) => {
          if (err) {
            throw new Error(err);
          } else {
            logger.info('Selenium has been shutdown');
          }
        });
        break;
      default:
        if (!options[Opt.ALREADY_OFF_ERROR].getBoolean()) {
          logger.warn('Multiple server instances running');
        } else {
          logger.error('Multiple server instances running');
          throw new Error('Multiple server instances running');
        }
    };
  });
}
