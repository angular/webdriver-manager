import * as semver from 'semver';

// An object of multiple versions of a binary. Each version could have
// different keys where each key represents a partial url path. Each
// partial url path could represent a combination of os architecture
// and os type.
export interface VersionList {
  // The version is the semver equivalent version of the version number.
  // An example is 2.9 would translate into 2.9.0
  [version: string]: {
    [name: string]: VersionObj;
  };
}

export interface VersionObj {
  url?: string;
  size?: number;
}

/**
 * Get the version from the version list.
 * 
 * @param versionList The version list object.
 * @param version Optional field for the semver version number or latest.
 * 
 * @returns The object with paritial urls associated with the binary size.
 */
export function getVersion(versionList: VersionList,
      version?: string): { [key: string]: VersionObj } {
  if (version && version !== 'latest') {
    return versionList[version];
  } else {
    let latestVersion = null;
    for (let versionKey of Object.keys(versionList)) {
      if (!latestVersion) {
        latestVersion = versionKey;
      } else {
        if (semver.gt(versionKey, latestVersion)) {
          latestVersion = versionKey;
        }
      }
    }
    return versionList[latestVersion];
  }
}