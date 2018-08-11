import * as yargs from 'yargs';
import { Options } from './options';
import { constructAllProviders } from './utils';

export function handler(argv: yargs.Arguments) {
  let options = constructAllProviders(argv);
  console.log(clean(options));
}

export function clean(options: Options): string {
  let filesCleaned: string[] = [];
  for (let provider of options.providers) {
    let cleanedFiles = provider.binary.cleanFiles();
    if (cleanedFiles) {
      filesCleaned.push(cleanedFiles);
    }
  }
  filesCleaned.push(options.server.binary.cleanFiles());
  return (filesCleaned.sort()).join();
}
