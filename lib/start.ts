import { ChromeDriver } from './provider/chromedriver';
import { SeleniumServer } from './provider/selenium_server';

let chromedriver = new ChromeDriver();
let seleniumServer = new SeleniumServer();

export function update(): Promise<any> {
  let promises = [];
  promises.push(chromedriver.updateBinary());
  promises.push(seleniumServer.updateBinary());

  return Promise.all(promises);
}


export function start(): Promise<any> {
  let opts = {
    '-Dwebdriver.chrome.driver': chromedriver.getBinaryPath()
  }
  return seleniumServer.startServer(opts);
}

update().then(() => {
  start().then(() => {
    console.log('indefinitely wait');
  });
});