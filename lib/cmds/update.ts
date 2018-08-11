import { Options } from './options';
import { constructProviders } from './utils';

let options: Options = {
  providers: [
    { name: 'chromedriver'},
    { name: 'geckodriver' }
  ],
  server: {
    name: 'selenium',
  },
}

export function update(options: Options): Promise<any> {
  let promises = [];
  for (let provider of options.providers) {
    promises.push(provider.binary.updateBinary(provider.version));
  }
  promises.push(options.server.binary.updateBinary(options.server.version));
  return Promise.all(promises);
}

options = constructProviders(options);
update(options).then(() => {});