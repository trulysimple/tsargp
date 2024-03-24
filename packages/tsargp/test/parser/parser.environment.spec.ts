import { describe, expect, it } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a flag option with an environment variable', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f1'],
          envVar: 'FLAG',
          requires: 'required',
        },
        required: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['FLAG'] = '1';
      expect(() => parser.parse([])).toThrow(`Option -f1 requires -f2.`);
      expect(parser.parse(['-f2'])).toEqual({ flag: true, required: true });
      process.env['FLAG'] = '0';
      expect(() => parser.parse([])).toThrow(`Option -f1 requires -f2.`);
      expect(parser.parse(['-f2'])).toEqual({ flag: false, required: true });
    });

    it('should handle a boolean option with an environment variable', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          envVar: 'BOOLEAN',
          requires: 'required',
        },
        required: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['BOOLEAN'] = '1';
      expect(() => parser.parse([])).toThrow(`Option -b requires -f.`);
      expect(parser.parse(['-f'])).toEqual({ boolean: true, required: true });
      process.env['BOOLEAN'] = '0';
      expect(() => parser.parse([])).toThrow(`Option -b requires -f.`);
      expect(parser.parse(['-f'])).toEqual({ boolean: false, required: true });
    });

    it('should handle a string option with an environment variable', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          envVar: 'STRING',
          requires: 'required',
        },
        required: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['STRING'] = '123';
      expect(() => parser.parse([])).toThrow(`Option -s requires -f.`);
      expect(parser.parse(['-f'])).toEqual({ string: '123', required: true });
    });

    it('should handle a number option with an environment variable', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          envVar: 'NUMBER',
          requires: 'required',
        },
        required: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['NUMBER'] = '123';
      expect(() => parser.parse([])).toThrow(`Option -n requires -f.`);
      expect(parser.parse(['-f'])).toEqual({ number: 123, required: true });
    });

    it('should handle a strings option with an environment variable', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          envVar: 'STRINGS',
          separator: ',',
          case: 'upper',
          requires: 'required',
        },
        required: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['STRINGS'] = 'one,two';
      expect(() => parser.parse([])).toThrow(`Option -ss requires -f.`);
      expect(parser.parse(['-f'])).toEqual({ strings: ['ONE', 'TWO'], required: true });
    });

    it('should handle a numbers option with an environment variable', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          envVar: 'NUMBERS',
          separator: ',',
          round: 'trunc',
          requires: 'required',
        },
        required: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['NUMBERS'] = '1.1,2.2';
      expect(() => parser.parse([])).toThrow(`Option -ns requires -f.`);
      expect(parser.parse(['-f'])).toEqual({ numbers: [1, 2], required: true });
    });

    it('should throw an error on string option with env. variable that fails validation', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          envVar: 'STRING',
          regex: /\d+/s,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['STRING'] = 'abc';
      expect(() => parser.parse([])).toThrow(
        `Invalid parameter to STRING: 'abc'. Value must match the regex /\\d+/s.`,
      );
    });

    it('should throw an error on number option with env. variable that fails validation', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          envVar: 'NUMBER',
          range: [0, Infinity],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['NUMBER'] = '-3';
      expect(() => parser.parse([])).toThrow(
        `Invalid parameter to NUMBER: -3. Value must be in the range [0, Infinity].`,
      );
    });

    it('should throw an error on strings option with env. variable that fails validation', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          envVar: 'STRINGS',
          separator: ',',
          regex: /\d+/s,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['STRINGS'] = '123,abc';
      expect(() => parser.parse([])).toThrow(
        `Invalid parameter to STRINGS: 'abc'. Value must match the regex /\\d+/s.`,
      );
    });

    it('should throw an error on numbers option with env. variable that fails validation', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          envVar: 'NUMBERS',
          separator: ',',
          range: [0, Infinity],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['NUMBERS'] = '1,-3';
      expect(() => parser.parse([])).toThrow(
        `Invalid parameter to NUMBERS: -3. Value must be in the range [0, Infinity].`,
      );
    });
  });
});
