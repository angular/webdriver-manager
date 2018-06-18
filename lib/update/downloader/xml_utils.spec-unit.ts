import * as fs from 'fs';
import * as path from 'path';
import * as xmlUtils from './xml_utils';

const contents = `
  <?xml version='1.0' encoding='UTF-8'?>
  <ListBucketResult xmlns='http://doc.s3.amazonaws.com/2006-03-01'>
    <Name>foobar_driver</Name>
    <Contents>
      <Key>2.0/foobar.zip</Key>
    </Contents>
  </ListBucketResult>`

describe('xml utils', () => {
  describe('readXml', () => {
    it('should read the file', () => {
      spyOn(fs, 'readFileSync').and.callFake(() => {
        return contents;
      });
      let xmlContent = xmlUtils.readXml('foobar');
      expect(xmlContent['ListBucketResult']['Name'][0]).toBe('foobar_driver');
      expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
        .toBe('2.0/foobar.zip');
    });
  });

  describe('convertXml2js', () => {
    it('should convert the content to json', () => {
      let xmlContent = xmlUtils.convertXml2js(contents);
      expect(xmlContent['ListBucketResult']['Name'][0]).toBe('foobar_driver');
      expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
        .toBe('2.0/foobar.zip');
    });
  });
});