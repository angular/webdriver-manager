import * as childProcess from 'child_process';

import * as log from 'loglevel';
import * as path from 'path';
import * as yargs from 'yargs';
import { Options } from './options';
import { constructProviders } from './utils';
import { SeleniumServer } from '../provider/selenium_server';

/**
 * Starts the selenium server standalone with browser drivers. Also handles
 * the SIGINT event when the server is stopped.
 * @param argv The argv from yargs.
 */
export async function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  let options = constructProviders(argv);
  if (options.server.runAsDetach) {
    await start(options);
    process.exit();
  } else {
    process.stdin.resume();
    process.on('SIGINT', () => {
      let seleniumServer = (options.server.binary as SeleniumServer);
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
  let javaOpts: {[key: string]: string} = {};
  for (let provider of options.providers) {
    if (provider.binary) {
      javaOpts[provider.binary.seleniumFlag] =
        provider.binary.getBinaryPath(provider.version);
    }
  }

  if (options.server) {
    // TODO(cnishina): move this into start server command?
    if (options.server.chrome_logs) {
      let chromeLogs = options.server.chrome_logs
        .replace('"', '').replace('\'', '');
      javaOpts['-Dwebdriver.chrome.logfile'] = path.resolve(chromeLogs);
    }
    // TODO(cnishina): move this into start server command?
    if (options.server.edge) {
      let edge = options.server.edge
        .replace('"', '').replace('\'', '');
      javaOpts['-Dwebdriver.edge.driver'] = path.resolve(edge);
    }
    if (options.server.binary) {
      return (options.server.binary as SeleniumServer)
        .startServer(javaOpts, options.server.version,
          options.server.runAsNode, options.server.runAsDetach);
    }
  }
  return Promise.reject('Could not start the server');
}