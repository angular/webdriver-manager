import {convertArgs2AllOptions, convertArgs2Options} from './utils';

describe('utils', () => {
  describe('convertArgs2AllOptions', () => {
    it('should create all providers', () => {
      const argv = {
        _: ['foobar'],
        proxy: 'http://some.proxy.com',
        versions: {gecko: '0.16.0', chrome: '2.20'},
        out_dir: 'foobar_download',
        ignore_ssl: false,
        '$0': 'bin\\webdriver-manager'
      };
      const options = convertArgs2AllOptions(argv);
      expect(options.browserDrivers).toBeTruthy();
      expect(options.browserDrivers.length).toBe(3);
      for (const provider of options.browserDrivers) {
        if (provider.name === 'geckodriver') {
          expect(provider.version).toBe('0.16.0');
        }
        if (provider.name === 'chromedriver') {
          expect(provider.version).toBe('2.20');
        }
        if (provider.name === 'iedriver') {
          expect(provider.version).toBeUndefined();
        }
      }
      expect(options.server).toBeTruthy();
      expect(options.server.name).toBe('selenium');
      expect(options.server.version).toBeUndefined();
      expect(options.proxy).toBe('http://some.proxy.com');
      expect(options.ignoreSSL).toBeFalsy();
      expect(options.outDir).toBe('foobar_download');
    });
  });

  describe('convertArgs2Options', () => {
    it('should create the default providers', () => {
      const argv = {
        _: ['foobar'],
        chrome: true,
        gecko: true,
        standalone: true,
        versions: {gecko: '0.16.0', chrome: '2.20'},
        out_dir: 'foobar_download',
        '$0': 'bin\\webdriver-manager'
      };
      const options = convertArgs2Options(argv);
      expect(options.browserDrivers).toBeTruthy();
      expect(options.browserDrivers.length).toBe(2);
      for (const provider of options.browserDrivers) {
        if (provider.name === 'geckodriver') {
          expect(provider.version).toBe('0.16.0');
        }
        if (provider.name === 'chromedriver') {
          expect(provider.version).toBe('2.20');
        }
      }
      expect(options.server).toBeTruthy();
      expect(options.server.name).toBe('selenium');
      expect(options.server.version).toBeUndefined();
      expect(options.proxy).toBeUndefined();
      expect(options.ignoreSSL).toBeUndefined();
    });
  });
});