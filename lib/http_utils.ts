import {OptionsWithUrl} from 'request';
import * as url from 'url';

import {Logger} from './cli/logger';
import {Config} from './config';

let logger = new Logger('http_utils');

export declare interface RequestOptionsValue {
  proxy?: string;
  ignoreSSL?: boolean;
}

let requestOpts: RequestOptionsValue = {};

export class HttpUtils {
  static assignOptions(options: RequestOptionsValue): void {
    Object.assign(requestOpts, options);
  }

  static initOptions(url: string, timeout?: number): OptionsWithUrl {
    let options: OptionsWithUrl = {
      url: url,
      // default Linux can be anywhere from 20-120 seconds
      // increasing this arbitrarily to 4 minutes
      timeout: 240000
    };
    HttpUtils.optionsSSL(options, requestOpts.ignoreSSL);
    HttpUtils.optionsProxy(options, url, requestOpts.proxy);
    return options;
  }

  static optionsSSL(options: OptionsWithUrl, opt_ignoreSSL: boolean): OptionsWithUrl {
    if (opt_ignoreSSL) {
      logger.info('ignoring SSL certificate');
      options.strictSSL = !opt_ignoreSSL;
      (options as any).rejectUnauthorized = !opt_ignoreSSL;
    }

    return options;
  }

  static optionsProxy(options: OptionsWithUrl, requestUrl: string, opt_proxy: string):
      OptionsWithUrl {
    if (opt_proxy) {
      options.proxy = HttpUtils.resolveProxy(requestUrl, opt_proxy);
      if (url.parse(requestUrl).protocol === 'https:') {
        options.url = requestUrl.replace('https:', 'http:');
      }
    }
    return options;
  }

  static optionsHeader(options: OptionsWithUrl, key: string, value: string): OptionsWithUrl {
    if (options.headers == null) {
      options.headers = {};
    }
    options.headers[key] = value;
    return options;
  }

  /**
   * Resolves proxy based on values set
   * @param fileUrl The url to download the file.
   * @param opt_proxy The proxy to connect to to download files.
   * @return Either undefined or the proxy.
   */
  static resolveProxy(fileUrl: string, opt_proxy?: string): string {
    let protocol = url.parse(fileUrl).protocol;
    let hostname = url.parse(fileUrl).hostname;

    if (opt_proxy) {
      return opt_proxy;
    } else {
      // If the NO_PROXY environment variable exists and matches the host name,
      // to ignore the resolve proxy.
      // the checks to see if it exists and equal to empty string is to help with testing
      let noProxy: string = Config.noProxy();
      if (noProxy) {
        // array of hostnames/domain names listed in the NO_PROXY environment variable
        let noProxyTokens = noProxy.split(',');
        // check if the fileUrl hostname part does not end with one of the
        // NO_PROXY environment variable's hostnames/domain names
        for (let noProxyToken of noProxyTokens) {
          if (hostname.indexOf(noProxyToken) !== -1) {
            return undefined;
          }
        }
      }

      // If the HTTPS_PROXY and HTTP_PROXY environment variable is set, use that as the proxy
      if (protocol === 'https:') {
        return Config.httpsProxy() || Config.httpProxy();
      } else if (protocol === 'http:') {
        return Config.httpProxy();
      }
    }
    return undefined;
  }
}
