import { describe, describe as on, expect, it as should } from 'vitest';
import { type Options } from '../../lib/options';
import { OptionValidator } from '../../lib/validator';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('OptionValidator', () => {
  on('validate', () => {
    should('accept an option with empty positional marker', async () => {
      const options = {
        single: {
          type: 'single',
          positional: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).resolves.toMatchObject({});
    });

    should('accept a version option with empty version', async () => {
      const options = {
        version: {
          type: 'version',
          version: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).resolves.toMatchObject({});
    });

    should('accept a version option with empty choices', async () => {
      const options = {
        single: {
          type: 'single',
          choices: [],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).resolves.toMatchObject({});
    });

    should('accept an option with empty cluster letters', async () => {
      const options = {
        flag: {
          type: 'flag',
          cluster: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).resolves.toMatchObject({});
    });

    should('throw an error on duplicate positional option', async () => {
      const options = {
        single1: {
          type: 'single',
          positional: true,
        },
        single2: {
          type: 'single',
          positional: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Duplicate positional option single2: previous was single1.`,
      );
    });

    should('validate nested command options recursively', async () => {
      const options = {
        cmd1: {
          type: 'command',
          options: {
            cmd2: {
              type: 'command',
              options: (): Options => ({ flag: { type: 'flag', names: [' '] } }),
            },
          },
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).rejects.toThrow(
        `Option cmd1.cmd2.flag has invalid name ' '.`,
      );
    });

    should('avoid circular references while evaluating nested command options', async () => {
      const options = {
        command: {
          type: 'command',
          options: {
            command: {
              type: 'command',
              options: (): Options => options,
            },
          },
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      await expect(validator.validate()).resolves.toMatchObject({});
    });
  });
});
