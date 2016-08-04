import * as minimist from 'minimist';
import * as path from 'path';

import {Options, Program} from '../cli';
import {Config} from '../config';
import {FileManager} from '../files';

import * as Opt from './';
import {Opts} from './opts';

let prog = new Program()
               .command('clean', 'removes all downloaded driver files from the out_dir')
               .action(clean)
               .addOption(Opts[Opt.OUT_DIR]);

export var program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'clean-run') {
  prog.run(JSON.parse(JSON.stringify(argv)));
} else if (argv._[0] === 'clean-help') {
  prog.printHelp();
}

/**
 * Parses the options and cleans the output directory of binaries.
 * @param: options
 */
function clean(options: Options): void {
  let outputDir = Config.getSeleniumDir();
  if (options[Opt.OUT_DIR].getString()) {
    if (path.isAbsolute(options[Opt.OUT_DIR].getString())) {
      outputDir = options[Opt.OUT_DIR].getString();
    } else {
      outputDir = path.resolve(Config.getBaseDir(), options[Opt.OUT_DIR].getString());
    }
  }
  FileManager.removeExistingFiles(outputDir);
}
