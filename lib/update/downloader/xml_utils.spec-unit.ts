import * as fs from 'fs';
import * as path from 'path';
import * as xmlUtils from './xml_utils';

const fileName = path.resolve('spec/support/files/foo.xml');
const contents = fs.readFileSync(fileName).toString();

describe('xml utils', () => {
  describe('readXml', () => {
    it('should read the file', () => {
      spyOn(fs, 'readFileSync').and.returnValue(contents);
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

  describe('isExpired', () => {
    it('should return true if the file is zero', () => {
      let mtime = Date.now() - 1000;
      spyOn(fs, 'statSync').and.returnValue({
        size: 0,
        mtime: mtime
      });
      expect(xmlUtils.isExpired('foobar.xml')).toBeTruthy();
    });

    it('should return true if the file is zero', () => {
      let mtime = Date.now() - (60 * 60 * 1000) - 5000;
      spyOn(fs, 'statSync').and.returnValue({
        size: 1000,
        mtime: mtime
      });
      expect(xmlUtils.isExpired('foobar.xml')).toBeTruthy();
    });

    it('should return true if the file is zero', () => {
      let mtime = Date.now() - (60 * 60 * 1000) + 5000;
      spyOn(fs, 'statSync').and.returnValue({
        size: 1000,
        mtime: mtime
      });
      expect(xmlUtils.isExpired('foobar.xml')).toBeFalsy();
    });
  });
});