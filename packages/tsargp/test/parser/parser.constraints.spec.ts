import { describe, expect, it } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a string option with a regex constraint', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          regex: /\d+/s,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ string: undefined });
      await expect(parser.parse(['-s', '456'])).resolves.toEqual({ string: '456' });
      await expect(parser.parse(['-s', 'abc'])).rejects.toThrow(
        `Invalid parameter to -s: 'abc'. Value must match the regex /\\d+/s.`,
      );
    });

    it('should handle a string option with enumeration constraint', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ string: undefined });
      await expect(parser.parse(['-s', 'one'])).resolves.toEqual({ string: 'one' });
      await expect(parser.parse(['-s', 'abc'])).rejects.toThrow(
        `Invalid parameter to -s: 'abc'. Possible values are {'one', 'two'}.`,
      );
    });

    it('should handle a number option with a range constraint', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          range: [0, Infinity],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ number: undefined });
      await expect(parser.parse(['-n', '0'])).resolves.toEqual({ number: 0 });
      await expect(parser.parse(['-n', '-3'])).rejects.toThrow(
        `Invalid parameter to -n: -3. Value must be in the range [0, Infinity].`,
      );
      await expect(parser.parse(['-n', 'a'])).rejects.toThrow(
        `Invalid parameter to -n: NaN. Value must be in the range [0, Infinity].`,
      );
    });

    it('should handle a number option with enumeration constraint', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [1, 2],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ number: undefined });
      await expect(parser.parse(['-n', '1'])).resolves.toEqual({ number: 1 });
      await expect(parser.parse(['-n', '3'])).rejects.toThrow(
        `Invalid parameter to -n: 3. Possible values are {1, 2}.`,
      );
    });

    it('should handle a strings option with a regex constraint', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          regex: /\d+/s,
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ strings: undefined });
      await expect(parser.parse(['-ss', '1,2'])).resolves.toEqual({ strings: ['1', '2'] });
      await expect(parser.parse(['-ss', '123,abc'])).rejects.toThrow(
        `Invalid parameter to -ss: 'abc'. Value must match the regex /\\d+/s.`,
      );
    });

    it('should handle a strings option with enumeration constraint', async () => {
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
      await expect(parser.parse([])).resolves.toEqual({ strings: undefined });
      await expect(parser.parse(['-ss', ' one , one '])).resolves.toEqual({
        strings: ['one', 'one'],
      });
      await expect(parser.parse(['-ss', ' two '])).resolves.toEqual({ strings: ['two'] });
      await expect(parser.parse(['-ss', 'abc'])).rejects.toThrow(
        `Invalid parameter to -ss: 'abc'. Possible values are {'one', 'two'}.`,
      );
    });

    it('should handle a numbers option with a range constraint', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          range: [0, Infinity],
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ numbers: undefined });
      await expect(parser.parse(['-ns', '1,2'])).resolves.toEqual({ numbers: [1, 2] });
      await expect(parser.parse(['-ns', '1,-3'])).rejects.toThrow(
        `Invalid parameter to -ns: -3. Value must be in the range [0, Infinity].`,
      );
      await expect(parser.parse(['-ns', 'a'])).rejects.toThrow(
        `Invalid parameter to -ns: NaN. Value must be in the range [0, Infinity].`,
      );
    });

    it('should handle a numbers option with enumeration constraint', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          enums: [1, 2],
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ numbers: undefined });
      await expect(parser.parse(['-ns', ' 1 , 1 '])).resolves.toEqual({ numbers: [1, 1] });
      await expect(parser.parse(['-ns', ' 2 '])).resolves.toEqual({ numbers: [2] });
      await expect(parser.parse(['-ns', '1,3'])).rejects.toThrow(
        `Invalid parameter to -ns: 3. Possible values are {1, 2}.`,
      );
    });

    it('should throw an error on delimited strings option with too many values', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          separator: ',',
          limit: 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'a,b,c'])).rejects.toThrow(
        `Option -ss has too many values (3). Should have at most 2.`,
      );
    });

    it('should throw an error on variadic strings option with too many values', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          limit: 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'a', 'b', 'c'])).rejects.toThrow(
        `Option -ss has too many values (3). Should have at most 2.`,
      );
    });

    it('should throw an error on delimited numbers option with too many values', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          separator: ',',
          limit: 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '1,2,3'])).rejects.toThrow(
        `Option -ns has too many values (3). Should have at most 2.`,
      );
    });

    it('should throw an error on variadic numbers option with too many values', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          limit: 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '1', '2', '3'])).rejects.toThrow(
        `Option -ns has too many values (3). Should have at most 2.`,
      );
    });
  });
});
