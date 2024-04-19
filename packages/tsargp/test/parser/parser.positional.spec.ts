import { describe, describe as on, describe as when, expect, it as should } from 'vitest';
import { type Options } from '../../lib/options';
import { ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    when('parameters are specified as positional arguments', () => {
      should('handle a single-valued option', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          single: {
            type: 'single',
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, single: '1' });
        await expect(parser.parse(['-f', '0', '1'])).resolves.toEqual({ flag: true, single: '1' });
        await expect(parser.parse(['0', '-f', '1'])).resolves.toEqual({ flag: true, single: '1' });
        await expect(parser.parse(['0', '1', '-f'])).resolves.toEqual({ flag: true, single: '1' });
      });

      should('handle an array-valued option', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          array: {
            type: 'array',
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['0', '1'])).resolves.toEqual({
          flag: undefined,
          array: ['0', '1'],
        });
        await expect(parser.parse(['-f', '0', '1'])).resolves.toEqual({
          flag: true,
          array: ['0', '1'],
        });
        await expect(parser.parse(['0', '-f', '1'])).resolves.toEqual({
          flag: true,
          array: ['1'],
        });
        await expect(parser.parse(['0', '1', '-f'])).resolves.toEqual({
          flag: true,
          array: ['0', '1'],
        });
      });

      should('handle a polyadic function option', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          function: {
            type: 'function',
            positional: true,
            paramCount: 2,
            preferredName: 'preferred',
            parse: (param) => param,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['0'])).rejects.toThrow(
          'Wrong number of parameters to option preferred: requires exactly 2.',
        );
        await expect(parser.parse(['0', '1', '2'])).rejects.toThrow(
          'Wrong number of parameters to option preferred: requires exactly 2.',
        );
        await expect(parser.parse(['0', '-f'])).resolves.toEqual({
          flag: undefined,
          function: ['0', '-f'],
        });
        await expect(parser.parse(['-f', '0', '1'])).resolves.toEqual({
          flag: true,
          function: ['0', '1'],
        });
        await expect(parser.parse(['0', '1', '-f'])).resolves.toEqual({
          flag: true,
          function: ['0', '1'],
        });
        await expect(parser.parse(['0', '1', '2', '3'])).resolves.toEqual({
          flag: undefined,
          function: ['2', '3'],
        });
      });
    });

    when('parameters are specified after a positional marker', () => {
      should('throw an error on wrong number of parameters to single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            positional: '--',
            preferredName: 'preferred',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['--'])).rejects.toThrow(
          `Wrong number of parameters to option preferred: requires exactly 1.`,
        );
        await expect(parser.parse(['--', '1', '2'])).rejects.toThrow(
          `Wrong number of parameters to option preferred: requires exactly 1.`,
        );
      });

      should('throw an error on missing parameter to polyadic function option ', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            positional: '--',
            paramCount: 2,
            preferredName: 'preferred',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['--'])).rejects.toThrow(
          `Wrong number of parameters to option preferred: requires exactly 2.`,
        );
        await expect(parser.parse(['--', '1', '2', '3'])).rejects.toThrow(
          `Wrong number of parameters to option preferred: requires exactly 2.`,
        );
      });

      should('handle a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['--', '-s'])).resolves.toEqual({
          flag: undefined,
          single: '-s',
        });
        await expect(parser.parse(['0', '--', '-s'])).resolves.toEqual({
          flag: undefined,
          single: '-s',
        });
      });

      should('handle an array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['--'])).resolves.toEqual({
          flag: undefined,
          array: [],
        });
        await expect(parser.parse(['--', '0', '-a'])).resolves.toEqual({
          flag: undefined,
          array: ['0', '-a'],
        });
        await expect(parser.parse(['0', '--', '-a'])).resolves.toEqual({
          flag: undefined,
          array: ['-a'],
        });
      });
    });
  });
});
