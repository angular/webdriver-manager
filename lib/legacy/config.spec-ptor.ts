import * as fs from 'fs';
import * as path from 'path';
import { Config } from './config';

describe('config', () => {
  it('should work with Protractor 5.4.2', () => {
    const updateConfigPath = path.resolve(Config.getSeleniumDir(),
      'update-config.json');
    const updateConfigContents = fs.readFileSync(updateConfigPath).toString();
    const updateConfig = JSON.parse(updateConfigContents);
    expect(updateConfig.standalone.last).toMatch(
      /selenium-server-standalone.*.jar/g);
    expect(updateConfig.chrome.last).toMatch(
      /chromedriver_.*/g);
    expect(updateConfig.gecko.last).toMatch(
      /geckodriver.*/g);
  });
});