# webdriver-manager [![CircleCI](https://circleci.com/gh/angular/webdriver-manager/tree/replacement.svg?style=svg)](https://circleci.com/gh/angular/webdriver-manager/tree/replacement)

* [Use as a dependency](#use-as-a-dependency)
* [Use as a command line interface](#use-as-a-command-line-interface)
* [Command line interface --help commands](#command-line-interface---help-commands)
* [Older versions of webdriver-manager](#older-versions-of-webdriver-manager)
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

Notes:
* Installing globally will not work with Protractor if you are trying to
start a Selenium Standalone server with a "local" or "directConnect", because
Protractor installs its own version of webdriver-manager as a dependency.
* Right now there is an issue with downloading the latest ChromeDriver.
It might not be compatible with the current version of Chrome.
The latest available version of ChromeDriver is the *v74.x.x.x*
but this one only works with Chrome *v74.x.x.x* which is in Beta right now.
So, if you have installed the latest stable version of Chrome (*v73.x.x.x*)
you should pin that ChromeDriver version to be
downloaded: `webdriver-manager update --versions.chrome=73.0.3683.68`.
To find out the latest version, check out http://chromedriver.chromium.org/ .

## Command line interface --help commands

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

## Older versions of webdriver-manager

NOTE: It is recommended to use the latest since it will have improvements and bug
fixes.

If you are running versions 10 - 12, see the
[Legacy branch](https://github.com/angular/webdriver-manager/tree/legacy).
Please also see the [CHANGELOG.md](CHANGELOG.md) since there have been many bug
fixes and it might be a good idea to upgrade to the latest.

If you are running versions 9 or lower, reference
[pose/webdriver-manager](https://github.com/pose/webdriver-manager). If there
are features that existed in version 9 and lower, please open up an issue with
the missing feature or a create a pull request.