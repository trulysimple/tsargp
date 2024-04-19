import { describe, describe as on, expect, it as should } from 'vitest';
import { type Options } from '../../lib/options';
import { OptionValidator } from '../../lib/validator';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('OptionValidator', () => {
  on('validate', () => {
    should('throw an error on single-valued option with duplicate choice', async () => {
      const options = {
        single: {
          type: 'single',
          choices: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option single has duplicate choice 'dup'.`,
      );
    });

    should('throw an error on array-valued option with duplicate choice', async () => {
      const options = {
        array: {
          type: 'array',
          choices: ['dup', 'dup'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option array has duplicate choice 'dup'.`,
      );
    });

    should('accept an array-valued option that disallows inline parameters', async () => {
      const options = {
        array: {
          type: 'array',
          inline: false,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).resolves.toMatchObject({});
    });

    should('throw an error on array-valued option that requires inline parameters', async () => {
      const options = {
        array: {
          type: 'array',
          inline: 'always',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option array has invalid inline constraint.`,
      );
    });

    should('throw an error on function option that requires inline parameters', async () => {
      const options = {
        function: {
          type: 'function',
          inline: 'always',
          paramCount: 2,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option function has invalid inline constraint.`,
      );
    });

    should('throw an error on function option with negative parameter count', async () => {
      const options = {
        function: {
          type: 'function',
          paramCount: -1,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option function has invalid parameter count -1.`,
      );
    });

    should('throw an error on function option with zero parameter count', async () => {
      const options = {
        function: {
          type: 'function',
          paramCount: 0,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option function has invalid parameter count 0.`,
      );
    });

    should('throw an error on function option with unitary parameter count', async () => {
      const options = {
        function: {
          type: 'function',
          paramCount: 1,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option function has invalid parameter count 1.`,
      );
    });

    should('throw an error on function option with invalid parameter count range', async () => {
      const options = {
        function: {
          type: 'function',
          paramCount: [0, 0],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option function has invalid parameter count [0, 0].`,
      );
    });

    should('throw an error on function option with invalid minimum parameter count', async () => {
      const options = {
        function: {
          type: 'function',
          paramCount: [-1, 1],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option function has invalid parameter count [-1, 1].`,
      );
    });
  });
});
