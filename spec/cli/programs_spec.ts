import {Option, Options, Program} from '../../lib/cli';


describe('program', () => {
  let program: Program;

  beforeEach(
      () => {program = new Program()
                           .command('fooCmd', 'fooDescription')
                           .addOption(new Option('fooString1', 'fooDescription', 'string', 'foo'))
                           .addOption(new Option('fooString1', 'fooDescription', 'string', 'foo'))
                           .addOption(new Option('fooBoolean1', 'fooDescription', 'boolean', false))
                           .addOption(new Option('fooBoolean2', 'fooDescription', 'boolean', true))
                           .addOption(new Option('fooNumber1', 'fooDescription', 'number', 1))
                           .addOption(new Option('fooNumber2', 'fooDescription', 'number', 2))
                           .addOption(new Option('fooNumber3', 'fooDescription', 'number', 3))});

  it('should get minimist options', () => {
    let json = JSON.parse(JSON.stringify(program.getMinimistOptions()));
    expect(json.string.length).toEqual(1);
    expect(json.boolean.length).toEqual(2);
    expect(json.number.length).toEqual(3);
    let length = 0;
    for (let item in json.default) {
      length++;
    }
    expect(length).toEqual(6);
    expect(json.string[0]).toBe('fooString1');
    expect(json.boolean[0]).toBe('fooBoolean1');
    expect(json.boolean[1]).toBe('fooBoolean2');
    expect(json.number[0]).toBe('fooNumber1');
    expect(json.number[1]).toBe('fooNumber2');
    expect(json.number[2]).toBe('fooNumber3');
  });

  it('should be able to extract the correct type and value', () => {
    let testString: string;
    let json = JSON.parse(JSON.stringify({
      '_': ['fooCmd'],
      'fooString1': 'bar',
      'fooBoolean1': true,
      'fooBoolean2': false,
      'fooNumber1': 10,
      'fooNumber2': 20,
      'fooNumber3': 30
    }));
    let callbackTest = (options: Options) => {
      expect(options['fooString1'].getString()).toEqual('bar');
      expect(options['fooBoolean1'].getBoolean()).toEqual(true);
      expect(options['fooBoolean2'].getBoolean()).toEqual(false);
      expect(options['fooNumber1'].getNumber()).toEqual(10);
      expect(options['fooNumber2'].getNumber()).toEqual(20);
      expect(options['fooNumber3'].getNumber()).toEqual(30);
    };
    program.action(callbackTest);
    program.run(json);
  });

  it('should be able to extract the mixed type and get the right type', () => {
    let testString: string;
    let json = JSON.parse(JSON.stringify({
      '_': ['fooCmd'],
      'fooString1': 1,
      'fooBoolean1': 'true',
      'fooBoolean2': 0,
      'fooNumber1': '100',
      'fooNumber2': 'foo',
      'fooNumber3': true
    }));
    let callbackTest = (options: Options) => {
      expect(options['fooString1'].getString()).toEqual('1');
      expect(options['fooBoolean1'].getBoolean()).toEqual(true);
      expect(options['fooBoolean2'].getBoolean()).toEqual(false);
      expect(options['fooNumber1'].getNumber()).toEqual(100);
      expect(options['fooNumber2'].getNumber()).toEqual(NaN);
      expect(options['fooNumber3'].getNumber()).toEqual(null);
    };
    program.action(callbackTest);
    program.run(json);
  });
});
