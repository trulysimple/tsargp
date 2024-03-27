import { describe, expect, it } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should throw an error when a required option with no name is not specified', () => {
      const options = {
        required: {
          type: 'boolean',
          required: true,
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).toThrow(`Option is required.`);
    });

    it('should throw an error missing parameter after positional marker', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['--'])).toThrow(`Missing parameter to abc.`);
    });

    it('should throw an error on positional marker specified with value', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['--='])).toThrow(`Positional marker -- does not accept inline values.`);
      expect(() => parser.parse(['--=a'])).toThrow(`Positional marker -- does not accept inline values.`);
    });

    it('should handle a boolean option with positional arguments', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, boolean: true });
      expect(parser.parse(['-f', '0', '1'])).toEqual({ flag: true, boolean: true });
      expect(parser.parse(['0', '-f', '1'])).toEqual({ flag: true, boolean: true });
      expect(parser.parse(['0', '1', '-f'])).toEqual({ flag: true, boolean: true });
    });

    it('should handle a boolean option with positional arguments after marker', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, boolean: true });
      expect(parser.parse(['--', '0', '1'])).toEqual({ flag: undefined, boolean: true });
      expect(parser.parse(['--', '0', '-f'])).toEqual({ flag: undefined, boolean: true });
      expect(parser.parse(['-b', '0', '--', '1'])).toEqual({ flag: undefined, boolean: true });
    });

    it('should throw a name suggestion on parse failure from positional string option', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['abc'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['s'])).toThrow(
        `Invalid parameter to -s: 's'. Possible values are ['abc'].\n` +
          `Did you mean to specify an option name instead of s? Similar names are [-s].\n`,
      );
    });

    it('should throw an error on string option with missing parameter after positional marker', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['--'])).toThrow(`Missing parameter to abc.`);
    });

    it('should handle a string option with positional arguments', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, string: '1' });
      expect(parser.parse(['-f', '0', '1'])).toEqual({ flag: true, string: '1' });
      expect(parser.parse(['0', '-f', '1'])).toEqual({ flag: true, string: '1' });
      expect(parser.parse(['0', '1', '-f'])).toEqual({ flag: true, string: '1' });
    });

    it('should handle a string option with positional arguments after marker', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, string: '1' });
      expect(parser.parse(['--', '0', '1'])).toEqual({ flag: undefined, string: '1' });
      expect(parser.parse(['--', '0', '-f'])).toEqual({ flag: undefined, string: '-f' });
      expect(parser.parse(['-s', '0', '--', '1'])).toEqual({ flag: undefined, string: '1' });
    });

    it('should throw a name suggestion on parse failure from positional number option', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [123],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['1'])).toThrow(
        `Invalid parameter to -n: 1. Possible values are [123].\n` +
          `Did you mean to specify an option name instead of 1?\n`,
      );
    });

    it('should throw an error on number option with missing parameter after positional marker', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          positional: '--',
          preferredName: 'abc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['--'])).toThrow(`Missing parameter to abc.`);
    });

    it('should handle a number option with positional arguments', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, number: 1 });
      expect(parser.parse(['-f', '0', '1'])).toEqual({ flag: true, number: 1 });
      expect(parser.parse(['0', '-f', '1'])).toEqual({ flag: true, number: 1 });
      expect(parser.parse(['0', '1', '-f'])).toEqual({ flag: true, number: 1 });
    });

    it('should handle a number option with positional arguments after marker', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, number: 1 });
      expect(parser.parse(['--', '0', '1'])).toEqual({ flag: undefined, number: 1 });
      expect(parser.parse(['--', '0', '-f'])).toEqual({ flag: undefined, number: NaN });
      expect(parser.parse(['-n', '0', '--', '1'])).toEqual({ flag: undefined, number: 1 });
    });

    it('should throw an error on strings option with missing parameter after positional marker', () => {
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
      expect(() => parser.parse(['--'])).toThrow(`Missing parameter to abc.`);
    });

    it('should handle a strings option with positional arguments', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, strings: ['0', '1'] });
      expect(parser.parse(['-f', '0', '1'])).toEqual({ flag: true, strings: ['0', '1'] });
      expect(parser.parse(['0', '-f', '1'])).toEqual({ flag: true, strings: ['1'] });
      expect(parser.parse(['0', '1', '-f'])).toEqual({ flag: true, strings: ['0', '1'] });
    });

    it('should handle a strings option with positional arguments after marker', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, strings: ['0', '1'] });
      expect(parser.parse(['--', '0', '1'])).toEqual({ flag: undefined, strings: ['0', '1'] });
      expect(parser.parse(['--', '0', '-f'])).toEqual({ flag: undefined, strings: ['0', '-f'] });
      expect(parser.parse(['-ss', '0', '--', '1'])).toEqual({ flag: undefined, strings: ['1'] });
      expect(parser.parse(['--'])).toEqual({ flag: undefined, strings: [] });
    });

    it('should throw an error on numbers option with missing parameter after positional marker', () => {
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
      expect(() => parser.parse(['--'])).toThrow(`Missing parameter to abc.`);
    });

    it('should handle a numbers option with positional arguments', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, numbers: [0, 1] });
      expect(parser.parse(['-f', '0', '1'])).toEqual({ flag: true, numbers: [0, 1] });
      expect(parser.parse(['0', '-f', '1'])).toEqual({ flag: true, numbers: [1] });
      expect(parser.parse(['0', '1', '-f'])).toEqual({ flag: true, numbers: [0, 1] });
    });

    it('should handle a numbers option with positional arguments after marker', () => {
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
      expect(parser.parse(['0', '1'])).toEqual({ flag: undefined, numbers: [0, 1] });
      expect(parser.parse(['--', '0', '1'])).toEqual({ flag: undefined, numbers: [0, 1] });
      expect(parser.parse(['--', '0', '-f'])).toEqual({ flag: undefined, numbers: [0, NaN] });
      expect(parser.parse(['-ns', '0', '--', '1'])).toEqual({ flag: undefined, numbers: [1] });
      expect(parser.parse(['--'])).toEqual({ flag: undefined, numbers: [] });
    });
  });
});
