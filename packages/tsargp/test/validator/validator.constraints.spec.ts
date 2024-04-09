import { describe, expect, it } from 'vitest';
import { type Options, OptionValidator } from '../../lib';
import '../utils.spec';

describe('OptionValidator', () => {
  describe('validate', () => {
    it('should throw an error on boolean option with zero truth names', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          truthNames: [],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option boolean has zero-length enumeration.`);
    });

    it('should throw an error on boolean option with zero falsity names', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          falsityNames: [],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option boolean has zero-length enumeration.`);
    });

    it('should throw an error on boolean option with zero truth and falsity names', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          truthNames: [],
          falsityNames: [],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option boolean has zero-length enumeration.`);
    });

    it('should throw an error on string option with zero enumerated values', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: [],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option string has zero-length enumeration.`);
    });

    it('should throw an error on number option with zero enumerated values', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option number has zero-length enumeration.`);
    });

    it('should throw an error on strings option with zero enumerated values', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          enums: [],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option strings has zero-length enumeration.`);
    });

    it('should throw an error on numbers option with zero enumerated values', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          enums: [],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option numbers has zero-length enumeration.`);
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
      expect(() => validator.validate()).toThrow(`Option string has duplicate enumerator 'dup'.`);
    });

    it('should throw an error on number option with duplicate enumerated values', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [1, 1],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option number has duplicate enumerator 1.`);
    });

    it('should throw an error on strings option with duplicate enumerated values', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          enums: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option strings has duplicate enumerator 'dup'.`);
    });

    it('should throw an error on numbers option with duplicate enumerated values', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          enums: [1, 1],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option numbers has duplicate enumerator 1.`);
    });

    it('should throw an error on boolean option with duplicate truth names', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          truthNames: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option boolean has duplicate enumerator 'dup'.`);
    });

    it('should throw an error on boolean option with duplicate falsity names', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          falsityNames: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option boolean has duplicate enumerator 'dup'.`);
    });

    it('should throw an error on boolean option with duplicate truth and falsity names', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          truthNames: ['dup'],
          falsityNames: ['dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option boolean has duplicate enumerator 'dup'.`);
    });

    it('should throw an error on number option with invalid range', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          range: [0, 0],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option number has invalid numeric range [0, 0].`);
    });

    it('should throw an error on number option with invalid range with NaN', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          range: [0, NaN],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option number has invalid numeric range [0, NaN].`,
      );
    });

    it('should throw an error on function option with invalid parameter count', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: [-1, 1],
          exec() {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option function has invalid parameter count [-1, 1].`,
      );
    });
  });
});
