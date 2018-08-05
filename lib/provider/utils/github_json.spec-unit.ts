import { hasQuota, RequestMethod } from './github_json';

describe('github_json', () => {
  describe('hasQuota', () => {
    it('should return true when there is quota', async() => {
      let requestMethod: RequestMethod = function(
          jsonUrl: string, {}, oauthToken?: string): Promise<string|null> {
        return Promise.resolve('{ "resources": { "core": { "remaining": 1 } } }');
      };
      let result = await hasQuota(null, requestMethod);
      expect(result).toBeTruthy();
    });

    it('should return false when there is no quota', async() => {
      let requestMethod = function(jsonUrl: string, {},
          oauthToken?: string): Promise<string|null> {
        return Promise.resolve('{ "resources": { "core": { "remaining": 0 } } }');
      };
      let result = await hasQuota(null, requestMethod);
      expect(result).toBeFalsy();
    });

    it('should return false when something wrong happened', async() => {
      let requestMethod = function(jsonUrl: string, {},
          oauthToken?: string): Promise<string|null> {
        return Promise.resolve('');
      };
      let result = await hasQuota(null, requestMethod);
      expect(result).toBeFalsy();
    });
  });
});