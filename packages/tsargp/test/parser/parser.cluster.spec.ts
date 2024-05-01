import { describe, describe as on, describe as when, expect, it as should } from 'vitest';
import { type Options } from '../../lib/options';
import { type ParsingFlags, ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    const flags: ParsingFlags = { clusterPrefix: '' };

    should('throw an error on unrecognized cluster argument', async () => {
      const parser = new ArgumentParser({});
      await expect(parser.parse(['-'], flags)).rejects.toThrow(`Unknown option -.`);
      await expect(parser.parse(['-x'], flags)).rejects.toThrow(`Unknown option -x.`);
    });

    should('parse a cluster argument with empty cluster prefix', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: [''], // test empty name
          cluster: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['f'], flags)).resolves.toEqual({ flag: true });
    });

    when('a cluster argument is specified', () => {
      should('parse a flag option', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            cluster: 'f',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['f'], flags)).resolves.toEqual({ flag: true });
        await expect(parser.parse(['ff'], flags)).resolves.toEqual({ flag: true });
      });

      should('parse a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            cluster: 's',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['s', '1'], flags)).resolves.toEqual({ single: '1' });
        await expect(parser.parse(['ss', '1', '2'], flags)).resolves.toEqual({ single: '2' });
      });

      should('parse an array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            cluster: 'a',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['a', '1', '2'], flags)).resolves.toEqual({ array: ['1', '2'] });
      });

      should('parse a variadic function option', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            cluster: 'f',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['f'], flags)).resolves.toEqual({ function: null });
      });

      should('parse a polyadic function option', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            cluster: 'f',
            paramCount: 2,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['f', '1', '2'], flags)).resolves.toEqual({ function: null });
        await expect(parser.parse(['ff', '1', '2', '3', '4'], flags)).resolves.toEqual({
          function: null,
        });
      });

      should('parse a command option', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            cluster: 'c',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['c'], flags)).resolves.toEqual({ command: {} });
      });
    });

    when('a variadic option is specified in middle of a cluster argument', () => {
      should('throw an error on array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            cluster: 'a',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['aa'], flags)).rejects.toThrow(
          `Option letter 'a' must be the last in a cluster.`,
        );
      });

      should('throw an error on variadic function option', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            cluster: 'f',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['ff'], flags)).rejects.toThrow(
          `Option letter 'f' must be the last in a cluster.`,
        );
      });

      should('throw an error on command option', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            cluster: 'c',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['cc'], flags)).rejects.toThrow(
          `Option letter 'c' must be the last in a cluster.`,
        );
      });
    });

    should('parse a nameless positional option in a cluster argument', async () => {
      const options = {
        single1: {
          type: 'single',
          cluster: 's',
          positional: true,
        },
        single2: {
          type: 'single',
          names: ['-s'],
          cluster: 'S',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['s1'], flags)).resolves.toEqual({
        single1: '1',
        single2: undefined,
      });
      await expect(parser.parse(['s', '1'], flags)).resolves.toEqual({
        single1: '1',
        single2: undefined,
      });
      await expect(parser.parse(['sS', '1', '2'], flags)).resolves.toEqual({
        single1: '1',
        single2: '2',
      });
      await expect(parser.parse(['Ss', '1', '2'], flags)).resolves.toEqual({
        single1: '2',
        single2: '1',
      });
    });

    should('parse options in a cluster argument for a nested command', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          options: {
            flag: {
              type: 'flag',
              names: ['-f'],
              cluster: 'f',
            },
            single: {
              type: 'single',
              names: ['-s'],
              cluster: 's',
            },
            array: {
              type: 'array',
              names: ['-a'],
              cluster: 'a',
            },
          },
          cluster: 'c',
          clusterPrefix: '',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['c', 'fsa', '1', '2', '3'], flags)).resolves.toEqual({
        command: {
          flag: true,
          single: '1',
          array: ['2', '3'],
        },
      });
    });
  });
});
