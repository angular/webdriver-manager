export interface MinimistArgs { [opt: string]: string[] }

export interface Args { [opt: string]: number|string|boolean }

export interface Options { [opt: string]: Option; }

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
    if (defaultValue) {
      this.defaultValue = defaultValue;
    }
  }

  getValue_(): number|string|boolean {
    if (this.value) {
      return this.value;
    } else {
      return this.defaultValue;
    }
  }

  getNumber(): number {
    let value = this.getValue_();
    if (value && typeof value === 'number') {
      return +value;
    }
    return null;
  }

  getString(): string {
    let value = this.getValue_();
    if (value && typeof value === 'string') {
      return '' + value;
    }
    return null;
  }

  getBoolean(): boolean {
    let value = this.getValue_();
    return value ? true : false;
  }
}
