import * as fs from 'fs';
import {GithubApiConfigSource, XmlConfigSource} from '../../lib/binaries/config_source';
import {Config} from '../../lib/config';

export class XMLConfig extends XmlConfigSource {
  constructor(public name: string, public xmlUrl: string) {
    super(name, xmlUrl);
  }
  getUrl(version: string): Promise<{url: string, version: string}> {
    return null;
  }
  getVersionList(): Promise<string[]> {
    return null;
  }
  testGetXml(): Promise<any> {
    return this.getXml();
  }
}

export class JSONConfig extends GithubApiConfigSource {
  constructor(name: string, url: string) {
    super(name, url);
  }
  getUrl(version: string): Promise<{url: string, version: string}> {
    return null;
  }
  getVersionList(): Promise<string[]> {
    return null;
  }
  testGetJson(): Promise<any> {
    return this.getJson();
  }
}

describe('config', () => {
  describe('xml config source', () => {
    it('on start: should read the xml file and not check the timestamp', done => {
      spyOn(fs, 'readFileSync').and.callFake(() => {
        return `
        <?xml version='1.0' encoding='UTF-8'?>
        <ListBucketResult xmlns="http://doc.s3.amazonaws.com/2006-03-01">
          <Name>foobar-release</Name>
          <Contents>
            <Key>0.01/foobar.zip</Key>  
          </Contents>
        </ListBucketResult>
        `;
      });
      spyOn(fs, 'statSync').and.callFake(() => {
        return {
          mtime: 0
        }
      });
      Config.runCommand = 'start';
      let xmlConfig = new XMLConfig('xml', 'url');
      xmlConfig.testGetXml()
          .then(xml => {
            expect(xml.ListBucketResult.Name).toEqual(['foobar-release']);
            done();
          })
          .catch(err => {
            done.fail(err);
          });
    });

    it('on udpate: should check the timestamp, invaidate cache, and try to make a web request',
       done => {
         spyOn(fs, 'readFileSync').and.callFake(() => {
           return 'foobar';
         });
         spyOn(fs, 'statSync').and.callFake(() => {
           return {
             mtime: 0
           }
         });
         Config.runCommand = 'update';
         let xmlConfig = new XMLConfig('xml', 'url');
         xmlConfig.testGetXml()
             .then(xml => {
               // should do nothing
               done.fail('this should not work');
             })
             .catch(err => {
               expect(err.toString()).toContain('Invalid URI "url"');
               done();
             });
       });

    it('on update: if the size of the file is zero, invalidate the cache', done => {
      spyOn(fs, 'statSync').and.callFake(() => {
        return {size: 0};
      });
      Config.runCommand = 'update';
      let xmlConfig = new XMLConfig('json', 'url');
      xmlConfig.testGetXml()
          .then(xml => {
            // should do nothing
            done.fail('this should not work');
          })
          .catch(err => {
            expect(err.toString()).toContain('Invalid URI "url"');
            done();
          });
    });
  });

  describe('github json', () => {
    it('on start: should read the json file and not check the timestamp', done => {
      spyOn(fs, 'readFileSync').and.callFake(() => {
        return '{ "foo": "bar" }';
      });
      spyOn(fs, 'statSync').and.callFake(() => {
        return {
          mtime: 0
        }
      });
      Config.runCommand = 'start';
      let jsonConfig = new JSONConfig('json', 'url');
      jsonConfig.testGetJson()
          .then(json => {
            expect(json.foo).toEqual('bar');
            done();
          })
          .catch(err => {
            done.fail(err);
          });
    });

    it('on udpate: should check the timestamp, invaidate cache, and try to make a web request',
       done => {
         spyOn(fs, 'readFileSync').and.callFake(() => {
           return 'foobar';
         });
         spyOn(fs, 'statSync').and.callFake(() => {
           return {
             mtime: 0
           }
         });
         Config.runCommand = 'update';
         let jsonConfig = new JSONConfig('json', 'url');
         jsonConfig.testGetJson()
             .then(json => {
               // should do nothing
               done.fail('this should not work');
             })
             .catch(err => {
               expect(err.toString()).toContain('Invalid URI "url"');
               done();
             });
       });

    it('on update: if the size of the file is zero, invalidate the cache', done => {
      spyOn(fs, 'statSync').and.callFake(() => {
        return {size: 0};
      });
      Config.runCommand = 'update';
      let jsonConfig = new JSONConfig('json', 'url');
      jsonConfig.testGetJson()
          .then(json => {
            // should do nothing
            done.fail('this should not work');
          })
          .catch(err => {
            expect(err.toString()).toContain('Invalid URI "url"');
            done();
          });
    });
  });
});
