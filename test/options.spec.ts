import { describe, expect, it } from 'vitest';
import { OptionRegistry, req, type Options } from '../lib';

describe('OptionRegistry', () => {
  describe('constructor', () => {
    it('should handle zero options', () => {
      expect(() => new OptionRegistry({})).not.toThrow();
    });

    it('should ignore empty option names', () => {
      const options = {
        string: {
          type: 'string',
          names: ['', 'name', ''],
        },
      } as const satisfies Options;
      expect(() => new OptionRegistry(options)).not.toThrow();
    });

    describe('duplicates', () => {
      it('should throw an error on duplicate option name in the same option', () => {
        const options = {
          duplicate: {
            type: 'string',
            names: ['dup', 'dup'],
          },
        } as const satisfies Options;
        expect(() => new OptionRegistry(options)).toThrow(/Duplicate option name .+dup.+\./);
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
        expect(() => new OptionRegistry(options)).toThrow(/Duplicate option name .+dup.+\./);
      });

      it('should throw an error on flag option with duplicate negation name', () => {
        const options = {
          function: {
            type: 'flag',
            names: ['dup'],
            negationNames: ['dup'],
          },
        } as const satisfies Options;
        expect(() => new OptionRegistry(options)).toThrow(/Duplicate option name .+dup.+\./);
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
        expect(() => new OptionRegistry(options)).toThrow(/Duplicate option name .+dup.+\./);
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
        expect(() => new OptionRegistry(options)).toThrow(
          /Duplicate positional option .+positional2.+\./,
        );
      });
    });
  });

  describe('validate', () => {
    it('should throw an error on option with no name', () => {
      const options = {
        string: {
          type: 'string',
          names: [],
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      expect(() => registry.validate()).toThrow(/Option .+string.+ has no name\./);
    });

    it('should throw an error on invalid option name', () => {
      const options = {
        string: {
          type: 'string',
          names: ['a = b'],
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      expect(() => registry.validate()).toThrow(/Invalid option name .+a = b.+\./);
    });

    it('should throw an error on option with empty positional marker', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          positional: '',
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      expect(() => registry.validate()).toThrow(/Option .+string.+ has empty positional marker\./);
    });

    it('should throw an error on version option with no version and no resolve', () => {
      const options = {
        version: {
          type: 'version',
          names: ['-v'],
          version: '',
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      expect(() => registry.validate()).toThrow(
        /Option .+version.+ contains no version or resolve function\./,
      );
    });

    describe('requires', () => {
      it('should throw an error on option required by itself', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: req.all('required', req.one({ requires: 'o' })),
          },
          required: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(/Option .+requires.+ requires itself\./);
      });

      it('should throw an error on unknown required option', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: req.all('required', req.one({ unknown: 'o' })),
          },
          required: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(/Unknown required option .+unknown.+\./);
      });

      it('should allow an option required to be present', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: { required: undefined },
          },
          required: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).not.toThrow();
      });

      it('should allow an option required to be absent', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: { required: null },
          },
          required: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).not.toThrow();
      });

      it('should throw an error on flag option required with a value', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: { required: true },
          },
          required: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Required option .+required.+ does not accept values\./,
        );
      });

      it('should throw an error on function option required with a value', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: { required: true },
          },
          required: {
            type: 'function',
            names: ['-f2'],
            exec: () => {},
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Required option .+required.+ does not accept values\./,
        );
      });

      it('should throw an error on boolean option required with an incompatible value', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 1 },
          },
          required: {
            type: 'boolean',
            names: ['-b'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has incompatible value <1>\. Should be of type .+'boolean'.+\./,
        );
      });

      it('should throw an error on string option required with an incompatible value', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 1 },
          },
          required: {
            type: 'string',
            names: ['-s'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has incompatible value <1>\. Should be of type .+'string'.+\./,
        );
      });

      it('should throw an error on number option required with an incompatible value', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: '1' },
          },
          required: {
            type: 'number',
            names: ['-n'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has incompatible value <1>\. Should be of type .+'number'.+\./,
        );
      });

      it('should throw an error on strings option required with an incompatible value', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 1 },
          },
          required: {
            type: 'strings',
            names: ['-ss'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has incompatible value <1>\. Should be of type .+'object'.+\./,
        );
      });

      it('should throw an error on strings option required with an incompatible array element', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: [1] },
          },
          required: {
            type: 'strings',
            names: ['-ss'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has incompatible value <1>\. Should be of type .+'string'.+\./,
        );
      });

      it('should throw an error on numbers option required with an incompatible value', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 1 },
          },
          required: {
            type: 'numbers',
            names: ['-ns'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has incompatible value <1>\. Should be of type .+'object'.+\./,
        );
      });

      it('should throw an error on numbers option required with an incompatible array element', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: ['1'] },
          },
          required: {
            type: 'numbers',
            names: ['-ns'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has incompatible value <1>\. Should be of type .+'number'.+\./,
        );
      });
    });

    describe('string', () => {
      it('should throw an error on string option with zero enumerated values', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            enums: [],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(/Option .+string.+ has zero enum values\./);
      });

      it('should throw an error on string option with duplicate enumerated values', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-se'],
            enums: ['dup', 'dup'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+string.+ has duplicate enum .+'dup'.+\./,
        );
      });

      it('should throw an error on string example value not matching regex', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            regex: /\d+/s,
            example: 'abc',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+string.+: .+'abc'.+\. Value must match the regex .+\/\\d\+\/s.+\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+string.+: .+'abc'.+\. Value must match the regex .+\/\\d\+\/s.+\./,
        );
      });

      it('should throw an error on string required value not matching regex', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 'abc' },
          },
          required: {
            type: 'string',
            names: ['-s'],
            regex: /\d+/s,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+required.+: .+'abc'.+\. Value must match the regex .+\/\\d\+\/s.+\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+string.+: .+'abc'.+\. Possible values are \[.+'one'.+, .+'two'.+\]\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+string.+: .+'abc'.+\. Possible values are \[.+'one'.+, .+'two'.+\]\./,
        );
      });

      it('should throw an error on string required value not in enumeration', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 'abc' },
          },
          required: {
            type: 'string',
            names: ['-s'],
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+required.+: .+'abc'.+\. Possible values are \[.+'one'.+, .+'two'.+\]\./,
        );
      });
    });

    describe('number', () => {
      it('should throw an error on number option with zero enumerated values', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(/Option .+number.+ has zero enum values\./);
      });

      it('should throw an error on number option with duplicate enumeration values', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [1, 1],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(/Option .+number.+ has duplicate enum .+1.+\./);
      });

      it('should throw an error on number example value not in range', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            range: [0, Infinity],
            example: -3,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+number.+: .+-3.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+number.+: .+-3.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
        );
      });

      it('should throw an error on number required value not in range', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: -3 },
          },
          required: {
            type: 'number',
            names: ['-n'],
            range: [0, Infinity],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+required.+: .+-3.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+number.+: .+3.+\. Possible values are \[.+1.+, .+2.+\]\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+number.+: .+3.+\. Possible values are \[.+1.+, .+2.+\]\./,
        );
      });

      it('should throw an error on number required value not in enumeration', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 3 },
          },
          required: {
            type: 'number',
            names: ['-n'],
            enums: [1, 2],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+required.+: .+3.+\. Possible values are \[.+1.+, .+2.+\]\./,
        );
      });
    });

    describe('strings', () => {
      it('should throw an error on strings option with zero enumerated values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            enums: [],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(/Option .+strings.+ has zero enum values\./);
      });

      it('should throw an error on strings option with duplicate enumeration values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            enums: ['dup', 'dup'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+strings.+ has duplicate enum .+'dup'.+\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+strings.+: .+'abc'.+\. Value must match the regex .+\/\\d\+\/s.+\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+strings.+: .+'abc'.+\. Value must match the regex .+\/\\d\+\/s.+\./,
        );
      });

      it('should throw an error on strings required value not matching regex', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: ['abc'] },
          },
          required: {
            type: 'strings',
            names: ['-ss'],
            regex: /\d+/s,
            separator: ',',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+required.+: .+'abc'.+\. Value must match the regex .+\/\\d\+\/s.+\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+strings.+: .+'abc'.+\. Possible values are \[.+'one'.+, .+'two'.+\]\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+strings.+: .+'abc'.+\. Possible values are \[.+'one'.+, .+'two'.+\]\./,
        );
      });

      it('should throw an error on strings required value not in enumeration', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: ['abc'] },
          },
          required: {
            type: 'strings',
            names: ['-s'],
            enums: ['one', 'two'],
            separator: ',',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+required.+: .+'abc'.+\. Possible values are \[.+'one'.+, .+'two'.+\]\./,
        );
      });

      it('should throw an error on strings example value with too many values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            example: ['one', 'two', 'three'],
            limit: 2,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+strings.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
        );
      });

      it('should throw an error on strings default value with too many values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            default: ['one', 'two', 'three'],
            limit: 2,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+strings.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
        );
      });

      it('should throw an error on strings required value with too many values', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: ['one', 'two', 'three'] },
          },
          required: {
            type: 'strings',
            names: ['-ss'],
            limit: 2,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
        );
      });
    });

    describe('numbers', () => {
      it('should throw an error on numbers option with zero enumerated values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            enums: [],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(/Option .+numbers.+ has zero enum values\./);
      });

      it('should throw an error on numbers option with duplicate enumeration values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            enums: [1, 1],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(/Option .+numbers.+ has duplicate enum .+1.+\./);
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+numbers.+: .+-3.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
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
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+numbers.+: .+-3.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
        );
      });

      it('should throw an error on numbers required value not in range', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: [-3] },
          },
          required: {
            type: 'numbers',
            names: ['-ns'],
            range: [0, Infinity],
            separator: ',',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+required.+: .+-3.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
        );
      });

      it('should throw an error on numbers example value not in enumeration', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            enums: [1, 2],
            example: [3],
            separator: ',',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+numbers.+: .+3.+. Possible values are \[.+1.+, .+2.+\]\./,
        );
      });

      it('should throw an error on numbers default value not in enumeration', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            enums: [1, 2],
            default: [3],
            separator: ',',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+numbers.+: .+3.+. Possible values are \[.+1.+, .+2.+\]\./,
        );
      });

      it('should throw an error on numbers required value not in enumeration', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: [3] },
          },
          required: {
            type: 'numbers',
            names: ['-ns'],
            enums: [1, 2],
            separator: ',',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Invalid parameter to .+required.+: .+3.+. Possible values are \[.+1.+, .+2.+\]\./,
        );
      });

      it('should throw an error on strings example value with too many values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            example: [1, 2, 3],
            limit: 2,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+numbers.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
        );
      });

      it('should throw an error on strings default value with too many values', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            default: [1, 2, 3],
            limit: 2,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+numbers.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
        );
      });

      it('should throw an error on strings required value with too many values', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: [1, 2, 3] },
          },
          required: {
            type: 'numbers',
            names: ['-ns'],
            limit: 2,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(() => registry.validate()).toThrow(
          /Option .+required.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
        );
      });
    });
  });
});
