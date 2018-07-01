import * as fs from 'fs';
import { isExpired } from './file_utils';

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