import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as log from 'loglevel';
import * as os from 'os';
import * as request from 'request';
import * as path from 'path';
import {
  OUT_DIR,
  Provider,
  ProviderConfig,
} from './provider';
import {
  generateConfigFile,
  getBinaryPathFromConfig,
  removeFiles,
} from './utils/file_utils';
import { curlCommand, initOptions, requestBinary } from './utils/http_utils';
import { convertXmlToVersionList, updateXml } from './utils/cloud_storage_xml';
import { getVersion } from './utils/version_list';

export class SeleniumServer implements Provider {
  cacheFileName = 'selenium-server.xml';
  configFileName = 'selenium-server.config.json';
  ignoreSSL: boolean = false;
  osType = os.type();
  osArch = os.arch();
  outDir = OUT_DIR;
  proxy: string = null;
  requestUrl = 'https://selenium-release.storage.googleapis.com/';
  seleniumProcess: childProcess.ChildProcess;
  runAsNode = false;

  constructor(providerConfig?: ProviderConfig) {
    if (providerConfig) {
      if (providerConfig.cacheFileName) {
        this.cacheFileName = providerConfig.cacheFileName;
      }
      if (providerConfig.configFileName) {
        this.configFileName = providerConfig.configFileName;
      }
      this.ignoreSSL = providerConfig.ignoreSSL;
      if (providerConfig.osArch) {
        this.osArch = providerConfig.osArch;
      }
      if (providerConfig.osType) {
        this.osType = providerConfig.osType;
      }
      if (providerConfig.outDir) {
        this.outDir = providerConfig.outDir;
      }
      if (providerConfig.proxy) {
        this.proxy = providerConfig.proxy;
      }
      if (providerConfig.requestUrl) {
        this.requestUrl = providerConfig.requestUrl;
      }
    }
  }

  /**
   * Should update the cache and download, find the version to download,
   * then download that binary.
   * @param version Optional to provide the version number or latest.
   */
  async updateBinary(version?: string): Promise<any> {
    await updateXml(this.requestUrl, {
      fileName: path.resolve(this.outDir, this.cacheFileName),
      ignoreSSL: this.ignoreSSL,
      proxy: this.proxy });
    let versionList = convertXmlToVersionList(
      path.resolve(this.outDir, this.cacheFileName), 'selenium-server-standalone',
      versionParser,
      semanticVersionParser);
    let versionObj = getVersion(
      versionList, '', version);

    let seleniumServerUrl = this.requestUrl + versionObj.url;
    let seleniumServerJar = path.resolve(this.outDir, versionObj.name);

    // We should check the jar file size if it exists. The size will
    // be used to either make the request, or quit the request if the file
    // size matches.
    let fileSize = 0;
    try {
      fileSize = fs.statSync(seleniumServerJar).size;
    } catch (err) {}
    await requestBinary(seleniumServerUrl, {
      fileName: seleniumServerJar, fileSize,
      ignoreSSL: this.ignoreSSL,
      proxy: this.proxy });
    generateConfigFile(this.outDir,
      path.resolve(this.outDir, this.configFileName),
      matchBinaries(), seleniumServerJar);
    return Promise.resolve();
  }

  /**
   * Starts selenium standalone server and handles emitted exit events.
   * @param opts The options to pass to the jar file.
   * @param version The optional version of the selenium jar file.
   * @param runAsNode The option to run the selenium jar with role set to node.
   * @param runAsDetach The option to detach the server and return to parent.
   * @returns A promise so the server can run while awaiting its completion.
   */
  startServer(
      opts: {[key:string]: string},
      version?: string,
      runAsNode?: boolean,
      runAsDetach?: boolean): Promise<number> {
    this.runAsNode = runAsNode;
    let java = this.getJava();
    return new Promise<number>(async(resolve, _) => {

      if (runAsDetach) {
        runAsNode = true;
        let cmd = this.getCmdStartServer(opts, version, runAsNode);
        log.info(`${java} ${cmd.join(' ')}`);
        this.seleniumProcess = childProcess.spawn(java, cmd,
          { detached: true, stdio: 'ignore' });
        log.info(`selenium process id: ${this.seleniumProcess.pid}`);
        await new Promise((resolve, _) => {
          setTimeout(resolve, 2000);
        });
        this.seleniumProcess.unref();
        await new Promise((resolve, _) => {
          setTimeout(resolve, 500);
        });
        resolve();
      } else {
        let cmd = this.getCmdStartServer(opts, version, runAsNode);
        log.info(`${java} ${cmd.join(' ')}`);
        this.seleniumProcess = childProcess.spawn(java, cmd,
          { stdio: 'inherit' });
        log.info(`selenium process id: ${this.seleniumProcess.pid}`);

        this.seleniumProcess.on('exit', (code: number) => {
          log.info(`Selenium Standalone has exited with code: ${code}`);
          resolve(code);
        });
        this.seleniumProcess.on('error', (err: Error) => {
          log.error(`Selenium Standalone server encountered an error: ${err}`);
        });
      }
    });
  }

  /**
   * Get the selenium server start command (not including the java command)
   * @param opts The options to pass to the jar file.
   * @param version The optional version of the selenium jar file.
   * @param runAsNode The option to run the selenium jar with role set to node.
   * @returns The spawn arguments array.
   */
  getCmdStartServer(
      opts: {[key:string]: string},
      version?: string,
      runAsNode?: boolean): string[] {
    let configFilePath = path.resolve(this.outDir, this.configFileName);
    let jarFile = getBinaryPathFromConfig(configFilePath, version);
    let options: string[] = [];
    if (opts) {
      for (let opt of Object.keys(opts)) {
        options.push(`${opt}=${opts[opt]}`);
      }
    }
    options.push('-jar');
    options.push(jarFile);

    if (runAsNode) {
      options.push('-role');
      options.push('node');

      options.push('-servlet');
      options.push('org.openqa.grid.web.servlet.LifecycleServlet');

      options.push('-registerCycle');
      options.push('0');
    }
    options.push('-port');
    options.push('4444');

    return options;
  }

  /**
   * Gets the java command either by the JAVA_HOME environment variable or
   * just the java command.
   */
  getJava(): string {
    let java = 'java';
    if (process.env.JAVA_HOME) {
      java = path.resolve(process.env.JAVA_HOME, 'bin', 'java');
      if (this.osType === 'Windows_NT') {
        java += '.exe'
      }
    }
    return java;
  }

  /**
   * If we are running the selenium server role = node, send
   * the command to stop the server via http get request. Reference:
   * https://github.com/SeleniumHQ/selenium/issues/2852#issuecomment-268324091
   *
   * If we are not running as the selenium server role = node, kill the
   * process with pid.
   *
   * @param host The protocol and ip address, default http://127.0.0.1
   * @param port The port number, default 4444
   * @returns A promise of the http get request completing.
   */
  stopServer(host?: string, port?: number): Promise<void> {
    if (this.runAsNode) {
      if (!host) {
        host = 'http://127.0.0.1';
      }
      if (!port) {
        port = 4444;
      }
      let stopUrl = host + ':' + port +
        '/extra/LifecycleServlet?action=shutdown';
      let options = initOptions(stopUrl, {});
      log.info(curlCommand(options));
      return new Promise<void>((resolve, _) => {
        let req = request(options);
        req.on('response', response => {
          response.on('end', () => {
            resolve();
          });
        });
      });
    } else if (this.seleniumProcess) {
      process.kill(this.seleniumProcess.pid);
      return Promise.resolve();
    } else {
      return Promise.reject(
        'Could not stop the server, server is not running.');
    }

  }

  /**
   * Gets a comma delimited list of versions downloaded. Also has the "latest"
   * downloaded noted.
   */
  getStatus(): string|null {
    try {
      const configFilePath = path.resolve(this.outDir, this.configFileName);
      const configJson = JSON.parse(fs.readFileSync(configFilePath).toString());
      let versions: string[] = [];
      for (let binaryPath of configJson['all']) {
        let version = '';
        let regex = /.*selenium-server-standalone-(\d+.\d+.\d+.*).jar/g
        try {
          let exec = regex.exec(binaryPath);
          if (exec && exec[1]) {
            version = exec[1];
          }
        } catch (_) {}

        if (configJson['last'] === binaryPath) {
          version += ' (latest)'
        }
        versions.push(version);
      }
      return versions.join(', ');
    } catch (_) {
      return null;
    }
  }

  /**
   * Get a line delimited list of files removed.
   */
  cleanFiles(): string {
    return removeFiles(this.outDir, [/selenium-server.*/g]);
  }
}

/**
 * Captures the version name which includes the semantic version and extra
 * metadata. So an example for 12.34/selenium-server-standalone-12.34.56.jar,
 * the version is 12.34.56. For metadata,
 * 12.34/selenium-server-standalone-12.34.56-beta.jar is 12.34.56-beta.
 * @param xmlKey The xml key including the partial url.
 */
export function versionParser(xmlKey: string) {
  // Capture the version name 12.34.56 or 12.34.56-beta
  let regex = /.*selenium-server-standalone-(\d+.\d+.\d+.*).jar/g
  try {
    return regex.exec(xmlKey)[1];
  } catch(_) {
    return null;
  }
}

/**
 * Captures the version name which includes the semantic version and extra
 * metadata. So an example for 12.34/selenium-server-standalone-12.34.56.jar,
 * the version is 12.34.56. For metadata,
 * 12.34/selenium-server-standalone-12.34.56-beta.jar is still 12.34.56.
 * @param xmlKey The xml key including the partial url.
 */
export function semanticVersionParser(xmlKey: string) {
  // Only capture numbers 12.34.56
  let regex = /.*selenium-server-standalone-(\d+.\d+.\d+).*.jar/g
  try {
    return regex.exec(xmlKey)[1];
  } catch(_) {
    return null;
  }
}

/**
 * Matches the installed binaries.
 */
export function matchBinaries(): RegExp | null {
  return /selenium-server-standalone-\d+.\d+.\d+.*.jar/g;
}