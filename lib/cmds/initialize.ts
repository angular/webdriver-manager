import * as os from 'os';
import * as path from 'path';
import * as q from 'q';
import * as glob from 'glob';
import * as ini from 'ini';
import * as fs from 'fs';
import * as child_process from 'child_process';
import {Logger} from '../cli';

const noop = () => {};

// Make a function which configures a child process to automatically respond
// to a certain question
function respondFactory(question: string, answer: string): Function {
  return (child: child_process.ChildProcess) => {
    (<any>child.stdin).setDefaultEncoding('utf-8');
    child.stdout.on('data', (data: Buffer|String) => {
      if (data != null) {
        if (data.toString().indexOf(question) != -1) {
          child.stdin.write(answer + '\n');
        }
      }
    });
  };
}

// Run a command on the android SDK
function runAndroidSDKCommand(sdkPath: string, cmd: string, args: string[],
    spawnOptions: Object, config_fun?: Function): q.Promise<any> {

  let child = child_process.spawn(path.join(sdkPath, 'tools', 'android'),
    [cmd].concat(args), spawnOptions);

  if(config_fun) {
    config_fun(child);
  };

  let deferred = q.defer()
  child.on('exit', (code: number) => {
    if (deferred != null) {
      if (code) {
        deferred.reject(code);
      } else {
        deferred.resolve();
      }
      deferred = null;
    }
  });
  child.on('error', (err: Error) => {
    if (deferred != null) {
      deferred.reject(err);
      deferred = null;
    }
  });
  return deferred.promise;
}

// Download updates via the android SDK
function downloadAndroidUpdates(sdkPath: string, targets: string[],
    search_all: boolean, auto_accept: boolean): q.Promise<any> {

  return runAndroidSDKCommand(sdkPath, 'update', ['sdk', '-u'].concat(search_all
      ? ['-a'] : []).concat(['-t', targets.join(',')]),
      {stdio: auto_accept ? 'pipe' : 'inherit'},
      auto_accept ? respondFactory('Do you accept the license', 'y') : noop);
}

// Setup hardware acceleration for x86-64 emulation
function setupHardwareAcceleration(sdkPath: string) {
  //TODO(sjelin): check that the BIOS option is set properly on linux 
  if (os.type() == 'Darwin') {
    console.log('Enabling hardware acceleration (requires root access)');
    child_process.spawnSync('sudo', [path.join(sdkPath, 'extras', 'intel',
        'Hardware_Accelerated_Execution_Manager', 'silent_install.sh')],
        {stdio: 'inherit'});
  } else if (os.type() == 'Windows_NT') {
    console.log('Enabling hardware acceleration (requires admin access)');
    child_process.spawnSync('runas', ['/noprofile', '/user:Administrator',
        path.join(sdkPath, 'extras', 'intel',
        'Hardware_Accelerated_Execution_Manager', 'silent_install.bat')],
        {stdio: 'inherit'});
  }
}

// Get a list of all the SDK download targets for a given set of APIs and ABIs
function getAndroidSDKTargets(apiLevels: string[], abis: string[]): string[] {
  return apiLevels.map((level) => {
    return 'android-' + level;
  }).concat(abis.reduce((targets, abi) => {
    let abiParts: string[] = abi.split('/');
    let deviceType: string = 'default';
    let architecture: string;
    if (abiParts.length == 1) {
      architecture = abiParts[0];
    } else {
      deviceType = abiParts[0];
      architecture = abiParts[1];
    }
    if (deviceType.toUpperCase() == 'DEFAULT') {
      deviceType = 'android';
    }
    return targets.concat(apiLevels.map((level) => {
      return 'sys-img-' + architecture + '-' + deviceType + '-' + level;
    }));
  }, []));
}

// All the information about an android virtual device
class AVDDescriptor {
  api: string;
  deviceType: string;
  architecture: string;
  abi: string;
  name: string;

  constructor(api: string, deviceType: string, architecture: string) {
    this.api = api;
    this.deviceType = deviceType;
    this.architecture = architecture;
    this.abi = (deviceType.toUpperCase() == 'DEFAULT' ? '' : deviceType + '/') +
      architecture;
    this.name = [api, deviceType, architecture].join('-');
  }

  avdName(version: string): string {
    return this.name + '-v' + version + '-wd-manager';
  }
}

// Gets the descriptors for all AVDs which are possible to make given the
// SDKs which were downloaded
function getAVDDescriptors(sdkPath: string): q.Promise<AVDDescriptor[]> {
  let deferred = q.defer<AVDDescriptor[]>();
  glob(path.join(sdkPath, 'system-images', '*', '*', '*'),
      (err: Error, files: string[]) => {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(files.map((file: string) => {
              let info = file.split(path.sep).slice(-3);
              return new AVDDescriptor(info[0], info[1], info[2]);
            }));
          }
      }
  );
  return deferred.promise;
}

function sequentialForEach<T>(array: T[], func: (x: T) => q.Promise<any>):
    q.Promise<any> {

  let ret = q(null);

  array.forEach((x: T) => {
    ret = ret.then(() => { return func(x); });
  });

  return ret;
}

// Configures the hardware.ini file for a system image of a new AVD
function configureAVDHardware(sdkPath: string, desc: AVDDescriptor):
    q.Promise<any> {
  let file = path.join(sdkPath, 'system-images', desc.api, desc.deviceType,
      desc.architecture, 'hardware.ini');
  return q.nfcall(fs.stat, file).then((stats: fs.Stats) => {
    return q.nfcall(fs.readFile, file);
  }, (err: Error) => {
    return q('');
  }).then((contents: string|Buffer) => {
    let config: any = ini.parse(contents.toString());
    config['hw.keyboard'] = 'yes';
    config['hw.battery'] = 'yes';
    config['hw.ramSize'] = 1024;
    return q.nfcall(fs.writeFile, file, ini.stringify(config));
  });
}

// Make an android virtual device
function makeAVD(sdkPath: string, desc: AVDDescriptor, version: string):
    q.Promise<any> {
  return runAndroidSDKCommand(sdkPath, 'delete',
      ['avd', '--name', desc.avdName(version)], {})
  .then(noop, noop).then(() => {
    return runAndroidSDKCommand(sdkPath, 'create',
      ['avd', '--name', desc.avdName(version), '--target', desc.api, '--abi',
      desc.abi], {stdio: 'pipe'},
      respondFactory('Do you wish to create a custom hardware profile', 'no'));
  });
}

// Initialize the android SDK
export function android(sdkPath: string, apiLevels: string[], abis: string[],
    acceptLicenses: boolean, version: string, logger: Logger): void {

  let avdDescriptors: AVDDescriptor[];
  let tools = ['platform-tool', 'tool'];
  if ((os.type() == 'Darwin') || (os.type() == 'Windows_NT')) {
    tools.push('extra-intel-Hardware_Accelerated_Execution_Manager');
  }

  logger.info('android-sdk: Downloading additional SDK updates');
  downloadAndroidUpdates(sdkPath, tools, false, acceptLicenses).then(() => {
    return setupHardwareAcceleration(sdkPath);
  }).then(() => {
    logger.info('android-sdk: Downloading more additional SDK updates ' +
                '(this may take a while)');
    return downloadAndroidUpdates(sdkPath, ['build-tools-24.0.0'].
        concat(getAndroidSDKTargets(apiLevels, abis)), true, acceptLicenses);
  }).then(() => {
    return getAVDDescriptors(sdkPath);
  }).then((descriptors: AVDDescriptor[]) => {
    avdDescriptors = descriptors;
    logger.info('android-sdk: Configuring virtual device hardware');
    return sequentialForEach(avdDescriptors, (descriptor: AVDDescriptor) => {
      return configureAVDHardware(sdkPath, descriptor);
    });
  }).then(() => {
    return sequentialForEach(avdDescriptors, (descriptor: AVDDescriptor) => {
      logger.info('android-sdk: Setting up virtual device "' + descriptor.name +
          '"');
      return makeAVD(sdkPath, descriptor, version);
    });
  }).then(() => {
    return q.nfcall(fs.writeFile, path.join(sdkPath, 'available_avds.json'),
        JSON.stringify(avdDescriptors.map((descriptor: AVDDescriptor) => {
          return descriptor.name;
        })));
  }).then(() => {
    logger.info('android-sdk: Initialization complete');
  }).done();
};
