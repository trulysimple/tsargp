import { describe, describe as on, expect, it as should } from 'vitest';
import { type Options } from '../../lib/options';
import { OptionValidator } from '../../lib/validator';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('OptionValidator', () => {
  on('validate', () => {
    should('throw an error on option with invalid cluster letter (space)', async () => {
      const options = {
        flag: {
          type: 'flag',
          cluster: ' ',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option flag has invalid cluster letter ' '.`,
      );
    });

    should('throw an error on option with invalid cluster letter (equals sign)', async () => {
      const options = {
        flag: {
          type: 'flag',
          cluster: '=',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option flag has invalid cluster letter '='.`,
      );
    });

    should('throw an error on duplicate cluster letter in the same option', async () => {
      const options = {
        flag: {
          type: 'flag',
          cluster: 'aba',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option flag has duplicate cluster letter 'a'.`,
      );
    });

    should('throw an error on duplicate cluster letter across different options', async () => {
      const options = {
        flag1: {
          type: 'flag',
          cluster: 'f',
        },
        flag2: {
          type: 'flag',
          cluster: 'f',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option flag2 has duplicate cluster letter 'f'.`,
      );
    });

    should('return a warning on variadic function option with cluster letter', async () => {
      const options = {
        function: {
          type: 'function',
          cluster: 'a',
          paramCount: [0, 1],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = await validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option function may only appear as the last option in a cluster.\n`,
      );
    });

    should('return a warning on array-valued option with cluster letter', async () => {
      const options = {
        array: {
          type: 'array',
          cluster: 'a',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const { warning } = await validator.validate();
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Variadic option array may only appear as the last option in a cluster.\n`,
      );
    });
  });
});
