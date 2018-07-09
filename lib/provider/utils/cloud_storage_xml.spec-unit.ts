import * as fs from 'fs';
import { convertXmlToVersionList } from './cloud_storage_xml';

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
</ListBucketResult>`

describe('cloud_storage_xml', () => {
  describe('convertXmlToVersionList', () => {
    it ('should convert an xml file an object from the xml file', () => {
      spyOn(fs, 'readFileSync').and.returnValue(contents);
      let versionList = convertXmlToVersionList('foobar', '.zip');
      expect(Object.keys(versionList).length).toBe(2);
      expect(versionList['2.0.0']['foobar.zip'].url).toBe('2.0/foobar.zip');
      expect(versionList['2.0.0']['foobar.zip'].size).toBe(10);
      expect(versionList['2.1.0']['foobar.zip'].url).toBe('2.1/foobar.zip');
      expect(versionList['2.1.0']['foobar.zip'].size).toBe(11);
    });

    it('should return null when the method to read an xml file returns null', () => {
      let versionList = convertXmlToVersionList('foo', '.zip');
      expect(versionList).toBeNull();
    });
  });
});