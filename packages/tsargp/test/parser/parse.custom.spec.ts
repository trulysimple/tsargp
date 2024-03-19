import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a boolean option with custom parsing', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          parse: vi.fn().mockImplementation((_0, _1, value) => value.includes('123')),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-b', '0123'])).toEqual({ boolean: true });
      expect(options.boolean.parse).toHaveBeenCalledWith(expect.anything(), '-b', '0123');
    });

    it('should handle a boolean option with async custom parsing', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          parse: async (_0, _1, value) => value.includes('123'),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-b', '0123'])).toEqual({ boolean: expect.toResolve(true) });
    });

    it('should handle a string option with custom parsing', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'upper',
          parse: vi.fn().mockImplementation((_0, _1, value) => value.slice(2)),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-s', 'abcde'])).toEqual({ string: 'CDE' });
      expect(options.string.parse).toHaveBeenCalledWith(expect.anything(), '-s', 'abcde');
    });

    it('should handle a string option with async custom parsing', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'upper',
          parse: async (_0, _1, value) => value.slice(2),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-s', 'abcde'])).toEqual({ string: expect.toResolve('CDE') });
    });

    it('should handle a number option with custom parsing', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          round: 'ceil',
          parse: vi.fn().mockImplementation((_0, _1, value) => Number(value) + 2),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-n', '1.2'])).toEqual({ number: 4 });
      expect(options.number.parse).toHaveBeenCalledWith(expect.anything(), '-n', '1.2');
    });

    it('should handle a number option with async custom parsing', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          round: 'ceil',
          parse: async (_0, _1, value) => Number(value) + 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-n', '1.2'])).toEqual({ number: expect.toResolve(4) });
    });

    it('should handle a strings option with custom parsing', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'upper',
          unique: true,
          parse: vi.fn().mockImplementation((_0, _1, value): string | Promise<string> => {
            const res = value.slice(2);
            return value.startsWith('a') ? res : Promise.resolve(res);
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ss'])).toEqual({ strings: [] });
      expect(options.strings.parse).not.toHaveBeenCalled();

      expect(parser.parse(['-ss', 'abcd', 'abCD'])).toEqual({ strings: ['CD'] });
      expect(options.strings.parse).toHaveBeenCalledWith(expect.anything(), '-ss', 'abcd');
      expect(options.strings.parse).toHaveBeenCalledWith(expect.anything(), '-ss', 'abCD');
      expect(options.strings.parse).toHaveBeenCalledTimes(2);

      expect(parser.parse(['-ss', 'abcd', '12CD'])).toEqual({
        strings: expect.toResolve(['CD']),
      });
      expect(parser.parse(['-ss', '12CD', 'abcd'])).toEqual({
        strings: expect.toResolve(['CD']),
      });
      expect(parser.parse(['-ss', '12CD', '34cd'])).toEqual({
        strings: expect.toResolve(['CD']),
      });
      expect(parser.parse(['-ss', 'abcd', '-ss'])).toEqual({ strings: [] });
      expect(parser.parse(['-ss', '12CD', '-ss'])).toEqual({
        strings: expect.toResolve([]),
      });
    });

    it('should handle a strings option with custom delimited parsing', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'upper',
          append: true,
          unique: true,
          parseDelimited: (_0, _1, value): Array<string> | Promise<Array<string>> => {
            const res = value.split(',').flatMap((val) => val.split('|'));
            return value.startsWith('a') ? res : Promise.resolve(res);
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-ss'])).toThrow(/Missing parameter to -ss\./);
      expect(parser.parse(['-ss', 'a,b|B', '-ss', 'a,B|b'])).toEqual({
        strings: ['A', 'B'],
      });
      expect(parser.parse(['-ss', 'a,b|B', '-ss', 'c,d|D'])).toEqual({
        strings: expect.toResolve(['A', 'B', 'C', 'D']),
      });
      expect(parser.parse(['-ss', 'c,d|D', '-ss', 'a,b|B'])).toEqual({
        strings: expect.toResolve(['C', 'D', 'A', 'B']),
      });
      expect(parser.parse(['-ss', 'c,d|D', '-ss', 'C|D'])).toEqual({
        strings: expect.toResolve(['C', 'D']),
      });
    });

    it('should handle a numbers option with custom parsing', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'ceil',
          unique: true,
          parse: vi.fn().mockImplementation((_0, _1, value): number | Promise<number> => {
            const res = Number(value) + 2;
            return value.startsWith('1') ? res : Promise.resolve(res);
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ns'])).toEqual({ numbers: [] });
      expect(options.numbers.parse).not.toHaveBeenCalled();

      expect(parser.parse(['-ns', '1.2', '1.7'])).toEqual({ numbers: [4] });
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.2');
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.7');
      expect(options.numbers.parse).toHaveBeenCalledTimes(2);

      expect(parser.parse(['-ns', '1.2', '2.2'])).toEqual({
        numbers: expect.toResolve([4, 5]),
      });
      expect(parser.parse(['-ns', '2.2', '1.2'])).toEqual({
        numbers: expect.toResolve([5, 4]),
      });
      expect(parser.parse(['-ns', '2.2', '2.7'])).toEqual({
        numbers: expect.toResolve([5]),
      });
      expect(parser.parse(['-ns', '1.2', '-ns'])).toEqual({ numbers: [] });
      expect(parser.parse(['-ns', '2.2', '-ns'])).toEqual({
        numbers: expect.toResolve([]),
      });
    });

    it('should handle a numbers option with custom delimited parsing', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'ceil',
          append: true,
          unique: true,
          parseDelimited: (_0, _1, value): Array<number> | Promise<Array<number>> => {
            const res = value.split(',').flatMap((val) => val.split('|').map((val) => Number(val)));
            return value.startsWith('1') ? res : Promise.resolve(res);
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-ns'])).toThrow(/Missing parameter to -ns\./);
      expect(parser.parse(['-ns', '1.1,2.2|2.3'])).toEqual({ numbers: [2, 3] });
      expect(parser.parse(['-ns', '1.1,2.2|2.3', '-ns', '11|12'])).toEqual({
        numbers: [2, 3, 11, 12],
      });
      expect(parser.parse(['-ns', '1.1,2.2|2.3', '-ns', '21|22'])).toEqual({
        numbers: expect.toResolve([2, 3, 21, 22]),
      });
      expect(parser.parse(['-ns', '21|22', '-ns', '1.1,2.2|2.3'])).toEqual({
        numbers: expect.toResolve([21, 22, 2, 3]),
      });
      expect(parser.parse(['-ns', '21|22', '-ns', '20.2|21.2'])).toEqual({
        numbers: expect.toResolve([21, 22]),
      });
    });
  });
});
