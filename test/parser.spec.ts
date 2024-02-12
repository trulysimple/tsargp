import { describe, expect, it } from 'vitest';
import { ArgumentParser, req, type Options } from '../lib';

describe('ArgumentParser', () => {
  describe('constructor', () => {
    it('should handle zero options', () => {
      expect(() => new ArgumentParser({})).not.toThrow();
    });

    it('should ignore empty option names', () => {
      const options = {
        string: {
          type: 'string',
          names: ['', 'name', ''],
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).not.toThrow();
    });

    it('should throw an error on invalid option name', () => {
      const options = {
        string: {
          type: 'string',
          names: ['a~$^&=|<> b'],
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).toThrowError(
        `Option name 'a~$^&=|<> b' contains invalid characters: '~$^&=|<> '.`,
      );
    });

    it('should throw an error on option with no name', () => {
      const options = {
        string: {
          type: 'string',
          names: [],
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).toThrowError(`Option 'string' has no name.`);
    });

    it('should throw an error on option with zero enumerated values', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: [],
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).toThrowError(
        `Option 'string' has zero enum values.`,
      );
    });

    it('should throw an error on option with empty positional marker', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          positional: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).toThrowError(
        `Option 'string' has empty positional marker.`,
      );
    });

    it('should throw an error on version option with no version and no resolve', () => {
      const options = {
        version: {
          type: 'version',
          names: ['-v'],
          version: '',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options)).toThrowError(
        `Option 'version' contains no version or resolve function.`,
      );
    });

    describe('duplicates', () => {
      it('should throw an error on duplicate option name in the same option', () => {
        const options = {
          duplicate: {
            type: 'string',
            names: ['dup', 'dup'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(`Duplicate option name 'dup'.`);
      });

      it('should throw an error on duplicate option name across different options', () => {
        const options = {
          duplicate1: {
            type: 'string',
            names: ['dup'],
          },
          duplicate2: {
            type: 'string',
            names: ['dup'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(`Duplicate option name 'dup'.`);
      });

      it('should throw an error on flag option with duplicate negation name', () => {
        const options = {
          function: {
            type: 'flag',
            names: ['dup'],
            negationNames: ['dup'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(`Duplicate option name 'dup'.`);
      });

      it('should throw an error on option with duplicate positional marker name', () => {
        const options = {
          string: {
            type: 'string',
            names: ['dup'],
          },
          positional: {
            type: 'number',
            names: ['-pos'],
            positional: 'dup',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(`Duplicate option name 'dup'.`);
      });

      it('should throw an error on duplicate enumerated value in string option', () => {
        const options = {
          stringEnum: {
            type: 'string',
            names: ['-se'],
            enums: ['dup', 'dup'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'stringEnum' has duplicate enum 'dup'.`,
        );
      });

      it('should throw an error on duplicate enumeration value in number option', () => {
        const options = {
          numberEnum: {
            type: 'number',
            names: ['-ne'],
            enums: [1, 1],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'numberEnum' has duplicate enum '1'.`,
        );
      });

      it('should throw an error on duplicate enumeration value in strings option', () => {
        const options = {
          stringsEnum: {
            type: 'strings',
            names: ['-sse'],
            enums: ['dup', 'dup'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'stringsEnum' has duplicate enum 'dup'.`,
        );
      });

      it('should throw an error on duplicate enumeration value in numbers option', () => {
        const options = {
          numbersEnum: {
            type: 'numbers',
            names: ['-nse'],
            enums: [1, 1],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'numbersEnum' has duplicate enum '1'.`,
        );
      });

      it('should throw an error on duplicate positional option', () => {
        const options = {
          positional1: {
            type: 'string',
            names: ['-pos1'],
            positional: true,
          },
          positional2: {
            type: 'number',
            names: ['-pos2'],
            positional: true,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Duplicate positional option 'positional2'.`,
        );
      });
    });

    describe('requires', () => {
      it('should throw an error on option required by itself', () => {
        const options = {
          requires: {
            type: 'string',
            names: ['req1'],
            requires: req.and('required=o', req.or('requires=o')),
          },
          required: {
            type: 'string',
            names: ['req2'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'requires' requires itself.`,
        );
      });

      it('should throw an error on unknown required option', () => {
        const options = {
          requires: {
            type: 'string',
            names: ['req1'],
            requires: req.and('required=o', req.or('unknown=o')),
          },
          required: {
            type: 'string',
            names: ['req2'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Unknown required option 'unknown'.`,
        );
      });

      it('should throw an error on flag option required with a value', () => {
        const options = {
          requires: {
            type: 'string',
            names: ['req1'],
            requires: 'required=true',
          },
          required: {
            type: 'flag',
            names: ['req2'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Required option 'required' does not accept values.`,
        );
      });

      it('should throw an error on function option required with a value', () => {
        const options = {
          requires: {
            type: 'string',
            names: ['req1'],
            requires: 'required=abc',
          },
          required: {
            type: 'function',
            names: ['req2'],
            exec: () => {},
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Required option 'required' does not accept values.`,
        );
      });
    });

    describe('string', () => {
      it('should throw an error on string example value not matching regex', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            regex: /\d+/s,
            example: 'abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'string': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on string default value not matching regex', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            regex: /\d+/s,
            default: 'abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'string': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on string required value not matching regex', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            regex: /\d+/s,
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            requires: 'string=abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'string': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on string example value not in enumeration', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            enums: ['one', 'two'],
            example: 'abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'string': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on string default value not in enumeration', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            enums: ['one', 'two'],
            default: 'abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'string': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on string required value not in enumeration', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            enums: ['one', 'two'],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            requires: 'string=abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'string': abc. Possible values are [one,two].`,
        );
      });
    });

    describe('number', () => {
      it('should throw an error on number example value not in range', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            range: [0, Infinity],
            example: -3,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'number': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on number default value not in range', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            range: [0, Infinity],
            default: -3,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'number': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on number required value not in range', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            range: [0, Infinity],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            requires: 'number=-3',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'number': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on number example value not in enumeration', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [1, 2],
            example: 3,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'number': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on number default value not in enumeration', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [1, 2],
            default: 3,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'number': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on number required value not in enumeration', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [1, 2],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            requires: 'number=3',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'number': 3. Possible values are [1,2].`,
        );
      });
    });

    describe('strings', () => {
      it('should throw an error on strings example value with zero values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            example: [],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'strings' has zero example values.`,
        );
      });

      it('should throw an error on strings default value with zero values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            default: [],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'strings' has zero default values.`,
        );
      });

      it('should throw an error on strings example value not matching regex', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            regex: /\d+/s,
            example: ['abc'],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'strings': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on strings default value not matching regex', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            regex: /\d+/s,
            default: ['abc'],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'strings': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on strings required value not matching regex', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            regex: /\d+/s,
            separator: ',',
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            requires: 'strings=abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'strings': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should throw an error on strings example value not in enumeration', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-s'],
            enums: ['one', 'two'],
            example: ['abc'],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'strings': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on strings default value not in enumeration', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-s'],
            enums: ['one', 'two'],
            default: ['abc'],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'strings': abc. Possible values are [one,two].`,
        );
      });

      it('should throw an error on strings required value not in enumeration', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-s'],
            enums: ['one', 'two'],
            separator: ',',
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            requires: 'strings=abc',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'strings': abc. Possible values are [one,two].`,
        );
      });
    });

    describe('numbers', () => {
      it('should throw an error on numbers example value with zero values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            example: [],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'numbers' has zero example values.`,
        );
      });

      it('should throw an error on numbers default value with zero values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            default: [],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Option 'numbers' has zero default values.`,
        );
      });

      it('should throw an error on numbers example value not in range', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            range: [0, Infinity],
            example: [-3],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'numbers': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on numbers default value not in range', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            range: [0, Infinity],
            default: [-3],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'numbers': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on numbers required value not in range', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            range: [0, Infinity],
            separator: ',',
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            requires: 'numbers=-3',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'numbers': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on numbers example value not in enumeration', () => {
        const options = {
          numbers: {
            names: ['-ns'],
            type: 'numbers',
            enums: [1, 2],
            example: [3],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'numbers': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on numbers default value not in enumeration', () => {
        const options = {
          numbers: {
            names: ['-ns'],
            type: 'numbers',
            enums: [1, 2],
            default: [3],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'numbers': 3. Possible values are [1,2].`,
        );
      });

      it('should throw an error on numbers required value not in enumeration', () => {
        const options = {
          numbers: {
            names: ['-ns'],
            type: 'numbers',
            enums: [1, 2],
            separator: ',',
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            requires: 'numbers=3',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options)).toThrowError(
          `Invalid parameter to 'numbers': 3. Possible values are [1,2].`,
        );
      });
    });
  });

  describe('parse', () => {
    it('should handle zero arguments', () => {
      expect(() => new ArgumentParser({}).parse([])).toMatchObject({});
    });

    it('should throw an error on unknown option name specified in arguments', () => {
      const options = {
        boolean1: {
          type: 'boolean',
          names: ['--boolean1'],
        },
        boolean2: {
          type: 'boolean',
          names: ['--boolean2'],
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options).parse(['boo'])).toThrowError(
        /Unknown option 'boo'.$/,
      );
      expect(() => new ArgumentParser(options).parse(['bool'])).toThrowError(
        `Unknown option 'bool'. Similar names: --boolean1, --boolean2.`,
      );
      expect(() => new ArgumentParser(options).parse(['bool-ean'])).toThrowError(
        `Unknown option 'bool-ean'. Similar names: --boolean1, --boolean2.`,
      );
    });

    it('should throw an error when a required option is not specified', () => {
      const options = {
        required: {
          type: 'boolean',
          names: ['-b'],
          required: true,
          preferredName: 'preferred',
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options).parse([])).toThrowError(
        `Option 'preferred' is required.`,
      );
    });

    it('should throw an error when an option requirement is not satisfied', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['req0'],
          requires: req.and(
            'required1',
            req.or('required2= a| b ', 'required2= b |a ', 'required3=a'),
          ),
        },
        required1: {
          type: 'flag',
          names: ['req1'],
        },
        required2: {
          type: 'strings',
          names: ['req2'],
          separator: '|',
          unique: true,
          trim: true,
        },
        required3: {
          type: 'strings',
          names: ['req3'],
          preferredName: 'preferred',
          positional: true,
          requires: req.and('required1', 'required4'),
        },
        required4: {
          type: 'function',
          names: ['req4'],
          exec: () => {},
        },
      } as const satisfies Options;
      expect(() => new ArgumentParser(options).parse([])).not.toThrowError();
      expect(() => new ArgumentParser(options).parse(['req0'])).toThrowError(
        `Option 'req0' requires 'req1'.`,
      );
      expect(() => new ArgumentParser(options).parse(['req0', 'req1'])).toThrowError(
        `Option 'req0' requires ('req2' or 'preferred').`,
      );
      expect(() => new ArgumentParser(options).parse(['req0', 'req1', 'req2=a'])).toThrowError(
        `Option 'req0' requires ('req2'=' a| b ' or 'req2'=' b |a ' or 'preferred').`,
      );
      expect(() => new ArgumentParser(options).parse(['a'])).toThrowError(
        `Option 'preferred' requires 'req1'.`,
      );
      expect(() => new ArgumentParser(options).parse(['req1', 'a'])).toThrowError(
        `Option 'preferred' requires 'req4'.`,
      );
      expect(() => new ArgumentParser(options).parse(['req0', 'req1', 'c'])).toThrowError(
        `Option 'req0' requires ('req2' or 'preferred'='a').`,
      );
      expect(() =>
        new ArgumentParser(options).parse(['req0', 'req1', 'req2', 'a|a|b']),
      ).not.toThrowError();
      expect(() =>
        new ArgumentParser(options).parse(['req0', 'req1', 'req2', 'b|b|a']),
      ).not.toThrowError();
      expect(() => new ArgumentParser(options).parse(['req1', 'req4', 'a'])).not.toThrowError();
    });

    describe('help', () => {
      it('should throw a help message', () => {
        const options = {
          function: {
            type: 'help',
            names: ['-h'],
            usage: 'usage',
            footer: 'footer',
            format: { indent: { names: 3 } },
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-h'])).toThrow(
          /usage.+Options:.+ {3}.*-h.+footer/s,
        );
      });
    });

    describe('version', () => {
      it('should throw a version message on a version option with fixed version', () => {
        const options = {
          function: {
            type: 'version',
            names: ['-v'],
            version: '0.1.0',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-v'])).toThrow('0.1.0');
      });

      it('should throw a version message on a version option with a resolve function', async () => {
        const options = {
          function: {
            type: 'version',
            names: ['-v'],
            resolve: (str) => `file://${import.meta.dirname}/${str}`,
          },
        } as const satisfies Options;
        await expect(new ArgumentParser(options).parseAsync(['-v'])).rejects.toThrow('0.1.0');
      });

      it('should throw an error on a version option that cannot resolve a package.json file', async () => {
        const options = {
          function: {
            type: 'version',
            names: ['-v'],
            resolve: () => `file:///abc`,
          },
        } as const satisfies Options;
        await expect(new ArgumentParser(options).parseAsync(['-v'])).rejects.toThrowError(
          `Could not find a 'package.json' file.`,
        );
      });
    });

    describe('fuction', () => {
      it('should throw an error on function option specified with value', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            exec: () => {},
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-f=a'])).toThrowError(
          `Option '-f' does not accept any value.`,
        );
      });

      it('should handle a function option', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f', '--function'],
            exec: () => {
              throw 'function';
            },
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).not.toHaveProperty('function');
        expect(() => new ArgumentParser(options).parse(['-f'])).toThrow('function');
        expect(() => new ArgumentParser(options).parse(['--function'])).toThrow('function');
      });

      it('should handle a function option with an asynchronous callback', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            exec: async () => {
              throw 'function';
            },
          },
        } as const satisfies Options;
        await expect(new ArgumentParser(options).parseAsync(['-f'])).rejects.toThrow('function');
      });

      it('should break the parsing loop when a function option explicitly asks so', () => {
        const options = {
          function1: {
            type: 'function',
            names: ['-f1'],
            exec: () => {},
            break: true,
          },
          function2: {
            type: 'function',
            names: ['-f2'],
            exec: () => {
              throw 'function';
            },
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-f1', '-f2'])).not.toThrow();
      });
    });

    describe('flag', () => {
      it('should throw an error on flag option specified with value', () => {
        const options = {
          function: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-f=a'])).toThrowError(
          `Option '-f' does not accept any value.`,
        );
      });

      it('should handle a flag option', () => {
        const options = {
          boolean: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ boolean: undefined });
        expect(new ArgumentParser(options).parse(['-f'])).toMatchObject({ boolean: true });
        expect(new ArgumentParser(options).parse(['-no-f'])).toMatchObject({ boolean: false });
      });

      it('should handle a flag option with a default value', () => {
        const options = {
          boolean: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
            default: false,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ boolean: false });
        expect(new ArgumentParser(options).parse(['-f'])).toMatchObject({ boolean: true });
        expect(new ArgumentParser(options).parse(['-no-f'])).toMatchObject({ boolean: false });
      });
    });

    describe('boolean', () => {
      it('should throw an error on boolean option with missing parameter', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-b'])).toThrowError(
          `Missing parameter to '-b'.`,
        );
      });

      it('should handle a boolean option with default and example values', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            default: true,
            example: false,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ boolean: true });
        expect(new ArgumentParser(options).parse(['-b', ' 0 '])).toMatchObject({ boolean: false });
        expect(new ArgumentParser(options).parse(['-b', ' 1 '])).toMatchObject({ boolean: true });
        expect(new ArgumentParser(options).parse(['--boolean', ''])).toMatchObject({
          boolean: false,
        });
        expect(new ArgumentParser(options).parse(['-b=1', '-b= False '])).toMatchObject({
          boolean: false,
        });
      });

      it('should handle a boolean option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['0', '1'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
        expect(new ArgumentParser(options).parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          boolean: true,
        });
        expect(new ArgumentParser(options).parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          boolean: true,
        });
        expect(new ArgumentParser(options).parse(['0', '1', '-f'])).toMatchObject({
          flag: true,
          boolean: true,
        });
      });

      it('should handle a boolean option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: '--',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['0', '1'])).toThrowError(
          `Unknown option '0'.`,
        );
        expect(new ArgumentParser(options).parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
        expect(new ArgumentParser(options).parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
        expect(new ArgumentParser(options).parse(['-b', '0', '--', '1'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
      });

      it('should handle a boolean option with custom parsing', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            parse: (_, value) => value.includes('123'),
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-b', '0123'])).toMatchObject({ boolean: true });
      });
    });

    describe('string', () => {
      it('should throw an error on string option with missing parameter', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-s'])).toThrowError(
          `Missing parameter to '-s'.`,
        );
      });

      it('should handle a string option with default and example values', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            default: '123',
            example: '456',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ string: '123' });
        expect(new ArgumentParser(options).parse(['-s', '789'])).toMatchObject({ string: '789' });
        expect(new ArgumentParser(options).parse(['--string', ''])).toMatchObject({ string: '' });
        expect(new ArgumentParser(options).parse(['-s=1', '-s=2'])).toMatchObject({ string: '2' });
      });

      it('should handle a string option with a regex constraint', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            regex: /\d+/s,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ string: undefined });
        expect(new ArgumentParser(options).parse(['-s', '456'])).toMatchObject({ string: '456' });
      });

      it('should throw an error on string value not matching regex', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            regex: /\d+/s,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-s', 'abc'])).toThrowError(
          `Invalid parameter to '-s': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should handle a string option with enumeration constraint', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ string: undefined });
        expect(new ArgumentParser(options).parse(['-s', 'one'])).toMatchObject({ string: 'one' });
      });

      it('should handle a string option with trimming normalization', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            trim: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-s', ' one '])).toMatchObject({ string: 'one' });
      });

      it('should handle a string option with lowercase normalization', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            case: 'lower',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-s', 'OnE'])).toMatchObject({ string: 'one' });
      });

      it('should handle a string option with uppercase normalization', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            case: 'upper',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-s', 'oNe'])).toMatchObject({ string: 'ONE' });
      });

      it('should throw an error on string value not in enumeration', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-s', 'abc'])).toThrowError(
          `Invalid parameter to '-s': abc. Possible values are [one,two].`,
        );
      });

      it('should handle a string option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          string: {
            type: 'string',
            names: ['-s'],
            positional: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['0', '1'])).toMatchObject({
          flag: undefined,
          string: '1',
        });
        expect(new ArgumentParser(options).parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          string: '1',
        });
        expect(new ArgumentParser(options).parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          string: '1',
        });
        expect(new ArgumentParser(options).parse(['0', '1', '-f'])).toMatchObject({
          flag: true,
          string: '1',
        });
      });

      it('should handle a string option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          string: {
            type: 'string',
            names: ['-s'],
            positional: '--',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['0', '1'])).toThrowError(
          `Unknown option '0'.`,
        );
        expect(new ArgumentParser(options).parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          string: '1',
        });
        expect(new ArgumentParser(options).parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          string: '-f',
        });
        expect(new ArgumentParser(options).parse(['-s', '0', '--', '1'])).toMatchObject({
          flag: undefined,
          string: '1',
        });
      });

      it('should handle a string option with custom parsing', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            case: 'upper',
            parse: (_, value) => value.slice(2),
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-s', 'abcde'])).toMatchObject({ string: 'CDE' });
      });
    });

    describe('number', () => {
      it('should throw an error on number option with missing parameter', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-n'])).toThrowError(
          `Missing parameter to '-n'.`,
        );
      });

      it('should handle a number option with default and example values', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            default: 123,
            example: 456,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ number: 123 });
        expect(new ArgumentParser(options).parse(['-n', '789'])).toMatchObject({ number: 789 });
        expect(new ArgumentParser(options).parse(['--number', '0'])).toMatchObject({ number: 0 });
        expect(new ArgumentParser(options).parse(['-n=1', '-n=2'])).toMatchObject({ number: 2 });
      });

      it('should handle a number option with a range constraint', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            range: [0, Infinity],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ number: undefined });
        expect(new ArgumentParser(options).parse(['-n', '0'])).toMatchObject({ number: 0 });
      });

      it('should throw an error on number value not in range', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            range: [0, Infinity],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-n', '-3'])).toThrowError(
          `Invalid parameter to '-n': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should handle a number option with enumeration constraint', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [1, 2],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ number: undefined });
        expect(new ArgumentParser(options).parse(['-n', '1'])).toMatchObject({ number: 1 });
      });

      it('should throw an error on number value not in enumeration', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [1, 2],
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-n', '3'])).toThrowError(
          `Invalid parameter to '-n': 3. Possible values are [1,2].`,
        );
      });

      it('should handle a number option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          number: {
            type: 'number',
            names: ['-s'],
            positional: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['0', '1'])).toMatchObject({
          flag: undefined,
          number: 1,
        });
        expect(new ArgumentParser(options).parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          number: 1,
        });
        expect(new ArgumentParser(options).parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          number: 1,
        });
        expect(new ArgumentParser(options).parse(['0', '1', '-f'])).toMatchObject({
          flag: true,
          number: 1,
        });
      });

      it('should handle a number option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          number: {
            type: 'number',
            names: ['-n'],
            positional: '--',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['0', '1'])).toThrowError(
          `Unknown option '0'.`,
        );
        expect(new ArgumentParser(options).parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          number: 1,
        });
        expect(new ArgumentParser(options).parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          number: NaN,
        });
        expect(new ArgumentParser(options).parse(['-n', '0', '--', '1'])).toMatchObject({
          flag: undefined,
          number: 1,
        });
      });

      it('should handle a number option with custom parsing', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            parse: (_, value) => Number(value) + 2,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-n', '1'])).toMatchObject({ number: 3 });
      });

      it('should handle a number option with truncation', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'trunc',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-n', '0.1'])).toMatchObject({ number: 0 });
        expect(new ArgumentParser(options).parse(['-n', '0.5'])).toMatchObject({ number: 0 });
        expect(new ArgumentParser(options).parse(['-n', '0.9'])).toMatchObject({ number: 0 });
        expect(new ArgumentParser(options).parse(['-n', '-.1'])).toMatchObject({ number: -0 });
        expect(new ArgumentParser(options).parse(['-n', '-.5'])).toMatchObject({ number: -0 });
        expect(new ArgumentParser(options).parse(['-n', '-.9'])).toMatchObject({ number: -0 });
      });

      it('should handle a number option with ceil rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'ceil',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-n', '0.1'])).toMatchObject({ number: 1 });
        expect(new ArgumentParser(options).parse(['-n', '0.5'])).toMatchObject({ number: 1 });
        expect(new ArgumentParser(options).parse(['-n', '0.9'])).toMatchObject({ number: 1 });
        expect(new ArgumentParser(options).parse(['-n', '-.1'])).toMatchObject({ number: -0 });
        expect(new ArgumentParser(options).parse(['-n', '-.5'])).toMatchObject({ number: -0 });
        expect(new ArgumentParser(options).parse(['-n', '-.9'])).toMatchObject({ number: -0 });
      });

      it('should handle a number option with floor rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'floor',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-n', '0.1'])).toMatchObject({ number: 0 });
        expect(new ArgumentParser(options).parse(['-n', '0.5'])).toMatchObject({ number: 0 });
        expect(new ArgumentParser(options).parse(['-n', '0.9'])).toMatchObject({ number: 0 });
        expect(new ArgumentParser(options).parse(['-n', '-.1'])).toMatchObject({ number: -1 });
        expect(new ArgumentParser(options).parse(['-n', '-.5'])).toMatchObject({ number: -1 });
        expect(new ArgumentParser(options).parse(['-n', '-.9'])).toMatchObject({ number: -1 });
      });

      it('should handle a number option with nearest rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'nearest',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-n', '0.1'])).toMatchObject({ number: 0 });
        expect(new ArgumentParser(options).parse(['-n', '0.5'])).toMatchObject({ number: 1 });
        expect(new ArgumentParser(options).parse(['-n', '0.9'])).toMatchObject({ number: 1 });
        expect(new ArgumentParser(options).parse(['-n', '-.1'])).toMatchObject({ number: -0 });
        expect(new ArgumentParser(options).parse(['-n', '-.5'])).toMatchObject({ number: -0 });
        expect(new ArgumentParser(options).parse(['-n', '-.9'])).toMatchObject({ number: -1 });
      });
    });

    describe('strings', () => {
      it('should throw an error on strings option with missing parameter', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ss'])).toThrowError(
          `Missing parameter to '-ss'.`,
        );
      });

      it('should throw an error on delimited strings option with too many values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            separator: ',',
            limit: 2,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ss', 'a,b,c'])).toThrowError(
          `Option '-ss' has too many values (3). Should have at most 2.`,
        );
      });

      it('should throw an error on multivalued strings option with too many values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            limit: 2,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ss', 'a', 'b', 'c'])).toThrowError(
          `Option '-ss' has too many values (3). Should have at most 2.`,
        );
      });

      it('should handle a strings option with default and example values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            default: ['one', 'two'],
            example: ['three', 'four'],
            append: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ strings: ['one', 'two'] });
        expect(new ArgumentParser(options).parse(['-ss', '456', 'abc'])).toMatchObject({
          strings: ['456', 'abc'],
        });
        expect(new ArgumentParser(options).parse(['--strings'])).toMatchObject({
          strings: [],
        });
        expect(new ArgumentParser(options).parse(['--strings', '   '])).toMatchObject({
          strings: ['   '],
        });
        expect(new ArgumentParser(options).parse(['-ss=123', '-ss=456'])).toMatchObject({
          strings: ['123', '456'],
        });
        expect(new ArgumentParser(options).parse(['-ss', 'a', 'b', '-ss', 'c', 'd'])).toMatchObject(
          {
            strings: ['a', 'b', 'c', 'd'],
          },
        );
      });

      it('should handle a strings option with enumeration constraint', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            enums: ['one', 'two'],
            separator: ',',
            trim: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ strings: undefined });
        expect(new ArgumentParser(options).parse(['-ss', ' one , one '])).toMatchObject({
          strings: ['one', 'one'],
        });
        expect(new ArgumentParser(options).parse(['-ss', ' two '])).toMatchObject({
          strings: ['two'],
        });
      });

      it('should handle a strings option specified with multiple parameters', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
          },
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ss', 'one', 'two'])).toMatchObject({
          strings: ['one', 'two'],
        });
        expect(new ArgumentParser(options).parse(['-ss', 'one', 'two', '-f'])).toMatchObject({
          strings: ['one', 'two'],
        });
        expect(
          new ArgumentParser(options).parse(['-ss', 'one', 'two', '-ss', 'one=two', 'one']),
        ).toMatchObject({
          strings: ['one=two', 'one'],
        });
      });

      it('should throw an error on strings value not matching regex', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            regex: /\d+/s,
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ss', '123,abc'])).toThrowError(
          `Invalid parameter to '-ss': abc. Value must match the regex /\\d+/s.`,
        );
      });

      it('should handle a strings option with trimming normalization', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            trim: true,
            separator: ',',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ss', ' one, two '])).toMatchObject({
          strings: ['one', 'two'],
        });
      });

      it('should handle a strings option with lowercase normalization', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            case: 'lower',
            separator: ',',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ss', 'OnE,T O.'])).toMatchObject({
          strings: ['one', 't o.'],
        });
      });

      it('should handle a strings option with uppercase normalization', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            case: 'upper',
            separator: ',',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ss', 'o?Ne,2ki'])).toMatchObject({
          strings: ['O?NE', '2KI'],
        });
      });

      it('should throw an error on strings value not in enumeration', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            enums: ['one', 'two'],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ss', 'abc'])).toThrowError(
          `Invalid parameter to '-ss': abc. Possible values are [one,two].`,
        );
      });

      it('should handle a strings option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          strings: {
            type: 'strings',
            names: ['-ss'],
            positional: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['0', '1'])).toMatchObject({
          flag: undefined,
          strings: ['0', '1'],
        });
        expect(new ArgumentParser(options).parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          strings: ['0', '1'],
        });
        expect(new ArgumentParser(options).parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          strings: ['1'],
        });
        expect(new ArgumentParser(options).parse(['0', '1', '-f'])).toMatchObject({
          flag: true,
          strings: ['0', '1'],
        });
      });

      it('should handle a strings option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          strings: {
            type: 'strings',
            names: ['-ss'],
            positional: '--',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['0', '1'])).toThrowError(
          `Unknown option '0'.`,
        );
        expect(new ArgumentParser(options).parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          strings: ['0', '1'],
        });
        expect(new ArgumentParser(options).parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          strings: ['0', '-f'],
        });
        expect(new ArgumentParser(options).parse(['-ss', '0', '--', '1'])).toMatchObject({
          flag: undefined,
          strings: ['1'],
        });
      });

      it('should handle a strings option with custom parsing', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            unique: true,
            parse: (_, value) => value.split(',').flatMap((val) => val.split('|')),
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ss', '1,2|2'])).toMatchObject({
          strings: ['1', '2'],
        });
      });
    });

    describe('numbers', () => {
      it('should throw an error on numbers option with missing parameter', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ns'])).toThrowError(
          `Missing parameter to '-ns'.`,
        );
      });

      it('should throw an error on delimited numbers option with too many values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            separator: ',',
            limit: 2,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ns', '1,2,3'])).toThrowError(
          `Option '-ns' has too many values (3). Should have at most 2.`,
        );
      });

      it('should throw an error on multivalued numbers option with too many values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            limit: 2,
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ns', '1', '2', '3'])).toThrowError(
          `Option '-ns' has too many values (3). Should have at most 2.`,
        );
      });

      it('should handle a numbers option with default and example values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            default: [1, 2],
            example: [3, 4],
            append: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ numbers: [1, 2] });
        expect(new ArgumentParser(options).parse(['-ns', '456', ' 123 '])).toMatchObject({
          numbers: [456, 123],
        });
        expect(new ArgumentParser(options).parse(['--numbers'])).toMatchObject({ numbers: [] });
        expect(new ArgumentParser(options).parse(['--numbers', '   '])).toMatchObject({
          numbers: [0],
        });
        expect(new ArgumentParser(options).parse(['-ns=456', '-ns=123'])).toMatchObject({
          numbers: [456, 123],
        });
        expect(new ArgumentParser(options).parse(['-ns', '5', '6', '-ns', '7', '8'])).toMatchObject(
          {
            numbers: [5, 6, 7, 8],
          },
        );
      });

      it('should handle a numbers option with enumeration constraint', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            enums: [1, 2],
            separator: ',',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse([])).toMatchObject({ numbers: undefined });
        expect(new ArgumentParser(options).parse(['-ns', ' 1 , 1 '])).toMatchObject({
          numbers: [1, 1],
        });
        expect(new ArgumentParser(options).parse(['-ns', ' 2 '])).toMatchObject({
          numbers: [2],
        });
      });

      it('should handle a numbers option specified with multiple parameters', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
          },
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ns', '1', '2'])).toMatchObject({
          numbers: [1, 2],
        });
        expect(new ArgumentParser(options).parse(['-ns', '1', '2', '-f'])).toMatchObject({
          numbers: [1, 2],
        });
        expect(new ArgumentParser(options).parse(['-ns', '1', '2', '-ns', '2', '1'])).toMatchObject(
          {
            numbers: [2, 1],
          },
        );
      });

      it('should throw an error on numbers value not in range', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            range: [0, Infinity],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ns', '1,-3'])).toThrowError(
          `Invalid parameter to '-ns': -3. Value must be in the range [0,Infinity].`,
        );
      });

      it('should throw an error on numbers value not in enumeration', () => {
        const options = {
          numbers: {
            names: ['-ns'],
            type: 'numbers',
            enums: [1, 2],
            separator: ',',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['-ns', '1,3'])).toThrowError(
          `Invalid parameter to '-ns': 3. Possible values are [1,2].`,
        );
      });

      it('should handle a numbers option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            positional: true,
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['0', '1'])).toMatchObject({
          flag: undefined,
          numbers: [0, 1],
        });
        expect(new ArgumentParser(options).parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          numbers: [0, 1],
        });
        expect(new ArgumentParser(options).parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          numbers: [1],
        });
        expect(new ArgumentParser(options).parse(['0', '1', '-f'])).toMatchObject({
          flag: true,
          numbers: [0, 1],
        });
      });

      it('should handle a numbers option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            positional: '--',
          },
        } as const satisfies Options;
        expect(() => new ArgumentParser(options).parse(['0', '1'])).toThrowError(
          `Unknown option '0'.`,
        );
        expect(new ArgumentParser(options).parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          numbers: [0, 1],
        });
        expect(new ArgumentParser(options).parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          numbers: [0, NaN],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0', '--', '1'])).toMatchObject({
          flag: undefined,
          numbers: [1],
        });
      });

      it('should handle a numbers option with custom parsing', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            unique: true,
            parse: (_, value) =>
              value.split(',').flatMap((val) => val.split('|').map((val) => Number(val))),
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ns', '1,2|2'])).toMatchObject({
          numbers: [1, 2],
        });
      });

      it('should handle a numbers option with truncation', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'trunc',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ns', '0.1', '-.1'])).toMatchObject({
          numbers: [0, -0],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0.5', '-.5'])).toMatchObject({
          numbers: [0, -0],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0.9', '-.9'])).toMatchObject({
          numbers: [0, -0],
        });
      });

      it('should handle a numbers option with ceil rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'ceil',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ns', '0.1', '-.1'])).toMatchObject({
          numbers: [1, -0],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0.5', '-.5'])).toMatchObject({
          numbers: [1, -0],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0.9', '-.9'])).toMatchObject({
          numbers: [1, -0],
        });
      });

      it('should handle a numbers option with floor rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'floor',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ns', '0.1', '-.1'])).toMatchObject({
          numbers: [0, -1],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0.5', '-.5'])).toMatchObject({
          numbers: [0, -1],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0.9', '-.9'])).toMatchObject({
          numbers: [0, -1],
        });
      });

      it('should handle a numbers option with nearest rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'nearest',
          },
        } as const satisfies Options;
        expect(new ArgumentParser(options).parse(['-ns', '0.1', '-.1'])).toMatchObject({
          numbers: [0, -0],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0.5', '-.5'])).toMatchObject({
          numbers: [1, -0],
        });
        expect(new ArgumentParser(options).parse(['-ns', '0.9', '-.9'])).toMatchObject({
          numbers: [1, -1],
        });
      });
    });
  });
});
