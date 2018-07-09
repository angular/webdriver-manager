import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {
  tarFileList,
  uncompressTarball,
  unzipFile,
  zipFileList
} from './file_utils';

const tarballFile = path.resolve('spec/support/files/bar.tar.gz');
const zipFile = path.resolve('spec/support/files/bar.zip');

describe('file_utils', () => {
  describe('tarFileList', () => {
    it('should have a file list', async() => {
      let fileList = await tarFileList(tarballFile);
      expect(fileList).toBeTruthy();
      expect(fileList.length).toBe(1);
      expect(fileList[0]).toBe('bar');
    });

    it('should return an error if the file does not exist', async(done) => {
      try {
        await tarFileList('file_does_not_exist');
        done.fail();
      } catch (err) {
        expect(err).toBeTruthy();
        done();
      }
    });
  });

  describe('untarFile', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = path.resolve(os.tmpdir(), 'test');
      try {
        fs.mkdirSync(tmpDir)
      } catch(err) {}
    });

    afterAll(() => {
      rimraf.sync(tmpDir);
    });

    it('should uncompress the file', async() => {      
      let untarFiles = await uncompressTarball(tarballFile, tmpDir);
      let untarBar = path.resolve(tmpDir, 'bar');
      expect(untarFiles).toBeTruthy();
      expect(untarFiles.length).toBe(1);
      expect(untarFiles[0]).toBe(untarBar);
      expect(fs.statSync(untarBar).size).toBe(30);
    });
  });

  describe('zipFileList', () => {
    it('should have a file list', () => {
      let fileList = zipFileList(zipFile);
      expect(fileList).toBeTruthy();
      expect(fileList.length).toBe(1);
      expect(fileList[0]).toBe('bar');
    });

    it('should return an error if the file does not exist', (done) => {
      try {
        zipFileList('file_does_not_exist');
        done.fail();
      } catch (err) {
        expect(err).toBeTruthy();
        done();
      }
    });
  });

  describe('unzipFile', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = path.resolve(os.tmpdir(), 'test');
      try {
        fs.mkdirSync(tmpDir)
      } catch(err) {}
    });

    afterAll(() => {
      rimraf.sync(tmpDir);
    });
    
    it('should uncompress the file', () => {
      let zipFiles = unzipFile(zipFile, tmpDir);
      let unzipBar = path.resolve(tmpDir, 'bar');
      expect(zipFiles).toBeTruthy();
      expect(zipFiles.length).toBe(1);
      expect(zipFiles[0]).toBe(unzipBar);
      expect(fs.statSync(unzipBar).size).toBe(30);
    });
  });
});