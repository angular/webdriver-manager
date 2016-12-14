import * as semver from 'semver';

import {Config} from '../config';

import {BinaryUrl} from './binary';
import {XmlConfigSource} from './config_source';

export class StandaloneXml extends XmlConfigSource {
  constructor() {
    super('standalone');
    this.xmlUrl = Config.cdnUrls()['selenium'];
  }

  getUrl(version: string): Promise<BinaryUrl> {
    return this.getXml().then(() => {
      if (version === 'latest') {
        return this.getLatestStandaloneVersion();
      } else {
        return this.getSpecificStandaloneVersion(version);
      }
    });
  }

  getVersionList(): Promise<string[]> {
    return this.getXml().then(() => {
      return this.getStandaloneList();
    });
  }

  /**
   * Get a list of standalone paths available for the configuration OS type and architecture.
   */
  private getStandaloneList(): string[] {
    let versionPaths: string[] = [];

    for (let content of this.xml.ListBucketResult.Contents) {
      let contentKey: string = content.Key[0];

      // Filter the selenium-server-standalone.
      if (contentKey.includes('selenium-server-standalone')) {
        versionPaths.push(contentKey);
      }
    }
    return versionPaths;
  }

  private getLatestStandaloneVersion(): BinaryUrl {
    let list = this.getStandaloneList();
    let standaloneVersion = null;
    let latest = '';
    let latestVersion = '';
    for (let item of list) {
      // Get a semantic version.
      let version = item.split('selenium-server-standalone-')[1].replace('.jar', '');

      // Do not do beta versions for latest.
      if (version.includes('beta')) {
        continue;
      }

      if (standaloneVersion == null) {
        // First time: use the version found.
        standaloneVersion = version;
        latest = item;
        latestVersion = version;
      } else if (semver.gt(version, standaloneVersion)) {
        // Get the latest.
        standaloneVersion = version;
        latest = item;
        latestVersion = version;
      }
    }
    return {url: latest, version: latestVersion};
  }

  private getSpecificStandaloneVersion(inputVersion: string): BinaryUrl {
    let list = this.getStandaloneList();
    let itemFound = '';
    let standaloneVersion = null;

    for (let item of list) {
      // Get a semantic version.
      let version = item.split('selenium-server-standalone-')[1].replace('.jar', '');

      // Check to see if the specified version matches.
      let firstPath = item.split('/')[0];
      if (version === inputVersion) {
        // Check if the beta exists that we have the right version
        // Example: We will see that beta3 appears in the file and path
        // 3.0-beta3/selenium-server-standalone-3.0.0-beta3.jar
        // where this should not work:
        // 3.0-beta2/selenium-server-standalone-3.0.0-beta3.jar
        if (inputVersion.includes('beta')) {
          let betaInputVersion = inputVersion.replace('.jar', '').split('beta')[1];
          if (item.split('/')[0].includes('beta' + betaInputVersion)) {
            return {url: item, version: version};
          }
        } else {
          return {url: item, version: version};
        }
      }
    }
  }
}
