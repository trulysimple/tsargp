import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
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
      const anything = expect.anything();
      expect(options.function.exec).toHaveBeenCalledWith(anything, true, anything);
    });

    it('should ignore the skip count of a function option during completion', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec() {
            this.skipCount = 1;
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
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
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -f=', { compIndex: 7 })).rejects.toThrow(/^$/);
      const anything = expect.anything();
      expect(options.function.exec).toHaveBeenCalledWith(anything, true, anything);
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
      const anything = expect.anything();
      expect(options.function.exec).toHaveBeenCalledWith(anything, true, anything);
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
          cmd: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-c$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-c$/);
      await expect(parser.parse('cmd -c', { compIndex: 6 })).rejects.toThrow(/^-c$/);
      await expect(parser.parse('cmd -c ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
      await expect(parser.parse('cmd -c=', { compIndex: 7 })).rejects.toThrow(/^$/);
      expect(options.command.cmd).not.toHaveBeenCalled();
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
      await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^$/);
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
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^one\ntwo$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-s\n--$/);
      await expect(parser.parse('cmd --', { compIndex: 6 })).rejects.toThrow(/^--$/);
      await expect(parser.parse('cmd -- ', { compIndex: 7 })).rejects.toThrow(/^one\ntwo$/);
      await expect(parser.parse('cmd -- o', { compIndex: 8 })).rejects.toThrow(/^one$/);
      await expect(parser.parse('cmd --=', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd --= ', { compIndex: 8 })).rejects.toThrow(/^one\ntwo$/);
      await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^one\ntwo$/);
    });

    it('should handle the completion of a positional boolean option', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^true\nfalse$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd t', { compIndex: 5 })).rejects.toThrow(/^true$/);
      await expect(parser.parse('cmd f', { compIndex: 5 })).rejects.toThrow(/^false$/);
      await expect(parser.parse('cmd x', { compIndex: 5 })).rejects.toThrow(/^$/);
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
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^one\ntwo$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-s$/);
      await expect(parser.parse('cmd o', { compIndex: 5 })).rejects.toThrow(/^one$/);
      await expect(parser.parse('cmd t', { compIndex: 5 })).rejects.toThrow(/^two$/);
      await expect(parser.parse('cmd x', { compIndex: 5 })).rejects.toThrow(/^$/);
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
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^123\n456$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-n$/);
      await expect(parser.parse('cmd 1', { compIndex: 5 })).rejects.toThrow(/^123$/);
      await expect(parser.parse('cmd 4', { compIndex: 5 })).rejects.toThrow(/^456$/);
      await expect(parser.parse('cmd x', { compIndex: 5 })).rejects.toThrow(/^$/);
    });

    it('should handle the completion of a boolean option with custom completion', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      await expect(parser.parse('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith(anything, '', anything);
      options.boolean.complete.mockClear();
      await expect(parser.parse('cmd -b 123', { compIndex: 7 })).rejects.toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith(anything, '', anything);
      options.boolean.complete.mockClear();
      await expect(parser.parse('cmd -b 123', { compIndex: 9 })).rejects.toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith(anything, '12', anything);
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

    it('should handle the completion of a boolean option', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -b', { compIndex: 6 })).rejects.toThrow(/^-b$/);
      await expect(parser.parse('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^true\nfalse$/);
      await expect(parser.parse('cmd -b t', { compIndex: 8 })).rejects.toThrow(/^true$/);
      await expect(parser.parse('cmd -b f', { compIndex: 8 })).rejects.toThrow(/^false$/);
      await expect(parser.parse('cmd -b x', { compIndex: 8 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -b=t', { compIndex: 8 })).rejects.toThrow(/^true$/);
      await expect(parser.parse('cmd -b=f', { compIndex: 8 })).rejects.toThrow(/^false$/);
      await expect(parser.parse('cmd -b=x', { compIndex: 8 })).rejects.toThrow(/^$/);
    });

    it('should handle the completion of a string option with custom completion', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
      expect(options.string.complete).toHaveBeenCalledWith(anything, '', anything);
      options.string.complete.mockClear();
      await expect(parser.parse('cmd -s 123', { compIndex: 7 })).rejects.toThrow(/^abc$/);
      expect(options.string.complete).toHaveBeenCalledWith(anything, '', anything);
      options.string.complete.mockClear();
      await expect(parser.parse('cmd -s 123', { compIndex: 9 })).rejects.toThrow(/^abc$/);
      expect(options.string.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a string option with custom completion that throws', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          complete: vi.fn().mockImplementation(() => {
            throw 'abc';
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^$/);
      expect(options.string.complete).toHaveBeenCalled();
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
      await expect(parser.parse('cmd -s=o', { compIndex: 8 })).rejects.toThrow(/^one$/);
      await expect(parser.parse('cmd -s=t', { compIndex: 8 })).rejects.toThrow(/^two$/);
      await expect(parser.parse('cmd -s=x', { compIndex: 8 })).rejects.toThrow(/^$/);
    });

    it('should handle the completion of a number option with custom completion', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      await expect(parser.parse('cmd -n ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
      expect(options.number.complete).toHaveBeenCalledWith(anything, '', anything);
      options.number.complete.mockClear();
      await expect(parser.parse('cmd -n 123', { compIndex: 7 })).rejects.toThrow(/^abc$/);
      expect(options.number.complete).toHaveBeenCalledWith(anything, '', anything);
      options.number.complete.mockClear();
      await expect(parser.parse('cmd -n 123', { compIndex: 9 })).rejects.toThrow(/^abc$/);
      expect(options.number.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a number option with custom completion that throws', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          complete: vi.fn().mockImplementation(() => {
            throw 'abc';
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -n ', { compIndex: 7 })).rejects.toThrow(/^$/);
      expect(options.number.complete).toHaveBeenCalled();
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
      await expect(parser.parse('cmd -n=1', { compIndex: 8 })).rejects.toThrow(/^123$/);
      await expect(parser.parse('cmd -n=4', { compIndex: 8 })).rejects.toThrow(/^456$/);
      await expect(parser.parse('cmd -n=x', { compIndex: 8 })).rejects.toThrow(/^$/);
    });

    it('should handle the completion of a strings option with custom completion', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      await expect(parser.parse('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^abc$/);
      expect(options.strings.complete).toHaveBeenCalledWith(anything, '', anything);
      options.strings.complete.mockClear();
      await expect(parser.parse('cmd -ss 123', { compIndex: 8 })).rejects.toThrow(/^abc$/);
      expect(options.strings.complete).toHaveBeenCalledWith(anything, '', anything);
      options.strings.complete.mockClear();
      await expect(parser.parse('cmd -ss 123', { compIndex: 10 })).rejects.toThrow(/^abc$/);
      expect(options.strings.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a strings option with custom completion that throws', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          complete: vi.fn().mockImplementation(() => {
            throw 'abc';
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^$/);
      expect(options.strings.complete).toHaveBeenCalled();
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
    });

    it('should handle the completion of a numbers option with custom completion', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      await expect(parser.parse('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^abc$/);
      expect(options.numbers.complete).toHaveBeenCalledWith(anything, '', anything);
      options.numbers.complete.mockClear();
      await expect(parser.parse('cmd -ns 123', { compIndex: 8 })).rejects.toThrow(/^abc$/);
      expect(options.numbers.complete).toHaveBeenCalledWith(anything, '', anything);
      options.numbers.complete.mockClear();
      await expect(parser.parse('cmd -ns 123', { compIndex: 10 })).rejects.toThrow(/^abc$/);
      expect(options.numbers.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a numbers option with custom completion that throws', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          complete: vi.fn().mockImplementation(() => {
            throw 'abc';
          }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^$/);
      expect(options.numbers.complete).toHaveBeenCalled();
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
    });

    it('should throw the default completion when completing a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd --', { shortStyle: true, compIndex: 5 })).rejects.toThrow(
        /^$/,
      );
      await expect(parser.parse('cmd ff', { shortStyle: true, compIndex: 5 })).rejects.toThrow(
        /^$/,
      );
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
