import { describe, expect, it } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a function option with positional arguments', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f1'],
        },
        function: {
          type: 'function',
          names: ['-f2'],
          positional: true,
          paramCount: 2,
          exec: ({ param }) => param,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0'])).rejects.toThrow('Missing parameter to -f2.');
      await expect(parser.parse(['0', '1', '2'])).rejects.toThrow('Missing parameter to -f2.');
      await expect(parser.parse(['0', '-f1'])).resolves.toEqual({
        flag: undefined,
        function: ['0', '-f1'],
      });
      await expect(parser.parse(['-f1', '0', '1'])).resolves.toEqual({
        flag: true,
        function: ['0', '1'],
      });
      await expect(parser.parse(['0', '1', '-f1'])).resolves.toEqual({
        flag: true,
        function: ['0', '1'],
      });
      await expect(parser.parse(['0', '1', '2', '3'])).resolves.toEqual({
        flag: undefined,
        function: ['2', '3'],
      });
    });

    it('should throw an error when a required option with no name is not specified', async () => {
      const options = {
        required: {
          type: 'boolean',
          required: true,
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).rejects.toThrow(`Option is required.`);
    });

    it('should throw an error missing parameter after positional marker', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).rejects.toThrow(`Missing parameter to abc.`);
    });

    it('should throw an error on positional marker specified with value', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--='])).rejects.toThrow(
        `Positional marker -- does not accept inline values.`,
      );
      await expect(parser.parse(['--=a'])).rejects.toThrow(
        `Positional marker -- does not accept inline values.`,
      );
    });

    it('should handle a boolean option with positional arguments', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, boolean: true });
      await expect(parser.parse(['-f', '0', '1'])).resolves.toEqual({ flag: true, boolean: true });
      await expect(parser.parse(['0', '-f', '1'])).resolves.toEqual({ flag: true, boolean: true });
      await expect(parser.parse(['0', '1', '-f'])).resolves.toEqual({ flag: true, boolean: true });
    });

    it('should handle a boolean option with positional arguments after marker', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, boolean: true });
      await expect(parser.parse(['--', '0', '1'])).resolves.toEqual({
        flag: undefined,
        boolean: true,
      });
      await expect(parser.parse(['--', '0', '-f'])).resolves.toEqual({
        flag: undefined,
        boolean: true,
      });
      await expect(parser.parse(['-b', '0', '--', '1'])).resolves.toEqual({
        flag: undefined,
        boolean: true,
      });
    });

    it('should set the fallback value of a boolean option when specified with a positional marker without parameters', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          positional: '--',
          fallback: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).resolves.toEqual({ boolean: true });
    });

    it('should throw an error on string option with missing parameter after positional marker', async () => {
      const options = {
        string: {
          type: 'string',
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).rejects.toThrow(`Missing parameter to abc.`);
    });

    it('should handle a string option with positional arguments', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        string: {
          type: 'string',
          names: ['-s'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, string: '1' });
      await expect(parser.parse(['-f', '0', '1'])).resolves.toEqual({ flag: true, string: '1' });
      await expect(parser.parse(['0', '-f', '1'])).resolves.toEqual({ flag: true, string: '1' });
      await expect(parser.parse(['0', '1', '-f'])).resolves.toEqual({ flag: true, string: '1' });
    });

    it('should handle a string option with positional arguments after marker', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        string: {
          type: 'string',
          names: ['-s'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, string: '1' });
      await expect(parser.parse(['--', '0', '1'])).resolves.toEqual({
        flag: undefined,
        string: '1',
      });
      await expect(parser.parse(['--', '0', '-f'])).resolves.toEqual({
        flag: undefined,
        string: '-f',
      });
      await expect(parser.parse(['-s', '0', '--', '1'])).resolves.toEqual({
        flag: undefined,
        string: '1',
      });
    });

    it('should set the fallback value of a string option when specified with a positional marker without parameters', async () => {
      const options = {
        string: {
          type: 'string',
          positional: '--',
          fallback: '1',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).resolves.toEqual({ string: '1' });
    });

    it('should throw an error on number option with missing parameter after positional marker', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).rejects.toThrow(`Missing parameter to abc.`);
    });

    it('should handle a number option with positional arguments', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        number: {
          type: 'number',
          names: ['-s'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, number: 1 });
      await expect(parser.parse(['-f', '0', '1'])).resolves.toEqual({ flag: true, number: 1 });
      await expect(parser.parse(['0', '-f', '1'])).resolves.toEqual({ flag: true, number: 1 });
      await expect(parser.parse(['0', '1', '-f'])).resolves.toEqual({ flag: true, number: 1 });
    });

    it('should handle a number option with positional arguments after marker', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        number: {
          type: 'number',
          names: ['-n'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, number: 1 });
      await expect(parser.parse(['--', '0', '1'])).resolves.toEqual({ flag: undefined, number: 1 });
      await expect(parser.parse(['--', '0', '-f'])).resolves.toEqual({
        flag: undefined,
        number: NaN,
      });
      await expect(parser.parse(['-n', '0', '--', '1'])).resolves.toEqual({
        flag: undefined,
        number: 1,
      });
    });

    it('should set the fallback value of a number option when specified with a positional marker without parameters', async () => {
      const options = {
        number: {
          type: 'number',
          positional: '--',
          fallback: 1,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).resolves.toEqual({ number: 1 });
    });

    it('should throw an error on delimited strings option with missing parameter after positional marker', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          separator: ',',
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).rejects.toThrow(`Missing parameter to abc.`);
    });

    it('should throw an error on variadic strings option with missing parameter after positional marker', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).rejects.toThrow(`Missing parameter to abc.`);
    });

    it('should handle a variadic strings option with positional arguments', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({
        flag: undefined,
        strings: ['0', '1'],
      });
      await expect(parser.parse(['-f', '0', '1'])).resolves.toEqual({
        flag: true,
        strings: ['0', '1'],
      });
      await expect(parser.parse(['0', '-f', '1'])).resolves.toEqual({ flag: true, strings: ['1'] });
      await expect(parser.parse(['0', '1', '-f'])).resolves.toEqual({
        flag: true,
        strings: ['0', '1'],
      });
    });

    it('should handle a variadic strings option with positional arguments after marker', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({
        flag: undefined,
        strings: ['0', '1'],
      });
      await expect(parser.parse(['--', '0', '1'])).resolves.toEqual({
        flag: undefined,
        strings: ['0', '1'],
      });
      await expect(parser.parse(['--', '0', '-f'])).resolves.toEqual({
        flag: undefined,
        strings: ['0', '-f'],
      });
      await expect(parser.parse(['-ss', '0', '--', '1'])).resolves.toEqual({
        flag: undefined,
        strings: ['1'],
      });
    });

    it('should handle a delimited strings option with positional arguments', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
          positional: true,
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0,1', '1,2'])).resolves.toEqual({
        flag: undefined,
        strings: ['1', '2'],
      });
      await expect(parser.parse(['-f', '0,1', '1,2'])).resolves.toEqual({
        flag: true,
        strings: ['1', '2'],
      });
      await expect(parser.parse(['0,1', '-f', '1,2'])).resolves.toEqual({
        flag: true,
        strings: ['1', '2'],
      });
      await expect(parser.parse(['0,1', '1,2', '-f'])).resolves.toEqual({
        flag: true,
        strings: ['1', '2'],
      });
    });

    it('should set the fallback value of a strings option when specified with a positional marker without parameters', async () => {
      const options = {
        strings: {
          type: 'strings',
          positional: '--',
          fallback: ['1'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).resolves.toEqual({ strings: ['1'] });
    });

    it('should throw an error on delimited numbers option with missing parameter after positional marker', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          separator: ',',
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).rejects.toThrow(`Missing parameter to abc.`);
    });

    it('should throw an error on variadic numbers option with missing parameter after positional marker', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).rejects.toThrow(`Missing parameter to abc.`);
    });

    it('should handle a variadic numbers option with positional arguments', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, numbers: [0, 1] });
      await expect(parser.parse(['-f', '0', '1'])).resolves.toEqual({
        flag: true,
        numbers: [0, 1],
      });
      await expect(parser.parse(['0', '-f', '1'])).resolves.toEqual({ flag: true, numbers: [1] });
      await expect(parser.parse(['0', '1', '-f'])).resolves.toEqual({
        flag: true,
        numbers: [0, 1],
      });
    });

    it('should handle a variadic numbers option with positional arguments after marker', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0', '1'])).resolves.toEqual({ flag: undefined, numbers: [0, 1] });
      await expect(parser.parse(['--', '0', '1'])).resolves.toEqual({
        flag: undefined,
        numbers: [0, 1],
      });
      await expect(parser.parse(['--', '0', '-f'])).resolves.toEqual({
        flag: undefined,
        numbers: [0, NaN],
      });
      await expect(parser.parse(['-ns', '0', '--', '1'])).resolves.toEqual({
        flag: undefined,
        numbers: [1],
      });
    });

    it('should handle a delimited numbers option with positional arguments', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          positional: true,
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0,1', '1,2'])).resolves.toEqual({
        flag: undefined,
        numbers: [1, 2],
      });
      await expect(parser.parse(['-f', '0,1', '1,2'])).resolves.toEqual({
        flag: true,
        numbers: [1, 2],
      });
      await expect(parser.parse(['0,1', '-f', '1,2'])).resolves.toEqual({
        flag: true,
        numbers: [1, 2],
      });
      await expect(parser.parse(['0,1', '1,2', '-f'])).resolves.toEqual({
        flag: true,
        numbers: [1, 2],
      });
    });

    it('should set the fallback value of a numbers option when specified with a positional marker without parameters', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          positional: '--',
          fallback: [1],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--'])).resolves.toEqual({ numbers: [1] });
    });
  });
});
