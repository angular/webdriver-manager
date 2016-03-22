import * as minimist from 'minimist';
import * as path from 'path';

import {Opts} from './opts';
import {Config} from '../config';
import {FileManager} from '../files';
import {Options, Program} from '../cli';

let prog = new Program()
                         .command('status', 'list the current available drivers')
                         .addOption(Opts.outputDir)
                         .action(status);

export var program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'status-run') {
  prog.run(argv);
} else if (argv._[0] === 'status-help') {
  prog.printHelp();
}

/**
 * Parses the options and logs the status of the binaries downloaded.
 * @param options
 */
function status(options: Options) {
  let binaries = FileManager.setupBinaries();
  let outputDir = Config.seleniumDir;
  if (options['out_dir'].value) {
    if (path.isAbsolute(options['out_dir'].getString())) {
      outputDir = options['out_dir'].getString();
    } else {
      outputDir = path.resolve(Config.baseDir, options['out_dir'].getString());
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
    console.log(log);
  }
  // for binaries that are available for the operating system, show them here
  for (let bin in binaries) {
    if (downloadedBinaries[bin] == null) {
      console.log(binaries[bin].name + ' is not present');
    }
  }
}
