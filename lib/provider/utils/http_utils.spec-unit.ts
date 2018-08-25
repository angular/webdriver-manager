import {addHeader, initOptions, optionsProxy, optionsSSL, RequestOptionsValue, resolveProxy} from './http_utils';

describe('http utils', () => {
  describe('initOptions', () => {
    it('should create options', () => {
      const requestUrl = 'http://foobar.com';
      const options = initOptions(requestUrl, {});
      expect(options['url']).toBe(requestUrl);
      expect(options['timeout']).toBe(240000);
      expect(options['proxy']).toBeUndefined();
      expect(options['strictSSL']).toBeUndefined();
      expect(options['rejectUnauthorized']).toBeUndefined();
    });

    it('should create options with a proxy', () => {
      const requestUrl = 'http://foobar.com';
      const proxy = 'http://baz.com';
      const options = initOptions(requestUrl, {proxy});
      expect(options['url']).toBe(requestUrl);
      expect(options['timeout']).toBe(240000);
      expect(options['proxy']).toBe(proxy);
      expect(options['strictSSL']).toBeUndefined();
      expect(options['rejectUnauthorized']).toBeUndefined();
    });

    it('should create options with SSL', () => {
      const requestUrl = 'http://foobar.com';
      const options = initOptions(requestUrl, {ignoreSSL: true});
      expect(options['url']).toBe(requestUrl);
      expect(options['timeout']).toBe(240000);
      expect(options['proxy']).toBeUndefined();
      expect(options['strictSSL']).toBeFalsy();
      expect(options['rejectUnauthorized']).toBeFalsy();
    });

    it('should create options with SSL and proxy', () => {
      const requestUrl = 'http://foobar.com';
      const proxy = 'http://baz.com';
      const options = initOptions(requestUrl, {ignoreSSL: true, proxy});
      expect(options['url']).toBe(requestUrl);
      expect(options['timeout']).toBe(240000);
      expect(options['proxy']).toBe(proxy);
      expect(options['strictSSL']).toBeFalsy();
      expect(options['rejectUnauthorized']).toBeFalsy();
    });
  });

  describe('optionsSSL', () => {
    it('should set strictSSL and rejectUnauthorized', () => {
      let options: RequestOptionsValue = {url: 'http://foobar.com'};
      const ignoreSSL = true;
      options = optionsSSL(options, ignoreSSL);
      expect(options['strictSSL']).toBeFalsy();
      expect(options['rejectUnauthorized']).toBeFalsy();
    });

    it('should set not set strictSSL and rejectUnauthorized', () => {
      let options: RequestOptionsValue = {url: 'http://foobar.com'};
      const ignoreSSL = false;
      options = optionsSSL(options, ignoreSSL);
      expect(options['strictSSL']).toBeUndefined();
      expect(options['rejectUnauthorized']).toBeUndefined();
    });
  });

  describe('optionsProxy', () => {
    it('should set the proxy', () => {
      const requestUrl = 'http://foobar.com';
      let options: RequestOptionsValue = {url: requestUrl};
      const proxy = 'http://baz.com';
      options = optionsProxy(options, requestUrl, proxy);
      expect(options['proxy']).toBe(proxy);
    });

    it('should not set the proxy when the proxy is undefined', () => {
      const requestUrl = 'http://foobar.com';
      let options: RequestOptionsValue = {url: requestUrl};
      options = optionsProxy(options, requestUrl, undefined);
      expect(options['proxy']).toBeUndefined();
    });
  });

  describe('resolveProxy', () => {
    it('should return the proxy', () => {
      const requestUrl = 'http://foobar.com/foo/bar/index.html';
      const proxy = 'http://baz.com';
      const resolvedProxy = resolveProxy(requestUrl, proxy);
      expect(resolvedProxy).toBe(proxy);
    });

    it('should return the http proxy env for a http request url', () => {
      const requestUrl = 'http://foobar.com/foo/bar/index.html';
      const proxy = 'http://baz.com';
      process.env['HTTP_PROXY'] = proxy;
      expect(process.env['HTTP_PROXY']).toBe(proxy);

      const resolvedProxy = resolveProxy(requestUrl, undefined);
      expect(resolvedProxy).toBe(proxy);

      delete process.env['HTTP_PROXY'];
      expect(process.env['HTTP_PROXY']).toBeUndefined();
    });

    it('should be undefined for a https proxy env for a http request', () => {
      const requestUrl = 'http://foobar.com/foo/bar/index.html';
      const proxy = 'https://baz.com';
      process.env['HTTPS_PROXY'] = proxy;
      expect(process.env['HTTPS_PROXY']).toBe(proxy);

      const resolvedProxy = resolveProxy(requestUrl, undefined);
      expect(resolvedProxy).toBeUndefined();

      delete process.env['HTTPS_PROXY'];
      expect(process.env['HTTPS_PROXY']).toBeUndefined();
    });


    it('should return the https proxy env for a https request', () => {
      const requestUrl = 'https://foobar.com/foo/bar/index.html';
      const proxy = 'https://baz.com';
      process.env['HTTPS_PROXY'] = proxy;
      expect(process.env['HTTPS_PROXY']).toBe(proxy);

      const resolvedProxy = resolveProxy(requestUrl, undefined);
      expect(resolvedProxy).toBe(proxy);

      delete process.env['HTTPS_PROXY'];
      expect(process.env['HTTPS_PROXY']).toBeUndefined();
    });

    it('should return the http proxy env for a https request', () => {
      const requestUrl = 'https://foobar.com/foo/bar/index.html';
      const proxy = 'http://baz.com';
      process.env['HTTP_PROXY'] = proxy;
      expect(process.env['HTTP_PROXY']).toBe(proxy);

      const resolvedProxy = resolveProxy(requestUrl, undefined);
      expect(resolvedProxy).toBe(proxy);

      delete process.env['HTTP_PROXY'];
      expect(process.env['HTTP_PROXY']).toBeUndefined();
    });
  });

  describe('addHeader', () => {
    let options: RequestOptionsValue;
    beforeEach(() => {
      options = {url: 'http://foo.bar'};
    });
    it('should create a new header if no header exists', () => {
      const modifiedOptions = addHeader(options, 'foo', 'bar');
      expect(modifiedOptions.headers).toBeTruthy();
      expect(Object.keys(modifiedOptions.headers).length).toBe(1);
      expect(modifiedOptions.headers['foo']).toBe('bar');
    });

    it('should add a header to an existing header without destroying the value',
       () => {
         let modifiedOptions = addHeader(options, 'foo1', 'bar1');
         modifiedOptions = addHeader(options, 'foo2', 'bar2');
         expect(modifiedOptions.headers).toBeTruthy();
         expect(Object.keys(modifiedOptions.headers).length).toBe(2);
         expect(modifiedOptions.headers['foo1']).toBe('bar1');
         expect(modifiedOptions.headers['foo2']).toBe('bar2');
       });

    it('should replace the header if selecting the same header name', () => {
      let modifiedOptions = addHeader(options, 'foo', 'bar');
      expect(modifiedOptions.headers).toBeTruthy();
      expect(Object.keys(modifiedOptions.headers).length).toBe(1);
      expect(modifiedOptions.headers['foo']).toBe('bar');

      modifiedOptions = addHeader(options, 'foo', 'baz');
      expect(Object.keys(modifiedOptions.headers).length).toBe(1);
      expect(modifiedOptions.headers['foo']).toBe('baz');
    });
  });
});