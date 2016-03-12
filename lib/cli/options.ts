export interface Args { [opt: string]: any }

export interface Options { [opt: string]: Option; }

export class Option {
  opt: string;
  description: string;
  type: string;
  defaultValue: any;
  value: any;

  constructor(opt: string, description: string, type: string, defaultValue?: any) {
    this.opt = opt;
    this.description = description;
    this.type = type;
    if (defaultValue) {
      this.defaultValue = defaultValue;
    }
  }

  getValue(): any {
    if (this.value) {
      return this.value;
    } else {
      return this.defaultValue;
    }
  }
}
