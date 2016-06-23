import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as os from 'os';
import * as childProcess from 'child_process';
import * as http from 'http';

import {Opts} from './opts';
import * as Opt from './';
import {Config} from '../config';
import {FileManager} from '../files';
import {Logger, Options, Program} from '../cli';
import {BinaryMap, Binary, ChromeDriver, IEDriver, AndroidSDK, StandAlone} from '../binaries';

let logger = new Logger('start');
let prog = new Program()
    .command('start', 'start up the selenium server')
    .action(start)
    .addOption(Opts[Opt.OUT_DIR])
    .addOption(Opts[Opt.SELENIUM_PORT])
    .addOption(Opts[Opt.APPIUM_PORT])
    .addOption(Opts[Opt.AVD_PORT])
    .addOption(Opts[Opt.VERSIONS_STANDALONE])
    .addOption(Opts[Opt.VERSIONS_CHROME])
    .addOption(Opts[Opt.VERSIONS_ANDROID])
    .addOption(Opts[Opt.CHROME_LOGS])
    .addOption(Opts[Opt.ANDROID])
    .addOption(Opts[Opt.AVDS])
    .addOption(Opts[Opt.AVD_USE_SNAPSHOTS]);

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts[Opt.VERSIONS_IE]);
  prog.addOption(Opts[Opt.EDGE]);
}

export var program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'start-run') {
  prog.run(JSON.parse(JSON.stringify(argv)));
} else if (argv._[0] === 'start-help') {
  prog.printHelp();
}

/**
 * Parses the options and starts the selenium standalone server.
 * @param options
 */
function start(options: Options) {
  let osType = os.type();
  let binaries = FileManager.setupBinaries();
  let seleniumPort = options[Opt.SELENIUM_PORT].getString();
  let outputDir = Config.getSeleniumDir();
  if (options[Opt.OUT_DIR].getString()) {
    if (path.isAbsolute(options[Opt.OUT_DIR].getString())) {
      outputDir = options[Opt.OUT_DIR].getString();
    } else {
      outputDir = path.resolve(Config.getBaseDir(), options[Opt.OUT_DIR].getString());
    }
  }

  try {
    // check if folder exists
    fs.statSync(outputDir).isDirectory();
  } catch (e) {
    // if the folder does not exist, quit early.
    logger.warn('the out_dir path ' + outputDir + ' does not exist, run webdriver-manager update');
    return;
  }

  let chromeLogs: string = null;
  if (options[Opt.CHROME_LOGS].getString()) {
    if (path.isAbsolute(options[Opt.CHROME_LOGS].getString())) {
      chromeLogs = options[Opt.CHROME_LOGS].getString();
    } else {
      chromeLogs = path.resolve(Config.getBaseDir(), options[Opt.CHROME_LOGS].getString());
    }
  }
  binaries[StandAlone.id].versionCustom = options[Opt.VERSIONS_STANDALONE].getString();
  binaries[ChromeDriver.id].versionCustom = options[Opt.VERSIONS_CHROME].getString();
  if (options[Opt.VERSIONS_IE]) {
    binaries[IEDriver.id].versionCustom = options[Opt.VERSIONS_IE].getString();
  }
  binaries[AndroidSDK.id].versionCustom = options[Opt.VERSIONS_ANDROID].getString();
  let downloadedBinaries = FileManager.downloadedBinaries(outputDir);

  if (downloadedBinaries[StandAlone.id] == null) {
    logger.error(
        'Selenium Standalone is not present. Install with ' +
        'webdriver-manager update --standalone');
    process.exit(1);
  }
  let args: string[] = ['-jar', path.join(outputDir, binaries[StandAlone.id].filename())];
  if (seleniumPort) {
    args.push('-port', seleniumPort);
  }
  if (downloadedBinaries[ChromeDriver.id] != null) {
    args.push(
        '-Dwebdriver.chrome.driver=' +
        path.join(outputDir, binaries[ChromeDriver.id].executableFilename(osType)));
    if (chromeLogs != null) {
      args.push('-Dwebdriver.chrome.logfile=' + chromeLogs);
    }
  }
  if (downloadedBinaries[IEDriver.id] != null) {
    args.push(
        '-Dwebdriver.ie.driver=' +
        path.join(outputDir, binaries[IEDriver.id].executableFilename(osType)));
  }
  if (options[Opt.EDGE]) {
    args.push(
        '-Dwebdriver.edge.driver=' +
        options[Opt.EDGE].getString());
  }
  if (options[Opt.ANDROID].getBoolean()) {
    if (downloadedBinaries[AndroidSDK.id] != null) {
      let avds = options[Opt.AVDS].getString();
      startAndroid(outputDir, binaries[AndroidSDK.id], avds.split(','),
          options[Opt.AVD_USE_SNAPSHOTS].getBoolean(),
          options[Opt.APPIUM_PORT].getString());
      startAppium(outputDir, options[Opt.APPIUM_PORT].getString());
    } else {
    }
  }

  // log the command to launch selenium server
  let argsToString = '';
  for (let arg in args) {
    argsToString += ' ' + args[arg];
  }
  logger.info('java' + argsToString);

  let seleniumProcess = spawnCommand('java', args);
  logger.info('seleniumProcess.pid: ' + seleniumProcess.pid);
  seleniumProcess.on('exit', (code: number) => {
    logger.info('Selenium Standalone has exited with code ' + code);
    killAndroid();
    killAppium();
    process.exit(code);
  });
  process.stdin.resume();
  process.stdin.on('data', (chunk: Buffer) => {
    logger.info('Attempting to shut down selenium nicely');
    let port = seleniumPort || '4444';
    http.get('http://localhost:' + port + '/selenium-server/driver/?cmd=shutDownSeleniumServer');
    killAndroid();
    killAppium();
  });
  process.on('SIGINT', () => {
    logger.info('Staying alive until the Selenium Standalone process exits');
  });
}

function spawnCommand(command: string, args?: string[]) {
  let osType = os.type();
  let windows: boolean = osType === 'Windows_NT';
  let winCommand = windows ? 'cmd' : command;
  let finalArgs: string[] = windows ? ['/c'].concat([command],args) : args;

  return childProcess.spawn(winCommand, finalArgs, {stdio: 'inherit'});
}

// Manage processes used in android emulation
let androidProcesses: childProcess.ChildProcess[] = [];

function startAndroid(outputDir: string, sdk: Binary, avds: string[],
    useSnapshots: boolean, port: string): void {
  let sdkPath = path.join(outputDir, sdk.executableFilename(os.type()));
  if (avds[0] == 'all') {
    avds = <string[]>require(path.join(sdkPath, 'available_avds.json'));
  } else if (avds[0] == 'none') {
    avds.length = 0;
  }
  avds.forEach((avd: string, i: number) => {
    logger.info('Booting up AVD ' + avd);
    // Credit to appium-ci, which this code was adapted from
    let emuBin = 'emulator'; //TODO(sjelin): get the 64bit linux version working
    let emuArgs = [
      '-avd', avd + '-v' + sdk.versionCustom + '-wd-manager',
      '-netfast',
    ];
    if (!useSnapshots) {
      emuArgs = emuArgs.concat(['-no-snapshot-load', '-no-snapshot-save']);
    }
    if (port) {
      emuArgs = emuArgs.concat(['-ports', (port+2*i) + ',' + (port+2*i+1)]);
    }
    if (emuBin !== 'emulator') {
      emuArgs = emuArgs.concat(['-qemu', '-enable-kvm']);
    }
    androidProcesses.push(childProcess.spawn(path.join(sdkPath, 'tools',
        emuBin), emuArgs, {stdio: 'inherit'}));
  });
}

function killAndroid() {
  androidProcesses.forEach((androidProcess: childProcess.ChildProcess) => {
    androidProcess.kill();
  });
  androidProcesses.length = 0;
}

// Manage appium process
let appiumProcess: childProcess.ChildProcess;

function startAppium(outputDir: string, port: string) {
  logger.info('Starting appium server');
  appiumProcess = childProcess.spawn(path.join(outputDir, 'appium',
      'node_modules', '.bin', 'appium'), port ? ['--port', port] : []);
}

function killAppium() {
  if (appiumProcess != null) {
    appiumProcess.kill();
    appiumProcess = null;
  }
}
