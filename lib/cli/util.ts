import * as chalk from 'chalk';

export enum LOG_LEVEL { DEBUG, WARN, INFO }

export class Logger {
  static info(message: string, opt_noTimestamp?: boolean): void {
    if (!opt_noTimestamp) {
      message = Logger.timestamp() + ' ' + message;
    }
    console.log(message);
  }

  static timestamp(): string {
    let d = new Date();
    return '[' + chalk.gray(d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()) + ']';
  }
}

export class Req {}
