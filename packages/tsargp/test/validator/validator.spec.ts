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

    it('should return a warning on string option with fallback value and cluster letters', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          fallback: '',
          clusterLetters: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option string has cluster letters. It may only appear as the last option in a cluster.\n`,
      );
    });

    it('should return a warning on variadic strings option with cluster letters', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          clusterLetters: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option strings has cluster letters. It may only appear as the last option in a cluster.\n`,
      );
    });

    it('should return a warning on variadic function option with cluster letters (1)', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: -1,
          clusterLetters: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option function has cluster letters. It may only appear as the last option in a cluster.\n`,
      );
    });

    it('should return a warning on variadic function option with cluster letters (2)', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: [0, 1],
          clusterLetters: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option function has cluster letters. It may only appear as the last option in a cluster.\n`,
      );
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
