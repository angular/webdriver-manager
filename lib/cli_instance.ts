import {Cli} from './cli';
import * as clean from './cmds/clean';
import * as shutdown from './cmds/shutdown';
import * as start from './cmds/start';
import * as status from './cmds/status';
import * as update from './cmds/update';
import * as version from './cmds/version';

export let cli = new Cli()
                     .usage('webdriver-manager <command> [options]')
                     .program(clean.program)
                     .program(start.program)
                     .program(shutdown.program)
                     .program(status.program)
                     .program(update.program)
                     .program(version.program);
