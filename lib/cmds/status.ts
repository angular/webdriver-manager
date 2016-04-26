import * as minimist from 'minimist';
import * as path from 'path';

import {Opts} from './opts';
import * as Opt from './';
import {Config} from '../config';
import {FileManager} from '../files';
import {Logger, Options, Program} from '../cli';

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
  let downloadedBinaries = FileManager.downloadedBinaries(outputDir);
  // log which binaries have been downloaded
  for (let bin in downloadedBinaries) {
    let downloaded = downloadedBinaries[bin];
    let log = downloaded.name + ' ';
    log += downloaded.versions.length == 1 ? 'version available: ' : 'versions available: ';
    for (let ver in downloaded.versions) {
      let version = downloaded.versions[ver];
      log += version;
      if (downloaded.binary.versionDefault() === version) {
        log += ' [default]';
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
