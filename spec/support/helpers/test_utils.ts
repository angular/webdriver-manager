import * as childProcess from 'child_process';
import { requestBody } from '../../../lib/provider/utils/http_utils';

/**
 * A command line to run. Example 'npm start', the task='npm' and the opt_arg=['start']
 * @param task The task string.
 * @param opt_arg Optional task args.
 * @param opt_io Optional io arg. By default, it should log to console.
 * @returns The child process.
 */
export function spawnProcess(task: string, opt_arg?: string[], opt_io?: string) {
  opt_arg = typeof opt_arg !== 'undefined' ? opt_arg : [];
  let stdio = 'inherit';
  if (opt_io === 'ignore') {
    stdio = 'ignore';
  }
  return childProcess.spawn(task, opt_arg, {stdio: stdio});
}

/**
 * Check the connectivity by making a request to https://github.com.
 * If the request results in an error, return false.
 */
export function checkConnectivity(testName: string): Promise<boolean> {
  return requestBody('https://github.com', {}).then(() => {
    return true;
  }).catch(() => {
    console.warn('[WARN] no connectivity. skipping test ' + testName)
    return false;
  });
}