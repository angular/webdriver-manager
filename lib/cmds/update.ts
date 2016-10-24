import * as AdmZip from 'adm-zip';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as os from 'os';
import * as path from 'path';
import * as q from 'q';
import * as rimraf from 'rimraf';

import {AndroidSDK, Appium, Binary, ChromeDriver, GeckoDriver, IEDriver, StandAlone} from '../binaries';
import {Logger, Options, Program} from '../cli';
import {Config} from '../config';
import {Downloader, FileManager} from '../files';

import * as Opt from './';
import {android as initializeAndroid, iOS as checkIOS} from './initialize';
import {Opts} from './opts';

let logger = new Logger('update');
let prog = new Program()
               .command('update', 'install or update selected binaries')
               .action(update)
               .addOption(Opts[Opt.OUT_DIR])
               .addOption(Opts[Opt.IGNORE_SSL])
               .addOption(Opts[Opt.PROXY])
               .addOption(Opts[Opt.ALTERNATE_CDN])
               .addOption(Opts[Opt.STANDALONE])
               .addOption(Opts[Opt.CHROME])
               .addOption(Opts[Opt.ANDROID])
               .addOption(Opts[Opt.ANDROID_API_LEVELS])
               .addOption(Opts[Opt.ANDROID_ABIS])
               .addOption(Opts[Opt.ANDROID_ACCEPT_LICENSES]);

if (GeckoDriver.supports(os.type(), os.arch())) {
  prog.addOption(Opts[Opt.VERSIONS_GECKO]).addOption(Opts[Opt.GECKO]);
}

if (os.type() === 'Darwin') {
  prog.addOption(Opts[Opt.IOS]);
}

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts[Opt.IE]).addOption(Opts[Opt.IE32]);
}

prog.addOption(Opts[Opt.VERSIONS_STANDALONE])
    .addOption(Opts[Opt.VERSIONS_CHROME])
    .addOption(Opts[Opt.VERSIONS_APPIUM])
    .addOption(Opts[Opt.VERSIONS_ANDROID]);

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts[Opt.VERSIONS_IE]);
}
export let program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'update-run') {
  prog.run(JSON.parse(JSON.stringify(argv)));
} else if (argv._[0] === 'update-help') {
  prog.printHelp();
}


/**
 * Parses the options and downloads binaries if they do not exist.
 * @param options
 */
function update(options: Options): void {
  let standalone = options[Opt.STANDALONE].getBoolean();
  let chrome = options[Opt.CHROME].getBoolean();
  let gecko = false;
  if (GeckoDriver.supports(os.type(), os.arch())) {
    gecko = options[Opt.GECKO].getBoolean();
  }
  let ie: boolean = false;
  let ie32: boolean = false;
  if (options[Opt.IE]) {
    ie = options[Opt.IE].getBoolean();
  }
  if (options[Opt.IE32]) {
    ie32 = options[Opt.IE32].getBoolean();
  }
  let android: boolean = options[Opt.ANDROID].getBoolean();
  let ios: boolean = false;
  if (options[Opt.IOS]) {
    ios = options[Opt.IOS].getBoolean();
  }
  let outputDir = Config.getSeleniumDir();
  let android_api_levels: string[] = options[Opt.ANDROID_API_LEVELS].getString().split(',');
  let android_abis: string[] = options[Opt.ANDROID_ABIS].getString().split(',');
  let android_accept_licenses: boolean = options[Opt.ANDROID_ACCEPT_LICENSES].getBoolean();
  if (options[Opt.OUT_DIR].getString()) {
    if (path.isAbsolute(options[Opt.OUT_DIR].getString())) {
      outputDir = options[Opt.OUT_DIR].getString();
    } else {
      outputDir = path.resolve(Config.getBaseDir(), options[Opt.OUT_DIR].getString());
    }
    FileManager.makeOutputDirectory(outputDir);
  }
  let ignoreSSL = options[Opt.IGNORE_SSL].getBoolean();
  let proxy = options[Opt.PROXY].getString();

  // setup versions for binaries
  let binaries = FileManager.setupBinaries(options[Opt.ALTERNATE_CDN].getString());
  binaries[StandAlone.id].versionCustom = options[Opt.VERSIONS_STANDALONE].getString();
  binaries[ChromeDriver.id].versionCustom = options[Opt.VERSIONS_CHROME].getString();
  if (options[Opt.VERSIONS_IE]) {
    binaries[IEDriver.id].versionCustom = options[Opt.VERSIONS_IE].getString();
  }
  if (options[Opt.VERSIONS_GECKO]) {
    binaries[GeckoDriver.id].versionCustom = options[Opt.VERSIONS_GECKO].getString();
  }
  binaries[AndroidSDK.id].versionCustom = options[Opt.VERSIONS_ANDROID].getString();
  binaries[Appium.id].versionCustom = options[Opt.VERSIONS_APPIUM].getString();

  // if the file has not been completely downloaded, download it
  // else if the file has already been downloaded, unzip the file, rename it, and give it
  // permissions
  if (standalone) {
    let binary = binaries[StandAlone.id];
    FileManager.toDownload(binary, outputDir, proxy, ignoreSSL).then((value: boolean) => {
      if (value) {
        Downloader.downloadBinary(binary, outputDir, proxy, ignoreSSL);
      } else {
        logger.info(
            binary.name + ': file exists ' +
            path.resolve(outputDir, binary.filename(os.type(), os.arch())));
        logger.info(binary.name + ': v' + binary.versionCustom + ' up to date');
      }
    });
  }
  if (chrome) {
    let binary = binaries[ChromeDriver.id];
    updateBinary(binary, outputDir, proxy, ignoreSSL);
  }
  if (gecko) {
    let binary = binaries[GeckoDriver.id];
    updateBinary(binary, outputDir, proxy, ignoreSSL);
  }
  if (ie) {
    let binary = binaries[IEDriver.id];
    binary.arch = os.arch();  // Win32 or x64
    updateBinary(binary, outputDir, proxy, ignoreSSL);
  }
  if (ie32) {
    let binary = binaries[IEDriver.id];
    binary.arch = 'Win32';
    updateBinary(binary, outputDir, proxy, ignoreSSL);
  }
  if (android) {
    let binary = binaries[AndroidSDK.id];
    let sdk_path = path.join(outputDir, binary.executableFilename(os.type()));

    updateBinary(binary, outputDir, proxy, ignoreSSL).then(() => {
      initializeAndroid(
          path.join(outputDir, binary.executableFilename(os.type())), android_api_levels,
          android_abis, android_accept_licenses, binaries[AndroidSDK.id].versionCustom, logger);
    });
  }
  if (ios) {
    checkIOS(logger);
  }
  if (android || ios) {
    installAppium(binaries[Appium.id], outputDir);
  }
}

function updateBinary(
    binary: Binary, outputDir: string, proxy: string, ignoreSSL: boolean): q.Promise<any> {
  return FileManager.toDownload(binary, outputDir, proxy, ignoreSSL).then((value: boolean) => {
    if (value) {
      let deferred = q.defer();
      Downloader.downloadBinary(
          binary, outputDir, proxy, ignoreSSL,
          (binary: Binary, outputDir: string, fileName: string) => {
            unzip(binary, outputDir, fileName);
            deferred.resolve();
          });
      return deferred.promise;
    } else {
      logger.info(
          binary.name + ': file exists ' +
          path.resolve(outputDir, binary.filename(os.type(), os.arch())));
      let fileName = binary.filename(os.type(), os.arch());
      unzip(binary, outputDir, fileName);
      logger.info(binary.name + ': v' + binary.versionCustom + ' up to date');
    }
  });
}

function unzip<T extends Binary>(binary: T, outputDir: string, fileName: string): void {
  // remove the previously saved file and unzip it
  let osType = os.type();
  let mv = path.join(outputDir, binary.executableFilename(osType));
  try {
    fs.unlinkSync(mv);
  } catch (err) {
    try {
      rimraf.sync(mv);
    } catch (err2) {
    }
  }

  // unzip the file
  logger.info(binary.name + ': unzipping ' + fileName);
  if (fileName.slice(-4) == '.zip') {
    let zip = new AdmZip(path.resolve(outputDir, fileName));
    zip.extractAllTo(outputDir, true);
  } else {
    // We will only ever get .tar files on linux
    child_process.spawnSync('tar', ['zxvf', path.resolve(outputDir, fileName), '-C', outputDir]);
  }

  // rename
  fs.renameSync(path.join(outputDir, binary.zipContentName(osType)), mv);

  // set permissions
  if (osType !== 'Windows_NT') {
    logger.info(binary.name + ': setting permissions to 0755 for ' + mv);
    if (binary.id() !== AndroidSDK.id) {
      fs.chmodSync(mv, '0755');
    } else {
      fs.chmodSync(path.join(mv, 'tools', 'android'), '0755');
      fs.chmodSync(path.join(mv, 'tools', 'emulator'), '0755');
      // TODO(sjelin): get 64 bit versions working
    }
  }
}

function installAppium(binary: Binary, outputDir: string): void {
  logger.info('appium: installing appium');

  let folder = path.join(outputDir, binary.filename());
  try {
    rimraf.sync(folder);
  } catch (err) {
  }

  fs.mkdirSync(folder);
  fs.writeFileSync(path.join(folder, 'package.json'), '{}');
  child_process.spawn('npm', ['install', 'appium@' + binary.version()], {cwd: folder});
}
