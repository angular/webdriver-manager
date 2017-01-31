import {AndroidSDK, Appium, ChromeDriver, GeckoDriver, IEDriver, Standalone} from '../binaries';
import {Cli, Option, Options} from '../cli';
import {Config} from '../config';

export const OUT_DIR = 'out_dir';
export const SELENIUM_PORT = 'seleniumPort';
export const APPIUM_PORT = 'appium-port';
export const AVD_PORT = 'avd-port';
export const IGNORE_SSL = 'ignore_ssl';
export const PROXY = 'proxy';
export const ALTERNATE_CDN = 'alternate_cdn';
export const STANDALONE = 'standalone';
export const CHROME = 'chrome';
export const IE = 'ie';
export const IE32 = 'ie32';
export const IE64 = 'ie64';
export const EDGE = 'edge';
export const GECKO = 'gecko';
export const ANDROID = 'android';
export const IOS = 'ios';
export const VERSIONS_CHROME = 'versions.chrome';
export const VERSIONS_GECKO = 'versions.gecko';
export const VERSIONS_STANDALONE = 'versions.standalone';
export const VERSIONS_IE = 'versions.ie';
export const VERSIONS_ANDROID = 'versions.android';
export const VERSIONS_APPIUM = 'versions.appium';
export const CHROME_LOGS = 'chrome_logs';
export const LOGGING = 'logging';
export const ANDROID_API_LEVELS = 'android-api-levels';
export const ANDROID_ARCHITECTURES = 'android-archs';
export const ANDROID_PLATFORMS = 'android-platorms';
export const ANDROID_ACCEPT_LICENSES = 'android-accept-licenses';
export const AVDS = 'avds';
export const AVD_USE_SNAPSHOTS = 'avd-use-snapshots';
export const STARTED_SIGNIFIER = 'started-signifier';
export const SIGNAL_VIA_IPC = 'signal-via-ipc';
export const DETACH = 'detach';
export const QUIET = 'quiet';
export const VERBOSE = 'verbose';
export const ALREADY_OFF_ERROR = 'already-off-error';

/**
 * The options used by the commands.
 */
var opts: Options = {};
opts[OUT_DIR] = new Option(OUT_DIR, 'Location to output/expect', 'string', Config.getSeleniumDir());
opts[SELENIUM_PORT] =
    new Option(SELENIUM_PORT, 'Optional port for the selenium standalone server', 'string', '4444');
opts[APPIUM_PORT] =
    new Option(APPIUM_PORT, 'Optional port for the appium server', 'string', '4723');
opts[AVD_PORT] = new Option(
    AVD_PORT, 'Optional port for android virtual devices.  See mobile.md for details', 'number',
    5554);
opts[IGNORE_SSL] = new Option(IGNORE_SSL, 'Ignore SSL certificates', 'boolean', false);
opts[PROXY] = new Option(PROXY, 'Proxy to use for the install or update command', 'string');
opts[ALTERNATE_CDN] = new Option(ALTERNATE_CDN, 'Alternate CDN to binaries', 'string');
opts[STANDALONE] = new Option(
    STANDALONE, 'Install or update selenium standalone', 'boolean', Standalone.isDefault);
opts[CHROME] =
    new Option(CHROME, 'Install or update chromedriver', 'boolean', ChromeDriver.isDefault);
opts[GECKO] = new Option(GECKO, 'Install or update geckodriver', 'boolean', GeckoDriver.isDefault);
opts[IE] = new Option(IE, 'Install or update 32-bit ie driver', 'boolean', IEDriver.isDefault32);
opts[IE32] =
    new Option(IE32, 'Install or update 32-bit ie driver', 'boolean', IEDriver.isDefault32);
opts[IE64] = new Option(
    IE64, 'Update: install or update 64-bit IE driver. Start: use installed x64 IE driver.',
    'boolean', IEDriver.isDefault64);
opts[EDGE] = new Option(
    EDGE, 'Use installed Microsoft Edge driver', 'string',
    'C:\\Program Files (x86)\\Microsoft Web Driver\\MicrosoftWebDriver.exe');
opts[ANDROID] = new Option(ANDROID, 'Update/use the android sdk', 'boolean', AndroidSDK.isDefault);
opts[IOS] = new Option(IOS, 'Update the iOS sdk', 'boolean', false);
opts[VERSIONS_CHROME] = new Option(
    VERSIONS_CHROME,
    'Optional chrome driver version (use \'latest\' to get the most recent version)', 'string',
    'latest');
opts[VERSIONS_GECKO] =
    new Option(VERSIONS_GECKO, 'Optional gecko driver version', 'string', 'latest');
opts[VERSIONS_ANDROID] = new Option(
    VERSIONS_ANDROID, 'Optional android sdk version', 'string', AndroidSDK.versionDefault);
opts[VERSIONS_STANDALONE] = new Option(
    VERSIONS_STANDALONE,
    'Optional seleniuim standalone server version (use \'latest\' to get the most recent version)',
    'string', 'latest');
opts[VERSIONS_APPIUM] =
    new Option(VERSIONS_APPIUM, 'Optional appium version', 'string', Appium.versionDefault);
opts[VERSIONS_IE] = new Option(
    VERSIONS_IE,
    'Optional internet explorer driver version (use \'latest\' to get the most recent version)',
    'string', 'latest');
opts[CHROME_LOGS] = new Option(CHROME_LOGS, 'File path to chrome logs', 'string', undefined);
opts[LOGGING] = new Option(LOGGING, 'File path to logging properties file', 'string', undefined);
opts[ANDROID_API_LEVELS] = new Option(
    ANDROID_API_LEVELS, 'Which versions of the android API you want to emulate', 'string',
    AndroidSDK.DEFAULT_API_LEVELS);
opts[ANDROID_ARCHITECTURES] = new Option(
    ANDROID_ARCHITECTURES,
    'Which architectures you want to use in android emulation.  By default it will try to match os.arch()',
    'string', AndroidSDK.DEFAULT_ARCHITECTURES);
opts[ANDROID_PLATFORMS] = new Option(
    ANDROID_PLATFORMS, 'Which platforms you want to use in android emulation', 'string',
    AndroidSDK.DEFAULT_PLATFORMS);
opts[ANDROID_ACCEPT_LICENSES] =
    new Option(ANDROID_ACCEPT_LICENSES, 'Automatically accept android licenses', 'boolean', false);
opts[AVDS] = new Option(
    AVDS,
    'Android virtual devices to emulate.  Use "all" for emulating all possible devices, and "none" for no devices',
    'string', 'all');
opts[AVD_USE_SNAPSHOTS] = new Option(
    AVD_USE_SNAPSHOTS,
    'Rather than booting a new AVD every time, save/load snapshots of the last time it was used',
    'boolean', true);
opts[STARTED_SIGNIFIER] = new Option(
    STARTED_SIGNIFIER,
    'A string to be outputted once the selenium server is up and running.  Useful if you are writing a script which uses webdriver-manager.',
    'string');
opts[SIGNAL_VIA_IPC] = new Option(
    SIGNAL_VIA_IPC,
    'If you are using --' + STARTED_SIGNIFIER +
        ', this flag will emit the signal string using process.send(), rather than writing it to stdout',
    'boolean', false);
opts[DETACH] = new Option(
    DETACH,
    'Once the selenium server is up and running, return control to the parent process and continue running the server in the background.',
    'boolean', false);
opts[VERBOSE] = new Option(VERBOSE, 'Extra console output', 'boolean', false);
opts[QUIET] = new Option(QUIET, 'Minimal console output', 'boolean', false);
opts[ALREADY_OFF_ERROR] = new Option(
    ALREADY_OFF_ERROR,
    'Normally if you try to shut down a selenium which is not running, you will get a warning.  This turns it into an error',
    'boolean', false);

export var Opts = opts;
