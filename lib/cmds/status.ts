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

export function status(options: Options): string {
  let binaryVersions = [];
  for (let provider of options.providers) {
    binaryVersions.push(`${provider.name}: ${provider.binary.getStatus()}`);
  }
  binaryVersions.push(
    `${options.server.name}: ${options.server.binary.getStatus()}`);
  return (binaryVersions.sort()).join('\n');
}

options = constructProviders(options);
console.log(status(options));