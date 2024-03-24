import { describe, expect, it } from 'vitest';
import { type Options, OptionValidator } from '../../lib';
import '../utils.spec';

describe('OptionValidator', () => {
  describe('constructor', () => {
    it('should handle zero options', () => {
      expect(() => new OptionValidator({})).not.toThrow();
    });
  });

  describe('validate', () => {
    it('should throw an error on boolean option with empty positional marker', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-s'],
          positional: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option boolean contains empty positional marker.`,
      );
    });

    it('should throw an error on version option with empty version', () => {
      const options = {
        version: {
          type: 'version',
          names: ['-v'],
          version: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option version contains empty version.`);
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
      expect(() => validator.validate()).toThrow(`Option string has zero enum values.`);
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
      expect(() => validator.validate()).toThrow(`Option number has zero enum values.`);
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
      expect(() => validator.validate()).toThrow(`Option strings has zero enum values.`);
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
      expect(() => validator.validate()).toThrow(`Option numbers has zero enum values.`);
    });

    it('should validate nested command options recursively', () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          options: {
            command: {
              type: 'command',
              names: ['-c'],
              options: { flag: { type: 'flag' } },
              cmd() {},
            },
          },
          cmd() {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Non-positional option command.command.flag has no name.`,
      );
    });

    it('should avoid circular references while evaluating nested command options', () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          options: {
            command: {
              type: 'command',
              names: ['-c'],
              options: (): Options => options,
              cmd() {},
            },
          },
          cmd() {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });
  });
});
