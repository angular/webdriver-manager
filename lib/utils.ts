import * as child_process from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

import {Config} from './config';

function spawnFactory(sync: false):
    (cmd: string, args: string[], stdio?: any, opts?: child_process.SpawnOptions) =>
        child_process.ChildProcess;
function spawnFactory(sync: true):
    (cmd: string, args: string[], stdio?: any, opts?: child_process.SpawnSyncOptions) =>
        child_process.SpawnSyncReturns<any>;
function spawnFactory(sync: boolean):
    (cmd: string, args: string[], stdio?: string,
     opts?: child_process.SpawnOptions|child_process.SpawnSyncOptions) =>
        child_process.ChildProcess | child_process.SpawnSyncReturns<any> {
  return (cmd: string, args: string[], stdio?: string,
          opts?: child_process.SpawnOptions|child_process.SpawnSyncOptions) => {
    if ((Config.osType() === 'Windows_NT') && (cmd.slice(-4) !== '.exe')) {
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

export function request(
    method: string, port: string, path: string, timeout?: number, data?: any): Promise<string> {
  let headers: {[key: string]: string} = {};
  let hasContent = data && ((method == 'POST') || (method == 'PUT'));
  if (hasContent) {
    data = data ? JSON.stringify(data) : '';
    headers['Content-Length'] = data.length;
    headers['Content-Type'] = 'application/json;charset=UTF-8';
  }
  return new Promise<string>((resolve, reject) => {
    let unexpectedEnd = () => {
      reject({code: 'UNKNOWN', message: 'Request ended unexpectedly'});
    };
    let req = http.request(
        {port: parseInt(port), method: method, path: path, headers: headers}, (res) => {
          req.removeListener('end', unexpectedEnd);
          if (res.statusCode !== 200) {
            reject({code: res.statusCode, message: res.statusMessage});
          } else {
            let buffer: (string|Buffer)[] = [];
            res.on('data', buffer.push.bind(buffer));
            res.on('end', () => {
              resolve(buffer.join('').replace(/\0/g, ''));
            });
          }
        });

    if (timeout) {
      req.setTimeout(timeout, () => {
        reject({code: 'TIMEOUT', message: 'Request timed out'});
      });
    }
    req.on('error', reject);
    req.on('end', unexpectedEnd);

    if (hasContent) {
      req.write(data as string);
    }

    req.end();
  });
}

export function adb(
    sdkPath: string, port: number, command: string, timeout: number,
    args?: string[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let child = spawn(
        path.resolve(sdkPath, 'platform-tools', 'adb'),
        ['-s', 'emulator-' + port, command].concat(args || []), 'pipe');
    let done = false;
    let buffer: (string|Buffer)[] = [];
    child.stdout.on('data', buffer.push.bind(buffer));
    child.on('error', (err: Error) => {
      if (!done) {
        done = true;
        reject(err);
      }
    });
    child.on('exit', (code: number, signal: string) => {
      if (!done) {
        done = true;
        if (code === 0) {
          resolve(buffer.join(''));
        } else {
          reject({
            code: code,
            message: 'abd command "' + command + '" ' +
                (signal ? 'received signal ' + signal : 'returned with a non-zero exit code') +
                'for emulator-' + port
          });
        }
      }
    });
    if (timeout) {
      setTimeout(() => {
        if (!done) {
          done = true;
          child.kill();
          reject({
            code: 'TIMEOUT',
            message: 'adb command "' + command + '" timed out for emulator-' + port
          });
        }
      }, timeout);
    }
  });
}
