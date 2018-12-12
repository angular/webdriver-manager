import * as childProcess from 'child_process';
import * as loglevel from 'loglevel';
import {requestBody} from '../../../lib/provider/utils/http_utils';

const log = loglevel.getLogger('webdriver-manager-test');

/**
 * A command line to run. Example 'npm start', the task='npm' and the
 * opt_arg=['start']
 * @param task The task string.
 * @param optArg Optional task args.
 * @param optIo Optional io arg. By default, it should log to console.
 * @returns The child process.
 */
export function spawnProcess(task: string, optArg?: string[], optIo?: string) {
  optArg = typeof optArg !== 'undefined' ? optArg : [];
  let stdio: childProcess.StdioOptions = 'inherit';
  if (optIo === 'ignore') {
    stdio = 'ignore';
  }
  return childProcess.spawn(task, optArg, {stdio});
}

/**
 * Check the connectivity by making a request to https://github.com.
 * If the request results in an error, return false.
 */
export function checkConnectivity(testName: string): Promise<boolean> {
  return requestBody('https://github.com', {})
      .then(() => {
        return true;
      })
      .catch(() => {
        log.warn('[WARN] no connectivity. skipping test ' + testName);
        return false;
      });
}