import * as path from 'path';

// Change the output directory for all providers.
// This will download to the webdriver-manager/downloads directory.
export const OUT_DIR = path.resolve(__dirname, '..', '..', '..', 'downloads');

/**
 * The provider interface implemented by all providers.
 */
export interface ProviderInterface {
  cleanFiles?: () => string;
  getBinaryPath?: (version?: string) => string | null;
  getStatus?: () => string | null;
  updateBinary: (version?: string, maxVersion?: string) => Promise<void>;
  seleniumFlag?: string;
  osType?: string;
  version?: string;
  maxVersion?: string;
}

/**
 * The provider class with commonmethods by all providers.
 */
export class ProviderClass {
  /**
   * Setting values from either the npmrc or config object:
   *   1. Use the default value
   *   2. If the npmrc value exists, use the npmrc value
   *   2. If the value is set in the config, use that instead.
   * @param key 
   * @param defaultValue
   * @param providerConfig
   * @return The value of the variable. The type needs to be fixed.
   */
  setVar<T>(key: string, defaultValue: T,
    providerConfig: ProviderConfig): T {
  let value: T = defaultValue;
  if (process.env[`npm_config_${key}`]) {
    value = process.env[`npm_config_${key}`] as any as T;
  }
  if (providerConfig && providerConfig[key]) {
    value = providerConfig[key] as any as T;
  }
  return value;
  }
}

/**
 * The provider configuration is passed to the Provider and can override
 * the default behavior of the provider.
 */
export interface ProviderConfig {
  // The request url to get the list of binaries available to download.
  requestUrl?: string;
  // The location of the output directory where to store the cache file,
  // the config file and the binaries.
  outDir?: string;
  // The cache file name is just the file name and not the full path.
  // The file contains the body returned from the request url.
  cacheFileName?: string;
  // The config file name is just the file name and not the full path.
  // The file contains a json object of the list of all downloaded
  // binaries and the last downloaded binary.
  configFileName?: string;
  // The os type of this system.
  osType?: string;
  // The os architecture of this system.
  osArch?: string;
  // The proxy requests must go through (optional).
  proxy?: string;
  // Set the requests to ignore SSL (optional).
  ignoreSSL?: boolean;
  // The version number (optional).
  version?: string;
  // The max version number. Partially match is okay (optional).
  maxVersion?: string;
  // Catch all for other things.
  [key: string]: string|boolean|number;
}
