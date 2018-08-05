import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {
  generateConfigFile,
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

  describe('generateConfigFile', () => {
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

    it('should write the file', () => {
      // Creates empty files in the temp directory.
      [
        'foo.zip',
        'foo_.zip',
        'foo_12.2',
        'foo_12.4',
        'foo.xml',
        'foo_.xml',
        'bar.tar.gz',
        'bar_10.1.1',
        'bar_10.1.2',
        'bar.json',
      ].forEach(fileName => {
        fs.closeSync(fs.openSync(path.resolve(tmpDir, fileName), 'w'));
      });
      let tmpFile = path.resolve(tmpDir, 'foobar.config.json');
      let lastBinary = path.resolve(tmpDir, 'foo_12.4');

      let fileBinaryPathRegex: RegExp = /foo_\d+.\d+/g;
      generateConfigFile(tmpDir, tmpFile, fileBinaryPathRegex, lastBinary);

      let contents = fs.readFileSync(tmpFile).toString();
      let jsonContents = JSON.parse(contents);
      expect(jsonContents['last']).toBe(lastBinary);
      expect(jsonContents['all'].length).toBe(2);
    });
  });
});