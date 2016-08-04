import * as fs from 'fs';

/**
 * operating system enum
 */
export enum OS {
  Windows_NT,
  Linux,
  Darwin
}

/**
 * Dictionary to map the binary's id to the binary object
 */
export interface BinaryMap<T extends Binary> { [id: string]: T; }


/**
 * The binary object base class
 */
export class Binary {
  static os: OS[];                // the operating systems, the binary can run on
  static id: string;              // the binaries key identifier
  static isDefault: boolean;      // to download by default
  static versionDefault: string;  // a static default version variable
  static shortName: string[];     // the names used for a binary download
  name: string;                   // used for logging to console
  prefixDefault: string;          // start of the file name
  versionCustom: string;          // version of file
  suffixDefault: string;          // file type for downloading
  cdn: string;                    // url protocol and host
  arch: string;

  /**
   * @param ostype The operating system.
   * @returns The executable file type.
   */
  executableSuffix(ostype: string): string {
    if (ostype == 'Windows_NT') {
      return '.exe';
    } else {
      return '';
    }
  }

  /**
   * @param ostype The operating system.
   * @returns The file name for the executable.
   */
  executableFilename(ostype: string): string {
    return this.prefix() + this.version() + this.executableSuffix(ostype);
  }

  prefix(): string { return this.prefixDefault; }

  version(): string { return this.versionCustom; }

  suffix(ostype?: string, arch?: string): string { return this.suffixDefault; }

  filename(ostype?: string, arch?: string): string {
    return this.prefix() + this.version() + this.suffix(ostype, arch);
  }

  /**
   * @param ostype The operating system.
   * @returns The file name for the file inside the downloaded zip file
   */
  zipContentName(ostype: string): string { return this.name + this.executableSuffix(ostype); }

  shortVersion(version: string): string { return version.slice(0, version.lastIndexOf('.')); }

  /**
   * A base class method that should be overridden.
   */
  id(): string { return 'not implemented'; }

  /**
   * A base class method that should be overridden.
   */
  versionDefault(): string { return 'not implemented'; }

  /**
   * A base class method that should be overridden.
   */
  url(ostype?: string, arch?: string): string { return 'not implemented'; }

  /**
   * Delete an instance of this binary from the file system
   */
  remove(filename: string): void { fs.unlinkSync(filename); }
}
