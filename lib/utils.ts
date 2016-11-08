import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';


function spawnFactory(sync: false):
    (cmd: string, args: string[], stdio?: string, opts?: child_process.SpawnOptions) =>
        child_process.ChildProcess;
function spawnFactory(sync: true):
    (cmd: string, args: string[], stdio?: string, opts?: child_process.SpawnSyncOptions) =>
        child_process.SpawnSyncReturns<any>;
function spawnFactory(sync: boolean):
    (cmd: string, args: string[], stdio?: string,
     opts?: child_process.SpawnOptions|child_process.SpawnSyncOptions) =>
        child_process.ChildProcess | child_process.SpawnSyncReturns<any> {
  return (cmd: string, args: string[], stdio?: string,
          opts?: child_process.SpawnOptions | child_process.SpawnSyncOptions) => {
    if ((os.type() === 'Windows_NT') && (cmd.slice(-4) !== '.exe')) {
      if (fs.existsSync(cmd + '.exe')) {
        cmd += '.exe';
      } else {
        args = ['/c'].concat([cmd], args);
        cmd = 'cmd';
      }
    }
    if (stdio) {
      opts = opts || {};
      opts.stdio = stdio;
    }
    if (sync) {
      return child_process.spawnSync(cmd, args, opts as child_process.SpawnOptions);
    } else {
      return child_process.spawn(cmd, args, opts as child_process.SpawnSyncOptions);
    }
  };
}

export let spawn = spawnFactory(false);
export let spawnSync = spawnFactory(true);
