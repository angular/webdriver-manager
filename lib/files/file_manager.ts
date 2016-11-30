import * as fs from 'fs';
import * as path from 'path';
import * as q from 'q';

import {Binary, BinaryMap, ChromeDriver, IEDriver, AndroidSDK, Appium, StandAlone, OS} from
'../binaries';
import {Config} from '../config';
import {DownloadedBinary} from './downloaded_binary';
import {Downloader} from './downloader';
import {Logger} from '../cli';
import {GeckoDriver} from '../binaries/gecko_driver';

let logger = new Logger('file_manager');

/**
 * The File Manager class is where the webdriver manager will compile a list of
 * binaries that could be downloaded and get a list of previously downloaded
 * file versions.
 */
export class FileManager {
  /**
   * Create a directory if it does not exist.
   * @param outputDir The directory to create.
   */
  static makeOutputDirectory(outputDir: string) {
    try {
      fs.statSync(outputDir);
    } catch (e) {
      logger.info('creating folder ' + outputDir);
      fs.mkdirSync(outputDir);
    }
  }

  /**
   * For the operating system, check against the list of operating systems that the
   * binary is available for.
   * @param osType The operating system.
   * @param binary The class type to have access to the static properties.
   * @returns If the binary is available for the operating system.
   */
  static checkOS_(osType: string, binary: typeof Binary): boolean {
    for (let os in binary.os) {
      if (OS[os] == osType) {
        return true;
      }
    }
    return false;
  }

  /**
   * For the operating system, create a list that includes the binaries
   * for selenium standalone, chrome, and internet explorer.
   * @param osType The operating system.
   * @param alternateCDN URL of the alternative CDN to be used instead of the default ones.
   * @returns A binary map that are available for the operating system.
   */
  static compileBinaries_(osType: string, alternateCDN?: string): BinaryMap<Binary> {
    let binaries: BinaryMap<Binary> = {};
    if (FileManager.checkOS_(osType, StandAlone)) {
      binaries[StandAlone.id] = new StandAlone(alternateCDN);
    }
    if (FileManager.checkOS_(osType, ChromeDriver)) {
      binaries[ChromeDriver.id] = new ChromeDriver(alternateCDN);
    }
    if (FileManager.checkOS_(osType, GeckoDriver)) {
      binaries[GeckoDriver.id] = new GeckoDriver(alternateCDN);
    }
    if (FileManager.checkOS_(osType, IEDriver)) {
      binaries[IEDriver.id] = new IEDriver(alternateCDN);
    }
    if (FileManager.checkOS_(osType, AndroidSDK)) {
      binaries[AndroidSDK.id] = new AndroidSDK(alternateCDN);
    }
    if (FileManager.checkOS_(osType, Appium)) {
      binaries[Appium.id] = new Appium(alternateCDN);
    }
    return binaries;
  }

  /**
   * Look up the operating system and compile a list of binaries that are available
   * for the system.
   * @param alternateCDN URL of the alternative CDN to be used instead of the default ones.
   * @returns A binary map that is available for the operating system.
   */
  static setupBinaries(alternateCDN?: string): BinaryMap<Binary> {
    return FileManager.compileBinaries_(Config.osType(), alternateCDN);
  }

  /**
   * Get the list of existing files from the output directory
   * @param outputDir The directory where binaries are saved
   * @returns A list of existing files.
   */
  static getExistingFiles(outputDir: string): string[] {
    try {
      return fs.readdirSync(outputDir);
    } catch (e) {
      return [];
    }
  }

  /**
   * For the binary, operating system, and system architecture, look through
   * the existing files and the downloaded binary
   * @param binary The binary of interest
   * @param osType The operating system.
   * @param existingFiles A list of existing files.
   * @returns The downloaded binary with all the versions found.
   */
  static downloadedVersions_(binary: Binary, osType: string, arch: string, existingFiles: string[]):
      DownloadedBinary {
    let versions: string[] = [];
    for (let existPos in existingFiles) {
      let existFile: string = existingFiles[existPos];
      // use only files that have a prefix and suffix that we care about
      if (existFile.indexOf(binary.prefix()) === 0) {
        let editExistFile = existFile.replace(binary.prefix(), '');
        // if the suffix matches the executable suffix, add it
        if (binary.suffix(osType, arch) === binary.executableSuffix(osType)) {
          versions.push(editExistFile.replace(binary.suffix(osType, arch), ''));
        }
        // if the suffix does not match the executable,
        // the binary is something like: .exe and .zip
        else if (existFile.indexOf(binary.suffix(osType, arch)) === -1) {
          editExistFile = editExistFile.replace(binary.executableSuffix(osType), '');
          editExistFile = editExistFile.indexOf('_') === 0 ?
              editExistFile.substring(1, editExistFile.length) :
              editExistFile;
          versions.push(editExistFile);
        }
      }
    }
    if (versions.length === 0) {
      return null;
    }
    let downloadedBinary = new DownloadedBinary(binary);
    downloadedBinary.versions = versions;
    return downloadedBinary;
  }

  /**
   * Finds all the downloaded binary versions stored in the output directory.
   * @param outputDir The directory where files are downloaded and stored.
   * @returns An dictionary map of all the downloaded binaries found in the output folder.
   */
  static downloadedBinaries(outputDir: string): BinaryMap<DownloadedBinary> {
    let ostype = Config.osType();
    let arch = Config.osArch();
    let binaries = FileManager.setupBinaries();
    let existingFiles = FileManager.getExistingFiles(outputDir);
    let downloaded: BinaryMap<DownloadedBinary> = {};
    for (let bin in binaries) {
      let binary = FileManager.downloadedVersions_(binaries[bin], ostype, arch, existingFiles);
      if (binary != null) {
        downloaded[binary.id()] = binary;
      }
    }
    return downloaded;
  }

  /**
   * Try to download the binary version.
   * @param binary The binary of interest.
   * @param outputDir The directory where files are downloaded and stored.
   * @returns Promise resolved to true for files downloaded, resolved to false for files not
   *          downloaded because they exist, rejected if there is an error.
   */
  static downloadFile<T extends Binary>(
      binary: T, outputDir: string, opt_proxy?: string, opt_ignoreSSL?: boolean,
      callback?: Function): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let filePath = path.resolve(outputDir, binary.filename(Config.osType(), Config.osArch()));
      let fileUrl = binary.url(Config.osType(), Config.osArch());
      let fileName = binary.filename(Config.osType(), Config.osArch());
      let outDir = Config.getSeleniumDir();
      let downloaded: BinaryMap<DownloadedBinary> = FileManager.downloadedBinaries(outputDir);
      let contentLength = 0;

      // If we have downloaded the file before, check the content length
      if (downloaded[binary.id()]) {
        let downloadedBinary = downloaded[binary.id()];
        let versions = downloadedBinary.versions;
        let version = binary.version();

        for (let index in versions) {
          let v = versions[index];
          if (v === version) {
            contentLength = fs.statSync(filePath).size;
            return Downloader
                .getFile(
                    binary, fileUrl, fileName, outputDir, contentLength, opt_proxy, opt_ignoreSSL,
                    callback)
                .then(downloaded => {
                  resolve(downloaded);
                });
          }
        }
      }
      // We have not downloaded it before, or the version does not exist. Use the default content
      // length of zero and download the file.
      Downloader
          .getFile(
              binary, fileUrl, fileName, outputDir, contentLength, opt_proxy, opt_ignoreSSL,
              callback)
          .then(downloaded => {
            resolve(downloaded);
          });

    });
  }

  /**
   * Removes the existing files found in the output directory that match the
   * binary prefix names.
   * @param outputDir The directory where files are downloaded and stored.
   */
  static removeExistingFiles(outputDir: string): void {
    try {
      fs.statSync(outputDir);
    } catch (e) {
      logger.warn('path does not exist ' + outputDir);
      return;
    }
    let existingFiles = FileManager.getExistingFiles(outputDir);
    if (existingFiles.length === 0) {
      logger.warn('no files found in path ' + outputDir);
      return;
    }

    let binaries = FileManager.setupBinaries();
    existingFiles.forEach((file) => {
      for (let binPos in binaries) {
        let bin: Binary = binaries[binPos];
        if (file.indexOf(bin.prefix()) !== -1) {
          bin.remove(path.resolve(outputDir, file));
          logger.info('removed ' + file);
        }
      }
    });

    let updateConfig = path.resolve(outputDir, 'update-config.json');
    try {
      fs.unlinkSync(updateConfig);
      logger.info('removed update-config.json');
    } catch (e) {
      return;
    }
  }
}
