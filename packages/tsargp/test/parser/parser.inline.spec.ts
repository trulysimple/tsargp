import { describe, describe as on, describe as when, expect, it as should, vi } from 'vitest';
import { type Options } from '../../lib/options';
import { type ParsingFlags, ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    const flags: ParsingFlags = { clusterPrefix: '-' };

    should('not consider an argument with an inline parameter as a cluster', async () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          cluster: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s=0'], flags)).resolves.toEqual({ single: '0' });
    });

    when('inline parameters are disallowed', () => {
      should('ignore disallowed inline parameter during word completion', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            choices: ['one', 'two'],
            inline: false,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -s=', { compIndex: 7 })).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd -s= ', { compIndex: 8 })).rejects.toThrow(/^-s$/);
      });

      should('throw an error on positional marker specified with inline parameter', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            positional: '', // test empty marker
            cluster: 's',
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['='])).rejects.toThrow(
          `Positional marker does not accept inline parameters.`,
        );
        await expect(parser.parse(['=1'])).rejects.toThrow(
          `Positional marker does not accept inline parameters.`,
        );
        expect(options.single.parse).not.toHaveBeenCalled();
      });

      should('throw an error on flag option specified with inline parameter', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: [''], // test empty name
            cluster: 'f',
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['='])).rejects.toThrow(
          `Option does not accept inline parameters.`,
        );
        await expect(parser.parse(['=1'])).rejects.toThrow(
          `Option does not accept inline parameters.`,
        );
        await expect(parser.parse(['-f1'], flags)).rejects.toThrow(
          `Option does not accept inline parameters.`,
        );
        expect(options.flag.parse).not.toHaveBeenCalled();
      });

      should('throw an error on single-valued option specified with inline parameter', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            cluster: 's',
            inline: false,
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s='])).rejects.toThrow(
          `Option -s does not accept inline parameters.`,
        );
        await expect(parser.parse(['-s=1'])).rejects.toThrow(
          `Option -s does not accept inline parameters.`,
        );
        await expect(parser.parse(['-s1'], flags)).rejects.toThrow(
          `Option -s does not accept inline parameters.`,
        );
        expect(options.single.parse).not.toHaveBeenCalled();
      });

      should('throw an error on command option specified with inline parameter', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            cluster: 'c',
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c='])).rejects.toThrow(
          `Option -c does not accept inline parameters.`,
        );
        await expect(parser.parse(['-c=1'])).rejects.toThrow(
          `Option -c does not accept inline parameters.`,
        );
        await expect(parser.parse(['-c1'], flags)).rejects.toThrow(
          `Option -c does not accept inline parameters.`,
        );
        expect(options.command.parse).not.toHaveBeenCalled();
      });

      should('accept a positional argument', async () => {
        const options = {
          single: {
            type: 'single',
            inline: false,
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['1'])).resolves.toEqual({ single: '1' });
      });
    });

    when('inline parameters are required', () => {
      should('ignore required inline parameter during word completion', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            choices: ['one', 'two'],
            inline: 'always',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -s ', { compIndex: 9 })).rejects.toThrow(/^-s$/);
      });

      should('accept an array-valued option with no parameters', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            inline: 'always',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a'])).resolves.toEqual({ array: [] });
      });

      should('throw an error on single-valued option with missing inline parameter', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['--single'],
            cluster: 's',
            inline: 'always',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['--single'])).rejects.toThrow(
          `Option --single requires an inline parameter.`,
        );
        await expect(parser.parse(['--single', '1'])).rejects.toThrow(
          `Option --single requires an inline parameter.`,
        );
        await expect(parser.parse(['-s'], flags)).rejects.toThrow(
          `Option --single requires an inline parameter.`,
        );
      });
    });

    when('inline parameters are allowed', () => {
      should('parse a single-valued option with inline parameter', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            cluster: 's',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s=1'])).resolves.toEqual({ single: '1' });
        await expect(parser.parse(['-s1'], flags)).resolves.toEqual({ single: '1' });
      });

      should('parse an array-valued option with inline parameter', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            cluster: 'a',
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a=1,2'])).resolves.toEqual({ array: ['1', '2'] });
        await expect(parser.parse(['-a1,2'], flags)).resolves.toEqual({ array: ['1', '2'] });
      });
    });
  });
});
