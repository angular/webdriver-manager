import {Binary, BinaryUrl} from '../binaries';

/**
 * The downloaded binary is the binary with the list of versions downloaded.
 */
export class DownloadedBinary extends Binary {
  versions: string[] = [];
  binary: Binary;

  constructor(binary: Binary) {
    super();
    this.binary = binary;
    this.name = binary.name;
    this.versionCustom = binary.versionCustom;
  }

  id(): string {
    return this.binary.id();
  }

  prefix(): string {
    return null;
  }
  suffix(): string {
    return null;
  }
  getUrl(): Promise<BinaryUrl> {
    return null;
  }
  getVersionList(): Promise<string[]> {
    return null;
  }
}
