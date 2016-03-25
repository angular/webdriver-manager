import * as minimist from 'minimist';
import * as path from 'path';
import * as os from 'os';
import * as childProcess from 'child_process';
import * as http from 'http';

import {Opts} from './opts';
import {Config} from '../config';
import {FileManager} from '../files';
import {Options, Program} from '../cli';
import {BinaryMap, ChromeDriver, IEDriver, StandAlone} from '../binaries';

let prog = new Program()
    .command('start', 'start up the selenium server')
    .action(start)
    .addOption(Opts.outputDir)
    .addOption(Opts.seleniumPort)
    .addOption(Opts.versionsStandAlone)
    .addOption(Opts.versionsChrome)
    .addOption(Opts.chromeLogs);

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts.versionsIe);
}

export var program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'start-run') {
  prog.run(argv);
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
  let seleniumPort = options['seleniumPort'].getString();
  let outputDir = Config.seleniumDir;
  if (options['out_dir'].getString()) {
    if (path.isAbsolute(options['out_dir'].getString())) {
      outputDir = options['out_dir'].getString();
    } else {
      outputDir = path.resolve(Config.baseDir, options['out_dir'].getString());
    }
  }
  let chromeLogs: string = null;
  if (options['chrome_logs'].getString()) {
    if (path.isAbsolute(options['chrome_logs'].getString())) {
      chromeLogs = options['chrome_logs'].getString();
    } else {
      chromeLogs = path.resolve(Config.baseDir, options['chrome_logs'].getString());
    }
  }
  binaries[StandAlone.id].versionCustom = options['versions_standalone'].getString();
  binaries[ChromeDriver.id].versionCustom = options['versions_chrome'].getString();
  if (options['versions_ie']) {
    binaries[IEDriver.id].versionCustom = options['versions_ie'].getString();
  }
  let downloadedBinaries = FileManager.downloadedBinaries(outputDir);

  if (downloadedBinaries[StandAlone.id] == null) {
    console.error(
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
  console.log('java' + argsToString);

  let seleniumProcess = spawnCommand('java', args);
  console.log('seleniumProcess.pid: ' + seleniumProcess.pid);
  seleniumProcess.on('exit', (code: number) => {
    console.log('Selenium Standalone has exited with code ' + code);
    process.exit(code);
  });
  process.stdin.resume();
  process.stdin.on('data', (chunk: Buffer) => {
    console.log('Attempting to shut down selenium nicely');
    http.get('http://localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer');
  });
  process.on('SIGINT', () => {
    console.log('Staying alive until the Selenium Standalone process exits');
  });
}

function spawnCommand(command: string, args?: string[]) {
  let osType = os.type();
  let windows: boolean = osType === 'Windows_NT';
  let winCommand = windows ? 'cmd' : command;
  let finalArgs: string[] = windows ? ['/c'].concat([command],args) : args;

  return childProcess.spawn(winCommand, finalArgs, {stdio: 'inherit'});
}
