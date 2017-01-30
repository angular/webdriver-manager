import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as request from 'request';
import * as xml2js from 'xml2js';

import {Config} from '../config';
import {HttpUtils} from '../http_utils';

export abstract class ConfigSource {
  ostype = Config.osType();
  osarch = Config.osArch();
  out_dir: string = Config.getSeleniumDir();
  opt_ignoreSSL: boolean;
  opt_proxy: string;

  abstract getUrl(version: string): Promise<{url: string, version: string}>;
  abstract getVersionList(): Promise<string[]>;
}

export abstract class XmlConfigSource extends ConfigSource {
  xml: any;
  xmlUrl: string;
  fileName: string;

  constructor(private name: string) {
    super();
  }

  protected getFileName(): string {
    try {
      fs.statSync(this.out_dir);
    } catch (e) {
      fs.mkdirSync(this.out_dir);
    }
    this.fileName = path.resolve(this.out_dir, this.name + '-response.xml');
    return this.fileName;
  }

  protected getXml(): Promise<any> {
    this.getFileName();
    let content = this.readResponse();
    if (content != null) {
      this.xml = content;
      return Promise.resolve(this.xml);
    }
    return this.requestXml(this.xmlUrl, this.opt_ignoreSSL, this.opt_proxy).then(text => {
      this.xml = this.convertXml2js(text);
      fs.writeFileSync(this.fileName, text);
      return this.xml;
    });
  }

  private readResponse(): any {
    try {
      let contents = fs.readFileSync(this.fileName).toString();
      let timestamp = new Date(fs.statSync(this.fileName).mtime).getTime();

      let now = Date.now();
      if (now - 36000000 < timestamp) {
        return this.convertXml2js(contents);
      }
    } catch (err) {
      return null;
    }
  }

  private requestXml(url: string, opt_ignoreSSL: boolean, opt_proxy: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let options = HttpUtils.initOptions(url);
      options = HttpUtils.optionsSSL(options, opt_ignoreSSL);
      options = HttpUtils.optionsProxy(options, url, opt_proxy);

      let req = request(options);
      req.on('response', response => {
        if (response.statusCode === 200) {
          // logger.info('curl -v ' + options.url);
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
  json: any;
  jsonUrl: string;
  fileName: string;

  constructor(private name: string) {
    super();
  }

  protected getFileName(): string {
    try {
      fs.statSync(this.out_dir);
    } catch (e) {
      fs.mkdirSync(this.out_dir);
    }
    this.fileName = path.resolve(this.out_dir, this.name + '-response.json');
    return this.fileName;
  }

  protected abstract getJson(): Promise<string>;
}

export abstract class GithubApiConfigSource extends JsonConfigSource {
  constructor(name: string) {
    super(name);
  }

  /**
   * This is an unauthenticated request and since Github limits the rate, we will cache this
   * to a file. { timestamp: number, response: response }. We will check the timestamp and renew
   * this request if the file is older than an hour.
   */
  getJson(): Promise<any> {
    this.getFileName();
    let content = this.readResponse();
    if (content != null) {
      this.json = content;
      return Promise.resolve(this.json);
    }
    return this.requestJson().then(() => {
      fs.writeFileSync(this.fileName, JSON.stringify(this.json, null, '  '));
      return this.json;
    });
  }

  private requestJson(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let options = HttpUtils.initOptions(this.jsonUrl);
      options = HttpUtils.optionsSSL(options, this.opt_ignoreSSL);
      options = HttpUtils.optionsProxy(options, this.jsonUrl, this.opt_proxy);
      options = HttpUtils.optionsHeader(options, 'Host', 'api.github.com');
      options = HttpUtils.optionsHeader(options, 'User-Agent', 'request');

      let req = request(options);
      req.on('response', response => {
        if (response.statusCode === 200) {
          // logger.info('curl -v ' + options.url);
          let output = '';
          response.on('data', (data) => {
            output += data;
          });
          response.on('end', () => {
            this.json = JSON.parse(output);
            resolve(this.json);
          });

        } else {
          reject(new Error('response status code is not 200'));
        }
      })
    });
  }

  private readResponse(): any {
    try {
      let contents = fs.readFileSync(this.fileName).toString();
      let timestamp = new Date(fs.statSync(this.fileName).mtime).getTime();

      let now = Date.now();
      if (now - 36000000 < timestamp) {
        return JSON.parse(contents);
      }
    } catch (err) {
      return null;
    }
  }
}
