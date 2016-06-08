/// <reference path = "../../typings/index.d.ts"/>

import {Downloader} from '../../lib/files';

describe('downloader', () => {
  let fileUrlHttp = 'http://foobar.com';
  let fileUrlHttps = 'https://foobar.com';
  let argProxy = 'http://foobar.arg';
  let envNoProxy = 'http://foobar.com';
  let envHttpProxy = 'http://foobar.env';
  let envHttpsProxy = 'https://foobar.env';

  it ('should return undefined when proxy arg is not used', () => {
    let proxy = Downloader.resolveProxy_(fileUrlHttp);
    expect(proxy).toBeUndefined();
  });

  describe('proxy arg', () => {
    let opt_proxy = 'http://bar.foo';
    it('should return the proxy arg', () => {
      let proxy = Downloader.resolveProxy_(fileUrlHttp, opt_proxy);
      expect(proxy).toBe(opt_proxy);
    });

    it('should always return the proxy arg with env var set', () => {
      process.env.HTTP_PROXY = envHttpProxy;
      process.env.HTTPS_PROXY = envHttpsProxy;
      process.env.NO_PROXY = envNoProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttp, opt_proxy);
      expect(proxy).toBe(opt_proxy);
    });
  });

  describe('environment varialbes', () => {
    beforeEach(() => {
      delete process.env.HTTP_PROXY;
      delete process.env.http_proxy;
      delete process.env.HTTPS_PROXY;
      delete process.env.https_proxy;
      delete process.env.NO_PROXY;
      delete process.env.no_proxy;
    });

    it('should return the HTTP env variable', () => {
      process.env.HTTP_PROXY = envHttpProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttp);
      expect(proxy).toBe(envHttpProxy);
    });

    it('should return the http env variable', () => {
      process.env.http_proxy = envHttpProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttp);
      expect(proxy).toBe(envHttpProxy);
    });

    it('should return the HTTPS env variable for https protocol', () => {
      process.env.HTTPS_PROXY = envHttpsProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttps);
      expect(proxy).toBe(envHttpsProxy);
    });

    it('should return the https env variable for https protocol', () => {
      process.env.https_proxy = envHttpsProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttps);
      expect(proxy).toBe(envHttpsProxy);
    });

    it('should return the HTTP env variable for https protocol', () => {
      process.env.HTTP_PROXY = envHttpProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttps);
      expect(proxy).toBe(envHttpProxy);
    });

    it('should return the https env variable for https protocol', () => {
      process.env.http_proxy = envHttpProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttps);
      expect(proxy).toBe(envHttpProxy);
    });

    describe('NO_PROXY environment variable', () => {
      beforeEach(() => {
        delete process.env.NO_PROXY;
        delete process.env.no_proxy;
      });

      it('should return null when the NO_PROXY matches the fileUrl', () => {
        process.env.NO_PROXY = envNoProxy;
        let proxy = Downloader.resolveProxy_(fileUrlHttp);
        expect(proxy).toBeUndefined();
      });

      it('should return null when the no_proxy matches the fileUrl', () => {
        process.env.no_proxy = envNoProxy;
        let proxy = Downloader.resolveProxy_(fileUrlHttp);
        expect(proxy).toBeUndefined();
      });
    });
  });
});
