import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

import {Binary, BinaryMap, ChromeDriver, IEDriver, StandAlone, OS} from '../binaries';
import {DownloadedBinary} from './downloaded_binary';
import {Logger} from '../cli';

/**
 * The File Manager class is where the webdriver manager will compile a list of
 * binaries that could be downloaded and get a list of previously downloaded
 * file versions.
 */
export class FileManager {
  static makeOutputDirectory(outputDir: string) {
    if (!fs.existsSync(outputDir) || !fs.statSync(outputDir).isDirectory()) {
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
   * @returns A binary map that are available for the operating system.
   */
  static compileBinaries_(osType: string): BinaryMap<Binary> {
    let binaries: BinaryMap<Binary> = {};
    if (FileManager.checkOS_(osType, StandAlone)) {
      binaries[StandAlone.id] = new StandAlone();
    }
    if (FileManager.checkOS_(osType, ChromeDriver)) {
      binaries[ChromeDriver.id] = new ChromeDriver();
    }
    if (FileManager.checkOS_(osType, IEDriver)) {
      binaries[IEDriver.id] = new IEDriver();
    }
    return binaries;
  }

  /**
   * Look up the operating system and compile a list of binaries that are available
   * for the system.
   * @returns A binary map that is available for the operating system.
   */
  static setupBinaries(): BinaryMap<Binary> { return FileManager.compileBinaries_(os.type()); }

  /**
   * Get the list of existing files from the output directory
   * @param outputDir The directory where binaries are saved
   * @returns A list of existing files.
   */
  static getExistngFiles(outputDir: string): string[] { return fs.readdirSync(outputDir); }

  /**
   * For the binary, operating system, and system architecture, look through
   * the existing files and the downloaded binary
   * @param binary The binary of interest
   * @param osType The operating system.
   * @param existingFiles A list of existing files.
   * @returns The downloaded binary with all the versions found.
   */
  static downloadedVersions_(
      binary: Binary, osType: string, arch: string,
      existingFiles: string[]): DownloadedBinary {
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
    let ostype = os.type();
    let arch = os.arch();
    let binaries = FileManager.setupBinaries();
    let existingFiles = FileManager.getExistngFiles(outputDir);
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
   * Check to see if the binary version should be downloaded.
   * @param binary The binary of interest.
   * @param outputDir The directory where files are downloaded and stored.
   * @returns If the file should be downloaded.
   */
  static toDownload<T extends Binary>(binary: T, outputDir: string): boolean {
    let downloaded: BinaryMap<DownloadedBinary> = FileManager.downloadedBinaries(outputDir);
    if (downloaded[binary.id()]) {
      let versions = downloaded[binary.id()].versions;
      let version = binary.version();
      for (let index in versions) {
        let v = versions[index];
        if (v === version) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Removes the existing files found in the output directory that match the
   * binary prefix names.
   * @param outputDir The directory where files are downloaded and stored.
   */
  static removeExistingFiles(outputDir: string): void {
    // folder exists
    if (!fs.existsSync(outputDir)) {
      Logger.warn('The out_dir path ' + outputDir + ' does not exist.');
      return;
    }
    let existingFiles = FileManager.getExistngFiles(outputDir);
    if (existingFiles.length === 0) {
      Logger.warn('No files found in out_dir: ' + outputDir);
      return;
    }

    let binaries = FileManager.setupBinaries();
    existingFiles.forEach((file) => {
      for (let binPos in binaries) {
        let bin: Binary = binaries[binPos];
        if (file.indexOf(bin.prefix()) !== -1) {
          fs.unlinkSync(path.join(outputDir, file));
          Logger.info('Removed ' + file);
        }
      }
    })
  }
}
