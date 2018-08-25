import * as fs from 'fs';
import {convertXmlToVersionList} from './cloud_storage_xml';

const contents = `
<?xml version='1.0' encoding='UTF-8'?>
<ListBucketResult xmlns='http://doc.s3.amazonaws.com/2006-03-01'>
  <Name>foobar_driver</Name>
  <Contents>
    <Key>2.0/foobar.zip</Key>
    <Size>10</Size>
  </Contents>
  <Contents>
    <Key>2.1/foobar.zip</Key>
    <Size>11</Size>
  </Contents>
</ListBucketResult>`;

export function versionParser(key: string): string {
  const regex = /([0-9]*.[0-9]*)\/foobar.*.zip/g;
  try {
    return regex.exec(key)[1];
  } catch (err) {
    return null;
  }
}

export function semanticVersionParser(key: string): string {
  const regex = /([0-9]*.[0-9]*)\/foobar.*.zip/g;
  try {
    return regex.exec(key)[1] + '.0';
  } catch (err) {
    return null;
  }
}

describe('cloud_storage_xml', () => {
  describe('convertXmlToVersionList', () => {
    it('should convert an xml file an object from the xml file', () => {
      spyOn(fs, 'readFileSync').and.returnValue(contents);
      const versionList = convertXmlToVersionList(
          'foobar', '.zip', versionParser, semanticVersionParser);
      expect(Object.keys(versionList).length).toBe(2);
      expect(versionList['2.0.0']['foobar.zip'].url).toBe('2.0/foobar.zip');
      expect(versionList['2.0.0']['foobar.zip'].size).toBe(10);
      expect(versionList['2.1.0']['foobar.zip'].url).toBe('2.1/foobar.zip');
      expect(versionList['2.1.0']['foobar.zip'].size).toBe(11);
    });

    it('should return null when the method to read an xml file returns null',
       () => {
         const versionList = convertXmlToVersionList(
             'foo', '.zip', versionParser, semanticVersionParser);
         expect(versionList).toBeNull();
       });
  });
});