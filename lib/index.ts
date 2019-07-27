// Exports when using this module as a dependency.

// Expose the loglevel api.
import * as loglevel from 'loglevel';
export let setLogLevel = loglevel.getLogger('webdriver-manager').setLevel;

// Export commands used in the cli.
export {clean} from './cmds/clean';
// Options that are used by the exported commands.
export {Options} from './cmds/options';
export {shutdown} from './cmds/shutdown';
export {start} from './cmds/start';
export {status} from './cmds/status';
export {update} from './cmds/update';
export {ChromeDriver} from './provider/chromedriver';
export {Chromium} from './provider/chromium';
export {GeckoDriver} from './provider/geckodriver';
export {IEDriver} from './provider/iedriver';
export {ProviderConfig, ProviderInterface} from './provider/provider';
export {SeleniumServer} from './provider/selenium_server';
