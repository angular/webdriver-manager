import * as fs from 'fs';

/**
 * Check to see if the modified timestamp is expired.
 * @param fileName THe xml filename.
 */
export function isExpired(fileName: string): boolean {
  try {
    let timestamp = new Date(fs.statSync(fileName).mtime).getTime();
    let size = fs.statSync(fileName).size;
    let now = Date.now();

    if (size > 0 && (now - (60 * 60 * 1000) < timestamp)) {
      return false;
    } else {
      return true;
    }
  } catch (err) {
    return true;
  }
}