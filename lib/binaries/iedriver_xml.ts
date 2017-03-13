import * as semver from 'semver';

import {Config} from '../config';

import {BinaryUrl} from './binary';
import {XmlConfigSource} from './config_source';

export class IEDriverXml extends XmlConfigSource {
  constructor() {
    super('iedriver', Config.cdnUrls()['ie']);
  }

  getUrl(version: string): Promise<BinaryUrl> {
    if (version === 'latest') {
      return this.getLatestIEDriverVersion();
    } else {
      return this.getSpecificIEDriverVersion(version);
    }
  }

  getVersionList(): Promise<string[]> {
    return this.getXml().then(xml => {
      let versionPaths: string[] = [];

      for (let content of xml.ListBucketResult.Contents) {
        let contentKey: string = content.Key[0];

        // Filter For IEDriverServer win 32. Removing option to download x64
        if (contentKey.includes('IEDriverServer_Win32_')) {
          versionPaths.push(contentKey);
        }
      }
      return versionPaths;
    });
  }

  private getLatestIEDriverVersion(): Promise<BinaryUrl> {
    return this.getVersionList().then(list => {
      let latestVersion: string = null;
      let latest = '';
      for (let item of list) {
        // Get a semantic version.
        let version = item.split('IEDriverServer_Win32_')[1].replace('.zip', '');

        if (latestVersion == null) {
          // First time: use the version found.
          latestVersion = version;
          latest = item;
        } else if (semver.gt(version, latestVersion)) {
          // Get the latest.
          latestVersion = version;
          latest = item;
        }
      }
      return {url: Config.cdnUrls().ie + latest, version: latestVersion};
    });
  }

  private getSpecificIEDriverVersion(inputVersion: string): Promise<BinaryUrl> {
    return this.getVersionList().then(list => {
      let itemFound = '';

      for (let item of list) {
        // Get a semantic version.
        let version = item.split('IEDriverServer_Win32_')[1].replace('.zip', '');

        // Check to see if the specified version matches.
        let firstPath = item.split('/')[0];
        if (version === inputVersion) {
          return {url: Config.cdnUrls().ie + item, version: version};
        }
      }
      return {url: '', version: inputVersion};
    });
  }
}
