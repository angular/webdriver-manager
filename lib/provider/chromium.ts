import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as semver from 'semver';
import { requestBody, JsonObject, requestBinary } from './utils/http_utils';
import { getBinaryPathFromConfig, removeFiles, unzipFile } from './utils/file_utils';
import { isExpired } from './utils/file_utils';
import { OUT_DIR, ProviderClass, ProviderConfig, ProviderInterface } from './provider';

export class Chromium extends ProviderClass implements ProviderInterface {
  cacheFileName = 'chromium-all.json';
  cacheVersionFileName = 'chromium-version.json';
  cacheStorageFileName = 'chromium-storage.json';
  compressedBinaryFileName = 'chromium.zip';
  configFileName = 'chromium.config.json';
  ignoreSSL = false;
  osType = os.type();
  osArch = os.arch();
  outDir = OUT_DIR;
  proxy: string = null;

  constructor(config?: ProviderConfig) {
    super();
    this.cacheFileName = this.setVar('cacheFileName', this.cacheFileName, config);
    this.configFileName = this.setVar('configFileName', this.configFileName, config);
    this.ignoreSSL = this.setVar('ignoreSSL', this.ignoreSSL, config);
    this.osArch = this.setVar('osArch', this.osArch, config);
    this.osType = this.setVar('osType', this.osType, config);
    this.outDir = this.setVar('outDir', this.outDir, config);
    this.proxy = this.setVar('proxy', this.proxy, config);
  }

  private makeDirectory(fileName: string) {
    const dir = path.dirname(fileName);
    try {
      fs.mkdirSync(dir);
    } catch (err) {
    }
  }

  /**
   * Step 1: Download the json file that contains all the releases by OS. Each
   * OS will have a list of release versions. The requested body will also be
   * written to the out directory.
   * 
   * The requested url is https://omahaproxy.appspot.com/all.json. Some other
   * urls include a timestamped csv https://omahaproxy.appspot.com/history.
   * @return Promise of the all-json file.
   */
  async downloadAllJson(): Promise<JsonObject> {
    const fileName = path.resolve(this.outDir, this.cacheFileName);
    if (!isExpired(fileName)) {
      return JSON.parse(fs.readFileSync(fileName).toString());
    } else {
      this.makeDirectory(fileName);
      const httpOptions = { fileName, ignoreSSL: this.ignoreSSL,
        proxy: this.proxy };
    
      if (isExpired(fileName)) {
        const allJsonUrl = 'https://omahaproxy.appspot.com/all.json';
        let contents = await requestBody(allJsonUrl, httpOptions);
        contents = `{ "all": ${contents} }`;
        const jsonObj = JSON.parse(contents);
        fs.writeFileSync(fileName, JSON.stringify(jsonObj, null, 2));
        return jsonObj;
      } else {
        const contents = fs.readFileSync(fileName).toString();
        return JSON.parse(contents);
      }
    }
  }

  /**
   * Step 2: From the all-json object, make a request that matches the major
   * version requested. The requested body will also be written to file in the
   * out directory.
   * 
   * An example of a requsted url is
   * https://omahaproxy.appspot.com/deps.json?version=72.0.3626.81
   * @param allJson The all-json object.
   * @param majorVersion The major version, this must be a whole number.
   */
  async downloadVersionJson(allJson: JsonObject, majorVersion: string
      ): Promise<JsonObject> {
    const fileName = path.resolve(this.outDir,
      this.cacheVersionFileName.replace('.json', `-${majorVersion}.json`));
    if (!isExpired(fileName)) {
      return JSON.parse(fs.readFileSync(fileName).toString());
    }
    this.makeDirectory(fileName);

    // Look up a version that makes sense.
    const all = allJson['all'];
    let os = '';
    if (this.osType === 'Windows_NT') {
      os = 'win';
      if (this.osArch === 'x64') {
        os = 'win64';
      }
    } else if (this.osType === 'Linux') {
      os = 'linux';
    } else {
      os = 'mac';
    }

    let workingFullVersion = '';
    let workingSemanticVersion = '0.0.0';
    for (let item of all) {
      if (item['os'] === os) {
        const versions = item['versions'];
        for (let version of versions) {
          const fullVersion = version['current_version'];
          const major = fullVersion.split('.')[0];
          const minor = fullVersion.split('.')[1];
          const patch = fullVersion.split('.')[2];
          const semanticVersion = `${major}.${minor}.${patch}`;
          if (majorVersion === major) {
            if (semver.gt(semanticVersion, workingSemanticVersion)) {
              workingFullVersion = fullVersion;
            }
          }
        }
      }
    }

    // Make a request and write it out to file.
    const httpOptions = { fileName, ignoreSSL: this.ignoreSSL,
      proxy: this.proxy };

    const depsUrl = 'https://omahaproxy.appspot.com/deps.json?version=' +
      workingFullVersion;
    const contents = await requestBody(depsUrl, httpOptions);
    const jsonObj = JSON.parse(contents);
    fs.writeFileSync(fileName, JSON.stringify(jsonObj, null, 2));
    return jsonObj;
  }

  /**
   * Step 3: From the downloaded-version-json object, get the revision number.
   * This is the "chromium_base_position" and make a request to the storage
   * bucket. If the returned value is {"kind": "storage#objects"}, then
   * decrement the revision number.
   * 
   * An example is the chromium_base_position revision number (612437).
   * https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o?delimiter=/&prefix=Linux_x64/612437/
   * returns {"kind": "storage#objects"}.
   * 
   * We keep decrementing the number until we reach 612434 where there is a list
   * of items.
   * @param downloadJson The download-version-json object.
   * @param majorVersion The major version, this must be a whole number.
   */
  async downloadStorageObject(downloadJson: JsonObject, majorVersion: string
      ): Promise<JsonObject> {
    const fileName = path.resolve(this.outDir,
      this.cacheStorageFileName.replace('.json', `-${majorVersion}.json`));
    if (!isExpired(fileName)) {
      return JSON.parse(fs.readFileSync(fileName).toString());
    }
    this.makeDirectory(fileName);
    let revisionUrl = 'https://www.googleapis.com/storage/v1/b/' +
      'chromium-browser-snapshots/o?delimiter=/&prefix=';
    let os = '';
    if (this.osType === 'Windows_NT') {
      os = 'Win';
      if (this.osArch === 'x64') {
        os = 'Win_x64';
      }
    } else if (this.osType === 'Linux') {
      os = 'Linux';
      if (this.osArch === 'x64') {
        os = 'Linux_x64';
      }
    } else {
      os = 'Mac';
    }
    revisionUrl += os + '/';
    let chromiumBasePosition: number = downloadJson['chromium_base_position'];
    
    const httpOptions = { fileName, ignoreSSL: this.ignoreSSL,
      proxy: this.proxy };
    while(chromiumBasePosition > 0) {
      const revisionBasePositionUrl =
        `${revisionUrl}${chromiumBasePosition}/`;
      const body = await requestBody(revisionBasePositionUrl, httpOptions);
      const jsonBody = JSON.parse(body);
      if (jsonBody['items']) {
        fs.writeFileSync(fileName, JSON.stringify(jsonBody, null, 2));
        return jsonBody;
      } else {
        chromiumBasePosition--;
      }
    }
    return null;
  }

  /**
   * Step 4: Get the download url for the chromium zip. Unzipping the zip file
   * directory. The folders and binaries uncompressed are different for each OS.
   * The following is examples of each OS:
   * 
   * downloads/
   *  |- chrome-linux/chrome
   *  |- chrome-mac/Chromium.app
   *  |- chrome-win/chrome.exe
   * 
   * @param storageObject The download-storage-json object
   * @param majorVersion The major version, this must be a whole number.
   */
  async downloadUrl(storageObject: JsonObject, majorVersion: string
      ): Promise<void> {
    const fileName = path.resolve(this.outDir, 
      this.compressedBinaryFileName.replace('.zip', `-${majorVersion}.zip`));
    if (isExpired(fileName)) {
      const httpOptions = { fileName, ignoreSSL: this.ignoreSSL,
        proxy: this.proxy };
      for (let item of storageObject['items'] as JsonObject[]) {
        const name: string = item['name'];
        if (name.indexOf('chrome') >= 0) {
          const downloadUrl = item['mediaLink'];
          await requestBinary(downloadUrl, httpOptions);
          break;
        }
      }
    }
    unzipFile(fileName, this.outDir);
  }

  async updateBinary(majorVersion?: string): Promise<void> {    
    const allJson = await this.downloadAllJson();
    const downloadVersionJson = await this.downloadVersionJson(
      allJson, majorVersion);
    const storageObject = await this.downloadStorageObject(
      downloadVersionJson, majorVersion);
    await this.downloadUrl(storageObject, majorVersion);
  }

  getBinaryPath(version?: string): string | null {
    try {
      const configFilePath = path.resolve(this.outDir, this.configFileName);
      return getBinaryPathFromConfig(configFilePath, version);
    } catch (_) {
      return null;
    }
  }

  getStatus(): string | null {
    return '';
  }

  cleanFiles(): string {
    return removeFiles(this.outDir, [/chromium.*/g]);
  }
}

/**
 * Helps translate the os type and arch to the download name associated
 * with composing the download link.
 * @param ostype The operating stystem type.
 * @param osarch The chip architecture.
 * @returns The download name associated with composing the download link.
 */
export function osHelper(ostype: string, osarch: string): string {
  if (ostype === 'Darwin') {
    return 'Mac';
  } else if (ostype === 'Windows_NT') {
    if (osarch === 'x64') {
      return 'Win_x64';
    } else if (osarch === 'x32') {
      return 'Win';
    }
  } else if (ostype === 'Linux') {
    if (osarch === 'x64') {
      return 'Linux_64';
    }
  }
  return null;
}