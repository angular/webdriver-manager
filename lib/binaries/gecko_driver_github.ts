import * as semver from 'semver';

import {Config} from '../config';

import {BinaryUrl} from './binary';
import {GithubApiConfigSource} from './config_source';

export class GeckoDriverGithub extends GithubApiConfigSource {
  versionsLookup: Array<{version: string, index: number}> = [];
  constructor() {
    super('gecko');
    this.jsonUrl = 'https://api.github.com/repos/mozilla/geckodriver/releases';
  }

  getUrl(version: string): Promise<BinaryUrl> {
    return this.getJson().then(() => {
      if (version === 'latest') {
        return this.getLatestGeckoDriverVersion();
      } else {
        return this.getSpecificGeckoDrierVersion(version);
      }
    });
  }

  getVersionList(): Promise<string[]> {
    return this.getJson().then(() => {
      return this.getGeckoDriverList();
    });
  }

  private getGeckoDriverList(): string[] {
    this.versionsLookup = [];
    let versions: string[] = [];
    for (let i = 0; i < this.json.length; i++) {
      let item = this.json[i];
      versions.push(item.tag_name);
      this.versionsLookup.push({version: item.tag_name, index: i});
    }
    return versions;
  }

  private getLatestGeckoDriverVersion(): BinaryUrl {
    this.getGeckoDriverList();
    let latest = '';
    for (let item of this.versionsLookup) {
      let version = item.version.replace('v', '');
      if (latest === '') {
        latest = version;
      } else if (semver.lt(latest, version)) {
        latest = version;
      }
    }
    return this.getSpecificGeckoDrierVersion('v' + latest);
  }

  private getSpecificGeckoDrierVersion(inputVersion: string): BinaryUrl {
    this.getGeckoDriverList();
    for (let item of this.versionsLookup) {
      // Get the asset from the matching version.
      if (item.version === inputVersion) {
        let assetsArray = this.json[item.index].assets;
        for (let asset of assetsArray) {
          if ((asset.name as string).includes(this.oshelper())) {
            return {url: asset.browser_download_url, version: inputVersion};
          }
        }
      }
    }
    return null;
  }

  private oshelper(): string {
    // Get the os type name.
    if (this.ostype === 'Darwin') {
      return 'macos';
    } else if (this.ostype === 'Windows_NT') {
      return this.osarch === 'x64' ? 'win64' : 'win32';
    } else {
      return this.osarch === 'x64' ? 'linux64' : 'linux32';
    }
  }
}
