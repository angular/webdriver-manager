import * as path from 'path';
import { convertJsonToVersionList } from './geckodriver';
import { toASCII } from 'punycode';

const fileName = path.resolve('spec/support/files/gecko.json');

describe('geckodriver', () => {
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