import { describe, describe as on, describe as when, expect, it as should, vi } from 'vitest';
import { type Options, OptionValues } from '../../lib/options';
import { ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    when('a default value is specified', () => {
      should(
        'set default values before calling the parse callback of an option that breaks the parsing loop',
        async () => {
          const options = {
            flag1: {
              type: 'flag',
              names: ['-f1'],
              break: true,
              parse(_, { values }) {
                expect((values as OptionValues<typeof options>).flag2).toBeTruthy();
              },
            },
            flag2: {
              type: 'flag',
              names: ['-f2'],
              default: true,
            },
          } as const satisfies Options;
          const parser = new ArgumentParser(options);
          await expect(parser.parse(['-f1'])).resolves.toEqual({ flag1: undefined, flag2: true });
        },
      );

      should(
        'avoid setting default values before calling the parse callback of an option that does not break the parsing loop',
        async () => {
          const options = {
            flag1: {
              type: 'function',
              names: ['-f1'],
              parse(_, { values }) {
                expect((values as OptionValues<typeof options>).flag2).toBeUndefined();
              },
            },
            flag2: {
              type: 'flag',
              names: ['-f2'],
              default: { a: 1 },
            },
          } as const satisfies Options;
          const parser = new ArgumentParser(options);
          await expect(parser.parse(['-f1'])).resolves.toEqual({
            flag1: undefined,
            flag2: { a: 1 },
          });
        },
      );

      should('set default values before calling the parse callback of command option', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            parse(_, { values }) {
              expect((values as OptionValues<typeof options>).flag).toBeTruthy();
            },
          },
          flag: {
            type: 'flag',
            names: ['-f'],
            default: [1, 'a'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c'])).resolves.toEqual({ command: undefined, flag: [1, 'a'] });
      });
    });

    when('a default callback is specified', () => {
      should('handle a flag option', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: async () => false,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ flag: false });
      });

      should('handle a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            default: async () => true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ single: true });
      });

      should('handle an array-valued option with a unique constraint', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            unique: true,
            default: async () => ['1', '1'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ array: ['1'] });
      });

      should('throw an error on array-valued option with a limit constraint', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            limit: 1,
            default: async () => ['1', '1'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).rejects.toThrow(
          `Option -a has too many values: 2. Should have at most 1.`,
        );
      });

      should('handle a function option', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            default: async () => true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ function: true });
      });

      should('handle a command option', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            default: async () => false,
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ command: false });
        expect(options.command.parse).not.toHaveBeenCalled();
      });
    });
  });
});
