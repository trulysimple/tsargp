import { describe, expect, it } from 'vitest';
import { type Options, OptionValidator } from '../../lib';
import '../utils.spec';

describe('OptionValidator', () => {
  describe('validate', () => {
    it('should throw an error on duplicate option name in the same option', () => {
      const options = {
        duplicate: {
          type: 'string',
          names: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(/Duplicate option name dup\./);
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(/Duplicate option name dup\./);
    });

    it('should throw an error on flag option with duplicate negation name', () => {
      const options = {
        function: {
          type: 'flag',
          names: ['dup'],
          negationNames: ['dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(/Duplicate option name dup\./);
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(/Duplicate option name dup\./);
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(/Duplicate positional option positional2\./);
    });

    it('should throw an error on string option with duplicate enumerated values', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-se'],
          enums: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(/Option string has duplicate enum 'dup'\./);
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
      expect(() => validator.validate()).toThrow(/Option number has duplicate enum 1\./);
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
      expect(() => validator.validate()).toThrow(/Option strings has duplicate enum 'dup'\./);
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
      expect(() => validator.validate()).toThrow(/Option numbers has duplicate enum 1\./);
    });
  });
});
