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

export function clean(options: Options): string {
  let filesCleaned: string[] = [];
  for (let provider of options.providers) {
    filesCleaned.push(provider.binary.cleanFiles());
  }
  filesCleaned.push(options.server.binary.cleanFiles());
  return (filesCleaned.sort()).join();
}

options = constructProviders(options);
console.log(clean(options));