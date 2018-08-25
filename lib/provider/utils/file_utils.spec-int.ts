import * as fs from 'fs';
import * as log from 'loglevel';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {generateConfigFile, removeFiles, tarFileList, uncompressTarball, unzipFile, zipFileList} from './file_utils';

log.setLevel('debug');

const tarballFile = path.resolve('spec/support/files/bar.tar.gz');
const zipFile = path.resolve('spec/support/files/bar.zip');

describe('file_utils', () => {
  describe('tarFileList', () => {
    it('should have a file list', async () => {
      const fileList = await tarFileList(tarballFile);
      expect(fileList).toBeTruthy();
      expect(fileList.length).toBe(1);
      expect(fileList[0]).toBe('bar');
    });

    it('should return an error if the file does not exist', async (done) => {
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
        fs.mkdirSync(tmpDir);
      } catch (err) {
      }
    });

    afterAll(() => {
      rimraf.sync(tmpDir);
    });

    it('should uncompress the file', async () => {
      const untarFiles = await uncompressTarball(tarballFile, tmpDir);
      const untarBar = path.resolve(tmpDir, 'bar');
      expect(untarFiles).toBeTruthy();
      expect(untarFiles.length).toBe(1);
      expect(untarFiles[0]).toBe(untarBar);
      expect(fs.statSync(untarBar).size).toBe(30);
    });
  });

  describe('zipFileList', () => {
    it('should have a file list', () => {
      const fileList = zipFileList(zipFile);
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
        fs.mkdirSync(tmpDir);
      } catch (err) {
      }
    });

    afterAll(() => {
      rimraf.sync(tmpDir);
    });

    it('should uncompress the file', () => {
      const zipFiles = unzipFile(zipFile, tmpDir);
      const unzipBar = path.resolve(tmpDir, 'bar');
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
        fs.mkdirSync(tmpDir);
      } catch (err) {
      }
    });

    afterAll(() => {
      rimraf.sync(tmpDir);
    });

    it('should write the file', () => {
      // Creates empty files in the temp directory.
      ['foo.zip',
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
      const tmpFile = path.resolve(tmpDir, 'foobar.config.json');
      const lastBinary = path.resolve(tmpDir, 'foo_12.4');

      const fileBinaryPathRegex: RegExp = /foo_\d+.\d+/g;
      generateConfigFile(tmpDir, tmpFile, fileBinaryPathRegex, lastBinary);

      const contents = fs.readFileSync(tmpFile).toString();
      const jsonContents = JSON.parse(contents);
      expect(jsonContents['last']).toBe(lastBinary);
      expect(jsonContents['all'].length).toBe(2);
    });
  });

  describe('removeFiles', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = path.resolve(os.tmpdir(), 'test');
      try {
        fs.mkdirSync(tmpDir);
      } catch (err) {
      }
    });

    afterEach(() => {
      rimraf.sync(tmpDir);
    });

    it('should remove files', () => {
      log.debug(tmpDir);
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'bar-123'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'bar-456'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'bar-789'), 'w'));

      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'baz-123'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'baz-456'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'baz-789'), 'w'));

      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'foo-123'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'foo-456'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'foo-789'), 'w'));

      expect(removeFiles(tmpDir, [/bar-.*/g]))
          .toBe('bar-123\nbar-456\nbar-789');
      expect(fs.readdirSync(tmpDir).length).toBe(6);
      expect(removeFiles(tmpDir, [
        /foo-.*/g, /baz-.*/g
      ])).toBe('baz-123\nbaz-456\nbaz-789\nfoo-123\nfoo-456\nfoo-789');
      expect(fs.readdirSync(tmpDir).length).toBe(0);
    });

    it('should not remove files if nothing is matched', () => {
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'bar-123'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'bar-456'), 'w'));
      fs.closeSync(fs.openSync(path.resolve(tmpDir, 'bar-789'), 'w'));
      expect(removeFiles(tmpDir, [/zebra-.*/g])).toBe('');
      expect(fs.readdirSync(tmpDir).length).toBe(3);
    });
  });
});