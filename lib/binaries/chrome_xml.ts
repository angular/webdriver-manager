import * as semver from 'semver';

import {Config} from '../config';

import {BinaryUrl} from './binary';
import {XmlConfigSource} from './config_source';

export class ChromeXml extends XmlConfigSource {
  maxVersion = Config.binaryVersions().maxChrome;

  constructor() {
    super('chrome', Config.cdnUrls()['chrome']);
  }

  getUrl(version: string): Promise<BinaryUrl> {
    if (version === 'latest') {
      return this.getLatestChromeDriverVersion();
    } else {
      return this.getSpecificChromeDriverVersion(version);
    }
  }

  /**
   * Get a list of chrome drivers paths available for the configuration OS type and architecture.
   */
  getVersionList(): Promise<string[]> {
    return this.getXml().then(xml => {
      let versionPaths: string[] = [];
      let osType = this.getOsTypeName();

      for (let content of xml.ListBucketResult.Contents) {
        let contentKey: string = content.Key[0];


        // Filter for 32-bit devices, make sure x64 is not an option
        if (this.osarch === 'x64' || !contentKey.includes('64')) {
          // Filter for only the osType
          if (contentKey.includes(osType)) {
            versionPaths.push(contentKey);
          }
        }
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
      return 'mac';
    } else if (this.ostype === 'Windows_NT') {
      return 'win';
    } else {
      return 'linux';
    }
  }

  /**
   * Gets the latest item from the XML.
   */
  private getLatestChromeDriverVersion(): Promise<BinaryUrl> {
    return this.getVersionList().then(list => {
      let chromedriverVersion: string = null;
      let latest = '';
      let latestVersion = '';
      for (let item of list) {
        // Get a semantic version
        const version = item.split('/')[0];
        if (semver.valid(version) == null) {
          const iterVersion = getValidSemver(version);

          if (!semver.valid(iterVersion)) {
            throw new Error('invalid Chromedriver version');
          }
          // First time: use the version found.
          if (chromedriverVersion == null) {
            chromedriverVersion = iterVersion;
            latest = item;
            latestVersion = item.split('/')[0];
          } else if (
              iterVersion.startsWith(this.maxVersion) &&
              semver.gt(iterVersion, chromedriverVersion)) {
            // After the first time, make sure the semantic version is greater.
            chromedriverVersion = iterVersion;
            latest = item;
            latestVersion = item.split('/')[0];
          } else if (iterVersion === chromedriverVersion) {
            // If the semantic version is the same, check os arch.
            // For 64-bit systems, prefer the 64-bit version.
            if (this.osarch === 'x64') {
              if (item.includes(this.getOsTypeName() + '64')) {
                latest = item;
              }
            }
          }
        }
      }
      return {url: Config.cdnUrls().chrome + latest, version: latestVersion};
    });
  }

  /**
   * Gets a specific item from the XML.
   */
  private getSpecificChromeDriverVersion(inputVersion: string): Promise<BinaryUrl> {
    return this.getVersionList().then(list => {
      const specificVersion = getValidSemver(inputVersion);
      if (specificVersion === '') {
        throw new Error(`version ${inputVersion} ChromeDriver does not exist`)
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
        return {url: Config.cdnUrls().chrome + itemFound, version: inputVersion};
      }
    });
  }
}

/**
 * Chromedriver is the only binary that does not conform to semantic versioning
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
  // Removing the 0 after 74, to keep patch version of webdriver
  try {
    const newRegex = /(\d+.)\d+.(\d+.\d+)/g;
    const exec = newRegex.exec(version);
    if (exec) {
      lookUpVersion = exec[1] + exec[2];
    }
  } catch (_) {
    // no-op: if this does not work, use the other regex pattern.
  }
  return lookUpVersion;
}
