import { describe, expect, it } from 'vitest';
import { type Options, OptionValidator } from '../../lib';
import '../utils.spec';

describe('OptionValidator', () => {
  describe('validate', () => {
    it('should throw an error on option with invalid cluster letter', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'a = b',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option flag has invalid cluster letter ' '.`,
      );
    });

    it('should throw an error on duplicate cluster letter in the same option', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'aba',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option flag has duplicate cluster letter 'a'.`,
      );
    });

    it('should throw an error on duplicate cluster letter across different options', async () => {
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
      await expect(validator.validate()).rejects.toThrow(
        `Option flag2 has duplicate cluster letter 'f'.`,
      );
    });

    it('should return a warning on string option with fallback value and cluster letters', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          fallback: '',
          clusterLetters: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = await validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option string may only appear as the last option in a cluster.\n`,
      );
    });

    it('should return a warning on variadic strings option with cluster letters', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          clusterLetters: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = await validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option strings may only appear as the last option in a cluster.\n`,
      );
    });

    it('should return a warning on variadic function option with cluster letters (1)', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: -1,
          clusterLetters: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = await validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option function may only appear as the last option in a cluster.\n`,
      );
    });

    it('should return a warning on variadic function option with cluster letters (2)', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: [0, 1],
          clusterLetters: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = await validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option function may only appear as the last option in a cluster.\n`,
      );
    });
  });
});
