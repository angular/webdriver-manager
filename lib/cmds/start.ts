import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as minimist from 'minimist';
import * as os from 'os';
import * as path from 'path';

import {AndroidSDK, Appium, Binary, BinaryMap, ChromeDriver, IEDriver, StandAlone} from '../binaries';
import {Logger, Options, Program} from '../cli';
import {Config} from '../config';
import {FileManager} from '../files';

import * as Opt from './';
import {Opts} from './opts';

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
               .addOption(Opts[Opt.VERSIONS_APPIUM])
               .addOption(Opts[Opt.CHROME_LOGS])
               .addOption(Opts[Opt.GECKO])
               .addOption(Opts[Opt.LOGGING])
               .addOption(Opts[Opt.ANDROID])
               .addOption(Opts[Opt.AVDS])
               .addOption(Opts[Opt.AVD_USE_SNAPSHOTS]);

if (os.type() === 'Darwin') {
  prog.addOption(Opts[Opt.IOS]);
}

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts[Opt.VERSIONS_IE])
      .addOption(Opts[Opt.IE32])
      .addOption(Opts[Opt.IE])
      .addOption(Opts[Opt.EDGE]);
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
  let loggingFile: string = null;
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
  binaries[Appium.id].versionCustom = options[Opt.VERSIONS_APPIUM].getString();
  let downloadedBinaries = FileManager.downloadedBinaries(outputDir);

  if (downloadedBinaries[StandAlone.id] == null) {
    logger.error(
        'Selenium Standalone is not present. Install with ' +
        'webdriver-manager update --standalone');
    process.exit(1);
  }
  let args: string[] = ['-jar', path.join(outputDir, binaries[StandAlone.id].filename())];
  if (osType === 'Linux') {
    // selenium server may take a long time to start because /dev/random is BLOCKING if there is not
    // enough entropy the solution is to use /dev/urandom, which is NON-BLOCKING (use /dev/./urandom
    // because of a java bug)
    // https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/1301
    // https://bugs.openjdk.java.net/browse/JDK-6202721
    args.push('-Djava.security.egd=file:///dev/./urandom');
  }

  if (options[Opt.LOGGING].getString()) {
    if (path.isAbsolute(options[Opt.LOGGING].getString())) {
      loggingFile = options[Opt.LOGGING].getString();
    } else {
      loggingFile = path.resolve(Config.getBaseDir(), options[Opt.LOGGING].getString());
    }
    args.push('-Djava.util.logging.config.file=' + loggingFile);
  }

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
    if (options[Opt.IE32]) {
      binaries[IEDriver.id].arch = 'Win32';
    }
    args.push(
        '-Dwebdriver.ie.driver=' +
        path.join(outputDir, binaries[IEDriver.id].executableFilename(osType)));
  }
  if (options[Opt.EDGE]) {
    // validate that the file exists prior to adding it to args
    try {
      let edgeFile = options[Opt.EDGE].getString();
      if (fs.statSync(edgeFile).isFile()) {
        args.push('-Dwebdriver.edge.driver=' + options[Opt.EDGE].getString());
      }
    } catch (err) {
      // Either the default file or user specified location of the edge
      // driver does not exist.
    }
  }
  if (options[Opt.GECKO].getString()) {
    let gecko = options[Opt.GECKO].getString();
    try {
      if (fs.statSync(gecko).isFile()) {
        args.push('-Dwebdriver.edge.driver=' + gecko);
      }
    } catch (err) {
      // The file does not exist.
      logger.warn('The absolute path provided for gecko (' + gecko + ') does not exist');
    }
  }
  if (options[Opt.ANDROID].getBoolean()) {
    if (downloadedBinaries[AndroidSDK.id] != null) {
      let avds = options[Opt.AVDS].getString();
      startAndroid(
          outputDir, binaries[AndroidSDK.id], avds.split(','),
          options[Opt.AVD_USE_SNAPSHOTS].getBoolean(), options[Opt.AVD_PORT].getString());
    } else {
      logger.warn('Not starting android because it is not installed');
    }
  }
  if (downloadedBinaries[Appium.id] != null) {
    startAppium(outputDir, binaries[Appium.id], options[Opt.APPIUM_PORT].getString());
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
  let finalArgs: string[] = windows ? ['/c'].concat([command], args) : args;

  return childProcess.spawn(winCommand, finalArgs, {stdio: 'inherit'});
}

// Manage processes used in android emulation
let androidProcesses: childProcess.ChildProcess[] = [];

function startAndroid(
    outputDir: string, sdk: Binary, avds: string[], useSnapshots: boolean, port: string): void {
  let sdkPath = path.join(outputDir, sdk.executableFilename(os.type()));
  if (avds[0] == 'all') {
    avds = <string[]>require(path.join(sdkPath, 'available_avds.json'));
  } else if (avds[0] == 'none') {
    avds.length = 0;
  }
  avds.forEach((avd: string, i: number) => {
    logger.info('Booting up AVD ' + avd);
    // Credit to appium-ci, which this code was adapted from
    let emuBin = 'emulator';  // TODO(sjelin): get the 64bit linux version working
    let emuArgs = [
      '-avd',
      avd + '-v' + sdk.versionCustom + '-wd-manager',
      '-netfast',
    ];
    if (!useSnapshots) {
      emuArgs = emuArgs.concat(['-no-snapshot-load', '-no-snapshot-save']);
    }
    if (port) {
      emuArgs = emuArgs.concat(['-ports', (port + 2 * i) + ',' + (port + 2 * i + 1)]);
    }
    if (emuBin !== 'emulator') {
      emuArgs = emuArgs.concat(['-qemu', '-enable-kvm']);
    }
    androidProcesses.push(
        childProcess.spawn(path.join(sdkPath, 'tools', emuBin), emuArgs, {stdio: 'inherit'}));
  });
}

function killAndroid() {
  androidProcesses.forEach(
      (androidProcess: childProcess.ChildProcess) => { androidProcess.kill(); });
  androidProcesses.length = 0;
}

// Manage appium process
let appiumProcess: childProcess.ChildProcess;

function startAppium(outputDir: string, binary: Binary, port: string) {
  logger.info('Starting appium server');
  appiumProcess = childProcess.spawn(
      path.join(outputDir, binary.filename(), 'node_modules', '.bin', 'appium'),
      port ? ['--port', port] : []);
}

function killAppium() {
  if (appiumProcess != null) {
    appiumProcess.kill();
    appiumProcess = null;
  }
}
