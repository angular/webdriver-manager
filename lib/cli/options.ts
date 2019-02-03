export interface MinimistArgs {
  [opt: string]: string[]
}

export interface Args {
  [opt: string]: number|string|boolean
}

export interface Options {
  [opt: string]: Option;
}

export class Option {
  opt: string;
  description: string;
  type: string;
  defaultValue: number|string|boolean;
  value: number|string|boolean;

  constructor(
      opt: string, description: string, type: string, defaultValue?: number|string|boolean) {
    this.opt = opt;
    this.description = description;
    this.type = type;
    if (defaultValue != null) {
      this.defaultValue = defaultValue;
    }
  }

  getValue_(): number|string|boolean {
    if (typeof this.value !== 'undefined') {
      return this.value;
    } else {
      return this.defaultValue;
    }
  }

  getNumber(): number {
    let value = this.getValue_();
    if (value != null && (typeof value === 'number' || typeof value === 'string')) {
      return +value;
    } else {
      return null;
    }
  }

  getString(): string {
    let value = this.getValue_();
    if (value != null) {
      return '' + this.getValue_();
    } else {
      return '';
    }
  }

  getBoolean(): boolean {
    let value = this.getValue_();
    if (value != null) {
      if (typeof value === 'string') {
        return !(value === '0' || value === 'false');
      } else if (typeof value === 'number') {
        return value !== 0;
      } else {
        return value;
      }
    }
    return false;
  }
}

export function unparseOptions(options: Options) {
  var args: string[] = [];
  for (let name in options) {
    let value = options[name].getValue_();
    if (value !== options[name].defaultValue) {
      args.push('--' + name, '' + value);
    }
  }
  return args;
};
