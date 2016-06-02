import * as fs from 'fs';
import * as path from 'path';

export class TestUtils {
  
  static copyRecursiveSync(src: string, dest: string) {
    let exists = fs.existsSync(src);
    let stats = exists && fs.statSync(src);
    let isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      fs.mkdirSync(dest);
      fs.readdirSync(src).forEach((childItemName: string) => {
        TestUtils.copyRecursiveSync(
          path.join(src,childItemName), path.join(dest,childItemName));
      });
    } else {
      fs.linkSync(src,dest);
    }
  }

  static deleteRecursiveSync(src: string) {
    let exists = fs.existsSync(src);
    let stats = exists && fs.statSync(src);
    let isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      fs.readdirSync(src).forEach((childItemName: string) => {
        TestUtils.deleteRecursiveSync(path.resolve(src,childItemName));
      });
      fs.rmdirSync(src);
    } else {
      fs.unlinkSync(src);
    }
  }
}
