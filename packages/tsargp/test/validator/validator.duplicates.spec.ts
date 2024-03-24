import { describe, expect, it } from 'vitest';
import { type Options, OptionValidator } from '../../lib';
import '../utils.spec';

describe('OptionValidator', () => {
  describe('validate', () => {
    it('should throw an error on duplicate option name in the same option', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option flag has duplicate name 'dup'.`);
    });

    it('should throw an error on duplicate option name across different options', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['dup'],
        },
        flag2: {
          type: 'flag',
          names: ['dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option flag2 has duplicate name 'dup'.`);
    });

    it('should throw an error on flag option with duplicate negation name', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['dup'],
          negationNames: ['dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option flag has duplicate name 'dup'.`);
    });

    it('should throw an error on option with duplicate positional marker', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['dup'],
          positional: 'dup',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option boolean has duplicate name 'dup'.`);
    });

    it('should throw an error on duplicate positional option', () => {
      const options = {
        boolean1: {
          type: 'boolean',
          positional: true,
        },
        boolean2: {
          type: 'boolean',
          positional: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Duplicate positional option boolean2: previous was boolean1.`,
      );
    });

    it('should throw an error on string option with duplicate enumerated values', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option string has duplicate enum 'dup'.`);
    });

    it('should throw an error on number option with duplicate enumeration values', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [1, 1],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option number has duplicate enum 1.`);
    });

    it('should throw an error on strings option with duplicate enumeration values', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          enums: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option strings has duplicate enum 'dup'.`);
    });

    it('should throw an error on numbers option with duplicate enumeration values', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          enums: [1, 1],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option numbers has duplicate enum 1.`);
    });

    it('should throw an error on duplicate cluster letter in the same option', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'aba',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option flag has duplicate cluster letter 'a'.`);
    });

    it('should throw an error on duplicate cluster letter across different options', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f1'],
          clusterLetters: 'f',
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option flag2 has duplicate cluster letter 'f'.`);
    });
  });
});
