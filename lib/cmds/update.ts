import * as AdmZip from 'adm-zip';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as q from 'q';
import * as rimraf from 'rimraf';

import {AndroidSDK, Appium, Binary, ChromeDriver, GeckoDriver, IEDriver, Standalone} from '../binaries';
import {Logger, Options, Program} from '../cli';
import {Config} from '../config';
import {Downloader, FileManager} from '../files';
import {HttpUtils} from '../http_utils';
import {spawn} from '../utils';

import * as Opt from './';
import {android as initializeAndroid, iOS as checkIOS} from './initialize';
import {Opts} from './opts';

Config.runCommand = 'update';

let logger = new Logger('update');
let prog = new Program()
               .command('update', 'install or update selected binaries')
               .action(update)
               .addOption(Opts[Opt.OUT_DIR])
               .addOption(Opts[Opt.VERBOSE])
               .addOption(Opts[Opt.IGNORE_SSL])
               .addOption(Opts[Opt.PROXY])
               .addOption(Opts[Opt.ALTERNATE_CDN])
               .addOption(Opts[Opt.STANDALONE])
               .addOption(Opts[Opt.CHROME])
               .addOption(Opts[Opt.GECKO])
               .addOption(Opts[Opt.ANDROID])
               .addOption(Opts[Opt.ANDROID_API_LEVELS])
               .addOption(Opts[Opt.ANDROID_ARCHITECTURES])
               .addOption(Opts[Opt.ANDROID_PLATFORMS])
               .addOption(Opts[Opt.ANDROID_ACCEPT_LICENSES]);

if (Config.osType() === 'Darwin') {
  prog.addOption(Opts[Opt.IOS]);
}

if (Config.osType() === 'Windows_NT') {
  prog.addOption(Opts[Opt.IE]).addOption(Opts[Opt.IE32]).addOption(Opts[Opt.IE64]);
}

prog.addOption(Opts[Opt.VERSIONS_STANDALONE])
    .addOption(Opts[Opt.VERSIONS_CHROME])
    .addOption(Opts[Opt.VERSIONS_APPIUM])
    .addOption(Opts[Opt.VERSIONS_ANDROID])
    .addOption(Opts[Opt.VERSIONS_GECKO]);

if (Config.osType() === 'Windows_NT') {
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

let browserFile: BrowserFile;

/**
 * Parses the options and downloads binaries if they do not exist.
 * @param options
 */
function update(options: Options): Promise<void> {
  let promises: q.IPromise<void>[] = [];
  let standalone = options[Opt.STANDALONE].getBoolean();
  let chrome = options[Opt.CHROME].getBoolean();
  let gecko = options[Opt.GECKO].getBoolean();
  let ie32: boolean = false;
  let ie64: boolean = false;
  if (options[Opt.IE]) {
    ie32 = ie32 || options[Opt.IE].getBoolean();
  }
  if (options[Opt.IE32]) {
    ie32 = ie32 || options[Opt.IE32].getBoolean();
  }
  if (options[Opt.IE64]) {
    ie64 = options[Opt.IE64].getBoolean();
  }
  let android: boolean = options[Opt.ANDROID].getBoolean();
  let ios: boolean = false;
  if (options[Opt.IOS]) {
    ios = options[Opt.IOS].getBoolean();
  }
  let outputDir = options[Opt.OUT_DIR].getString();

  try {
    browserFile =
        JSON.parse(fs.readFileSync(path.resolve(outputDir, 'update-config.json')).toString());
  } catch (err) {
    browserFile = {};
  }

  let android_api_levels: string[] = options[Opt.ANDROID_API_LEVELS].getString().split(',');
  let android_architectures: string[] = options[Opt.ANDROID_ARCHITECTURES].getString().split(',');
  let android_platforms: string[] = options[Opt.ANDROID_PLATFORMS].getString().split(',');
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
  HttpUtils.assignOptions({ignoreSSL, proxy});
  let verbose = options[Opt.VERBOSE].getBoolean();

  // setup versions for binaries
  let binaries = FileManager.setupBinaries(options[Opt.ALTERNATE_CDN].getString());
  binaries[Standalone.id].versionCustom = options[Opt.VERSIONS_STANDALONE].getString();
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
    let binary: Standalone = binaries[Standalone.id];
    promises.push(FileManager.downloadFile(binary, outputDir)
                      .then<void>((downloaded: boolean) => {
                        if (!downloaded) {
                          logger.info(
                              binary.name + ': file exists ' +
                              path.resolve(outputDir, binary.filename()));
                          logger.info(binary.name + ': ' + binary.filename() + ' up to date');
                        }
                      })
                      .then(() => {
                        updateBrowserFile(binary, outputDir);
                      }));
  }
  if (chrome) {
    let binary: ChromeDriver = binaries[ChromeDriver.id];
    promises.push(updateBinary(binary, outputDir, proxy, ignoreSSL).then(() => {
      return Promise.resolve(updateBrowserFile(binary, outputDir));
    }));
  }
  if (gecko) {
    let binary: GeckoDriver = binaries[GeckoDriver.id];
    promises.push(updateBinary(binary, outputDir, proxy, ignoreSSL).then(() => {
      return Promise.resolve(updateBrowserFile(binary, outputDir));
    }));
  }
  if (ie64) {
    let binary: IEDriver = binaries[IEDriver.id];
    binary.osarch = Config.osArch();  // Win32 or x64
    promises.push(updateBinary(binary, outputDir, proxy, ignoreSSL).then(() => {
      return Promise.resolve(updateBrowserFile(binary, outputDir));
    }));
  }
  if (ie32) {
    let binary: IEDriver = binaries[IEDriver.id];
    binary.osarch = 'Win32';
    promises.push(updateBinary(binary, outputDir, proxy, ignoreSSL).then(() => {
      return Promise.resolve(updateBrowserFile(binary, outputDir));
    }));
  }
  if (android) {
    let binary = binaries[AndroidSDK.id];
    let sdk_path = path.resolve(outputDir, binary.executableFilename());
    let oldAVDList: string;

    updateBrowserFile(binary, outputDir);
    promises.push(q.nfcall(fs.readFile, path.resolve(sdk_path, 'available_avds.json'))
                      .then(
                          (oldAVDs: string) => {
                            oldAVDList = oldAVDs;
                          },
                          () => {
                            oldAVDList = '[]';
                          })
                      .then(() => {
                        return updateBinary(binary, outputDir, proxy, ignoreSSL);
                      })
                      .then<void>(() => {
                        initializeAndroid(
                            path.resolve(outputDir, binary.executableFilename()),
                            android_api_levels, android_architectures, android_platforms,
                            android_accept_licenses, binaries[AndroidSDK.id].versionCustom,
                            JSON.parse(oldAVDList), logger, verbose);
                      }));
  }
  if (ios) {
    checkIOS(logger);
  }
  if (android || ios) {
    installAppium(binaries[Appium.id], outputDir);
    updateBrowserFile(binaries[Appium.id], outputDir);
  }

  return Promise.all(promises).then(() => {
    writeBrowserFile(outputDir);
  });
}

function updateBinary<T extends Binary>(
    binary: T, outputDir: string, proxy: string, ignoreSSL: boolean): Promise<void> {
  return FileManager
      .downloadFile(
          binary, outputDir,
          (binary: Binary, outputDir: string, fileName: string) => {
            unzip(binary, outputDir, fileName);
          })
      .then<void>(downloaded => {
        if (!downloaded) {
          // The file did not have to download, we should unzip it.
          logger.info(binary.name + ': file exists ' + path.resolve(outputDir, binary.filename()));
          let fileName = binary.filename();
          unzip(binary, outputDir, fileName);
          logger.info(binary.name + ': ' + binary.executableFilename() + ' up to date');
        }
      });
}

function unzip<T extends Binary>(binary: T, outputDir: string, fileName: string): void {
  // remove the previously saved file and unzip it
  let osType = Config.osType();
  let mv = path.resolve(outputDir, binary.executableFilename());
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
    try {
      let zip = new AdmZip(path.resolve(outputDir, fileName));
      zip.extractAllTo(outputDir, true);
    } catch (e) {
      throw new Error(`Invalid filename: ${path.resolve(outputDir, fileName)}`)
    }
  } else {
    // We will only ever get .tar files on linux
    child_process.spawnSync('tar', ['zxvf', path.resolve(outputDir, fileName), '-C', outputDir]);
  }

  // rename
  fs.renameSync(path.resolve(outputDir, binary.zipContentName()), mv);

  // set permissions
  if (osType !== 'Windows_NT') {
    logger.info(binary.name + ': setting permissions to 0755 for ' + mv);
    if (binary.id() !== AndroidSDK.id) {
      fs.chmodSync(mv, '0755');
    } else {
      fs.chmodSync(path.resolve(mv, 'tools', 'android'), '0755');
      fs.chmodSync(path.resolve(mv, 'tools', 'emulator'), '0755');
      // TODO(sjelin): get 64 bit versions working
    }
  }
}

function installAppium(binary: Binary, outputDir: string): void {
  logger.info('appium: installing appium');

  let folder = path.resolve(outputDir, binary.filename());
  try {
    rimraf.sync(folder);
  } catch (err) {
  }

  fs.mkdirSync(folder);
  fs.writeFileSync(
      path.resolve(folder, 'package.json'), JSON.stringify({scripts: {appium: 'appium'}}));
  spawn('npm', ['install', 'appium@' + binary.version()], null, {cwd: folder});
}

interface BinaryPath {
  last?: string, all?: string[]
}

interface BrowserFile {
  chrome?: BinaryPath, standalone?: BinaryPath, gecko?: BinaryPath, iedriver?: BinaryPath
}

function updateBrowserFile<T extends Binary>(binary: T, outputDir: string) {
  let currentDownload = path.resolve(outputDir, binary.executableFilename());

  // if browserFile[id] exists, we should update it
  if ((browserFile as any)[binary.id()]) {
    let binaryPath: BinaryPath = (browserFile as any)[binary.id()];
    if (binaryPath.last === currentDownload) {
      return;
    } else {
      binaryPath.last = currentDownload;
      for (let bin of binaryPath.all) {
        if (bin === currentDownload) {
          return;
        }
      }
      binaryPath.all.push(currentDownload);
    }
  } else {
    // The browserFile[id] does not exist / has not been downloaded previously.
    // We should create the entry.
    let binaryPath: BinaryPath = {last: currentDownload, all: [currentDownload]};
    (browserFile as any)[binary.id()] = binaryPath;
  }
}

function writeBrowserFile(outputDir: string) {
  let filePath = path.resolve(outputDir, 'update-config.json');
  fs.writeFileSync(filePath, JSON.stringify(browserFile));
}

// for testing
export function clearBrowserFile() {
  browserFile = {};
}
