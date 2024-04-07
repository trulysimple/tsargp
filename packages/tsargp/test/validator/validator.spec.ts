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
      expect(() => validator.validate()).toThrow(`Option boolean has empty positional marker.`);
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

    it('should throw an error on version option with empty version', () => {
      const options = {
        version: {
          type: 'version',
          names: ['-v'],
          version: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option version has empty version.`);
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
              exec() {},
            },
          },
          exec() {},
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
              exec() {},
            },
          },
          exec() {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });
  });
});
