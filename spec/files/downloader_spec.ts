import {Config} from '../../lib/config';
import {Downloader} from '../../lib/files';

describe('downloader', () => {
  let fileUrlHttp = 'http://foobar.com';
  let fileUrlHttps = 'https://foobar.com';
  let argProxy = 'http://foobar.arg';
  let envNoProxy = 'http://foobar.com';
  let envHttpProxy = 'http://foobar.env';
  let envHttpsProxy = 'https://foobar.env';

  it('should return undefined when proxy arg is not used', () => {
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
      Config.httpProxy_ = envHttpProxy;
      Config.httpsProxy_ = envHttpsProxy;
      Config.noProxy_ = envNoProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttp, opt_proxy);
      expect(proxy).toBe(opt_proxy);
    });
  });

  describe('environment variables', () => {
    beforeEach(() => {
      Config.httpProxy_ = undefined;
      Config.httpsProxy_ = undefined;
      Config.noProxy_ = undefined;
    });

    it('should return the HTTP env variable', () => {
      Config.httpProxy_ = envHttpProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttp);
      expect(proxy).toBe(envHttpProxy);
    });

    it('should return the HTTPS env variable for https protocol', () => {
      Config.httpProxy_ = envHttpsProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttps);
      expect(proxy).toBe(envHttpsProxy);
    });

    it('should return the HTTP env variable for https protocol', () => {
      Config.httpProxy_ = envHttpProxy;
      let proxy = Downloader.resolveProxy_(fileUrlHttps);
      expect(proxy).toBe(envHttpProxy);
    });

    describe('NO_PROXY environment variable', () => {
      beforeEach(() => {
        Config.noProxy_ = undefined;
      });

      it('should return undefined when the NO_PROXY matches the fileUrl', () => {
        Config.noProxy_ = envNoProxy;
        let proxy = Downloader.resolveProxy_(fileUrlHttp);
        expect(proxy).toBeUndefined();
      });

      it('should return undefined when the no_proxy matches the fileUrl', () => {
        Config.noProxy_ = envNoProxy;
        let proxy = Downloader.resolveProxy_(fileUrlHttp);
        expect(proxy).toBeUndefined();
      });
    });
  });
});
