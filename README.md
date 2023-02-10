# webdriver-manager [![CircleCI](https://circleci.com/gh/angular/webdriver-manager/tree/replacement.svg?style=svg)](https://circleci.com/gh/angular/webdriver-manager/tree/replacement)

* [Use as a dependency](#use-as-a-dependency)
* [Use as a command line interface](#use-as-a-command-line-interface)
* [The command line interface help commands](#the-command-line-interface-help-commands)
* [Environment variables](docs/env_vars.md)


## Use as a dependency

To install this as a dependency: `npm install -D webdriver-manager`. The
following is an example running webdriver-manager as a dependency.
The test downloads the providers and starts the selenium server standalone as
detached. After the test, it will shutdown the selenium server standalone.


```
import {
  Options,
  setLogLevel,
  shutdown,
  start,
  update,
} from 'webdriver-manager';

const options: Options = {
  browserDrivers: [{
    name: 'chromedriver'     // For browser drivers, we just need to use a valid
                             // browser driver name. Other possible values
                             // include 'geckodriver' and 'iedriver'.
  }],
  server: {
    name: 'selenium',
    runAsNode: true,          // If we want to run as a node. By default
                              // running as detached will set this to true.
    runAsDetach: true         // To run this in detached. This returns the
                              // process back to the parent process.
  }
};
setLogLevel('info');          // Required if we webdriver-manager to log to
                              // console. Not setting this will hide the logs.

describe('some web test', () => {
  beforeAll(async () => {
    await update(options);
    await start(options);
  });

  it('should run some web test', async () => {
    // Your async / await web test with some framework.
  });

  afterAll(async () => {
    await shutdown(options);  // Makes the web request to shutdown the server.
                              // If we do not call shutdown, the java command
                              // will still be running the server on port 4444.
  });
});

```

## Use as a command line interface

```
npm i -g webdriver-manager

webdriver-manager update      // Downloads the latest binaries.
webdriver-manager start       // Starts the selenium server standalone.
```

Note: Installing globally will not work with Protractor if you are trying to
start a Selenium Standalone server with a "local" or "directConnect". It will
not work for these since Protractor is looking files downloaded locally to
the project.

## The command line interface help commands

To get a list of commands for webdriver-manager, use the help flag.

```
webdriver-manager --help
webdriver-manager [command]

Commands:
  webdriver-manager clean     Removes downloaded files from the out_dir.
  webdriver-manager shutdown  Shutdown a local selenium server with GET request
  webdriver-manager start     Start up the selenium server.
  webdriver-manager status    List the current available binaries.
  webdriver-manager update    Install or update selected binaries.

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

To get a list of options that can be passed to the `webdriver-manager update`
command, use the help flag.

```
webdriver-manager update --help
webdriver-manager update

Install or update selected binaries.

Options:
  --version              Show version number                           [boolean]
  --help                 Show help                                     [boolean]
  --out_dir              Location of output.                            [string]
  --chrome               Install or update chromedriver.
                                                       [boolean] [default: true]
  --gecko                Install or update geckodriver.[boolean] [default: true]
  --github_token         Use a GitHub token to prevent rate limit issues.
                                                                        [string]
  --iedriver             Install or update ie driver. [boolean] [default: false]
  --ignore_ssl           Ignore SSL certificates.                      [boolean]
  --log_level            The log level of this CLI.   [string] [default: "info"]
  --proxy                Use a proxy server to download files.          [string]
  --standalone           Install or update selenium server standalone.
                                                       [boolean] [default: true]
  --versions.chrome      The chromedriver version.                      [string]
  --versions.gecko       The geckodriver version.                       [string]
  --versions.ie          The ie driver version.                         [string]
  --versions.standalone  The selenium server standalone version.        [string]
```