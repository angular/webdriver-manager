import {ChildProcess} from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as minimist from 'minimist';
import * as os from 'os';
import * as path from 'path';
import * as q from 'q';

import {AndroidSDK, Appium, Binary, BinaryMap, ChromeDriver, IEDriver, StandAlone} from '../binaries';
import {GeckoDriver} from '../binaries/gecko_driver';
import {Logger, Options, Program, unparseOptions} from '../cli';
import {Config} from '../config';
import {FileManager} from '../files';
import {spawn} from '../utils';

import * as Opt from './';
import {Opts} from './opts';

const commandName = 'start';

let logger = new Logger('start');
let prog = new Program()
               .command(commandName, 'start up the selenium server')
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
               .addOption(Opts[Opt.LOGGING])
               .addOption(Opts[Opt.ANDROID])
               .addOption(Opts[Opt.AVDS])
               .addOption(Opts[Opt.AVD_USE_SNAPSHOTS])
               .addOption(Opts[Opt.STARTED_SIGNIFIER])
               .addOption(Opts[Opt.SIGNAL_VIA_IPC])
               .addOption(Opts[Opt.DETACH]);

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

// Manage processes used in android emulation
let androidProcesses: ChildProcess[] = [];

/**
 * Parses the options and starts the selenium standalone server.
 * @param options
 */
function start(options: Options) {
  if (options[Opt.DETACH].getBoolean()) {
    return detachedRun(options);
  }

  let osType = os.type();
  let binaries = FileManager.setupBinaries();
  let seleniumPort = options[Opt.SELENIUM_PORT].getString();
  let appiumPort = options[Opt.APPIUM_PORT].getString();
  let avdPort = options[Opt.AVD_PORT].getNumber();
  let android = options[Opt.ANDROID].getBoolean();
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
  let args: string[] = [];
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

  if (downloadedBinaries[ChromeDriver.id] != null) {
    args.push(
        '-Dwebdriver.chrome.driver=' +
        path.resolve(outputDir, binaries[ChromeDriver.id].executableFilename(osType)));
    if (chromeLogs != null) {
      args.push('-Dwebdriver.chrome.logfile=' + chromeLogs);
    }
  }
  if (downloadedBinaries[GeckoDriver.id] != null) {
    args.push(
        '-Dwebdriver.gecko.driver=' +
        path.resolve(outputDir, binaries[GeckoDriver.id].executableFilename(osType)));
  }
  if (downloadedBinaries[IEDriver.id] != null) {
    if (options[Opt.IE32]) {
      binaries[IEDriver.id].arch = 'Win32';
    }
    args.push(
        '-Dwebdriver.ie.driver=' +
        path.resolve(outputDir, binaries[IEDriver.id].executableFilename(osType)));
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
  if (android) {
    if (downloadedBinaries[AndroidSDK.id] != null) {
      let avds = options[Opt.AVDS].getString();
      startAndroid(
          outputDir, binaries[AndroidSDK.id], avds.split(','),
          options[Opt.AVD_USE_SNAPSHOTS].getBoolean(), avdPort);
    } else {
      logger.warn('Not starting android because it is not installed');
    }
  }
  if (downloadedBinaries[Appium.id] != null) {
    startAppium(outputDir, binaries[Appium.id], binaries[AndroidSDK.id], appiumPort);
  }

  // log the command to launch selenium server
  args.push('-jar');
  args.push(path.resolve(outputDir, binaries[StandAlone.id].filename()));

  // Add the port parameter, has to declared after the jar file
  if (seleniumPort) {
    args.push('-port', seleniumPort);
  }

  let argsToString = '';
  for (let arg in args) {
    argsToString += ' ' + args[arg];
  }
  logger.info('java' + argsToString);

  let seleniumProcess = spawn('java', args, 'inherit');
  if (options[Opt.STARTED_SIGNIFIER].getString()) {
    signalWhenReady(
        options[Opt.STARTED_SIGNIFIER].getString(), options[Opt.SIGNAL_VIA_IPC].getBoolean(),
        outputDir, seleniumPort, downloadedBinaries[Appium.id] ? appiumPort : '',
        binaries[AndroidSDK.id], avdPort, androidProcesses.length);
  }
  logger.info('seleniumProcess.pid: ' + seleniumProcess.pid);
  seleniumProcess.on('exit', (code: number) => {
    logger.info('Selenium Standalone has exited with code ' + code);
    shutdownEverything();
    process.exit(code);
  });
  process.stdin.resume();
  process.stdin.on('data', (chunk: Buffer) => {
    logger.info('Attempting to shut down selenium nicely');
    shutdownEverything(seleniumPort);
  });
  process.on('SIGINT', () => {
    logger.info('Staying alive until the Selenium Standalone process exits');
    shutdownEverything(seleniumPort);
  });
}

function startAndroid(
    outputDir: string, sdk: Binary, avds: string[], useSnapshots: boolean, port: number): void {
  let sdkPath = path.resolve(outputDir, sdk.executableFilename(os.type()));
  if (avds[0] == 'all') {
    avds = <string[]>require(path.resolve(sdkPath, 'available_avds.json'));
  } else if (avds[0] == 'none') {
    avds.length = 0;
  }
  const minAVDPort = 5554;
  const maxAVDPort = 5586 - 2 * avds.length;
  if (avds.length && ((port < minAVDPort) || (port > maxAVDPort))) {
    throw new RangeError(
        'AVD Port must be between ' + minAVDPort + ' and ' + maxAVDPort + ' to emulate ' +
        avds.length + ' android devices');
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
      emuArgs = emuArgs.concat(['-port', '' + (port + 2 * i)]);
    }
    if (emuBin !== 'emulator') {
      emuArgs = emuArgs.concat(['-qemu', '-enable-kvm']);
    }
    androidProcesses.push(spawn(path.resolve(sdkPath, 'tools', emuBin), emuArgs, 'inherit'));
  });
}

function killAndroid() {
  androidProcesses.forEach((androidProcess: ChildProcess) => {
    androidProcess.kill();
  });
  androidProcesses.length = 0;
}

// Manage appium process
let appiumProcess: ChildProcess;

function startAppium(outputDir: string, binary: Binary, androidSDK: Binary, port: string) {
  logger.info('Starting appium server');
  if (androidSDK) {
    process.env.ANDROID_HOME = path.resolve(outputDir, androidSDK.executableFilename(os.type()));
  }
  appiumProcess = spawn(
      'npm', ['run', 'appium'].concat(port ? ['--', '--port', port] : []), null,
      {cwd: path.resolve(outputDir, binary.filename())});
}

function killAppium() {
  if (appiumProcess != null) {
    appiumProcess.kill();
    appiumProcess = null;
  }
}


function signalWhenReady(
    signal: string, viaIPC: boolean, outputDir: string, seleniumPort: string, appiumPort: string,
    androidSDK: Binary, avdPort: number, avdCount: number) {
  const checkInterval = 100;
  const maxWait = 10000;
  function waitFor(isReady: () => q.Promise<void>) {
    return q.Promise<void>((resolve, reject) => {
      let waited = 0;
      (function recursiveCheck() {
        setTimeout(() => {
          isReady().then(
              () => {
                resolve(undefined);
              },
              (reason) => {
                waited += checkInterval;
                if (waited < maxWait) {
                  recursiveCheck();
                } else {
                  reject('Timed out.  Final rejection reason: ' + reason);
                }
              });
        }, checkInterval);
      })();
    });
  };
  function serverChecker(url: string, test: (data: string) => boolean): () => q.Promise<void> {
    return () => {
      return q.Promise<void>((resolve, reject) => {
        http.get(url, (res) => {
              if (res.statusCode !== 200) {
                reject(
                    'Could not check ' + url + ' for server status (' + res.statusCode + ': ' +
                    res.statusMessage + ')');
              } else {
                let data = '';
                res.on('data', (chunk) => {
                  data += chunk;
                });
                res.on('end', () => {
                  if (test(data)) {
                    resolve(undefined);
                  } else {
                    reject('Bad server status: ' + data);
                  }
                });
              }
            }).on('error', () => {
          reject(undefined);
        });
      });
    };
  }
  function waitForAndroid(port: number): q.Promise<void> {
    return q.Promise<void>((resolve, reject) => {
      let child = spawn(
          path.resolve(
              outputDir, androidSDK.executableFilename(os.type()), 'platform-tools', 'adb'),
          ['-s', 'emulator-' + port, 'wait-for-device'], 'ignore');
      let done = false;
      child.on('error', (err: Error) => {
        if (!done) {
          done = true;
          reject('Error while waiting for for emulator-' + port + ': ' + err);
        }
      });
      child.on('exit', (code: number, signal: string) => {
        if (!done) {
          done = true;
          resolve(undefined);
        }
      });
      setTimeout(() => {
        if (!done) {
          done = true;
          child.kill();
          reject('Timed out waiting for emulator-' + port);
        }
      }, maxWait);
    });
  }
  let pending = [waitFor(serverChecker(
      'http://localhost:' + seleniumPort + '/selenium-server/driver/?cmd=getLogMessages',
      (logs) => {
        return logs.toUpperCase().indexOf('OK') != -1;
      }))];
  if (appiumPort) {
    pending.push(
        waitFor(serverChecker('http://localhost:' + appiumPort + '/wd/hub/status', (status) => {
          return JSON.parse(status).status == 0;
        })));
  }
  if (androidSDK && avdPort && avdCount) {
    for (let i = 0; i < avdCount; i++) {
      pending.push(waitForAndroid(avdPort + 2 * i));
    }
  }
  q.all(pending).then(
      () => {
        sendStartedSignal(signal, viaIPC);
      },
      (error) => {
        logger.error(error);
        shutdownEverything(seleniumPort);
        process.exitCode = 1;
      });
}

function sendStartedSignal(signal: string, viaIPC: boolean) {
  if (viaIPC) {
    if (process.send) {
      return process.send(signal);
    } else {
      logger.warn('No IPC channel, sending signal via stdout');
    }
  }
}

function shutdownEverything(seleniumPort?: string) {
  if (seleniumPort) {
    http.get(
        'http://localhost:' + seleniumPort + '/selenium-server/driver/?cmd=shutDownSeleniumServer');
  }
  killAndroid();
  killAppium();
}

function detachedRun(options: Options) {
  var file = path.resolve(__dirname, '..', 'webdriver.js');
  var oldSignal = options[Opt.STARTED_SIGNIFIER].getString();
  var oldViaIPC = options[Opt.SIGNAL_VIA_IPC].getBoolean();
  options[Opt.DETACH].value = false;
  options[Opt.STARTED_SIGNIFIER].value = 'server started';
  options[Opt.SIGNAL_VIA_IPC].value = true;
  let args: string[] = [file, commandName].concat(unparseOptions(options));

  var unreffed = false;
  let child = spawn(process.execPath, args, ['ignore', 1, 2, 'ipc']);

  child.on('message', (message: string) => {
    if (message == options[Opt.STARTED_SIGNIFIER].getString()) {
      if (oldSignal) {
        sendStartedSignal(oldSignal, oldViaIPC);
      }
      logger.info('Detached pid: ' + child.pid);
      child.disconnect();
      child.unref();
      unreffed = true;
    }
  });

  child.on('exit', (code: number) => {
    if (!unreffed) {
      if (code == 0) {
        logger.warn('Server never seemed to start, and has now exited');
      } else {
        logger.error('Server never seemed to start, and has probably crashed');
      }
      process.exit(code);
    }
  });
}
