import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as semver from 'semver';

import {AndroidSDK, Appium, ChromeDriver, GeckoDriver, IEDriver, Standalone} from '../binaries';
import {getValidSemver} from '../binaries/chrome_xml';
import {Logger, Options, Program} from '../cli';
import {Config} from '../config';
import {FileManager} from '../files';

import * as Opt from './';
import {Opts} from './opts';

let logger = new Logger('status');
let prog = new Program()
               .command('status', 'list the current available drivers')
               .addOption(Opts[Opt.OUT_DIR])
               .action(status);

export var program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'status-run') {
  prog.run(JSON.parse(JSON.stringify(argv)));
} else if (argv._[0] === 'status-help') {
  prog.printHelp();
}

/**
 * Parses the options and logs the status of the binaries downloaded.
 * @param options
 */
function status(options: Options) {
  let binaries = FileManager.setupBinaries();
  let outputDir = Config.getSeleniumDir();
  if (options[Opt.OUT_DIR].value) {
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
    logger.warn('the out_dir path ' + outputDir + ' does not exist');
    return;
  }

  // Try to get the update-config.json. This will be used for showing the last binary downloaded.
  let updateConfig: any = {};
  try {
    updateConfig =
        JSON.parse(fs.readFileSync(path.resolve(outputDir, 'update-config.json')).toString()) || {};
  } catch (err) {
    updateConfig = {};
  }

  let downloadedBinaries = FileManager.downloadedBinaries(outputDir);

  // Log which binaries have been downloaded.
  for (let bin in downloadedBinaries) {
    let downloaded = downloadedBinaries[bin];
    let log = downloaded.name + ' ';
    log += downloaded.versions.length == 1 ? 'version available: ' : 'versions available: ';

    // Get the "last" downloaded binary from the updateConfig.
    let last: string = null;
    if (downloaded.binary instanceof Appium && updateConfig[Appium.id]) {
      last = updateConfig[Appium.id]['last'];
    } else if (downloaded.binary instanceof AndroidSDK && updateConfig[AndroidSDK.id]) {
      last = updateConfig[AndroidSDK.id]['last'];
    } else if (downloaded.binary instanceof ChromeDriver && updateConfig[ChromeDriver.id]) {
      last = updateConfig[ChromeDriver.id]['last'];
    } else if (downloaded.binary instanceof GeckoDriver && updateConfig[GeckoDriver.id]) {
      last = updateConfig[GeckoDriver.id]['last'];
    } else if (downloaded.binary instanceof IEDriver && updateConfig[IEDriver.id]) {
      last = updateConfig[IEDriver.id]['last'];
    } else if (downloaded.binary instanceof Standalone && updateConfig[Standalone.id]) {
      last = updateConfig[Standalone.id]['last'];
    }

    // Sort the versions then log them:
    // - last: the last binary downloaded by webdriver-manager per the update-config.json
    downloaded.versions = downloaded.versions.sort((a: string, b: string): number => {
      if (!semver.valid(a)) {
        a = getValidSemver(a);
        b = getValidSemver(b);
      }
      if (semver.gt(a, b)) {
        return 1;
      } else {
        return 0;
      }
    });
    for (let ver in downloaded.versions) {
      let version = downloaded.versions[ver];
      log += version;
      if (last && last.indexOf(version) >= 0) {
        log += ' [last]'
      }
      if (+ver != downloaded.versions.length - 1) {
        log += ', ';
      }
    }
    logger.info(log);
  }
  // for binaries that are available for the operating system, show them here
  for (let bin in binaries) {
    if (downloadedBinaries[bin] == null) {
      logger.info(binaries[bin].name + ' is not present');
    }
  }
}
