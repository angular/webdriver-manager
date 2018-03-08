import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as request from 'request';
import * as url from 'url';
import * as xml2js from 'xml2js';

import {Logger} from '../cli/logger';
import {Config} from '../config';
import {HttpUtils} from '../http_utils';

let logger = new Logger('config_source');

export abstract class ConfigSource {
  ostype = Config.osType();
  osarch = Config.osArch();
  out_dir: string = Config.getSeleniumDir();

  abstract getUrl(version: string): Promise<{url: string, version: string}>;
  abstract getVersionList(): Promise<string[]>;
}

export abstract class XmlConfigSource extends ConfigSource {
  constructor(public name: string, public xmlUrl: string) {
    super();
  }

  protected getFileName(): string {
    try {
      fs.statSync(this.out_dir);
    } catch (e) {
      fs.mkdirSync(this.out_dir);
    }
    return path.resolve(this.out_dir, this.name + '-response.xml');
  }

  protected getXml(): Promise<any> {
    let fileName = this.getFileName();
    let content = this.readResponse();
    if (content) {
      return Promise.resolve(content);
    } else {
      return this.requestXml().then(text => {
        let xml = this.convertXml2js(text);
        fs.writeFileSync(fileName, text);
        return xml;
      });
    }
  }

  private readResponse(): any {
    let fileName = this.getFileName();
    try {
      let contents = fs.readFileSync(fileName).toString();
      let timestamp = new Date(fs.statSync(fileName).mtime).getTime();
      let size = fs.statSync(fileName).size;
      let now = Date.now();

      // On start, read the file. If not on start, check use the cache as long as the
      // size > 0 and within the cache time.
      // 60 minutes * 60 seconds / minute * 1000 ms / second
      if (Config.runCommand === 'start' || (size > 0 && (now - (60 * 60 * 1000) < timestamp))) {
        return this.convertXml2js(contents);
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  }

  private requestXml(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let options = HttpUtils.initOptions(this.xmlUrl);

      let curl = this.getFileName() + ' ' + options.url;
      if (HttpUtils.requestOpts.proxy) {
        let pathUrl = url.parse(options.url.toString()).path;
        let host = url.parse(options.url.toString()).host;
        let newFileUrl = url.resolve(HttpUtils.requestOpts.proxy, pathUrl);
        curl = this.getFileName() + ' \'' + newFileUrl + '\' -H \'host:' + host + '\'';
      }
      if (HttpUtils.requestOpts.ignoreSSL) {
        curl = 'k ' + curl;
      }
      logger.info('curl -o' + curl);

      let req = request(options);
      req.on('response', response => {
        if (response.statusCode === 200) {
          let output = '';
          response.on('data', (data) => {
            output += data;
          });
          response.on('end', () => {
            resolve(output);
          });

        } else {
          reject(new Error('response status code is not 200'));
        }
      });
    });
  }

  private convertXml2js(xml: string): any {
    let retResult: any = null;
    xml2js.parseString(xml, (err, result) => {
      retResult = result;
    });
    return retResult;
  }
}

export abstract class JsonConfigSource extends ConfigSource {
  constructor(public name: string, public jsonUrl: string) {
    super();
  }

  protected getFileName(): string {
    try {
      fs.statSync(this.out_dir);
    } catch (e) {
      fs.mkdirSync(this.out_dir);
    }
    return path.resolve(this.out_dir, this.name + '-response.json');
  }

  protected abstract getJson(): Promise<string>;
}

export abstract class GithubApiConfigSource extends JsonConfigSource {
  constructor(name: string, url: string) {
    super(name, url);
  }

  /**
   * This is an unauthenticated request and since Github limits the rate, we will cache this
   * to a file. { timestamp: number, response: response }. We will check the timestamp and renew
   * this request if the file is older than an hour.
   */
  getJson(): Promise<any> {
    let fileName = this.getFileName();
    let content = this.readResponse();
    if (content) {
      return Promise.resolve(JSON.parse(content));
    } else {
      return this.requestJson().then(body => {
        let json = JSON.parse(body);
        fs.writeFileSync(fileName, JSON.stringify(json, null, '  '));
        return json;
      });
    }
  }

  private requestJson(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let options = HttpUtils.initOptions(this.jsonUrl);
      options = HttpUtils.optionsHeader(options, 'Host', 'api.github.com');
      options = HttpUtils.optionsHeader(options, 'User-Agent', 'request');

      let curl = this.getFileName() + ' ' + options.url;
      if (HttpUtils.requestOpts.proxy) {
        let pathUrl = url.parse(options.url.toString()).path;
        let host = url.parse(options.url.toString()).host;
        let newFileUrl = url.resolve(HttpUtils.requestOpts.proxy, pathUrl);
        curl = this.getFileName() + ' \'' + newFileUrl + '\' -H \'host:' + host + '\'';
      }
      if (HttpUtils.requestOpts.ignoreSSL) {
        curl = 'k ' + curl;
      }
      logger.info('curl -o' + curl);

      let req = request(options);
      req.on('response', response => {
        if (response.statusCode === 200) {
          let output = '';
          response.on('data', (data) => {
            output += data;
          });
          response.on('end', () => {
            resolve(output);
          });

        } else if (response.statusCode == 403 && response.headers['x-ratelimit-remaining'] == '0') {
          reject(new Error('Failed to make Github request, rate limit reached.'));
        } else {
          reject(new Error('response status code is not 200.  It was ' + response.statusCode));
        }
      })
    });
  }

  private readResponse(): any {
    let fileName = this.getFileName();
    try {
      let contents = fs.readFileSync(fileName).toString();
      let timestamp = new Date(fs.statSync(fileName).mtime).getTime();
      let size = fs.statSync(fileName).size;
      let now = Date.now();

      // On start, read the file. If not on start, check use the cache as long as the
      // size > 0 and within the cache time.
      // 60 minutes * 60 seconds / minute * 1000 ms / second
      if (Config.runCommand === 'start' || (size > 0 && (now - (60 * 60 * 1000) < timestamp))) {
        return contents;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  }
}
