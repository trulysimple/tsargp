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
          envVar: 'FLAG2',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env['FLAG2'];
      process.env['FLAG'] = '1';
      expect(() => parser.parse([])).toThrow(`Option -f1 requires -f2.`);
      process.env['FLAG2'] = '1';
      expect(parser.parse([])).toEqual({ flag: true, required: true });
      process.env['FLAG'] = '0';
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
          envVar: 'FLAG',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env['FLAG'];
      process.env['BOOLEAN'] = '1';
      expect(() => parser.parse([])).toThrow(`Option -b requires -f.`);
      process.env['FLAG'] = '1';
      expect(parser.parse([])).toEqual({ boolean: true, required: true });
      process.env['BOOLEAN'] = '0';
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
          envVar: 'FLAG',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env['FLAG'];
      process.env['STRING'] = '123';
      expect(() => parser.parse([])).toThrow(`Option -s requires -f.`);
      process.env['FLAG'] = '1';
      expect(parser.parse([])).toEqual({ string: '123', required: true });
      process.env['STRING'] = '';
      expect(parser.parse([])).toEqual({ string: '', required: true });
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
          envVar: 'FLAG',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env['FLAG'];
      process.env['NUMBER'] = '123';
      expect(() => parser.parse([])).toThrow(`Option -n requires -f.`);
      process.env['FLAG'] = '1';
      expect(parser.parse([])).toEqual({ number: 123, required: true });
      process.env['NUMBER'] = '';
      expect(parser.parse(['-f'])).toEqual({ number: 0, required: true });
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
          envVar: 'FLAG',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env['FLAG'];
      process.env['STRINGS'] = 'one,two';
      expect(() => parser.parse([])).toThrow(`Option -ss requires -f.`);
      process.env['FLAG'] = '1';
      expect(parser.parse([])).toEqual({ strings: ['ONE', 'TWO'], required: true });
      process.env['STRINGS'] = '';
      expect(parser.parse([])).toEqual({ strings: [''], required: true });
    });

    it('should handle a numbers option with an environment variable', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          envVar: 'NUMBERS',
          separator: ',',
          conv: 'trunc',
          requires: 'required',
        },
        required: {
          type: 'flag',
          names: ['-f'],
          envVar: 'FLAG',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env['FLAG'];
      process.env['NUMBERS'] = '1.1,2.2';
      expect(() => parser.parse([])).toThrow(`Option -ns requires -f.`);
      process.env['FLAG'] = '1';
      expect(parser.parse([])).toEqual({ numbers: [1, 2], required: true });
      process.env['NUMBERS'] = '';
      expect(parser.parse([])).toEqual({ numbers: [0], required: true });
    });

    it('should throw an error on option required if another is specified as an environment variable', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f1'],
          envVar: 'FLAG',
          requiredIf: 'other',
        },
        other: {
          type: 'flag',
          names: ['-f2'],
          envVar: 'FLAG2',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env['FLAG'];
      process.env['FLAG2'] = '1';
      expect(() => parser.parse([])).toThrow(`Option -f1 is required if -f2.`);
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
