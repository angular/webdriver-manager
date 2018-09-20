import * as loglevel from 'loglevel';
import * as path from 'path';
import * as yargs from 'yargs';

import {SeleniumServer} from '../provider/selenium_server';
import {Options} from './options';
import {OptionsBinary} from './options_binary';
import {addOptionsBinary, convertArgs2Options} from './utils';

const log = loglevel.getLogger('webdriver-manager');

/**
 * Starts the selenium server standalone with browser drivers. Also handles
 * the SIGINT event when the server is stopped.
 * @param argv The argv from yargs.
 */
export async function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  const options = convertArgs2Options(argv);
  if (options.server.runAsDetach) {
    await start(options);
    process.exit();
  } else {
    process.stdin.resume();
    process.on('SIGINT', () => {
      const optionsBinary = addOptionsBinary(options);
      const seleniumServer = (optionsBinary.server.binary as SeleniumServer);
      process.kill(seleniumServer.seleniumProcess.pid);
      process.exit(process.exitCode);
    });
    start(options).then(() => {});
  }
}

/**
 * Goes through all the option providers and creates a set of java options
 * to pass to java when starting the selenium server standalone.
 * @param options The constructed options.
 * @returns Promise starting the server with the resolved exit code.
 */
export function start(options: Options): Promise<number> {
  const optionsBinary = addOptionsBinary(options);
  return startBinary(optionsBinary);
}

/**
 * Goes through all the option providers and creates a set of java options
 * to pass to java when starting the selenium server standalone.
 * @param optionsBinary The constructed options with binaries.
 * @returns Promise starting the server with the resolved exit code.
 */
export function startBinary(optionsBinary: OptionsBinary): Promise<number> {
  const javaOpts: {[key: string]: string} = {};
  for (const browserDriver of optionsBinary.browserDrivers) {
    if (browserDriver.binary) {
      javaOpts[browserDriver.binary.seleniumFlag] =
          browserDriver.binary.getBinaryPath(browserDriver.version);
    }
  }

  if (optionsBinary.server) {
    if (optionsBinary.server.chrome_logs) {
      const chromeLogs =
          optionsBinary.server.chrome_logs.replace('"', '').replace('\'', '');
      javaOpts['-Dwebdriver.chrome.logfile'] = path.resolve(chromeLogs);
    }
    if (optionsBinary.server.edge) {
      const edge = optionsBinary.server.edge.replace('"', '').replace('\'', '');
      javaOpts['-Dwebdriver.edge.driver'] = path.resolve(edge);
    }
    if (optionsBinary.server.binary) {
      return (optionsBinary.server.binary as SeleniumServer)
          .startServer(javaOpts, optionsBinary.server.version);
    }
  }
  return Promise.reject('Could not start the server');
}