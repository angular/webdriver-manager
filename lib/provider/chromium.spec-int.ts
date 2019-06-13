import {Chromium} from './chromium';
import * as loglevel from 'loglevel';

const log = loglevel.getLogger('webdriver-manager');
log.setLevel('debug');

describe('chromium', () => {
  describe('class Chromium', () => {
    
    beforeAll(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    });

    it('should download a config', async () => {
      const chromium = new Chromium({});
      chromium.osType = 'Darwin'
      const majorVersion = '73';
      const allJson = await chromium.downloadAllJson();
      const versionJson = await chromium.downloadVersionJson(allJson, majorVersion);
      const storageJson = await chromium.downloadStorageObject(versionJson, majorVersion);
      await chromium.downloadUrl(storageJson, majorVersion);
    });
  });
});