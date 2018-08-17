import * as log from 'loglevel';
import * as yargs from 'yargs';
import { SeleniumServer } from '../provider/selenium_server';

/**
 * Handles making the get request to stop the selenium server standalone if the
 * server has been started with role = node.
 * @param argv The argv from yargs.
 */
export function handler(argv: yargs.Arguments) {
  log.setLevel(argv.log_level);
  let seleniumServer = new SeleniumServer({});
  seleniumServer.runAsNode = true;
  seleniumServer.stopServer();
}
