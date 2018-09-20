import * as loglevel from 'loglevel';
import * as yargs from 'yargs';

import {SeleniumServer} from '../provider/selenium_server';
import {Options} from './options';
import {OptionsBinary} from './options_binary';
import {addOptionsBinary} from './utils';

const log = loglevel.getLogger('webdriver-manager');

/**
 * Handles making the get request to stop the selenium server standalone if the
 * server has been started with role = node.
 * @param argv The argv from yargs.
 */
export async function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  const seleniumServer = new SeleniumServer();
  seleniumServer.runAsNode = true;
  const options = {server: {binary: seleniumServer, runAsNode: true}};
  await shutdown(options);
}

/**
 * Shutdown the selenium server with a get request. If the server is not
 * started with role = node, nothing will happen.
 * @param options The constructed option for the server.
 * @returns A promise for the get request.
 */
export function shutdown(options: Options): Promise<void> {
  const optionsBinary = addOptionsBinary(options);
  return shutdownBinary(optionsBinary);
}

/**
 * Shutodown the selenium server with a get request. If the server is not
 * started with role = node, nothing will happen.
 * @param optionsBinary The constructed option for the server with binary.
 * @returns A promise for the get request.
 */
export function shutdownBinary(optionsBinary: OptionsBinary): Promise<void> {
  const seleniumServer = optionsBinary.server.binary as SeleniumServer;
  return seleniumServer.stopServer();
}