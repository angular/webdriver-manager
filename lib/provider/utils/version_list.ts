import * as fs from 'fs';
import * as semver from 'semver';

/**
 * An object of multiple versions of a binary. Each version could have
 * different keys where each key represents a partial url path. Each
 * partial url path could represent a combination of os architecture
 * and os type.
 */
export interface VersionList {
  // The forced version is the semver equivalent version of the
  // actual version number. An example is 2.9 would translate into 2.9.0
  [forcedVersion: string]: {

    // The name of the binary file.
    [name: string]: VersionObj;
  };
}

/**
 * Information about the binary file.
 */
export interface VersionObj {
  // The file name.
  name?: string;

  // The content length of the file.
  size?: number;

  // The full or partial url get the binary.
  url?: string;

  // The actual version number, not the forced semantic version.
  version?: string;
}

/**
 * Encapsulates the getVersionObjs and getVersionObj into a single method.
 * @param versionList The version list object.
 * @param osMatch The OS name and architecture.
 * @param version Optional field for the semver version number or latest.
 * * @returns Either a VersionObj or null.
 */
export function getVersion(
    versionList: VersionList, osMatch: string, version?: string): VersionObj|
    null {
  const versionObjs = getVersionObjs(versionList, version);
  return getVersionObj(versionObjs, osMatch);
}

/**
 * Get the version obj from the version list.
 * @param versionList The version list object.
 * @param version Optional field for the semver version number or latest.
 * @returns The object with paritial urls associated with the binary size.
 */
export function getVersionObjs(
    versionList: VersionList, version?: string): {[key: string]: VersionObj} {
  if (version && version !== 'latest') {
    return versionList[version];
  } else {
    let latestVersion = null;
    for (const versionKey of Object.keys(versionList)) {
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

/**
 * Get the version obj from the map.
 * @param versionObjs A map of partial urls to VersionObj
 * @param osMatch The OS name and architecture.
 * @returns Either a VersionObj or null.
 */
export function getVersionObj(
    versionObjMap: {[key: string]: VersionObj}, osMatch: string): VersionObj|
    null {
  for (const name of Object.keys(versionObjMap)) {
    if (name.includes(osMatch)) {
      return versionObjMap[name];
    }
  }
  return null;
}