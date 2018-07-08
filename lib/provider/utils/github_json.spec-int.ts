import * as path from 'path';
import { convertJsonToVersionList, requestRateLimit } from './github_json';
import { checkConnectivity } from '../../../spec/support/helpers/test_utils';

const fileName = path.resolve('spec/support/files/gecko.json');

describe('github_json', () => {

  describe('requestRateLimit', () => {
    it('should get rate limit assuming quota exists', async(done) => {
      if (!await checkConnectivity('rate limit test')) {
        done();
      }
      let rateLimit = await requestRateLimit();
      expect(rateLimit).toBeTruthy();
      let rateLimitObj = JSON.parse(rateLimit);
      expect(rateLimitObj['resources']).toBeTruthy();
      expect(rateLimitObj['resources']['core']).toBeTruthy();
      done();
    });
  });

  describe('convertJsonToVersionList', () => {
    it('should convert the json', () => {
      let geckoVersionList = convertJsonToVersionList(fileName);
      expect(Object.keys(geckoVersionList).length).toBe(3);
      expect(geckoVersionList['0.20.0']).toBeTruthy();
      expect(geckoVersionList['0.20.1']).toBeTruthy();
      expect(geckoVersionList['0.21.0']).toBeTruthy();
    });
  });
});