import { describe, expect, it, vi } from 'vitest';
import type { Options, ParsingFlags } from '../../lib';
import { ArgumentParser, CompMessage } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should complete an empty command line', async () => {
      const parser = new ArgumentParser({});
      await expect(parser.parse('cmd', { compIndex: 4 })).rejects.toThrow(/^$/);
    });

    it('should ignore unknown options during completion', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd x ', { compIndex: 6 })).rejects.toThrow(/^-f$/);
    });

    it('should ignore parsing errors during completion', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -s a ', { compIndex: 9 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd -s a -s ', { compIndex: 12 })).rejects.toThrow(/^abc$/);
    });

    it('should ignore an error thrown by a fallback callback during completion', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          fallback: vi.fn().mockImplementation(() => {
            throw 'abc';
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -s -s ', { compIndex: 10 })).rejects.toThrow(/^-s$/);
      expect(options.string.fallback).toHaveBeenCalled();
    });

    it('should ignore errors thrown by a function option callback during completion', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec: vi.fn().mockImplementation(() => {
            throw 'abc';
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
      expect(options.function.exec).toHaveBeenCalledWith({
        values: { function: undefined },
        index: 0,
        name: '-f',
        param: [''],
        comp: true,
      });
    });

    it('can throw completion words from a function callback during completion', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec() {
            throw new CompMessage('abc');
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a help option', async () => {
      const options = {
        help: {
          type: 'help',
          names: ['-h'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-h$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-h$/);
      await expect(parser.parse('cmd -h', { compIndex: 6 })).rejects.toThrow(/^-h$/);
      await expect(parser.parse('cmd -h ', { compIndex: 7 })).rejects.toThrow(/^-h$/);
      await expect(parser.parse('cmd -h=', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -h= ', { compIndex: 8 })).rejects.toThrow(/^-h$/);
    });

    it('should handle the completion of a version option', async () => {
      const options = {
        version: {
          type: 'version',
          names: ['-v'],
          version: '0.1.0',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-v$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-v$/);
      await expect(parser.parse('cmd -v', { compIndex: 6 })).rejects.toThrow(/^-v$/);
      await expect(parser.parse('cmd -v ', { compIndex: 7 })).rejects.toThrow(/^-v$/);
      await expect(parser.parse('cmd -v=', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -v= ', { compIndex: 8 })).rejects.toThrow(/^-v$/);
    });

    it('should handle the completion of a function option', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -f', { compIndex: 6 })).rejects.toThrow(/^-f$/);
      expect(options.function.exec).not.toHaveBeenCalled();
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
      expect(options.function.exec).toHaveBeenCalledWith({
        values: { function: undefined },
        index: 0,
        name: '-f',
        param: [''],
        comp: true,
      });
      options.function.exec.mockClear();
      await expect(parser.parse('cmd -f=', { compIndex: 7 })).rejects.toThrow(/^$/);
      expect(options.function.exec).not.toHaveBeenCalled();
      await expect(parser.parse('cmd -f= ', { compIndex: 8 })).rejects.toThrow(/^-f$/);
      expect(options.function.exec).not.toHaveBeenCalled(); // option was ignored
    });

    it('should handle the completion of a function option that breaks the parsing loop', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec: vi.fn(),
          break: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
      expect(options.function.exec).toHaveBeenCalledWith({
        values: { function: undefined },
        index: 0,
        name: '-f',
        param: [''],
        comp: true,
      });
    });

    it('should handle the completion of a function option with a parameter count', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: 2,
          exec: vi.fn(),
          complete: () => ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -f 1 2', { compIndex: 10 })).rejects.toThrow(/^abc$/);
      expect(options.function.exec).not.toHaveBeenCalled();
    });

    it('should handle the completion of a command option', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          options: {
            flag: {
              type: 'flag',
              names: ['-f'],
            },
          },
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-c$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-c$/);
      await expect(parser.parse('cmd -c', { compIndex: 6 })).rejects.toThrow(/^-c$/);
      await expect(parser.parse('cmd -c ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -c=', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -c= ', { compIndex: 8 })).rejects.toThrow(/^-c$/);
      expect(options.command.exec).not.toHaveBeenCalled();
    });

    it('should handle the completion of a flag option', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -f', { compIndex: 6 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -f=', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -f= ', { compIndex: 8 })).rejects.toThrow(/^-f$/);
    });

    it('should handle the completion of a positional marker', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-s\n--$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-s\n--$/);
      await expect(parser.parse('cmd --', { compIndex: 6 })).rejects.toThrow(/^--$/);
      await expect(parser.parse('cmd -- ', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd --=', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd --= ', { compIndex: 8 })).rejects.toThrow(/^-s\n--$/);
    });

    it('should handle the completion of a positional marker with enums', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^one\ntwo\n-s\n--$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-s\n--$/);
      await expect(parser.parse('cmd --', { compIndex: 6 })).rejects.toThrow(/^--$/);
      await expect(parser.parse('cmd -- ', { compIndex: 7 })).rejects.toThrow(/^one\ntwo$/);
      await expect(parser.parse('cmd -- o', { compIndex: 8 })).rejects.toThrow(/^one$/);
      await expect(parser.parse('cmd --=', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd --= ', { compIndex: 8 })).rejects.toThrow(
        /^one\ntwo\n-s\n--$/,
      );
    });

    it('should handle the completion of a positional function option with parameter count', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: 2,
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd a ', { compIndex: 6 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd a a ', { compIndex: 8 })).rejects.toThrow(/^-f$/);
    });

    it('should handle the completion of a positional function option with custom completion', async () => {
      const options = {
        function: {
          type: 'function',
          paramCount: 2,
          positional: true,
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^abc$/);
      expect(options.function.complete).toHaveBeenCalledWith({
        values: { function: undefined },
        index: 0,
        name: '',
        param: [],
        comp: '',
      });
      options.function.complete.mockClear();
      await expect(parser.parse('cmd a ', { compIndex: 6 })).rejects.toThrow(/^abc$/);
      expect(options.function.complete).toHaveBeenCalledWith({
        values: { function: undefined },
        index: 0,
        name: '',
        param: ['a'],
        comp: '',
      });
      options.function.complete.mockClear();
      await expect(parser.parse('cmd a a ', { compIndex: 8 })).rejects.toThrow(/^abc$/);
      expect(options.function.complete).toHaveBeenCalledWith({
        values: { function: undefined },
        index: 0,
        name: '',
        param: [],
        comp: '',
      });
    });

    it('should handle the completion of a positional boolean option with truth names', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          truthNames: ['yes'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^yes\n-b$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd y', { compIndex: 5 })).rejects.toThrow(/^yes$/);
      await expect(parser.parse('cmd x', { compIndex: 5 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd x y', { compIndex: 7 })).rejects.toThrow(/^yes$/);
    });

    it('should handle the completion of a positional boolean option with falsity names', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          falsityNames: ['no'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^no\n-b$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd n', { compIndex: 5 })).rejects.toThrow(/^no$/);
      await expect(parser.parse('cmd x', { compIndex: 5 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd x n', { compIndex: 7 })).rejects.toThrow(/^no$/);
    });

    it('should handle the completion of a positional string option with enums', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^one\ntwo\n-s$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd o', { compIndex: 5 })).rejects.toThrow(/^one$/);
      await expect(parser.parse('cmd t', { compIndex: 5 })).rejects.toThrow(/^two$/);
      await expect(parser.parse('cmd x', { compIndex: 5 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd one o', { compIndex: 9 })).rejects.toThrow(/^one$/);
    });

    it('should handle the completion of a positional number option with enums', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [123, 456],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^123\n456\n-n$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-n$/);
      await expect(parser.parse('cmd 1', { compIndex: 5 })).rejects.toThrow(/^123$/);
      await expect(parser.parse('cmd 4', { compIndex: 5 })).rejects.toThrow(/^456$/);
      await expect(parser.parse('cmd x', { compIndex: 5 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd 123 1', { compIndex: 9 })).rejects.toThrow(/^123$/);
    });

    it('should handle the completion of a positional boolean option with custom completion', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: true,
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith({
        values: { boolean: undefined },
        index: 0,
        name: '-b',
        param: [],
        comp: '',
      });
      options.boolean.complete.mockClear();
      await expect(parser.parse('cmd -b 123', { compIndex: 7 })).rejects.toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith({
        values: { boolean: undefined },
        index: 0,
        name: '-b',
        param: [],
        comp: '',
      });
      options.boolean.complete.mockClear();
      await expect(parser.parse('cmd -b 123', { compIndex: 9 })).rejects.toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith({
        values: { boolean: undefined },
        index: 0,
        name: '-b',
        param: [],
        comp: '12',
      });
      options.boolean.complete.mockClear();
      await expect(parser.parse('cmd 0 1 ', { compIndex: 8 })).rejects.toThrow(/^abc\n-b$/);
      expect(options.boolean.complete).toHaveBeenCalledWith({
        values: { boolean: true },
        index: 1,
        name: '-b',
        param: [],
        comp: '',
      });
    });

    it('should handle the completion of a boolean option with custom completion that throws', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          complete: vi.fn().mockImplementation(() => {
            throw 'abc';
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^$/);
      expect(options.boolean.complete).toHaveBeenCalled();
    });

    it('should handle the completion of a boolean option with truth names', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          truthNames: ['yes'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -b', { compIndex: 6 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^yes$/);
      await expect(parser.parse('cmd -b y', { compIndex: 8 })).rejects.toThrow(/^yes$/);
      await expect(parser.parse('cmd -b x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -b=y', { compIndex: 8 })).rejects.toThrow(/^yes$/);
      await expect(parser.parse('cmd -b=x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -b x -b', { compIndex: 11 })).rejects.toThrow(/^-b$/);
    });

    it('should handle the completion of a boolean option with falsity names', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          falsityNames: ['no'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -b', { compIndex: 6 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^no$/);
      await expect(parser.parse('cmd -b n', { compIndex: 8 })).rejects.toThrow(/^no$/);
      await expect(parser.parse('cmd -b x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -b=n', { compIndex: 8 })).rejects.toThrow(/^no$/);
      await expect(parser.parse('cmd -b=x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -b x -b', { compIndex: 11 })).rejects.toThrow(/^-b$/);
    });

    it('should handle the completion of a string option with a fallback value', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          fallback: '123',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd -s', { compIndex: 6 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^-s$/);
    });

    it('should handle the completion of a string option with enums', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd -s', { compIndex: 6 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^one\ntwo$/);
      await expect(parser.parse('cmd -s o', { compIndex: 8 })).rejects.toThrow(/^one$/);
      await expect(parser.parse('cmd -s t', { compIndex: 8 })).rejects.toThrow(/^two$/);
      await expect(parser.parse('cmd -s x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -s=', { compIndex: 7 })).rejects.toThrow(/^one\ntwo$/);
      await expect(parser.parse('cmd -s=o', { compIndex: 8 })).rejects.toThrow(/^one$/);
      await expect(parser.parse('cmd -s=t', { compIndex: 8 })).rejects.toThrow(/^two$/);
      await expect(parser.parse('cmd -s=x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -s one -s', { compIndex: 13 })).rejects.toThrow(/^-s$/);
    });

    it('should handle the completion of a number option with a fallback value', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          fallback: 123,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-n$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-n$/);
      await expect(parser.parse('cmd -n', { compIndex: 6 })).rejects.toThrow(/^-n$/);
      await expect(parser.parse('cmd -n ', { compIndex: 7 })).rejects.toThrow(/^-n$/);
    });

    it('should handle the completion of a number option with enums', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [123, 456],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-n$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-n$/);
      await expect(parser.parse('cmd -n', { compIndex: 6 })).rejects.toThrow(/^-n$/);
      await expect(parser.parse('cmd -n ', { compIndex: 7 })).rejects.toThrow(/^123\n456$/);
      await expect(parser.parse('cmd -n 1', { compIndex: 8 })).rejects.toThrow(/^123$/);
      await expect(parser.parse('cmd -n 4', { compIndex: 8 })).rejects.toThrow(/^456$/);
      await expect(parser.parse('cmd -n x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -n=', { compIndex: 7 })).rejects.toThrow(/^123\n456$/);
      await expect(parser.parse('cmd -n=1', { compIndex: 8 })).rejects.toThrow(/^123$/);
      await expect(parser.parse('cmd -n=4', { compIndex: 8 })).rejects.toThrow(/^456$/);
      await expect(parser.parse('cmd -n=x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -n 123 -n', { compIndex: 13 })).rejects.toThrow(/^-n$/);
    });

    it('should handle the completion of a variadic strings option with a fallback value', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          fallback: [],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -s', { compIndex: 6 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -ss', { compIndex: 7 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -ss -ss', { compIndex: 11 })).rejects.toThrow(/^-ss$/);
    });

    it('should handle the completion of a variadic strings option with custom completion', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          complete: vi.fn().mockImplementation(() => []),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^$/);
      expect(options.strings.complete).toHaveBeenCalledWith({
        values: { strings: undefined },
        index: 0,
        name: '-ss',
        param: [],
        comp: '',
      });
      options.strings.complete.mockClear();
      await expect(parser.parse('cmd -ss 1 ', { compIndex: 10 })).rejects.toThrow(/^-ss$/);
      expect(options.strings.complete).toHaveBeenCalledWith({
        values: { strings: undefined },
        index: 0,
        name: '-ss',
        param: ['1'],
        comp: '',
      });
    });

    it('should handle the completion of a variadic strings option', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -s', { compIndex: 6 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -ss', { compIndex: 7 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -ss 1 ', { compIndex: 10 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -ss=', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -ss= ', { compIndex: 9 })).rejects.toThrow(/^-ss$/);
      await expect(parser.parse('cmd -ss 1 -ss', { compIndex: 13 })).rejects.toThrow(/^-ss$/);
    });

    it('should handle the completion of a variadic numbers option with a fallback value', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          fallback: [],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -n', { compIndex: 6 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -ns', { compIndex: 7 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -ns -ns', { compIndex: 11 })).rejects.toThrow(/^-ns$/);
    });

    it('should handle the completion of a variadic numbers option with custom completion', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          complete: vi.fn().mockImplementation(() => []),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^$/);
      expect(options.numbers.complete).toHaveBeenCalledWith({
        values: { numbers: undefined },
        index: 0,
        name: '-ns',
        param: [],
        comp: '',
      });
      options.numbers.complete.mockClear();
      await expect(parser.parse('cmd -ns 1 ', { compIndex: 10 })).rejects.toThrow(/^-ns$/);
      expect(options.numbers.complete).toHaveBeenCalledWith({
        values: { numbers: undefined },
        index: 0,
        name: '-ns',
        param: ['1'],
        comp: '',
      });
    });

    it('should handle the completion of a variadic numbers option', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -n', { compIndex: 6 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -ns', { compIndex: 7 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -ns 1 ', { compIndex: 10 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -ns=', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -ns= ', { compIndex: 9 })).rejects.toThrow(/^-ns$/);
      await expect(parser.parse('cmd -ns 1 -ns', { compIndex: 13 })).rejects.toThrow(/^-ns$/);
    });

    it('should handle the completion of a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const flags: ParsingFlags = { clusterPrefix: '-', compIndex: 6 };
      await expect(parser.parse('cmd  -f', flags)).rejects.toThrow(/^--flag$/);
      await expect(parser.parse('cmd --f', flags)).rejects.toThrow(/^--flag$/);
      await expect(parser.parse('cmd -ff', flags)).rejects.toThrow(/^$/);
    });

    it('should complete the parameter of a clustered option (and ignore the rest)', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
        boolean: {
          type: 'boolean',
          names: ['--bool'],
          truthNames: ['yes'],
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const flags: ParsingFlags = { clusterPrefix: '-', compIndex: 8 };
      await expect(parser.parse('cmd -bf  rest', flags)).rejects.toThrow(/^yes$/);
    });

    it('should ignore unknown cluster letters during completion', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['--bool'],
          truthNames: ['yes'],
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const flags: ParsingFlags = { clusterPrefix: '-', compIndex: 8 };
      await expect(parser.parse('cmd -xb ', flags)).rejects.toThrow(/^--bool$/);
    });

    it('should handle the completion of a boolean option with async custom completion', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          complete: async () => ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a boolean option with async custom completion that throws', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          async complete() {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^$/);
    });

    it('should handle the completion of a string option with async custom completion', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          complete: async () => ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a string option with async custom completion that throws', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          async complete() {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^$/);
    });

    it('should handle the completion of a number option with async custom completion', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          complete: async () => ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -n ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a number option with async custom completion that throws', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          async complete() {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -n ', { compIndex: 7 })).rejects.toThrow(/^$/);
    });

    it('should handle the completion of a strings option with async custom completion', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          complete: async () => ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a strings option with async custom completion that throws', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          async complete() {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^$/);
    });

    it('should handle the completion of a numbers option with async custom completion', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          complete: async () => ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a numbers option with async custom completion that throws', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          async complete() {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^$/);
    });

    it('should handle a function option with an async callback that throws during completion', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          async exec() {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
    });
  });
});
