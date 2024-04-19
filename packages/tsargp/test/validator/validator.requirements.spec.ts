import { describe, describe as on, describe as when, expect, it as should } from 'vitest';
import { type Options, req } from '../../lib/options';
import { OptionValidator } from '../../lib/validator';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('OptionValidator', () => {
  on('validate', () => {
    when('validating forward requirements', () => {
      should('ignore a requirement callback', async () => {
        const options = {
          flag: {
            type: 'flag',
            requires: () => false,
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).resolves.toMatchObject({});
      });

      should('throw an error on option required by itself with req.not', async () => {
        const options = {
          flag: {
            type: 'flag',
            requires: req.not('flag'),
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(`Option flag requires itself.`);
      });

      should('throw an error on option required by itself with req.all', async () => {
        const options = {
          flag: {
            type: 'flag',
            requires: req.all('flag'),
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(`Option flag requires itself.`);
      });

      should('throw an error on unknown option required with req.one', async () => {
        const options = {
          flag: {
            type: 'flag',
            requires: req.one('other'),
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(`Unknown option other in requirement.`);
      });

      should('throw an error on help option required with undefined', async () => {
        const options = {
          flag: {
            type: 'flag',
            requires: { help: undefined },
          },
          help: {
            type: 'help',
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(`Invalid option help in requirement.`);
      });

      should('throw an error on version option required with null', async () => {
        const options = {
          flag: {
            type: 'flag',
            requires: { version: null },
          },
          version: {
            type: 'version',
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(
          `Invalid option version in requirement.`,
        );
      });

      should(
        'throw an error on option required to be present despite being always required',
        async () => {
          const options = {
            flag1: {
              type: 'flag',
              requires: { flag2: undefined },
            },
            flag2: {
              type: 'flag',
              required: true,
            },
          } as const satisfies Options;
          const validator = new OptionValidator(options);
          await expect(validator.validate()).rejects.toThrow(
            `Invalid required value for option flag2. Option is always required or has a default value.`,
          );
        },
      );

      should(
        'throw an error on option required to be absent despite having a default value',
        async () => {
          const options = {
            flag1: {
              type: 'flag',
              requires: { flag2: null },
            },
            flag2: {
              type: 'flag',
              default: () => true,
            },
          } as const satisfies Options;
          const validator = new OptionValidator(options);
          await expect(validator.validate()).rejects.toThrow(
            `Invalid required value for option flag2. Option is always required or has a default value.`,
          );
        },
      );

      should('allow a flag option required with an arbitrary value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            requires: { flag2: expect },
          },
          flag2: {
            type: 'flag',
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).resolves.toMatchObject({});
      });
    });

    when('validating conditional requirements', () => {
      should('ignore a requirement callback', async () => {
        const options = {
          flag: {
            type: 'flag',
            requiredIf: () => false,
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).resolves.toMatchObject({});
      });

      should('throw an error on option required by itself with req.not', async () => {
        const options = {
          flag: {
            type: 'flag',
            requiredIf: req.not('flag'),
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(`Option flag requires itself.`);
      });

      should('throw an error on option required by itself with req.all', async () => {
        const options = {
          flag: {
            type: 'flag',
            requiredIf: req.all('flag'),
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(`Option flag requires itself.`);
      });

      should('throw an error on unknown option required with req.one', async () => {
        const options = {
          flag: {
            type: 'flag',
            requiredIf: req.one('other'),
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(`Unknown option other in requirement.`);
      });

      should('throw an error on help option required with undefined', async () => {
        const options = {
          flag: {
            type: 'flag',
            requiredIf: { help: undefined },
          },
          help: {
            type: 'help',
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(`Invalid option help in requirement.`);
      });

      should('throw an error on version option required with null', async () => {
        const options = {
          flag: {
            type: 'flag',
            requiredIf: { version: null },
          },
          version: {
            type: 'version',
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).rejects.toThrow(
          `Invalid option version in requirement.`,
        );
      });

      should(
        'throw an error on option required if another is be present despite being always required',
        async () => {
          const options = {
            flag1: {
              type: 'flag',
              requiredIf: { flag2: undefined },
            },
            flag2: {
              type: 'flag',
              required: true,
            },
          } as const satisfies Options;
          const validator = new OptionValidator(options);
          await expect(validator.validate()).rejects.toThrow(
            `Invalid required value for option flag2. Option is always required or has a default value.`,
          );
        },
      );

      should(
        'throw an error on option required if another is absent despite having a default value',
        async () => {
          const options = {
            flag1: {
              type: 'flag',
              requiredIf: { flag2: null },
            },
            flag2: {
              type: 'flag',
              default: () => true,
            },
          } as const satisfies Options;
          const validator = new OptionValidator(options);
          await expect(validator.validate()).rejects.toThrow(
            `Invalid required value for option flag2. Option is always required or has a default value.`,
          );
        },
      );

      should('allow a flag option required if another has an arbitrary value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            requiredIf: { flag2: expect },
          },
          flag2: {
            type: 'flag',
          },
        } as const satisfies Options;
        const validator = new OptionValidator(options);
        await expect(validator.validate()).resolves.toMatchObject({});
      });
    });
  });
});
