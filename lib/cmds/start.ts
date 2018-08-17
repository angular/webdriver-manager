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
export function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  let options = constructProviders(argv);
  process.stdin.resume();
  process.on('SIGINT', () => {
    let seleniumServer = (options.server.binary as SeleniumServer);
    process.kill(seleniumServer.seleniumProcess.pid);
    process.exit(process.exitCode);
  });
  start(options).then(() => {});
}

/**
 * Goes through all the providers and creates a set of  java options to pass
 * to java when starting the selenium server standalone.
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
    if (options.server.chrome_logs) {
      let chromeLogs = options.server.chrome_logs
        .replace('"', '').replace('\'', '');
      javaOpts['-Dwebdriver.chrome.logfile'] = path.resolve(chromeLogs);
    }
    if (options.server.binary) {
      return (options.server.binary as SeleniumServer)
        .startServer(javaOpts, options.server.version,
          options.server.runAsNode);
    }
  }
  return Promise.reject('Could not start the server');
}