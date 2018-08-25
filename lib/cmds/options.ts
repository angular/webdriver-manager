import {ProviderInterface} from '../provider/provider';

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
    name?: string;
    // The version which does not have to follow semver.
    version?: string;
    // The binary provider object.
    binary?: ProviderInterface;
  }>;
  server?: {
    // The name of the server.
    name?: string;
    // The version which does not have to follow semver.
    version?: string;
    // The server binary object.
    binary?: ProviderInterface;
    // Run as role = node option.
    runAsNode?: boolean;
    // The relative or full path to the chrome logs file
    chrome_logs?: string;
    // The full path to the edge driver server
    edge?: string;
    // Detach the server and return the process to the parent.
    runAsDetach?: boolean;
  };
  // The proxy url (must include protocol with url)
  proxy?: string;
  // To ignore SSL certs when making requests.
  ignoreSSL?: boolean;
  // The location where files should be saved.
  outDir?: string;
}