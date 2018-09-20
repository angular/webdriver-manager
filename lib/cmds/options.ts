/**
 * An options object to update and start the server.
 */
export interface Options {
  // A list of browser drivers.
  browserDrivers?: BrowserDriver[];
  // The server.
  server?: Server;
  // The proxy url (must include protocol with url)
  proxy?: string;
  // To ignore SSL certs when making requests.
  ignoreSSL?: boolean;
  // The location where files should be saved.
  outDir?: string;
  // Use a github token for github requests.
  githubToken?: string;
}

/**
 * Contains information about a browser driver.
 */
export interface BrowserDriver {
  // The name of the browser driver.
  name?: 'chromedriver'|'geckodriver'|'iedriver';
  // The version which does not have to follow semver.
  version?: string;
}

/**
 * Contains information about the selenium server standalone. This includes
 * options to start the server along with options to send to the server.
 */
export interface Server {
  // The name of the server option.
  name?: 'selenium';
  // The version which does not have to follow semver.
  version?: string;
  // Run as role = node option.
  runAsNode?: boolean;
  // The relative or full path to the chrome logs file.
  chrome_logs?: string;
  // The full path to the edge driver server.
  edge?: string;
  // Detach the server and return the process to the parent.
  runAsDetach?: boolean;
  // Port number to start the server.
  port?: number;
}