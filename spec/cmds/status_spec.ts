import * as path from 'path';

import {Logger, WriteTo} from '../../lib/cli/logger';
import {program} from '../../lib/cmds/update';
import {spawnSync} from '../../lib/utils';

function getVersions(line: string): string[] {
  return line.split(':')[3].split(',');
}

describe('status', () => {
  Logger.writeTo = WriteTo.NONE;
  let argv: any;
  let tmpDir = path.resolve('selenium_test');

  // chrome 2.20[last], 2.24
  // geckodriver {{config version}} [last]
  // standalone 2.24 [last], {{config version}}
  beforeAll((done) => {
    argv = {
      '_': ['update'],
      'gecko': 'false',
      'versions': {'chrome': '2.24', 'standalone': '2.44.0'},
      'out_dir': tmpDir
    };
    program.run(JSON.parse(JSON.stringify(argv)))
        .then(() => {
          argv['versions']['chrome'] = '2.20';
          program.run(JSON.parse(JSON.stringify(argv))).then(() => {
            done();
          });
        })
        .catch(err => {
          done.fail();
        });
  });

  xit('should show the version number of the default and latest versions', () => {
    let lines =
        spawnSync(
            process.execPath,
            ['built/lib/webdriver.js', 'status', '--out_dir', 'selenium_test', '--gecko', 'false'],
            'pipe')
            .output[1]
            .toString()
            .split('\n');
    let seleniumLine: string = null;
    let chromeLine: string = null;
    // let geckodriverLine: string = null;
    let androidSdkLine: string = null;
    let appiumLine: string = null;

    for (let line of lines) {
      if (line.indexOf('selenium') >= 0) {
        seleniumLine = line;
      } else if (line.indexOf('chrome') >= 0) {
        chromeLine = line;
        // } else if (line.indexOf('geckodriver') >= 0) {
        //   geckodriverLine = line;
      } else if (line.indexOf('android-sdk') >= 0) {
        androidSdkLine = line;
      } else if (line.indexOf('appium') >= 0) {
        appiumLine = line;
      }
    }
    expect(seleniumLine).not.toBeNull();
    expect(getVersions(seleniumLine).length).toEqual(1);
    expect(getVersions(seleniumLine)[0]).toContain('2.44.0 [last]');

    expect(chromeLine).not.toBeNull();
    expect(getVersions(chromeLine).length).toEqual(2);
    expect(getVersions(chromeLine)[0]).toContain('2.20 [last]');
    expect(getVersions(chromeLine)[1]).toContain('2.24');

    // expect(geckodriverLine).not.toBeNull();
    // expect(geckodriverLine).toContain('[last]');
    // expect(getVersions(geckodriverLine).length).toEqual(1);

    expect(androidSdkLine).not.toBeNull();
    expect(androidSdkLine).toContain('not present');
    expect(appiumLine).not.toBeNull();
    expect(appiumLine).toContain('not present');
  });
});
