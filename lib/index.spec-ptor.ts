import {ChromeDriver, GeckoDriver, SeleniumServer} from './index';

describe('Make the new version work with Protractor 6+', () => {
  it('should use 5.4.2 calls used in driverProviders/local and ' +
     'driverProviders/direct', () => {
    const chromedriverPath = new ChromeDriver().getBinaryPath();
    expect(chromedriverPath).toMatch(/.*chromedriver_.*/g);
    
    const geckodriverPath = new GeckoDriver().getBinaryPath();
    expect(geckodriverPath).toMatch(/.*geckodriver_.*/g);
    
    const seleniumServerPath = new SeleniumServer().getBinaryPath();
    expect(seleniumServerPath)
      .toMatch(/.*selenium-server-standalone-.*.jar/g);
  });
});