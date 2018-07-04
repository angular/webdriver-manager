import * as fs from 'fs';
import { convertXml2js, isExpired, readXml } from './file_utils';

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

describe('file_utils', () => {
  describe('isExpired', () => {
    it('should return true if the file is zero', () => {
      let mtime = Date.now() - 1000;
      spyOn(fs, 'statSync').and.returnValue({
        size: 0,
        mtime: mtime
      });
      expect(isExpired('foobar.xml')).toBeTruthy();
    });
  
    it('should return true if the file is zero', () => {
      let mtime = Date.now() - (60 * 60 * 1000) - 5000;
      spyOn(fs, 'statSync').and.returnValue({
        size: 1000,
        mtime: mtime
      });
      expect(isExpired('foobar.xml')).toBeTruthy();
    });
  
    it('should return true if the file is zero', () => {
      let mtime = Date.now() - (60 * 60 * 1000) + 5000;
      spyOn(fs, 'statSync').and.returnValue({
        size: 1000,
        mtime: mtime
      });
      expect(isExpired('foobar.xml')).toBeFalsy();
    });  
  });
  
  describe('readXml', () => {
    it('should read the file', () => {
      spyOn(fs, 'readFileSync').and.returnValue(contents);
      let xmlContent = readXml('foobar');
      expect(xmlContent['ListBucketResult']['Name'][0]).toBe('foobar_driver');
      expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
        .toBe('2.0/foobar.zip');
    });
  });
  
  describe('convertXml2js', () => {
    it('should convert the content to json', () => {
      let xmlContent = convertXml2js(contents);
      expect(xmlContent['ListBucketResult']['Name'][0]).toBe('foobar_driver');
      expect(xmlContent['ListBucketResult']['Contents'][0]['Key'][0])
        .toBe('2.0/foobar.zip');
    });
  });
});

