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
import {BinaryMap, ChromeDriver, IEDriver, StandAlone} from '../binaries';

let prog = new Program()
    .command('start', 'start up the selenium server')
    .action(start)
    .addOption(Opts[Opt.OUT_DIR])
    .addOption(Opts[Opt.SELENIUM_PORT])
    .addOption(Opts[Opt.VERSIONS_STANDALONE])
    .addOption(Opts[Opt.VERSIONS_CHROME])
    .addOption(Opts[Opt.CHROME_LOGS]);

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts[Opt.VERSIONS_IE]);
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
  let outputDir = Config.seleniumDir;
  if (options[Opt.OUT_DIR].getString()) {
    if (path.isAbsolute(options[Opt.OUT_DIR].getString())) {
      outputDir = options[Opt.OUT_DIR].getString();
    } else {
      outputDir = path.resolve(Config.baseDir, options[Opt.OUT_DIR].getString());
    }
  }
  let chromeLogs: string = null;
  if (options[Opt.CHROME_LOGS].getString()) {
    if (path.isAbsolute(options[Opt.CHROME_LOGS].getString())) {
      chromeLogs = options[Opt.CHROME_LOGS].getString();
    } else {
      chromeLogs = path.resolve(Config.baseDir, options[Opt.CHROME_LOGS].getString());
    }
  }
  binaries[StandAlone.id].versionCustom = options[Opt.VERSIONS_STANDALONE].getString();
  binaries[ChromeDriver.id].versionCustom = options[Opt.VERSIONS_CHROME].getString();
  if (options[Opt.VERSIONS_IE]) {
    binaries[IEDriver.id].versionCustom = options[Opt.VERSIONS_IE].getString();
  }
  let downloadedBinaries = FileManager.downloadedBinaries(outputDir);

  if (downloadedBinaries[StandAlone.id] == null) {
    Logger.error(
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

  // log the command to launch selenium server
  let argsToString = '';
  for (let arg in args) {
    argsToString += ' ' + args[arg];
  }
  Logger.info('java' + argsToString);

  let seleniumProcess = spawnCommand('java', args);
  Logger.info('seleniumProcess.pid: ' + seleniumProcess.pid);
  seleniumProcess.on('exit', (code: number) => {
    Logger.info('Selenium Standalone has exited with code ' + code);
    process.exit(code);
  });
  process.stdin.resume();
  process.stdin.on('data', (chunk: Buffer) => {
    Logger.info('Attempting to shut down selenium nicely');
    http.get('http://localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer');
  });
  process.on('SIGINT', () => {
    Logger.info('Staying alive until the Selenium Standalone process exits');
  });
}

function spawnCommand(command: string, args?: string[]) {
  let osType = os.type();
  let windows: boolean = osType === 'Windows_NT';
  let winCommand = windows ? 'cmd' : command;
  let finalArgs: string[] = windows ? ['/c'].concat([command],args) : args;

  return childProcess.spawn(winCommand, finalArgs, {stdio: 'inherit'});
}
