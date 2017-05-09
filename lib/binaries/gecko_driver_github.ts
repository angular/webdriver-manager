import * as semver from 'semver';

import {Config} from '../config';

import {BinaryUrl} from './binary';
import {GithubApiConfigSource} from './config_source';

export class GeckoDriverGithub extends GithubApiConfigSource {
  constructor() {
    super('gecko', 'https://api.github.com/repos/mozilla/geckodriver/releases');
  }

  getUrl(version: string): Promise<BinaryUrl> {
    if (version === 'latest') {
      return this.getLatestGeckoDriverVersion();
    } else {
      return this.getSpecificGeckoDrierVersion(version);
    }
  }

  getVersionList(): Promise<string[]> {
    return this.getJson().then(json => {
      let versions: string[] = [];
      for (let i = 0; i < json.length; i++) {
        let item = json[i];
        versions.push(item.tag_name);
      }
      return versions;
    });
  }

  getVersionsLookup(): Promise<Array<{version: string, index: string}>> {
    return this.getJson().then(json => {
      let versionsLookup: Array<{version: string, index: string}> = [];
      for (let i = 0; i < json.length; i++) {
        let item = json[i];
        let index = i.toString();
        versionsLookup.push({version: item.tag_name, index: index});
      }
      return versionsLookup;
    });
  }

  private getLatestGeckoDriverVersion(): Promise<BinaryUrl> {
    return this.getJson().then(json => {
      return this.getVersionsLookup().then(versionsLookup => {
        let latest = '';
        for (let item of versionsLookup) {
          let version = item.version.replace('v', '');
          let assetsArray = json[item.index].assets;

          // check to make sure the version found has the OS
          for (let asset of assetsArray) {
            if ((asset.name as string).includes(this.oshelper())) {
              if (latest === '') {
                latest = version;
              } else if (semver.lt(latest, version)) {
                latest = version;
              }
            }
          }
        }
        return this.getSpecificGeckoDrierVersion('v' + latest);
      });
    });
  }

  private getSpecificGeckoDrierVersion(inputVersion: string): Promise<BinaryUrl> {
    return this.getJson().then(json => {
      return this.getVersionsLookup().then(versionsLookup => {
        for (let item of versionsLookup) {
          // Get the asset from the matching version.
          if (item.version === inputVersion) {
            let assetsArray = json[item.index].assets;
            for (let asset of assetsArray) {
              if ((asset.name as string).includes(this.oshelper())) {
                return {url: asset.browser_download_url, version: inputVersion};
              }
            }
          }
        }
        return null;
      });
    });
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
