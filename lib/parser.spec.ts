import type { Options } from './options.js';

import { describe, expect, it } from 'vitest';
import { ArgumentParser } from './parser.js';

describe('ArgumentParser', () => {
  describe('constructor', () => {
    it('should handle zero options', () => {
      expect(() => new ArgumentParser({})).not.toThrow();
    });

    it('should ignore empty option names', () => {
      const options = {
        empty: {
          names: ['', 'name', ''],
          type: 'string',
          desc: '',
        },
      } as const satisfies Options;
      expect(new ArgumentParser(options).parse(['name', '123'])).toMatchObject({
        empty: '123',
      });
    });

    it('should throw an error on option with no valid name', () => {
      const options = {
        nameless: {
          names: ['', ''],
          type: 'string',
          desc: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).toThrowError(
        `Option 'nameless' has no valid name.`,
      );
    });

    it('should throw an error on duplicate option name in the same option', () => {
      const options = {
        duplicate: {
          names: ['dup', 'dup'],
          type: 'string',
          desc: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).toThrowError(`Duplicate option name 'dup'.`);
    });

    it('should throw an error on duplicate option name across different options', () => {
      const options = {
        duplicate1: {
          names: ['dup'],
          type: 'string',
          desc: '',
        },
        duplicate2: {
          names: ['dup'],
          type: 'string',
          desc: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).toThrowError(`Duplicate option name 'dup'.`);
    });
  });

  it('should throw an error on unknown required option with requiresAll', () => {
    const options = {
      requires: {
        names: ['req'],
        type: 'string',
        desc: '',
        requiresAll: ['required'],
      },
    } as const satisfies Options;
    expect(() => new ArgumentParser(options)).toThrowError(`Unknown required option 'required'.`);
  });

  it('should throw an error on unknown required option with requiresOne', () => {
    const options = {
      requires: {
        names: ['req'],
        type: 'string',
        desc: '',
        requiresOne: ['required'],
      },
    } as const satisfies Options;
    expect(() => new ArgumentParser(options)).toThrowError(`Unknown required option 'required'.`);
  });

  it('should throw an error on option required by itself with requiresAll', () => {
    const options = {
      requires: {
        names: ['req'],
        type: 'string',
        desc: '',
        requiresAll: ['requires'],
      },
    } as const satisfies Options;
    expect(() => new ArgumentParser(options)).toThrowError(`Option 'requires' requires itself.`);
  });

  it('should throw an error on option required by itself with requiresOne', () => {
    const options = {
      requires: {
        names: ['req'],
        type: 'string',
        desc: '',
        requiresOne: ['requires'],
      },
    } as const satisfies Options;
    expect(() => new ArgumentParser(options)).toThrowError(`Option 'requires' requires itself.`);
  });

  describe('parse', () => {
    it('should throw an error on unknown option name specified in arguments', () => {
      const options = {
        unknown: {
          names: ['unknown'],
          type: 'string',
          desc: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options).parse(['abc'])).toThrowError(
        `Unknown option 'abc'.`,
      );
    });

    it('should throw an error on monadic option with no parameter specified in arguments', () => {
      const options = {
        monadic: {
          names: ['--monadic'],
          type: 'string',
          desc: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options).parse(['--monadic'])).toThrowError(
        `Missing parameter to '--monadic'.`,
      );
    });

    it('should throw an error when required option with requiresAll is not specified', () => {
      const options = {
        requires: {
          names: ['req1'],
          type: 'boolean',
          desc: '',
          requiresAll: ['required1', 'required2'],
        },
        required1: {
          names: ['req2'],
          type: 'boolean',
          desc: '',
        },
        required2: {
          names: ['req3'],
          type: 'boolean',
          desc: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options).parse(['req1'])).toThrowError(
        `Option 'req1' requires option 'req2'.`,
      );
      expect(() => new ArgumentParser(options).parse(['req1', 'req2'])).toThrowError(
        `Option 'req1' requires option 'req3'.`,
      );
      expect(() => new ArgumentParser(options).parse(['req1', 'req2', 'req3'])).not.toThrowError();
    });

    it('should throw an error when required option with requiresOne is not specified', () => {
      const options = {
        requires: {
          names: ['req1'],
          type: 'boolean',
          desc: '',
          requiresOne: ['required1', 'required2'],
        },
        required1: {
          names: ['req2'],
          type: 'boolean',
          desc: '',
        },
        required2: {
          names: ['req3'],
          type: 'boolean',
          desc: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options).parse(['req1'])).toThrowError(
        `Option 'req1' requires one of [req2,req3].`,
      );
      expect(() => new ArgumentParser(options).parse(['req1', 'req2'])).not.toThrowError();
      expect(() => new ArgumentParser(options).parse(['req1', 'req3'])).not.toThrowError();
    });

    describe('fuction', () => {
      it('should handle a function option', () => {
        const options = {
          function: {
            names: ['-f', '--function'],
            desc: 'A function option',
            type: 'function',
            default: () => {
              throw 'function';
            },
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).not.toThrow();
        expect(new ArgumentParser(options).parse([])).not.toHaveProperty('function');
        expect(() => new ArgumentParser(options).parse(['-f'])).toThrow('function');
        expect(() => new ArgumentParser(options).parse(['--function'])).toThrow('function');
      });

      it('should exit the parsing loop when a function option callback returns null', () => {
        const options = {
          function1: {
            names: ['-f1', '--function1'],
            desc: 'First function option',
            type: 'function',
            default: () => {
              return null;
            },
          },
          function2: {
            names: ['-f2', '--function2'],
            desc: 'Second function option',
            type: 'function',
            default: () => {
              throw 'function';
            },
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-f1', '-f2'])).not.toThrow();
      });

      it('should throw an error on synchronous parsing with async fuction option', () => {
        const options = {
          duplicate: {
            names: ['async'],
            type: 'function',
            desc: '',
            default: async () => {},
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['async'])).toThrowError(
          'Use `asyncParse` to handle async functions.',
        );
      });

      it('should exit the parsing loop when an async function option callback returns null', () => {
        const options = {
          function1: {
            names: ['-f1', '--function1'],
            desc: 'First function option',
            type: 'function',
            default: async () => {
              return null;
            },
          },
          function2: {
            names: ['-f2', '--function2'],
            desc: 'Second function option',
            type: 'function',
            default: () => {
              throw 'function';
            },
          },
        } as const satisfies Options;
        expect(
          async () => await new ArgumentParser(options).asyncParse(['-f1', '-f2']),
        ).not.toThrow();
      });
    });

    describe('boolean', () => {
      it('should handle a boolean option', () => {
        const options = {
          boolean: {
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            type: 'boolean',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ boolean: false });
        expect(new ArgumentParser(options).parse(['-b'])).toMatchObject({ boolean: true });
        expect(new ArgumentParser(options).parse(['--boolean'])).toMatchObject({ boolean: true });
      });
    });

    describe('string', () => {
      it('should handle a string option with default and example values', () => {
        const options = {
          string: {
            names: ['-s', '--string'],
            desc: 'A string option',
            type: 'string',
            default: '123',
            example: '456',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ string: '123' });
        expect(new ArgumentParser(options).parse(['-s', '789'])).toMatchObject({ string: '789' });
        expect(new ArgumentParser(options).parse(['--string', ''])).toMatchObject({ string: '' });
      });

      it('should handle a string option with a regex constraint', () => {
        const options = {
          string: {
            names: ['-s', '--string'],
            desc: 'A string option',
            type: 'string',
            regex: /\d+/s,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ string: undefined });
        expect(new ArgumentParser(options).parse(['-s', '456'])).toMatchObject({ string: '456' });
        expect(new ArgumentParser(options).parse(['--string', '0'])).toMatchObject({ string: '0' });
      });

      it('should throw an error on string value not matching regex', () => {
        const options = {
          string: {
            names: ['-s', '--string'],
            desc: 'A string option',
            type: 'string',
            regex: /\d+/s,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-s', 'abc'])).toThrowError(
          `Invalid parameter to '-s': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on string example value not matching regex', () => {
        const options = {
          string: {
            names: ['-s', '--string'],
            desc: 'A string option',
            type: 'string',
            regex: /\d+/s,
            example: 'abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-s': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on string default value not matching regex', () => {
        const options = {
          string: {
            names: ['-s', '--string'],
            desc: 'A string option',
            type: 'string',
            regex: /\d+/s,
            default: 'abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-s': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should handle a string option with enumeration constraint', () => {
        const options = {
          stringEnum: {
            names: ['-se', '--stringEnum'],
            desc: 'A string enumeration option',
            type: 'string',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ stringEnum: undefined });
        expect(new ArgumentParser(options).parse(['-se', 'one'])).toMatchObject({
          stringEnum: 'one',
        });
        expect(new ArgumentParser(options).parse(['--stringEnum', 'two'])).toMatchObject({
          stringEnum: 'two',
        });
      });

      it('should throw an error on string value not in enumeration', () => {
        const options = {
          stringEnum: {
            names: ['-se', '--stringEnum'],
            desc: 'A string enumeration option',
            type: 'string',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-se', 'abc'])).toThrowError(
          `Invalid parameter to '-se': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on string example value not in enumeration', () => {
        const options = {
          stringEnum: {
            names: ['-se', '--stringEnum'],
            desc: 'A string enumeration option',
            type: 'string',
            enums: ['one', 'two'],
            example: 'abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-se': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on string default value not in enumeration', () => {
        const options = {
          stringEnum: {
            names: ['-se', '--stringEnum'],
            desc: 'A string enumeration option',
            type: 'string',
            enums: ['one', 'two'],
            default: 'abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-se': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on duplicate enumeration value', () => {
        const options = {
          stringEnum: {
            names: ['-se'],
            type: 'string',
            desc: '',
            enums: ['dup', 'dup'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'stringEnum' has duplicate enum 'dup'.`,
        );
      });
    });

    describe('number', () => {
      it('should handle a number option with default and example values', () => {
        const options = {
          number: {
            names: ['-n', '--number'],
            desc: 'A number option',
            type: 'number',
            default: 123,
            example: 456,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ number: 123 });
        expect(new ArgumentParser(options).parse(['-n', '789'])).toMatchObject({ number: 789 });
        expect(new ArgumentParser(options).parse(['--number', '0'])).toMatchObject({ number: 0 });
      });

      it('should handle a number option with a range constraint', () => {
        const options = {
          number: {
            names: ['-n', '--number'],
            desc: 'A number option',
            type: 'number',
            range: [0, Infinity],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ number: undefined });
        expect(new ArgumentParser(options).parse(['-n', '456'])).toMatchObject({ number: 456 });
        expect(new ArgumentParser(options).parse(['--number', '0'])).toMatchObject({ number: 0 });
      });

      it('should throw an error on number value not in range', () => {
        const options = {
          number: {
            names: ['-n', '--number'],
            desc: 'A number option',
            type: 'number',
            range: [0, Infinity],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-n', '-3'])).toThrowError(
          `Invalid parameter to '-n': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on number example value not in range', () => {
        const options = {
          number: {
            names: ['-n', '--number'],
            desc: 'A number option',
            type: 'number',
            range: [0, Infinity],
            example: -3,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-n': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on number default value not in range', () => {
        const options = {
          number: {
            names: ['-n', '--number'],
            desc: 'A number option',
            type: 'number',
            range: [0, Infinity],
            default: -3,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-n': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should handle a number option with enumeration constraint', () => {
        const options = {
          numberEnum: {
            names: ['-ne', '--numberEnum'],
            desc: 'A number enumeration option',
            type: 'number',
            enums: [1, 2],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ numberEnum: undefined });
        expect(new ArgumentParser(options).parse(['-ne', '1'])).toMatchObject({
          numberEnum: 1,
        });
        expect(new ArgumentParser(options).parse(['--numberEnum', '2'])).toMatchObject({
          numberEnum: 2,
        });
      });

      it('should throw an error on number value not in enumeration', () => {
        const options = {
          numberEnum: {
            names: ['-ne', '--numberEnum'],
            desc: 'A number enumeration option',
            type: 'number',
            enums: [1, 2],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ne', '3'])).toThrowError(
          `Invalid parameter to '-ne': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on number example value not in enumeration', () => {
        const options = {
          numberEnum: {
            names: ['-ne', '--numberEnum'],
            desc: 'A number enumeration option',
            type: 'number',
            enums: [1, 2],
            example: 3,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-ne': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on number default value not in enumeration', () => {
        const options = {
          numberEnum: {
            names: ['-ne', '--numberEnum'],
            desc: 'A number enumeration option',
            type: 'number',
            enums: [1, 2],
            default: 3,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-ne': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on duplicate enumeration value', () => {
        const options = {
          numberEnum: {
            names: ['-ne'],
            type: 'number',
            desc: '',
            enums: [1, 1],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'numberEnum' has duplicate enum '1'.`,
        );
      });
    });

    describe('strings', () => {
      it('should handle a strings option with default and example values', () => {
        const options = {
          strings: {
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            type: 'strings',
            default: ['one', 'two'],
            example: ['three', 'four'],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ strings: ['one', 'two'] });
        expect(new ArgumentParser(options).parse(['-ss', ' 456 , abc '])).toMatchObject({
          strings: ['456', 'abc'],
        });
        expect(new ArgumentParser(options).parse(['--strings', '   '])).toMatchObject({
          strings: [],
        });
      });

      it('should handle a strings option with enumeration constraint', () => {
        const options = {
          stringsEnum: {
            names: ['-sse', '--stringsEnum'],
            desc: 'A strings enumeration option',
            type: 'strings',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ stringsEnum: undefined });
        expect(new ArgumentParser(options).parse(['-sse', ' one , one '])).toMatchObject({
          stringsEnum: ['one', 'one'],
        });
        expect(new ArgumentParser(options).parse(['--stringsEnum', ' two '])).toMatchObject({
          stringsEnum: ['two'],
        });
        expect(new ArgumentParser(options).parse(['--stringsEnum', '   '])).toMatchObject({
          stringsEnum: [],
        });
      });

      it('should throw an error on strings value not matching regex', () => {
        const options = {
          stringsEnum: {
            names: ['-sse', '--stringsEnum'],
            desc: 'A strings enumeration option',
            type: 'strings',
            regex: /\d+/s,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-sse', 'abc'])).toThrowError(
          `Invalid parameter to '-sse': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on strings example value not matching regex', () => {
        const options = {
          stringsEnum: {
            names: ['-sse', '--stringsEnum'],
            desc: 'A strings enumeration option',
            type: 'strings',
            regex: /\d+/s,
            example: ['abc'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-sse': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on strings default value not matching regex', () => {
        const options = {
          stringsEnum: {
            names: ['-sse', '--stringsEnum'],
            desc: 'A strings enumeration option',
            type: 'strings',
            regex: /\d+/s,
            default: ['abc'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-sse': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on strings value not in enumeration', () => {
        const options = {
          stringsEnum: {
            names: ['-sse', '--stringsEnum'],
            desc: 'A strings enumeration option',
            type: 'strings',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-sse', 'abc'])).toThrowError(
          `Invalid parameter to '-sse': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on strings example value not in enumeration', () => {
        const options = {
          stringsEnum: {
            names: ['-sse', '--stringsEnum'],
            desc: 'A strings enumeration option',
            type: 'strings',
            enums: ['one', 'two'],
            example: ['abc'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-sse': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on strings default value not in enumeration', () => {
        const options = {
          stringsEnum: {
            names: ['-sse', '--stringsEnum'],
            desc: 'A strings enumeration option',
            type: 'strings',
            enums: ['one', 'two'],
            default: ['abc'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-sse': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on duplicate enumeration value', () => {
        const options = {
          stringsEnum: {
            names: ['-sse'],
            type: 'strings',
            desc: '',
            enums: ['dup', 'dup'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'stringsEnum' has duplicate enum 'dup'.`,
        );
      });
    });

    describe('numbers', () => {
      it('should handle a numbers option with default and example values', () => {
        const options = {
          numbers: {
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            type: 'numbers',
            default: [1, 2],
            example: [3, 4],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ numbers: [1, 2] });
        expect(new ArgumentParser(options).parse(['-ns', ' 456 , 123 '])).toMatchObject({
          numbers: [456, 123],
        });
        expect(new ArgumentParser(options).parse(['--numbers', '   '])).toMatchObject({
          numbers: [],
        });
      });

      it('should handle a numbers option with enumeration constraint', () => {
        const options = {
          numbersEnum: {
            names: ['-nse', '--numbersEnum'],
            desc: 'A numbers enumeration option',
            type: 'numbers',
            enums: [1, 2],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ numbersEnum: undefined });
        expect(new ArgumentParser(options).parse(['-nse', ' 1 , 1 '])).toMatchObject({
          numbersEnum: [1, 1],
        });
        expect(new ArgumentParser(options).parse(['--numbersEnum', ' 2 '])).toMatchObject({
          numbersEnum: [2],
        });
        expect(new ArgumentParser(options).parse(['--numbersEnum', '   '])).toMatchObject({
          numbersEnum: [],
        });
      });

      it('should throw an error on numbers value not in range', () => {
        const options = {
          numbersEnum: {
            names: ['-nse', '--numbersEnum'],
            desc: 'A numbers enumeration option',
            type: 'numbers',
            range: [0, Infinity],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-nse', '-3'])).toThrowError(
          `Invalid parameter to '-nse': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on numbers example value not in range', () => {
        const options = {
          numbersEnum: {
            names: ['-nse', '--numbersEnum'],
            desc: 'A numbers enumeration option',
            type: 'numbers',
            range: [0, Infinity],
            example: [-3],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-nse': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on numbers default value not in range', () => {
        const options = {
          numbersEnum: {
            names: ['-nse', '--numbersEnum'],
            desc: 'A numbers enumeration option',
            type: 'numbers',
            range: [0, Infinity],
            default: [-3],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-nse', '3'])).toThrowError(
          `Invalid parameter to '-nse': -3. Value must be in the range [0,Infinity].`,
        );
      });
      it('should throw an error on numbers value not in enumeration', () => {
        const options = {
          numbersEnum: {
            names: ['-nse', '--numbersEnum'],
            desc: 'A numbers enumeration option',
            type: 'numbers',
            enums: [1, 2],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-nse', '3'])).toThrowError(
          `Invalid parameter to '-nse': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on numbers example value not in enumeration', () => {
        const options = {
          numbersEnum: {
            names: ['-nse', '--numbersEnum'],
            desc: 'A numbers enumeration option',
            type: 'numbers',
            enums: [1, 2],
            example: [3],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse([])).toThrowError(
          `Invalid parameter to '-nse': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on numbers default value not in enumeration', () => {
        const options = {
          numbersEnum: {
            names: ['-nse', '--numbersEnum'],
            desc: 'A numbers enumeration option',
            type: 'numbers',
            enums: [1, 2],
            default: [3],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-nse', '3'])).toThrowError(
          `Invalid parameter to '-nse': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on duplicate enumeration value', () => {
        const options = {
          numbersEnum: {
            names: ['-nse'],
            type: 'numbers',
            desc: '',
            enums: [1, 1],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'numbersEnum' has duplicate enum '1'.`,
        );
      });
    });
  });
});
