import * as AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as os from 'os';
import * as path from 'path';

import {Opts} from './opts';
import * as Opt from './';
import {Config} from '../config';
import {Binary, ChromeDriver, IEDriver, StandAlone} from '../binaries';
import {FileManager, Downloader} from '../files';
import {Logger, Options, Program} from '../cli';

let logger = new Logger('update');
let prog = new Program()
    .command('update', 'install or update selected binaries')
    .action(update)
    .addOption(Opts[Opt.OUT_DIR])
    .addOption(Opts[Opt.IGNORE_SSL])
    .addOption(Opts[Opt.PROXY])
    .addOption(Opts[Opt.ALTERNATE_CDN])
    .addOption(Opts[Opt.STANDALONE])
    .addOption(Opts[Opt.CHROME]);

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts[Opt.IE]).addOption(Opts[Opt.IE32]);
}

prog
  .addOption(Opts[Opt.VERSIONS_STANDALONE])
  .addOption(Opts[Opt.VERSIONS_CHROME]);

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts[Opt.VERSIONS_IE]);
}
export var program = prog;

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
  let ie: boolean = false;
  let ie32: boolean = false;
  if (options[Opt.IE]) {
    ie = options[Opt.IE].getBoolean();
  }
  if (options[Opt.IE32]) {
    ie32 = options[Opt.IE32].getBoolean();
  }
  let outputDir = Config.getSeleniumDir();
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
  let binaries = FileManager.setupBinaries();
  binaries[StandAlone.id].versionCustom = options[Opt.VERSIONS_STANDALONE].getString();
  binaries[ChromeDriver.id].versionCustom = options[Opt.VERSIONS_CHROME].getString();
  if (options[Opt.VERSIONS_IE]) {
    binaries[IEDriver.id].versionCustom = options[Opt.VERSIONS_IE].getString();
  }

  // if the file has not been completely downloaded, download it
  // else if the file has already been downloaded, unzip the file, rename it, and give it permissions
  if (standalone) {
    let binary = binaries[StandAlone.id];
    FileManager.toDownload(binary, outputDir).then((value: boolean) => {
      if (value) {
        Downloader.downloadBinary(binary, outputDir);
      } else {
        logger.info(binary.name + ': file exists ' + path.resolve(outputDir, binary.filename(os.type(), os.arch())));
        logger.info(binary.name + ': v' + binary.versionCustom + ' up to date');
      }
    });
  }
  if (chrome) {
    let binary = binaries[ChromeDriver.id];
    updateBinary(binary, outputDir, proxy, ignoreSSL);
  }
  if (ie) {
    let binary = binaries[IEDriver.id];
    binary.arch = os.arch(); // Win32 or x64
    updateBinary(binary, outputDir, proxy, ignoreSSL);
  }
  if (ie32) {
    let binary = binaries[IEDriver.id];
    binary.arch = 'Win32';
    updateBinary(binary, outputDir, proxy, ignoreSSL);
  }
}

function updateBinary(binary: Binary, outputDir: string, proxy: string, ignoreSSL: boolean) {
  FileManager.toDownload(binary, outputDir).then((value: boolean) => {
    if (value) {
      Downloader.downloadBinary(binary, outputDir, proxy, ignoreSSL, unzip);
    } else {
      logger.info(binary.name + ': file exists ' + path.resolve(outputDir, binary.filename(os.type(), os.arch())));
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
  } catch(err) {}

  // unzip the file
  logger.info(binary.name + ': unzipping ' + fileName);
  let zip = new AdmZip(path.resolve(outputDir, fileName));
  zip.extractAllTo(outputDir, true);

  // rename
  fs.renameSync(path.join(outputDir, binary.name + binary.executableSuffix(osType)), mv);

  // set permissions
  if (osType !== 'Windows_NT') {
    logger.info(binary.name + ': setting permissions to 0755 for ' + mv);
    fs.chmodSync(mv, '0755');
  }
}
