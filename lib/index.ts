// Exports when using this module as a dependency.
export { ChromeDriver } from './provider/chromedriver';
export { GeckoDriver } from './provider/geckodriver';
export { IEDriver } from './provider/iedriver';
export { ProviderInterface, ProviderConfig } from './provider/provider';
export { SeleniumServer } from './provider/selenium_server';

// Export commands used in the cli.
export { clean } from './cmds/clean';
export { shutdown } from './cmds/shutdown';
export { start } from './cmds/start';
export { status } from './cmds/status';
export { update } from './cmds/update';

// Options that are used by the exported commands.
export { Options } from './cmds/options';
export { initOptions, Provider } from './cmds/utils';

// Expose the loglevel api.
export { setLevel as setLogLevel } from 'loglevel';