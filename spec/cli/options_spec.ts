import {Option} from '../../lib/cli/options';


describe('options', () => {
  let option: Option;

  describe('get number', () => {
    describe('for this.value not set', () => {
      it('should return the default value', () => {
        option = new Option('fake opt', 'fake description', 'number', 10);
        expect(option.getNumber()).toEqual(10);

        option = new Option('fake opt', 'fake description', 'number', 0);
        expect(option.getNumber()).toEqual(0);

        option = new Option('fake opt', 'fake description', 'number', -5);
        expect(option.getNumber()).toEqual(-5);
      });

      it('should return null if the default value is not set', () => {
        option = new Option('fake opt', 'fake description', 'number');
        expect(option.getNumber()).toBeNull();
      });
    });

    describe('for this.value set', () => {
      beforeEach(() => {
        option = new Option('fake opt', 'fake description', 'number', -10);
      });

      it('should return the this.value when this.value is a number', () => {
        option.value = 20;
        expect(option.getNumber()).toEqual(20);
      });

      it('should return a number of this.value when it is a string of a number', () => {
        option.value = '10';
        expect(option.getNumber()).toEqual(10);
        option.value = '0';
        expect(option.getNumber()).toEqual(0);
        option.value = '-5';
        expect(option.getNumber()).toEqual(-5);
      });

      it('should return null if this.value is not a string or a number', () => {
        option.value = true;
        expect(option.getNumber()).toBeNull();
        option.value = false;
        expect(option.getNumber()).toBeNull();
      });

      it('should return NaN if this.value is a string but is not a number', () => {
        option.value = 'foobar';
        expect(option.getNumber()).toEqual(NaN);
      });
    });
  });

  describe('get boolean', () => {
    describe('for this.value not set', () => {
      it('should return the default value', () => {
        option = new Option('fake opt', 'fake description', 'boolean', true);
        expect(option.getBoolean()).toBeTruthy();
        option = new Option('fake opt', 'fake description', 'boolean', false);
        expect(option.getBoolean()).not.toBeTruthy();
      });

      it('should return false if the default value is not defined', () => {
        option = new Option('fake opt', 'fake description', 'boolean');
        expect(option.getBoolean()).not.toBeTruthy();
      });
    });

    describe('for this.value set', () => {
      beforeEach(() => {
        option = new Option('fake opt', 'fake description', 'boolean');
      });

      it('should return a boolean when this.value is a string', () => {
        option.value = 'true';
        expect(option.getBoolean()).toBeTruthy();
        option.value = 'false';
        expect(option.getBoolean()).not.toBeTruthy();
      });

      it('should return a boolean of this.value when this.value is a number', () => {
        option.value = 1;
        expect(option.getNumber()).toBeTruthy();
        option.value = 0;
        expect(option.getNumber()).not.toBeTruthy();
      });

      it('should return the boolean of this.value when this.value is a boolean', () => {
        option.value = true;
        expect(option.getNumber()).toBeNull();
        option.value = false;
        expect(option.getNumber()).toBeNull();
      });
    });
  });

  describe('get string', () => {
    describe('for this.value not set', () => {
      it('should return the default value', () => {
        option = new Option('fake opt', 'fake description', 'string', 'foobar');
        expect(option.getString()).toBe('foobar');
        option = new Option('fake opt', 'fake description', 'string', '');
        expect(option.getString()).toBe('');
      });

      it('should return an empty string if the default value is not defined', () => {
        option = new Option('fake opt', 'fake description', 'string');
        expect(option.getString()).toBe('');
      });
    });

    describe('for this.value set', () => {
      beforeEach(() => {
        option = new Option('fake opt', 'fake description', 'string', 'foo');
      });

      it('should return this.value when this.value is a string', () => {
        option.value = 'bar';
        expect(option.getString()).toEqual('bar');
        option.value = '';
        expect(option.getString()).toEqual('');
      });

      it('should return the string of this.value when this.value is a number', () => {
        option.value = 0;
        expect(option.getString()).toEqual('0');
        option.value = 1;
        expect(option.getString()).toEqual('1');
      });

      it('should return the string of this.value when this.value is a boolean', () => {
        option.value = false;
        expect(option.getString()).toEqual('false');
        option.value = true;
        expect(option.getString()).toEqual('true');
      });
    });
  });
});
