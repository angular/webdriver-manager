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

var prog = new Program()
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
  let outputDir = Config.seleniumDir;
  if (options[Opt.OUT_DIR].getString()) {
    if (path.isAbsolute(options[Opt.OUT_DIR].getString())) {
      outputDir = options[Opt.OUT_DIR].getString();
    } else {
      outputDir = path.resolve(Config.baseDir, options[Opt.OUT_DIR].getString());
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

  // do the update
  if (standalone) {
    if (FileManager.toDownload(binaries[StandAlone.id], outputDir)) {
      Downloader.downloadBinary(binaries[StandAlone.id], outputDir);
    } else {
      Logger.info(binaries[StandAlone.id].name + ' ' + binaries[StandAlone.id].versionCustom + ' up to date');
    }
  }
  if (chrome) {
      if (FileManager.toDownload(binaries[ChromeDriver.id], outputDir)) {
        Downloader.downloadBinary(
            binaries[ChromeDriver.id], outputDir, proxy, ignoreSSL, unzip);
      } else {
        Logger.info(binaries[ChromeDriver.id].name + ' ' + binaries[ChromeDriver.id].versionCustom + ' up to date');
      }
  }
  if (ie) {
    if (FileManager.toDownload(binaries[IEDriver.id], outputDir)) {
      Downloader.downloadBinary(
          binaries[IEDriver.id], outputDir, proxy, ignoreSSL, unzip);
    } else {
      Logger.info(binaries[IEDriver.id].name + ' ' + binaries[StandAlone.id].versionCustom + ' up to date');
    }
  }
  if (ie32) {
    if (FileManager.toDownload(binaries[IEDriver.id], outputDir)) {
      Downloader.downloadBinary(
          binaries[IEDriver.id], outputDir, proxy, ignoreSSL, unzip);
    } else {
      Logger.info(binaries[IEDriver.id].name + ' 32-bit ' + binaries[StandAlone.id].versionCustom + ' up to date');
    }
  }
}

function unzip<T extends Binary>(binary: T, outputDir: string, filename: string): void {
  let zip = new AdmZip(filename);
  let osType = os.type();
  zip.extractAllTo(outputDir, true);
  let mv =
      path.join(outputDir, binary.prefix() + binary.version() + binary.executableSuffix(osType));
  fs.renameSync(path.join(outputDir, binary.name + binary.executableSuffix(osType)), mv);
  if (osType !== 'Windows_NT') {
    fs.chmodSync(mv, '0755');
  }
}
