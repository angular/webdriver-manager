
import * as child_process from 'child_process';
import * as xml_utils from './xml_utils';
import {httpServer} from '../../../spec/server/http_server';



function spawnProcess(task: string, opt_arg?: string[], opt_io?: string) {
  opt_arg = typeof opt_arg !== 'undefined' ? opt_arg : [];
  let stdio = 'inherit';
  if (opt_io === 'ignore') {
    stdio = 'ignore';
  }
  return child_process.spawn(task, opt_arg, {stdio: stdio});
}

function killProcess(proc: any) {
  proc.kill();
}

describe('xml_utils', () => {
  let proc: any;
  let origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeAll((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    proc = spawnProcess('npm', ['run', 'http-server']);
    console.log(proc.pid);
    setTimeout(() => {
      console.log('done!');
      done();
    }, 3000);
  });

  it('should get the xml file', (done) => {
    xml_utils.requestXml('http://127.0.0.1:8812/spec/support/files/foo.xml', 'foo.xml').then(() => {
      done();
    });
  })
  
  afterAll((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout;
    spawnProcess('kill', ['-TERM', proc.pid]);
    setTimeout(() => {
      console.log('done!');
      done();
    }, 3000);
  });
});