import {Binary} from '../binaries/binary';

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
}
