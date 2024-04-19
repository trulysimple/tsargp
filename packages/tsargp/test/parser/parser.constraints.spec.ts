import { describe, describe as on, describe as when, expect, it as should } from 'vitest';
import { type Options } from '../../lib/options';
import { ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    when('a regex constraint is specified', () => {
      should('handle a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            regex: /\d+/s,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s', '123'])).resolves.toEqual({ single: '123' });
        await expect(parser.parse(['-s', 'abc'])).rejects.toThrow(
          `Invalid parameter to -s: 'abc'. Value must match the regex /\\d+/s.`,
        );
      });

      should('handle an array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            regex: /\d+/s,
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', '1', '2'])).resolves.toEqual({ array: ['1', '2'] });
        await expect(parser.parse(['-a', '1,2'])).resolves.toEqual({ array: ['1', '2'] });
        await expect(parser.parse(['-a', '123', 'abc'])).rejects.toThrow(
          `Invalid parameter to -a: 'abc'. Value must match the regex /\\d+/s.`,
        );
        await expect(parser.parse(['-a', '123,abc'])).rejects.toThrow(
          `Invalid parameter to -a: 'abc'. Value must match the regex /\\d+/s.`,
        );
      });

      should('handle a function option', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            regex: /\d+/s,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f', '123'])).resolves.toEqual({ function: null });
        await expect(parser.parse(['-f', 'abc'])).rejects.toThrow(
          `Invalid parameter to -f: 'abc'. Value must match the regex /\\d+/s.`,
        );
      });
    });

    when('a choices array constraint is specified', () => {
      should('throw an error on invalid parameter to single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            choices: ['one'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s', 'abc'])).rejects.toThrow(
          `Invalid parameter to -s: 'abc'. Value must be one of: 'one'.`,
        );
      });

      should('handle a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            choices: ['one', 'two'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s', 'one'])).resolves.toEqual({ single: 'one' });
        await expect(parser.parse(['-s', 'abc'])).rejects.toThrow(
          `Invalid parameter to -s: 'abc'. Value must be one of: 'one', 'two'.`,
        );
      });

      should('throw an error on invalid parameter to array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            choices: ['one'],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', 'abc'])).rejects.toThrow(
          `Invalid parameter to -a: 'abc'. Value must be one of: 'one'.`,
        );
        await expect(parser.parse(['-a', 'one,abc'])).rejects.toThrow(
          `Invalid parameter to -a: 'abc'. Value must be one of: 'one'.`,
        );
      });

      should('handle a array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            choices: ['one', 'two'],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', 'one', 'two'])).resolves.toEqual({
          array: ['one', 'two'],
        });
        await expect(parser.parse(['-a', 'one,two'])).resolves.toEqual({ array: ['one', 'two'] });
        await expect(parser.parse(['-a', 'abc'])).rejects.toThrow(
          `Invalid parameter to -a: 'abc'. Value must be one of: 'one', 'two'.`,
        );
      });
    });

    when('a choices record constraint is specified', () => {
      should('throw an error on invalid parameter to single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            choices: { one: 'two' },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s', 'abc'])).rejects.toThrow(
          `Invalid parameter to -s: 'abc'. Value must be one of: 'one'.`,
        );
      });

      should('handle a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            choices: { one: 'two' },
            parse: (param) => param,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s', 'one'])).resolves.toEqual({ single: 'two' });
        await expect(parser.parse(['-s', 'abc'])).resolves.toEqual({ single: 'abc' });
      });

      should('throw an error on invalid parameter to array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            choices: { one: 'two' },
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', 'abc'])).rejects.toThrow(
          `Invalid parameter to -a: 'abc'. Value must be one of: 'one'.`,
        );
        await expect(parser.parse(['-a', 'one,abc'])).rejects.toThrow(
          `Invalid parameter to -a: 'abc'. Value must be one of: 'one'.`,
        );
      });

      should('handle an array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            choices: { one: 'two' },
            separator: ',',
            parse: (param) => param,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', 'one'])).resolves.toEqual({ array: ['two'] });
        await expect(parser.parse(['-a', 'one,one'])).resolves.toEqual({ array: ['two', 'two'] });
        await expect(parser.parse(['-a', 'abc'])).resolves.toEqual({ array: ['abc'] });
        await expect(parser.parse(['-a', 'abc,abc'])).resolves.toEqual({ array: ['abc', 'abc'] });
      });
    });

    when('a limit constraint is specified', () => {
      should('throw an error on array-valued option with too many values', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            separator: ',',
            limit: 1,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', 'a', 'b'])).rejects.toThrow(
          `Option -a has too many values: 2. Should have at most 1.`,
        );
        await expect(parser.parse(['-a', 'a,b'])).rejects.toThrow(
          `Option -a has too many values: 2. Should have at most 1.`,
        );
      });
    });

    when('a unique constraint is specified', () => {
      should('handle an array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            separator: ',',
            unique: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', '1', '2', '1'])).resolves.toEqual({ array: ['1', '2'] });
        await expect(parser.parse(['-a', '1,2,1,2'])).resolves.toEqual({ array: ['1', '2'] });
      });
    });
  });
});
