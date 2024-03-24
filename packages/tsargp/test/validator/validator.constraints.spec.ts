import { describe, expect, it } from 'vitest';
import { type Options, OptionValidator } from '../../lib';
import '../utils.spec';

describe('OptionValidator', () => {
  describe('validate', () => {
    it('should throw an error on string example value not matching regex', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          regex: /\d+/s,
          example: 'abc',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to string: 'abc'. Value must match the regex /\\d+/s.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to string: 'abc'. Value must match the regex /\\d+/s.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to required: 'abc'. Value must match the regex /\\d+/s.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to string: 'abc'. Possible values are ['one', 'two'].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to string: 'abc'. Possible values are ['one', 'two'].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to required: 'abc'. Possible values are ['one', 'two'].`,
      );
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to number: -3. Value must be in the range [0, Infinity].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to number: -3. Value must be in the range [0, Infinity].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to required: -3. Value must be in the range [0, Infinity].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to number: 3. Possible values are [1, 2].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to number: 3. Possible values are [1, 2].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to required: 3. Possible values are [1, 2].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to strings: 'abc'. Value must match the regex /\\d+/s.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to strings: 'abc'. Value must match the regex /\\d+/s.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to required: 'abc'. Value must match the regex /\\d+/s.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to strings: 'abc'. Possible values are ['one', 'two'].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to strings: 'abc'. Possible values are ['one', 'two'].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to required: 'abc'. Possible values are ['one', 'two'].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option strings has too many values (3). Should have at most 2.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option strings has too many values (3). Should have at most 2.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option required has too many values (3). Should have at most 2.`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to numbers: -3. Value must be in the range [0, Infinity].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to numbers: -3. Value must be in the range [0, Infinity].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to required: -3. Value must be in the range [0, Infinity].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to numbers: 3. Possible values are [1, 2].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to numbers: 3. Possible values are [1, 2].`,
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Invalid parameter to required: 3. Possible values are [1, 2].`,
      );
    });

    it('should throw an error on numbers example value with too many values', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          example: [1, 2, 3],
          limit: 2,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option numbers has too many values (3). Should have at most 2.`,
      );
    });

    it('should throw an error on numbers default value with too many values', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          default: [1, 2, 3],
          limit: 2,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option numbers has too many values (3). Should have at most 2.`,
      );
    });

    it('should throw an error on numbers required value with too many values', () => {
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
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option required has too many values (3). Should have at most 2.`,
      );
    });
  });
});
