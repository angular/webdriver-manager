import * as log from 'loglevel';
import * as yargs from 'yargs';
import { Options } from './options';
import { SeleniumServer } from '../provider/selenium_server';

/**
 * Handles making the get request to stop the selenium server standalone if the
 * server has been started with role = node.
 * @param argv The argv from yargs.
 */
export async function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  let seleniumServer = new SeleniumServer();
  seleniumServer.runAsNode = true;
  let options = {
    server: {
      binary: seleniumServer,
      runAsNode: true
    }
  };
  await shutdown(options);
}

/**
 * Shutdown the selenium server with a get request. If the server is not
 * started with role = node, nothing will happen.
 * @param options The constructed option for the server.
 * @returns A promise for the get request.
 */
export function shutdown(options: Options): Promise<void> {
  let seleniumServer = options.server.binary as SeleniumServer;
  return seleniumServer.stopServer();
}