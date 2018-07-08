import { ChromeDriver } from './chromedriver';

describe('chromedriver', () => {
  it('should work?', async() => {
    let chromedriver = new ChromeDriver();
    await chromedriver.updateBinary();
  });
});
