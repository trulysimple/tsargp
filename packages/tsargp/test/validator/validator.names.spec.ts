import { describe, expect, it } from 'vitest';
import { type Options, OptionValidator } from '../../lib';
import '../utils.spec';

describe('OptionValidator', () => {
  describe('validate', () => {
    it('should ignore empty option names', () => {
      const options = {
        string: {
          type: 'string',
          names: ['', 'name', ''],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should accept a positional option with no name', () => {
      const options = {
        string: {
          type: 'string',
          positional: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should accept a flag option with only a negation name', () => {
      const options = {
        flag: {
          type: 'flag',
          negationNames: ['-no-f'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should throw an error on non-positional option with no name', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['', null],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Non-positional option flag has no name.`);
    });

    it('should throw an error on option with invalid name', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['a = b'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option flag has invalid name 'a = b'.`);
    });

    it('should throw an error on flag option with invalid negation name', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          negationNames: ['a = b'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option flag has invalid name 'a = b'.`);
    });

    it('should throw an error on option with invalid positional marker', () => {
      const options = {
        boolean: {
          type: 'boolean',
          positional: 'a = b',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option boolean has invalid name 'a = b'.`);
    });

    it('should throw an error on option with invalid cluster letter', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'a = b',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option flag has invalid cluster letter ' '.`);
    });

    it('should return a warning on option name too similar to other names', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['flag1'],
        },
        flag2: {
          type: 'flag',
          names: ['flag2'],
        },
        flag3: {
          type: 'flag',
          names: ['flag3'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const warnings = validator.validate();
      expect(warnings).toHaveLength(1);
      expect(warnings.message).toEqual(
        `[] Option name 'flag1' has too similar names ['flag2', 'flag3'].\n`,
      );
    });

    it('should return a warning on mixed naming conventions', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['lower', 'abc', 'keb-ab'],
        },
        flag2: {
          type: 'flag',
          names: ['UPPER', '-def', 'sna_ke'],
        },
        flag3: {
          type: 'flag',
          names: ['Capital', '--ghi', 'col:on'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const warnings = validator.validate();
      expect(warnings).toHaveLength(3);
      expect(warnings.message).toEqual(
        `[] Name slot 0 has mixed naming conventions ['lowercase: lower', 'UPPERCASE: UPPER', 'Capitalized: Capital'].\n` +
          `[] Name slot 1 has mixed naming conventions ['noDash: abc', '-singleDash: -def', '--doubleDash: --ghi'].\n` +
          `[] Name slot 2 has mixed naming conventions ['kebab-case: keb-ab', 'snake_case: sna_ke', 'colon:case: col:on'].\n`,
      );
    });
  });
});
