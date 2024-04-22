import { describe, describe as on, describe as when, expect, it as should, vi } from 'vitest';
import { type Options } from '../../lib/options';
import { ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    should('handle an array-valued option with local file', async () => {
      const options = {
        array: {
          type: 'array',
          names: ['-a'],
          sources: ['ARRAY', new URL(`file://${import.meta.dirname}/../data/test-read-file.txt`)],
          separator: '\n',
          parse: vi.fn((param) => param),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env['ARRAY'];
      await expect(parser.parse([])).resolves.toEqual({ array: ['test', 'read', 'file'] });
      expect(options.array.parse).toHaveBeenCalledWith('test', {
        // should have been { array: undefined } at the time of call
        values: { array: ['test', 'read', 'file'] },
        index: NaN,
        name: expect.stringMatching(/data\/test-read-file.txt$/),
        comp: false,
        format: expect.anything(),
      });
      options.array.parse.mockClear();
      process.env['ARRAY'] = '1';
      await expect(parser.parse([])).resolves.toEqual({ array: ['1'] });
      expect(options.array.parse).toHaveBeenCalledWith('1', {
        // should have been { array: undefined } at the time of call
        values: { array: ['1'] },
        index: NaN,
        name: 'ARRAY',
        comp: false,
        format: expect.anything(),
      });
    });

    when('an environment variable is specified', () => {
      should('handle a flag option', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            sources: ['FLAG1'],
            requires: 'flag2',
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            sources: ['FLAG2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete process.env['FLAG2'];
        process.env['FLAG1'] = '';
        await expect(parser.parse([])).rejects.toThrow(`Option -f1 requires -f2.`);
        process.env['FLAG2'] = '';
        await expect(parser.parse([])).resolves.toEqual({ flag1: true, flag2: true });
      });

      should('handle a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            sources: ['SINGLE'],
            requires: 'flag',
          },
          flag: {
            type: 'flag',
            names: ['-f'],
            sources: ['FLAG'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete process.env['FLAG'];
        process.env['SINGLE'] = '1';
        await expect(parser.parse([])).rejects.toThrow(`Option -s requires -f.`);
        process.env['FLAG'] = '';
        await expect(parser.parse([])).resolves.toEqual({ single: '1', flag: true });
        process.env['SINGLE'] = '';
        await expect(parser.parse([])).resolves.toEqual({ single: '', flag: true });
      });

      should('handle an array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            sources: ['ARRAY'],
            separator: ',',
            requires: 'flag',
          },
          flag: {
            type: 'flag',
            names: ['-f'],
            sources: ['FLAG'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete process.env['FLAG'];
        process.env['ARRAY'] = 'one,two';
        await expect(parser.parse([])).rejects.toThrow(`Option -a requires -f.`);
        process.env['FLAG'] = '';
        await expect(parser.parse([])).resolves.toEqual({ array: ['one', 'two'], flag: true });
        process.env['ARRAY'] = '';
        await expect(parser.parse([])).resolves.toEqual({ array: [''], flag: true });
      });

      should('handle a function option and ignore its parameter count', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f1'],
            sources: ['FUNCTION'],
            requires: 'flag',
            paramCount: 2,
            parse: (param) => param,
          },
          flag: {
            type: 'flag',
            names: ['-f2'],
            sources: ['FLAG'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete process.env['FLAG'];
        process.env['FUNCTION'] = '1';
        await expect(parser.parse([])).rejects.toThrow(`Option -f1 requires -f2.`);
        process.env['FLAG'] = '';
        await expect(parser.parse([])).resolves.toEqual({ function: ['1'], flag: true });
        process.env['FUNCTION'] = '';
        await expect(parser.parse([])).resolves.toEqual({ function: [''], flag: true });
      });
    });

    should(
      'throw an error on option absent despite being required if another is specified',
      async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            sources: ['FLAG1'],
            requiredIf: 'flag2',
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            sources: ['FLAG2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete process.env['FLAG1'];
        process.env['FLAG2'] = '1';
        await expect(parser.parse([])).rejects.toThrow(`Option -f1 is required if -f2.`);
      },
    );

    should('throw an error on environment variable that fails a regex constraint', async () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          sources: ['SINGLE'],
          regex: /\d+/,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['SINGLE'] = 'abc';
      await expect(parser.parse([])).rejects.toThrow(
        `Invalid parameter to SINGLE: 'abc'. Value must match the regex /\\d+/.`,
      );
    });

    should('throw an error on environment variable that fails a choice constraint', async () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          sources: ['SINGLE'],
          choices: ['1'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['SINGLE'] = 'abc';
      await expect(parser.parse([])).rejects.toThrow(
        `Invalid parameter to SINGLE: 'abc'. Value must be one of: '1'.`,
      );
    });

    should('throw an error on environment variable that fails a limit constraint', async () => {
      const options = {
        array: {
          type: 'array',
          names: ['-a'],
          sources: ['ARRAY'],
          separator: ',',
          limit: 1,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['ARRAY'] = 'abc,def';
      await expect(parser.parse([])).rejects.toThrow(
        `Option ARRAY has too many values: 2. Should have at most 1.`,
      );
    });
  });
});
