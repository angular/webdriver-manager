import * as path from 'path';

// Change the output directory for all providers.
// This will download to the webdriver-manager/downloads directory.
export const OUT_DIR = path.resolve(
  process.cwd(), '..', '..', '..', 'downloads');

/**
 * The provider updateBinary interface implemented by all providers.
 */
export interface Provider {
  cleanFiles?: () => string;
  getBinaryPath?: (version?: string) => string|null;
  getStatus?: () => string|null;
  updateBinary: (version?: string) => Promise<any>;
  seleniumFlag?: string;
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
}
