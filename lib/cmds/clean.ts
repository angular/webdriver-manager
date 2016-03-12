import * as minimist from 'minimist';
import * as path from 'path';

import {Opts} from './opts';
import {Config} from '../config';
import {FileManager} from '../files';
import {Options, Program} from '../cli';

let prog = new Program()
                         .command('clean', 'removes all downloaded driver files from the out_dir')
                         .action(clean)
                         .addOption(Opts.outputDir);

export var program = prog;

// stand alone runner
let argv = minimist(process.argv.slice(2), prog.getMinimistOptions());
if (argv._[0] === 'clean-run') {
  program.run(argv);
} else if (argv._[0] === 'clean-help') {
  program.printHelp();
}

/**
 * Parses the options and cleans the output directory of binaries.
 * @param: options
 */
function clean(options: Options): void {
  let outputDir = Config.SELENIUM_DIR;
  if (options['out_dir'].getValue()) {
    if (path.isAbsolute(options['out_dir'].getValue())) {
      outputDir = options['out_dir'].getValue();
    } else {
      outputDir = path.resolve(Config.BASE_DIR, options['out_dir'].getValue());
    }
  }
  FileManager.removeExistingFiles(outputDir);
}
