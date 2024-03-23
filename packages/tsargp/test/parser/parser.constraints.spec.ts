import { describe, expect, it } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a string option with a regex constraint', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          regex: /\d+/s,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([])).toEqual({ string: undefined });
      expect(parser.parse(['-s', '456'])).toEqual({ string: '456' });
      expect(() => parser.parse(['-s', 'abc'])).toThrow(
        /Invalid parameter to -s: 'abc'\. Value must match the regex \/\\d\+\/s\./,
      );
    });

    it('should handle a string option with enumeration constraint', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([])).toEqual({ string: undefined });
      expect(parser.parse(['-s', 'one'])).toEqual({ string: 'one' });
      expect(() => parser.parse(['-s', 'abc'])).toThrow(
        /Invalid parameter to -s: 'abc'\. Possible values are \['one', 'two'\]\./,
      );
    });

    it('should handle a number option with a range constraint', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          range: [0, Infinity],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([])).toEqual({ number: undefined });
      expect(parser.parse(['-n', '0'])).toEqual({ number: 0 });
      expect(() => parser.parse(['-n', '-3'])).toThrow(
        /Invalid parameter to -n: -3\. Value must be in the range \[0, Infinity\]\./,
      );
      expect(() => parser.parse(['-n', 'a'])).toThrow(
        /Invalid parameter to -n: NaN\. Value must be in the range \[0, Infinity\]\./,
      );
    });

    it('should handle a number option with enumeration constraint', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [1, 2],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([])).toEqual({ number: undefined });
      expect(parser.parse(['-n', '1'])).toEqual({ number: 1 });
      expect(() => parser.parse(['-n', '3'])).toThrow(
        /Invalid parameter to -n: 3\. Possible values are \[1, 2\]\./,
      );
    });

    it('should handle a strings option with a regex constraint', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          regex: /\d+/s,
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([])).toEqual({ strings: undefined });
      expect(parser.parse(['-ss', '1,2'])).toEqual({ strings: ['1', '2'] });
      expect(() => parser.parse(['-ss', '123,abc'])).toThrow(
        /Invalid parameter to -ss: 'abc'\. Value must match the regex \/\\d\+\/s\./,
      );
    });

    it('should handle a strings option with enumeration constraint', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          enums: ['one', 'two'],
          separator: ',',
          trim: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([])).toEqual({ strings: undefined });
      expect(parser.parse(['-ss', ' one , one '])).toEqual({ strings: ['one', 'one'] });
      expect(parser.parse(['-ss', ' two '])).toEqual({ strings: ['two'] });
      expect(() => parser.parse(['-ss', 'abc'])).toThrow(
        /Invalid parameter to -ss: 'abc'\. Possible values are \['one', 'two'\]\./,
      );
    });

    it('should handle a numbers option with a range constraint', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          range: [0, Infinity],
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([])).toEqual({ numbers: undefined });
      expect(parser.parse(['-ns', '1,2'])).toEqual({ numbers: [1, 2] });
      expect(() => parser.parse(['-ns', '1,-3'])).toThrow(
        /Invalid parameter to -ns: -3\. Value must be in the range \[0, Infinity\]\./,
      );
      expect(() => parser.parse(['-ns', 'a'])).toThrow(
        /Invalid parameter to -ns: NaN\. Value must be in the range \[0, Infinity\]\./,
      );
    });

    it('should handle a numbers option with enumeration constraint', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          enums: [1, 2],
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([])).toEqual({ numbers: undefined });
      expect(parser.parse(['-ns', ' 1 , 1 '])).toEqual({ numbers: [1, 1] });
      expect(parser.parse(['-ns', ' 2 '])).toEqual({ numbers: [2] });
      expect(() => parser.parse(['-ns', '1,3'])).toThrow(
        /Invalid parameter to -ns: 3\. Possible values are \[1, 2\]\./,
      );
    });

    it('should throw an error on delimited strings option with too many values', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          separator: ',',
          limit: 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-ss', 'a,b,c'])).toThrow(
        /Option -ss has too many values \(3\)\. Should have at most 2\./,
      );
    });

    it('should throw an error on variadic strings option with too many values', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          limit: 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-ss', 'a', 'b', 'c'])).toThrow(
        /Option -ss has too many values \(3\)\. Should have at most 2\./,
      );
    });

    it('should throw an error on delimited numbers option with too many values', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          separator: ',',
          limit: 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-ns', '1,2,3'])).toThrow(
        /Option -ns has too many values \(3\)\. Should have at most 2\./,
      );
    });

    it('should throw an error on variadic numbers option with too many values', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          limit: 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-ns', '1', '2', '3'])).toThrow(
        /Option -ns has too many values \(3\)\. Should have at most 2\./,
      );
    });
  });
});
