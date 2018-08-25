import {hasQuota, RequestMethod} from './github_json';

describe('github_json', () => {
  describe('hasQuota', () => {
    it('should return true when there is quota', async () => {
      const requestMethod: RequestMethod =
          (jsonUrl: string, {}, oauthToken?: string): Promise<string|null> => {
            return Promise.resolve(
                '{ "resources": { "core": { "remaining": 1 } } }');
          };
      const result = await hasQuota(null, requestMethod);
      expect(result).toBeTruthy();
    });

    it('should return false when there is no quota', async () => {
      const requestMethod =
          (jsonUrl: string, {}, oauthToken?: string): Promise<string|null> => {
            return Promise.resolve(
                '{ "resources": { "core": { "remaining": 0 } } }');
          };
      const result = await hasQuota(null, requestMethod);
      expect(result).toBeFalsy();
    });

    it('should return false when something wrong happened', async () => {
      const requestMethod =
          (jsonUrl: string, {}, oauthToken?: string): Promise<string|null> => {
            return Promise.resolve('');
          };
      const result = await hasQuota(null, requestMethod);
      expect(result).toBeFalsy();
    });
  });
});