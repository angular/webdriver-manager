import * as semver from 'semver';

import {Config} from '../config';
import {requestBody} from '../http_utils';

import {BinaryUrl} from './binary';
import {XmlConfigSource} from './config_source';

export class EdgeXml extends XmlConfigSource {
  maxVersion = Config.binaryVersions().maxEdge;
  constructor() {
    super('edge', Config.cdnUrls().edge + 'edgewebdriver?delimiter=%2F&maxresults=5000&restype=container&comp=list&timeout=60000');
  }

  getUrl(version: string): Promise<BinaryUrl> {
    if (version === 'latest') {
      return this.getLatestMsedgeDriverVersion();
    } else {
      return this.getSpecificMsedgeDriverVersion(version);
    }
  }

  /**
   * Get a list of edge drivers paths available for the configuration OS type and architecture.
   */
  getVersionList(): Promise<string[]> {
    return this.getXml().then(xml => {
      let versionPaths: string[] = [];
      let osType = this.getOsTypeName();

      for (let content of xml.EnumerationResults.Blobs[0].BlobPrefix) {
        let contentKey: string = content.Name[0];
        versionPaths.push(`${contentKey}edgedriver_${osType}.zip`);
      }
      return versionPaths;
    });
  }

  /**
   * Helper method, gets the ostype and gets the name used by the XML
   */
  getOsTypeName(): string {
    // Get the os type name.
    if (this.ostype === 'Darwin') {
      return 'mac64';
    } else if (this.ostype === 'Windows_NT') {
      return 'win64';
    }
  }

  
  private getLatestMsedgeDriverVersion(): Promise<BinaryUrl> {
    const latestReleaseUrl = 'https://msedgedriver.azureedge.net/LATEST_STABLE';
    return requestBody(latestReleaseUrl).then(latestVersion => {
      return this.getSpecificMsedgeDriverVersion(latestVersion.replace(/\s|\uFFFD|\u0000|/g,""));
    });
  }

  private toValidSemver(version: string) {
    return version.replace(".0.",".")
  }

  /**
   * Gets a specific item from the XML.
   */
  private getSpecificMsedgeDriverVersion(inputVersion: string): Promise<BinaryUrl> {
    return this.getVersionList().then(list => {
      const specificVersion = getValidSemver(inputVersion);
      if (specificVersion === '') {
        throw new Error(`version ${inputVersion} EdgeDriver does not exist`)
      }
      let itemFound = '';
      for (let item of list) {
        // Get a semantic version.
        let version = item.split('/')[0];
        if (semver.valid(version) == null) {
          const lookUpVersion = getValidSemver(version);

          if (semver.valid(lookUpVersion)) {
            // Check to see if the specified version matches.
            if (lookUpVersion === specificVersion) {
              // When item found is null, check the os arch
              // 64-bit version works OR not 64-bit version and the path does not have '64'
              if (itemFound == '') {
                if (this.osarch === 'x64' ||
                    (this.osarch !== 'x64' && !item.includes(this.getOsTypeName() + '64'))) {
                  itemFound = item;
                }

              }
              // If the semantic version is the same, check os arch.
              // For 64-bit systems, prefer the 64-bit version.
              else if (this.osarch === 'x64') {
                if (item.includes(this.getOsTypeName() + '64')) {
                  itemFound = item;
                }
              }
            }
          }
        }
      }
      if (itemFound == '') {
        return {url: '', version: inputVersion};
      } else {
        return {url: "https://msedgedriver.azureedge.net/" + itemFound, version: inputVersion};
      }
    });
  }
}

/**
 * Edgedriver is the only binary that does not conform to semantic versioning
 * and either has too little number of digits or too many. To get this to be in
 * semver, we will either add a '.0' at the end or chop off the last set of
 * digits. This is so we can compare to find the latest and greatest.
 *
 * Example:
 *   2.46 -> 2.46.0
 *   75.0.3770.8 -> 75.0.3770
 *
 * @param version
 */
export function getValidSemver(version: string): string {
  let lookUpVersion = '';
  // This supports downloading 2.46
  try {
    const oldRegex = /(\d+.\d+)/g;
    const exec = oldRegex.exec(version);
    if (exec) {
      lookUpVersion = exec[1] + '.0';
    }
  } catch (_) {
    // no-op: is this is not valid, do not throw here.
  }
  // This supports downloading 74.0.3729.6
  try {
    const newRegex = /(\d+.\d+.\d+).\d+/g;
    const exec = newRegex.exec(version);
    if (exec) {
      lookUpVersion = exec[1];
    }
  } catch (_) {
    // no-op: if this does not work, use the other regex pattern.
  }
  return lookUpVersion;
}
