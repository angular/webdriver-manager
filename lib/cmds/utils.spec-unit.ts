import {constructAllProviders, constructProviders,} from './utils';

describe('utils', () => {
  describe('constructAllProviders', () => {
    it('should create all providers', () => {
      const argv = {
        _: ['foobar'],
        proxy: 'http://some.proxy.com',
        versions: {gecko: '0.16.0', chrome: '2.20'},
        out_dir: 'foobar_download',
        ignore_ssl: false,
        '$0': 'bin\\webdriver-manager'
      };
      const options = constructAllProviders(argv);
      expect(options.providers).toBeTruthy();
      expect(options.providers.length).toBe(3);
      for (const provider of options.providers) {
        if (provider.name === 'geckodriver') {
          expect(provider.version).toBe('0.16.0');
        }
        if (provider.name === 'chromedriver') {
          expect(provider.version).toBe('2.20');
        }
        if (provider.name === 'iedriver') {
          expect(provider.version).toBeUndefined();
        }
        expect(provider.binary).toBeTruthy();
      }
      expect(options.server).toBeTruthy();
      expect(options.server.name).toBe('selenium');
      expect(options.server.version).toBeUndefined();
      expect(options.server.binary).toBeTruthy();
      expect(options.proxy).toBe('http://some.proxy.com');
      expect(options.ignoreSSL).toBeFalsy();
      expect(options.outDir).toBe('foobar_download');
    });
  });
  describe('constructProviders', () => {
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
      const options = constructProviders(argv);
      expect(options.providers).toBeTruthy();
      expect(options.providers.length).toBe(2);
      for (const provider of options.providers) {
        if (provider.name === 'geckodriver') {
          expect(provider.version).toBe('0.16.0');
        }
        if (provider.name === 'chromedriver') {
          expect(provider.version).toBe('2.20');
        }
        expect(provider.binary).toBeTruthy();
      }
      expect(options.server).toBeTruthy();
      expect(options.server.name).toBe('selenium');
      expect(options.server.version).toBeUndefined();
      expect(options.server.binary).toBeTruthy();
      expect(options.proxy).toBeUndefined();
      expect(options.ignoreSSL).toBeUndefined();
    });
  });
});