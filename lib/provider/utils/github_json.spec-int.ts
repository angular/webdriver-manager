import * as path from 'path';
import {checkConnectivity} from '../../../spec/support/helpers/test_utils';
import {convertJsonToVersionList, requestRateLimit} from './github_json';

const fileName = path.resolve('spec/support/files/gecko.json');

describe('github_json', () => {
  describe('requestRateLimit', () => {
    it('should get rate limit assuming quota exists', async () => {
      if (await checkConnectivity('rate limit test')) {
        const rateLimit = await requestRateLimit();
        expect(rateLimit).toBeTruthy();
        const rateLimitObj = JSON.parse(rateLimit);
        expect(rateLimitObj['resources']).toBeTruthy();
        expect(rateLimitObj['resources']['core']).toBeTruthy();
      }
    });
  });

  describe('convertJsonToVersionList', () => {
    it('should convert the json', () => {
      const geckoVersionList = convertJsonToVersionList(fileName);
      expect(Object.keys(geckoVersionList).length).toBe(3);
      expect(geckoVersionList['0.20.0']).toBeTruthy();
      expect(geckoVersionList['0.20.1']).toBeTruthy();
      expect(geckoVersionList['0.21.0']).toBeTruthy();
    });
  });
});