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

    it('should handle a boolean option with async custom parsing', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          parse: async (_0, _1, value) => value.includes('123'),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b', '0123']).boolean).resolves.toBeTruthy();
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
      await expect(parser.parse(['-s', 'abcde']).string).resolves.toEqual('CDE');
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

    it('should handle a number option with async custom parsing', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          round: 'ceil',
          parse: async (_0, _1, value) => Number(value) + 2,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '1.2']).number).resolves.toEqual(4);
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
      expect(parser.parse(['-ss'])).toEqual({ strings: [] });
      expect(options.strings.parse).not.toHaveBeenCalled();
      expect(parser.parse(['-ss', 'sync', 'sync'])).toEqual({ strings: ['SYNC'] });
      expect(options.strings.parse).toHaveBeenCalledWith(expect.anything(), '-ss', 'sync');
      expect(options.strings.parse).toHaveBeenCalledTimes(2);

      await expect(parser.parse(['-ss', 'sync', 'async']).strings).resolves.toEqual([
        'SYNC',
        'ASYNC',
      ]);
      await expect(parser.parse(['-ss', 'async', 'sync']).strings).resolves.toEqual([
        'ASYNC',
        'SYNC',
      ]);
      await expect(parser.parse(['-ss', 'async', 'async']).strings).resolves.toEqual(['ASYNC']);
      expect(parser.parse(['-ss', 'sync', '-ss'])).toEqual({ strings: [] });
      expect(parser.parse(['-ss', 'async', '-ss'])).toEqual({ strings: [] });
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
      expect(parser.parse(['-ss', 'sync,sync'])).toEqual({ strings: ['SYNC'] });
      expect(options.strings.parse).toHaveBeenCalledWith(expect.anything(), '-ss', 'sync');
      expect(options.strings.parse).toHaveBeenCalledTimes(2);

      await expect(parser.parse(['-ss', 'sync,async']).strings).resolves.toEqual(['SYNC', 'ASYNC']);
      await expect(parser.parse(['-ss', 'async,sync']).strings).resolves.toEqual(['ASYNC', 'SYNC']);
      await expect(parser.parse(['-ss', 'async,async']).strings).resolves.toEqual(['ASYNC']);
      await expect(parser.parse(['-ss', 'async', '-ss', 'sync,sync']).strings).resolves.toEqual([
        'ASYNC',
        'SYNC',
      ]);
      await expect(parser.parse(['-ss', 'async', '-ss', 'sync,async']).strings).resolves.toEqual([
        'ASYNC',
        'SYNC',
      ]);
      await expect(parser.parse(['-ss', 'async', '-ss', 'async,sync']).strings).resolves.toEqual([
        'ASYNC',
        'SYNC',
      ]);
      await expect(parser.parse(['-ss', 'async', '-ss', 'async,async']).strings).resolves.toEqual([
        'ASYNC',
      ]);
      await expect(parser.parse(['-ss', 'async', '-ss', 'sync,last']).strings).resolves.toEqual([
        'ASYNC',
        'SYNC',
        'LAST', // order is preserved
      ]);
    });

    it('should handle a strings option with mixed-async custom delimited parsing', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'upper',
          append: true,
          unique: true,
          parseDelimited: (_0, _1, value: string) => {
            const res = value.split(',');
            return value.startsWith('sync') ? res : Promise.resolve(res);
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-ss'])).toThrow(`Missing parameter to -ss.`);
      expect(parser.parse(['-ss', 'sync,sync', '-ss', 'sync,sync'])).toEqual({ strings: ['SYNC'] });
      await expect(
        parser.parse(['-ss', 'sync,sync', '-ss', 'async,async']).strings,
      ).resolves.toEqual(['SYNC', 'ASYNC']);
      await expect(
        parser.parse(['-ss', 'async,async', '-ss', 'sync,sync']).strings,
      ).resolves.toEqual(['ASYNC', 'SYNC']);
      await expect(
        parser.parse(['-ss', 'async,async', '-ss', 'async,async']).strings,
      ).resolves.toEqual(['ASYNC']);
    });

    it('should handle a numbers option with mixed-async custom parsing', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'ceil',
          unique: true,
          parse: vi.fn().mockImplementation((_0, _1, value) => {
            const res = Number(value);
            return value.startsWith('1') ? res : Promise.resolve(res);
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ns'])).toEqual({ numbers: [] });
      expect(options.numbers.parse).not.toHaveBeenCalled();
      expect(parser.parse(['-ns', '1.2', '1.7'])).toEqual({ numbers: [2] });
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.2');
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.7');
      expect(options.numbers.parse).toHaveBeenCalledTimes(2);

      await expect(parser.parse(['-ns', '1.2', '2.2']).numbers).resolves.toEqual([2, 3]);
      await expect(parser.parse(['-ns', '2.2', '1.2']).numbers).resolves.toEqual([3, 2]);
      await expect(parser.parse(['-ns', '2.2', '2.7']).numbers).resolves.toEqual([3]);
      expect(parser.parse(['-ns', '1.2', '-ns'])).toEqual({ numbers: [] });
      expect(parser.parse(['-ns', '2.2', '-ns'])).toEqual({ numbers: [] });
    });

    it('should handle a numbers option with mixed-async custom parsing in conjunction with a separator', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'ceil',
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
      expect(parser.parse(['-ns', '1.2,1.7'])).toEqual({ numbers: [2] });
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.2');
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.7');
      expect(options.numbers.parse).toHaveBeenCalledTimes(2);

      await expect(parser.parse(['-ns', '1.2,2.2']).numbers).resolves.toEqual([2, 3]);
      await expect(parser.parse(['-ns', '2.2,1.2']).numbers).resolves.toEqual([3, 2]);
      await expect(parser.parse(['-ns', '2.2,2.7']).numbers).resolves.toEqual([3]);
      await expect(parser.parse(['-ns', '2.2', '-ns', '1.2,1.2']).numbers).resolves.toEqual([3, 2]);
      await expect(parser.parse(['-ns', '2.2', '-ns', '1.2,2.7']).numbers).resolves.toEqual([3, 2]);
      await expect(parser.parse(['-ns', '2.2', '-ns', '2.7,1.2']).numbers).resolves.toEqual([3, 2]);
      await expect(parser.parse(['-ns', '2.2', '-ns', '2.7,2.8']).numbers).resolves.toEqual([3]);
      await expect(parser.parse(['-ns', '2.2', '-ns', '1.2,3.3']).numbers).resolves.toEqual([
        3,
        2,
        4, // order is preserved
      ]);
    });

    it('should handle a numbers option with mixed-async custom delimited parsing', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'ceil',
          append: true,
          unique: true,
          parseDelimited: (_0, _1, value): Array<number> | Promise<Array<number>> => {
            const res = value.split(',').map((val) => Number(val));
            return value.startsWith('1') ? res : Promise.resolve(res);
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-ns'])).toThrow(`Missing parameter to -ns.`);
      expect(parser.parse(['-ns', '1.1,1.2', '-ns', '1.1,1.2'])).toEqual({ numbers: [2] });
      await expect(parser.parse(['-ns', '1.1,1.2', '-ns', '2.1,2.2']).numbers).resolves.toEqual([
        2, 3,
      ]);
      await expect(parser.parse(['-ns', '2.1,2.2', '-ns', '1.1,1.2']).numbers).resolves.toEqual([
        3, 2,
      ]);
      await expect(parser.parse(['-ns', '2.1,2.2', '-ns', '2.1,2.2']).numbers).resolves.toEqual([
        3,
      ]);
    });
  });
});
