import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a boolean option with custom parsing', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          parse: vi.fn().mockImplementation((_0, _1, value) => value.includes('123')),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b', '0123'])).resolves.toEqual({ boolean: true });
      expect(options.boolean.parse).toHaveBeenCalledWith(expect.anything(), '-b', '0123');
    });

    it('should handle a boolean option with async custom parsing', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          parse: async (_0, _1, value) => value.includes('123'),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b', '0123'])).resolves.toEqual({ boolean: true });
    });

    it('should handle a string option with custom parsing', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'upper',
          parse: vi.fn().mockImplementation((_0, _1, value) => value.slice(2)),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s', 'abcde'])).resolves.toEqual({ string: 'CDE' });
      expect(options.string.parse).toHaveBeenCalledWith(expect.anything(), '-s', 'abcde');
    });

    it('should handle a string option with async custom parsing', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'upper',
          parse: async (_0, _1, value) => value.slice(2),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s', 'abcde'])).resolves.toEqual({ string: 'CDE' });
    });

    it('should handle a number option with custom parsing', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          conv: 'ceil',
          parse: vi.fn().mockImplementation((_0, _1, value) => Number(value) + 2),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '1.2'])).resolves.toEqual({ number: 4 });
      expect(options.number.parse).toHaveBeenCalledWith(expect.anything(), '-n', '1.2');
    });

    it('should handle a number option with async custom parsing', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          conv: 'ceil',
          parse: async (_0, _1, value) => Number(value) + 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '1.2'])).resolves.toEqual({ number: 4 });
    });

    it('should handle a strings option with mixed-async custom parsing', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'upper',
          unique: true,
          parse: vi.fn().mockImplementation((_0, _1, value: string) => {
            return value === 'sync' ? value : Promise.resolve(value);
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'sync', 'sync'])).resolves.toEqual({ strings: ['SYNC'] });
      expect(options.strings.parse).toHaveBeenCalledWith(expect.anything(), '-ss', 'sync');
      expect(options.strings.parse).toHaveBeenCalledTimes(2);

      await expect(parser.parse(['-ss', 'sync', 'async'])).resolves.toEqual({
        strings: ['SYNC', 'ASYNC'],
      });
      await expect(parser.parse(['-ss', 'async', 'sync'])).resolves.toEqual({
        strings: ['ASYNC', 'SYNC'],
      });
      await expect(parser.parse(['-ss', 'async', 'async'])).resolves.toEqual({
        strings: ['ASYNC'],
      });
      await expect(parser.parse(['-ss', 'sync', '-ss', ''])).resolves.toEqual({ strings: [''] });
      await expect(parser.parse(['-ss', 'async', '-ss', ''])).resolves.toEqual({ strings: [''] });
    });

    it('should handle a strings option with mixed-async custom parsing in conjunction with a separator', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'upper',
          append: true,
          unique: true,
          separator: ',',
          parse: vi.fn().mockImplementation((_0, _1, value: string) => {
            return value === 'sync' ? value : Promise.resolve(value);
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'sync,sync'])).resolves.toEqual({ strings: ['SYNC'] });
      expect(options.strings.parse).toHaveBeenCalledWith(expect.anything(), '-ss', 'sync');
      expect(options.strings.parse).toHaveBeenCalledTimes(2);

      await expect(parser.parse(['-ss', 'sync,async'])).resolves.toEqual({
        strings: ['SYNC', 'ASYNC'],
      });
      await expect(parser.parse(['-ss', 'async,sync'])).resolves.toEqual({
        strings: ['ASYNC', 'SYNC'],
      });
      await expect(parser.parse(['-ss', 'async,async'])).resolves.toEqual({ strings: ['ASYNC'] });
      await expect(parser.parse(['-ss', 'async', '-ss', 'sync,sync'])).resolves.toEqual({
        strings: ['ASYNC', 'SYNC'],
      });
      await expect(parser.parse(['-ss', 'async', '-ss', 'sync,async'])).resolves.toEqual({
        strings: ['ASYNC', 'SYNC'],
      });
      await expect(parser.parse(['-ss', 'async', '-ss', 'async,sync'])).resolves.toEqual({
        strings: ['ASYNC', 'SYNC'],
      });
      await expect(parser.parse(['-ss', 'async', '-ss', 'async,async'])).resolves.toEqual({
        strings: ['ASYNC'],
      });
      await expect(parser.parse(['-ss', 'async', '-ss', 'sync,last'])).resolves.toEqual({
        strings: [
          'ASYNC',
          'SYNC',
          'LAST', // order is preserved
        ],
      });
    });

    it('should handle a numbers option with mixed-async custom parsing', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          conv: 'ceil',
          unique: true,
          parse: vi.fn().mockImplementation((_0, _1, value) => {
            const res = Number(value);
            return value.startsWith('1') ? res : Promise.resolve(res);
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '1.2', '1.7'])).resolves.toEqual({ numbers: [2] });
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.2');
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.7');
      expect(options.numbers.parse).toHaveBeenCalledTimes(2);

      await expect(parser.parse(['-ns', '1.2', '2.2'])).resolves.toEqual({ numbers: [2, 3] });
      await expect(parser.parse(['-ns', '2.2', '1.2'])).resolves.toEqual({ numbers: [3, 2] });
      await expect(parser.parse(['-ns', '2.2', '2.7'])).resolves.toEqual({ numbers: [3] });
      await expect(parser.parse(['-ns', '1.2', '-ns', ''])).resolves.toEqual({ numbers: [0] });
      await expect(parser.parse(['-ns', '2.2', '-ns', ''])).resolves.toEqual({ numbers: [0] });
    });

    it('should handle a numbers option with mixed-async custom parsing in conjunction with a separator', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          conv: 'ceil',
          append: true,
          unique: true,
          separator: ',',
          parse: vi.fn().mockImplementation((_0, _1, value) => {
            const res = Number(value);
            return value.startsWith('1') ? res : Promise.resolve(res);
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '1.2,1.7'])).resolves.toEqual({ numbers: [2] });
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.2');
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.7');
      expect(options.numbers.parse).toHaveBeenCalledTimes(2);

      await expect(parser.parse(['-ns', '1.2,2.2'])).resolves.toEqual({ numbers: [2, 3] });
      await expect(parser.parse(['-ns', '2.2,1.2'])).resolves.toEqual({ numbers: [3, 2] });
      await expect(parser.parse(['-ns', '2.2,2.7'])).resolves.toEqual({ numbers: [3] });
      await expect(parser.parse(['-ns', '2.2', '-ns', '1.2,1.2'])).resolves.toEqual({
        numbers: [3, 2],
      });
      await expect(parser.parse(['-ns', '2.2', '-ns', '1.2,2.7'])).resolves.toEqual({
        numbers: [3, 2],
      });
      await expect(parser.parse(['-ns', '2.2', '-ns', '2.7,1.2'])).resolves.toEqual({
        numbers: [3, 2],
      });
      await expect(parser.parse(['-ns', '2.2', '-ns', '2.7,2.8'])).resolves.toEqual({
        numbers: [3],
      });
      await expect(parser.parse(['-ns', '2.2', '-ns', '1.2,3.3'])).resolves.toEqual({
        numbers: [
          3,
          2,
          4, // order is preserved
        ],
      });
    });
  });
});
