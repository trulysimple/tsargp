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
          parse: vi.fn().mockImplementation(({ param }) => param.includes('123')),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['0123'])).resolves.toEqual({ boolean: true });
      expect(options.boolean.parse).toHaveBeenCalledWith({
        // should have been { boolean: undefined } at the time of call
        values: { boolean: true },
        index: 0,
        name: 'bool',
        param: '0123',
        comp: false,
      });
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
      expect(options.boolean.parse).toHaveBeenCalledWith({
        // should have been { boolean: undefined } at the time of call
        values: { boolean: true },
        index: NaN,
        name: 'BOOLEAN',
        param: '1',
        comp: false,
      });
    });

    it('should handle a boolean option with async custom parsing', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          parse: async ({ param }) => param.includes('123'),
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
          parse: vi.fn().mockImplementation(({ param }) => param.slice(2)),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s', 'abcde'])).resolves.toEqual({ string: 'CDE' });
      expect(options.string.parse).toHaveBeenCalledWith({
        // should have been { string: undefined } at the time of call
        values: { string: 'CDE' },
        index: 0,
        name: '-s',
        param: 'abcde',
        comp: false,
      });
    });

    it('should handle a string option with async custom parsing', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'upper',
          parse: async ({ param }) => param.slice(2),
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
          parse: vi.fn().mockImplementation(({ param }) => Number(param)),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '1.2'])).resolves.toEqual({ number: 2 });
      expect(options.number.parse).toHaveBeenCalledWith({
        // should have been { number: undefined } at the time of call
        values: { number: 2 },
        index: 0,
        name: '-n',
        param: '1.2',
        comp: false,
      });
    });

    it('should handle a number option with async custom parsing', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          conv: 'ceil',
          parse: async ({ param }) => Number(param),
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
          parse: vi.fn().mockImplementation(({ param }) => param),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'a', 'b'])).resolves.toEqual({ strings: ['A', 'B'] });
      expect(options.strings.parse).toHaveBeenCalledWith({
        // should have been { strings: undefined } at the time of call
        values: { strings: ['A', 'B'] },
        index: 0,
        name: '-ss',
        param: ['a', 'b'],
        comp: false,
      });
      expect(options.strings.parse).toHaveBeenCalledTimes(1);
    });

    it('should handle a strings option with async custom parsing', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          unique: true,
          parse: async ({ param }) => param,
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
          parse: vi.fn().mockImplementation(({ param }) => param.map(Number)),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '1.2', '1.7'])).resolves.toEqual({ numbers: [2, 2] });
      expect(options.numbers.parse).toHaveBeenCalledWith({
        // should have been { numbers: undefined } at the time of call
        values: { numbers: [2, 2] },
        index: 0,
        name: '-ns',
        param: ['1.2', '1.7'],
        comp: false,
      });
      expect(options.numbers.parse).toHaveBeenCalledTimes(1);
    });

    it('should handle a numbers option with async custom parsing', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          unique: true,
          parse: async ({ param }) => param.map(Number),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '1', '1'])).resolves.toEqual({ numbers: [1] });
    });
  });
});
