import { Provider } from '../provider/provider';

/**
 * An options object to update and start the server.
 */
export interface Options {
  /**
   * A provider contains information about a browser driver not including
   * the server.
   */
  providers?: Array<{
    // The name of the binary.
    name?: string,
    // The version which does not have to follow semver.
    version?: string,
    // The binary provider object.
    binary?: Provider
  }>,
  server?: {
    // The name of the server.
    name?: string,
    // The version which does not have to follow semver.
    version?: string,
    // The server binary object.
    binary?: Provider
  },
  // The proxy url (must include protocol with url)
  proxy?: string,
  // To ignore SSL certs when making requests.
  ignoreSSL?: boolean,
  // The location where files should be saved.
  outDir?: string
}