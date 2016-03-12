import * as AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as os from 'os';
import * as path from 'path';

import {Opts} from './opts';
import {Config} from '../config';
import {Binary, ChromeDriver, IEDriver, StandAlone} from '../binaries';
import {FileManager, Downloader} from '../files';
import {Options, Program} from '../cli';

var prog = new Program()
    .command('update', 'install or update selected binaries')
    .action(update)
    .addOption(Opts.outputDir)
    .addOption(Opts.ignoreSsl)
    .addOption(Opts.proxy)
    .addOption(Opts.alternateCdn)
    .addOption(Opts.standalone)
    .addOption(Opts.chrome);

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts.ie).addOption(Opts.ie32);
}

prog
  .addOption(Opts.versionsStandAlone)
  .addOption(Opts.versionsChrome);

if (os.type() === 'Windows_NT') {
  prog.addOption(Opts.versionsIe);
}
export var program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'update-run') {
  program.run(argv);
} else if (argv._[0] === 'update-help') {
  program.printHelp();
}

/**
 * Parses the options and downloads binaries if they do not exist.
 * @param options
 */
function update(options: Options): void {
  let standalone = options['standalone'].getValue() != undefined;
  let chrome = options['chrome'].getValue() != undefined;
  let ie: boolean = false;
  let ie32: boolean = false;
  if (options['ie']) {
    ie = options['ie'].getValue() != undefined;
  }
  if (options['ie32']) {
    ie32 = options['ie32'].getValue() != undefined;
  }
  let outputDir = Config.SELENIUM_DIR;
  if (options['out_dir'].getValue()) {
    if (path.isAbsolute(options['out_dir'].getValue())) {
      outputDir = options['out_dir'].getValue();
    } else {
      outputDir = path.resolve(Config.BASE_DIR, options['out_dir'].getValue());
    }
  }
  let ignoreSSL = options['ignore_ssl'].getValue() != undefined;
  let proxy = options['proxy'].getValue();

  // setup versions for binaries
  let binaries = FileManager.setupBinaries();
  binaries[StandAlone.id].versionCustom = options['versions_standalone'].getValue();
  binaries[ChromeDriver.id].versionCustom = options['versions_chrome'].getValue();
  if (options['versions_ie']) {
    binaries[IEDriver.id].versionCustom = options['versions.ie'].getValue();
  }

  // do the update
  if (standalone) {
    if (FileManager.toDownload(binaries[StandAlone.id], outputDir)) {
      Downloader.downloadBinary(binaries[StandAlone.id], outputDir);
    } else {
      console.log(binaries[StandAlone.id].name + ' ' + binaries[StandAlone.id].versionCustom + ' up to date');
    }
  }
  if (chrome) {
      if (FileManager.toDownload(binaries[ChromeDriver.id], outputDir)) {
        Downloader.downloadBinary(
            binaries[ChromeDriver.id], outputDir, proxy, ignoreSSL, unzip);
      } else {
        console.log(binaries[ChromeDriver.id].name + ' ' + binaries[ChromeDriver.id].versionCustom + ' up to date');
      }
  }
  if (ie) {
    if (FileManager.toDownload(binaries[IEDriver.id], outputDir)) {
      Downloader.downloadBinary(
          binaries[IEDriver.id], outputDir, proxy, ignoreSSL, unzip);
    } else {
      console.log(binaries[IEDriver.id].name + ' ' + binaries[StandAlone.id].versionCustom + ' up to date');
    }
  }
  if (ie32) {
    if (FileManager.toDownload(binaries[IEDriver.id], outputDir)) {
      Downloader.downloadBinary(
          binaries[IEDriver.id], outputDir, proxy, ignoreSSL, unzip);
    } else {
      console.log(binaries[IEDriver.id].name + ' 32-bit ' + binaries[StandAlone.id].versionCustom + ' up to date');
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
}
