import * as childProcess from 'child_process';
import * as fs from 'fs';
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
   * @returns A promise so the server can run while awaiting its completion.
   */
  startServer(opts: {[key:string]: string}, version?: string): Promise<any> {
    let cmd = this.getCmdStartServer(opts, version);
    console.log(cmd);
    return new Promise<any>((resolve, reject) => {
      let seleniumProcess = childProcess.exec(cmd);
      console.log(`selenium process id: ${seleniumProcess.pid}`);
      seleniumProcess.on('exit', async(code: number) => {
        console.log(`Selenium Standalone has exited with code: ${code}`);
        process.exit(process.exitCode || code);
      });
      seleniumProcess.on('error', (err: Error) => {
        console.log(`Selenium Standalone server encountered an error: ${err}`);
      });
      process.stdin.resume();
      process.on('SIGINT', async() => {
        process.kill(seleniumProcess.pid);
        process.exit(process.exitCode);
      });
    });
  }

  /**
   * Get the selenium server start command (not including the java command)
   * @param opts The options to pass to the jar file.
   * @param version The optional version of the selenium jar file.
   * @returns The java command to start the selenium standalone server.
   */
  getCmdStartServer(opts: {[key:string]: string}, version?: string): string {
    let configFilePath = path.resolve(this.outDir, this.configFileName);
    let jarFile = getBinaryPathFromConfig(configFilePath, version);
    let options = '';
    if (opts) {
      for (let opt of Object.keys(opts)) {
        options += `${opt}=${opts[opt]} `;
      }
    }
    let java = 'java';
    if (process.env.JAVA_HOME) {
      java = path.resolve(process.env.JAVA_HOME, 'bin', 'java');
      if (java.match(' ')) {
        java = `"${java}"`;
      }
    }
    let args = '-role node ' +
      '-servlet org.openqa.grid.web.servlet.LifecycleServlet ' +
      '-registerCycle 0 -port 4444';

    return `${java} ${options}-jar ${jarFile} ${args}`;
  }

  /**
   * Sends the command to stop the server via http get request. Reference:
   * https://github.com/SeleniumHQ/selenium/issues/2852#issuecomment-268324091
   * @param host The protocol and ip address, default http://127.0.0.1
   * @param port The port number, default 4444
   * @returns A promise of the http get request completing.
   */
  stopServer(host?: string, port?: number): Promise<void> {
    if (!host) {
      host = 'http://127.0.0.1';
    }
    if (!port) {
      port = 4444;
    }
    let stopUrl = host + ':' + port +
      '/extra/LifecycleServlet?action=shutdown';
    let options = initOptions(stopUrl, {});
    console.log(curlCommand(options));
    return new Promise<void>((resolve, _) => {
      let req = request(options);
      req.on('response', response => {
        response.on('end', () => {
          resolve();
        });
      });
    });
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