import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a positional boolean option with custom parsing', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          positional: true,
          preferredName: 'bool',
          parse: vi.fn().mockImplementation((_0, _1, value) => value.includes('123')),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0123'])).resolves.toEqual({ boolean: true });
      expect(options.boolean.parse).toHaveBeenCalledWith(expect.anything(), 'bool', '0123');
    });

    it('should handle a boolean option with custom parsing from environment variable', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          envVar: 'BOOLEAN',
          parse: vi.fn().mockImplementation(() => true),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['BOOLEAN'] = '1';
      await expect(parser.parse([])).resolves.toEqual({ boolean: true });
      expect(options.boolean.parse).toHaveBeenCalledWith(expect.anything(), 'BOOLEAN', '1');
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
      await expect(parser.parse(['-b', 'abc'])).resolves.toEqual({ boolean: false });
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
          parse: vi.fn().mockImplementation((_0, _1, value) => Number(value)),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '1.2'])).resolves.toEqual({ number: 2 });
      expect(options.number.parse).toHaveBeenCalledWith(expect.anything(), '-n', '1.2');
    });

    it('should handle a number option with async custom parsing', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          conv: 'ceil',
          parse: async (_0, _1, value) => Number(value),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '1.2'])).resolves.toEqual({ number: 2 });
    });

    it('should handle a strings option with custom parsing', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'upper',
          parse: vi.fn().mockImplementation((_0, _1, value) => value),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'a', 'b'])).resolves.toEqual({ strings: ['A', 'B'] });
      expect(options.strings.parse).toHaveBeenCalledWith(expect.anything(), '-ss', 'a');
      expect(options.strings.parse).toHaveBeenCalledWith(expect.anything(), '-ss', 'b');
      expect(options.strings.parse).toHaveBeenCalledTimes(2);
    });

    it('should handle a strings option with async custom parsing', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          unique: true,
          parse: async (_0, _1, value) => value,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'ab', 'ab'])).resolves.toEqual({ strings: ['ab'] });
      await expect(parser.parse(['-ss', 'ab', '-ss', ''])).resolves.toEqual({ strings: [''] });
    });

    it('should handle a numbers option with custom parsing', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          conv: 'ceil',
          parse: vi.fn().mockImplementation((_0, _1, value) => Number(value)),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '1.2', '1.7'])).resolves.toEqual({ numbers: [2, 2] });
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.2');
      expect(options.numbers.parse).toHaveBeenCalledWith(expect.anything(), '-ns', '1.7');
      expect(options.numbers.parse).toHaveBeenCalledTimes(2);
    });

    it('should handle a numbers option with async custom parsing', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          unique: true,
          parse: async (_0, _1, value) => Number(value),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '1', '1'])).resolves.toEqual({ numbers: [1] });
    });
  });
});
