import {ProviderInterface} from '../provider/provider';
import {BrowserDriver, Options, Server} from './options';

export interface OptionsBinary extends Options {
  browserDrivers?: BrowserDriverBinary[];
  server?: ServerBinary;
}

export interface BrowserDriverBinary extends BrowserDriver {
  // The binary provider object.
  binary?: ProviderInterface;
}

export interface ServerBinary extends Server {
  // The binary provider object.
  binary?: ProviderInterface;
}