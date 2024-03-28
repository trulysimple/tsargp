import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should ignore parsing errors during completion', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd -s a ', { compIndex: 9 })).toThrow(/^-s$/);
      expect(() => parser.parse('cmd -s a -s ', { compIndex: 12 })).toThrow(/^abc$/);
    });

    it('should ignore errors thrown by a function option callback during completion', () => {
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
      expect(() => parser.parse('cmd -f ', { compIndex: 7 })).toThrow(/^-f$/);
      const anything = expect.anything();
      expect(options.function.exec).toHaveBeenCalledWith(anything, true, anything);
    });

    it('should ignore the skip count of a function option during completion', () => {
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
      expect(() => parser.parse('cmd -f ', { compIndex: 7 })).toThrow(/^-f$/);
    });

    it('should handle the completion of a help option', () => {
      const options = {
        help: {
          type: 'help',
          names: ['-h'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-h$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-h$/);
      expect(() => parser.parse('cmd -h', { compIndex: 6 })).toThrow(/^-h$/);
      expect(() => parser.parse('cmd -h ', { compIndex: 7 })).toThrow(/^-h$/);
      expect(() => parser.parse('cmd -h=', { compIndex: 7 })).toThrow(/^$/);
    });

    it('should handle the completion of a version option', () => {
      const options = {
        version: {
          type: 'version',
          names: ['-v'],
          version: '0.1.0',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-v$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-v$/);
      expect(() => parser.parse('cmd -v', { compIndex: 6 })).toThrow(/^-v$/);
      expect(() => parser.parse('cmd -v ', { compIndex: 7 })).toThrow(/^-v$/);
      expect(() => parser.parse('cmd -v=', { compIndex: 7 })).toThrow(/^$/);
    });

    it('should handle the completion of a function option', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -f', { compIndex: 6 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -f ', { compIndex: 7 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -f=', { compIndex: 7 })).toThrow(/^$/);
      const anything = expect.anything();
      expect(options.function.exec).toHaveBeenCalledWith(anything, true, anything);
    });

    it('should handle the completion of a function option that breaks the parsing loop', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec: vi.fn(),
          break: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd -f ', { compIndex: 7 })).toThrow(/^-f$/);
      const anything = expect.anything();
      expect(options.function.exec).toHaveBeenCalledWith(anything, true, anything);
    });

    it('should handle the completion of a command option', () => {
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
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-c$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-c$/);
      expect(() => parser.parse('cmd -c', { compIndex: 6 })).toThrow(/^-c$/);
      expect(() => parser.parse('cmd -c ', { compIndex: 7 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -c=', { compIndex: 7 })).toThrow(/^$/);
      expect(options.command.cmd).not.toHaveBeenCalled();
    });

    it('should handle the completion of a flag option', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -f', { compIndex: 6 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -f ', { compIndex: 7 })).toThrow(/^-f$/);
      expect(() => parser.parse('cmd -f=', { compIndex: 7 })).toThrow(/^$/);
    });

    it('should handle the completion of a positional marker', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-s\n--$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-s\n--$/);
      expect(() => parser.parse('cmd --', { compIndex: 6 })).toThrow(/^--$/);
      expect(() => parser.parse('cmd -- ', { compIndex: 7 })).toThrow(/^$/);
      expect(() => parser.parse('cmd --=', { compIndex: 7 })).toThrow(/^$/);
      expect(() => parser.parse('cmd -s ', { compIndex: 7 })).toThrow(/^$/);
    });

    it('should handle the completion of a positional marker with enums', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^one\ntwo$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-s\n--$/);
      expect(() => parser.parse('cmd --', { compIndex: 6 })).toThrow(/^--$/);
      expect(() => parser.parse('cmd -- ', { compIndex: 7 })).toThrow(/^one\ntwo$/);
      expect(() => parser.parse('cmd -- o', { compIndex: 8 })).toThrow(/^one$/);
      expect(() => parser.parse('cmd --=', { compIndex: 7 })).toThrow(/^$/);
      expect(() => parser.parse('cmd -s ', { compIndex: 7 })).toThrow(/^one\ntwo$/);
    });

    it('should handle the completion of a positional boolean option', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^true\nfalse$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-b$/);
      expect(() => parser.parse('cmd t', { compIndex: 5 })).toThrow(/^true$/);
      expect(() => parser.parse('cmd f', { compIndex: 5 })).toThrow(/^false$/);
      expect(() => parser.parse('cmd x', { compIndex: 5 })).toThrow(/^$/);
    });

    it('should handle the completion of a positional string option with enums', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^one\ntwo$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-s$/);
      expect(() => parser.parse('cmd o', { compIndex: 5 })).toThrow(/^one$/);
      expect(() => parser.parse('cmd t', { compIndex: 5 })).toThrow(/^two$/);
      expect(() => parser.parse('cmd x', { compIndex: 5 })).toThrow(/^$/);
    });

    it('should handle the completion of a positional number option with enums', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [123, 456],
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^123\n456$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-n$/);
      expect(() => parser.parse('cmd 1', { compIndex: 5 })).toThrow(/^123$/);
      expect(() => parser.parse('cmd 4', { compIndex: 5 })).toThrow(/^456$/);
      expect(() => parser.parse('cmd x', { compIndex: 5 })).toThrow(/^$/);
    });

    it('should handle the completion of a boolean option with custom completion', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      expect(() => parser.parse('cmd -b ', { compIndex: 7 })).toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith(anything, '', anything);
      options.boolean.complete.mockClear();
      expect(() => parser.parse('cmd -b 123', { compIndex: 7 })).toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith(anything, '', anything);
      options.boolean.complete.mockClear();
      expect(() => parser.parse('cmd -b 123', { compIndex: 9 })).toThrow(/^abc$/);
      expect(options.boolean.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a boolean option with custom completion that throws', () => {
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
      expect(() => parser.parse('cmd -b ', { compIndex: 7 })).toThrow(/^$/);
      expect(options.boolean.complete).toHaveBeenCalled();
    });

    it('should handle the completion of a boolean option', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-b$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-b$/);
      expect(() => parser.parse('cmd -b', { compIndex: 6 })).toThrow(/^-b$/);
      expect(() => parser.parse('cmd -b ', { compIndex: 7 })).toThrow(/^true\nfalse$/);
      expect(() => parser.parse('cmd -b t', { compIndex: 8 })).toThrow(/^true$/);
      expect(() => parser.parse('cmd -b f', { compIndex: 8 })).toThrow(/^false$/);
      expect(() => parser.parse('cmd -b x', { compIndex: 8 })).toThrow(/^$/);
      expect(() => parser.parse('cmd -b=t', { compIndex: 8 })).toThrow(/^true$/);
      expect(() => parser.parse('cmd -b=f', { compIndex: 8 })).toThrow(/^false$/);
      expect(() => parser.parse('cmd -b=x', { compIndex: 8 })).toThrow(/^$/);
    });

    it('should handle the completion of a string option with custom completion', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      expect(() => parser.parse('cmd -s ', { compIndex: 7 })).toThrow(/^abc$/);
      expect(options.string.complete).toHaveBeenCalledWith(anything, '', anything);
      options.string.complete.mockClear();
      expect(() => parser.parse('cmd -s 123', { compIndex: 7 })).toThrow(/^abc$/);
      expect(options.string.complete).toHaveBeenCalledWith(anything, '', anything);
      options.string.complete.mockClear();
      expect(() => parser.parse('cmd -s 123', { compIndex: 9 })).toThrow(/^abc$/);
      expect(options.string.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a string option with custom completion that throws', () => {
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
      expect(() => parser.parse('cmd -s ', { compIndex: 7 })).toThrow(/^$/);
      expect(options.string.complete).toHaveBeenCalled();
    });

    it('should handle the completion of a string option with enums', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-s$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-s$/);
      expect(() => parser.parse('cmd -s', { compIndex: 6 })).toThrow(/^-s$/);
      expect(() => parser.parse('cmd -s ', { compIndex: 7 })).toThrow(/^one\ntwo$/);
      expect(() => parser.parse('cmd -s o', { compIndex: 8 })).toThrow(/^one$/);
      expect(() => parser.parse('cmd -s t', { compIndex: 8 })).toThrow(/^two$/);
      expect(() => parser.parse('cmd -s x', { compIndex: 8 })).toThrow(/^$/);
      expect(() => parser.parse('cmd -s=o', { compIndex: 8 })).toThrow(/^one$/);
      expect(() => parser.parse('cmd -s=t', { compIndex: 8 })).toThrow(/^two$/);
      expect(() => parser.parse('cmd -s=x', { compIndex: 8 })).toThrow(/^$/);
    });

    it('should handle the completion of a number option with custom completion', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      expect(() => parser.parse('cmd -n ', { compIndex: 7 })).toThrow(/^abc$/);
      expect(options.number.complete).toHaveBeenCalledWith(anything, '', anything);
      options.number.complete.mockClear();
      expect(() => parser.parse('cmd -n 123', { compIndex: 7 })).toThrow(/^abc$/);
      expect(options.number.complete).toHaveBeenCalledWith(anything, '', anything);
      options.number.complete.mockClear();
      expect(() => parser.parse('cmd -n 123', { compIndex: 9 })).toThrow(/^abc$/);
      expect(options.number.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a number option with custom completion that throws', () => {
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
      expect(() => parser.parse('cmd -n ', { compIndex: 7 })).toThrow(/^$/);
      expect(options.number.complete).toHaveBeenCalled();
    });

    it('should handle the completion of a number option with enums', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          enums: [123, 456],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-n$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-n$/);
      expect(() => parser.parse('cmd -n', { compIndex: 6 })).toThrow(/^-n$/);
      expect(() => parser.parse('cmd -n ', { compIndex: 7 })).toThrow(/^123\n456$/);
      expect(() => parser.parse('cmd -n 1', { compIndex: 8 })).toThrow(/^123$/);
      expect(() => parser.parse('cmd -n 4', { compIndex: 8 })).toThrow(/^456$/);
      expect(() => parser.parse('cmd -n x', { compIndex: 8 })).toThrow(/^$/);
      expect(() => parser.parse('cmd -n=1', { compIndex: 8 })).toThrow(/^123$/);
      expect(() => parser.parse('cmd -n=4', { compIndex: 8 })).toThrow(/^456$/);
      expect(() => parser.parse('cmd -n=x', { compIndex: 8 })).toThrow(/^$/);
    });

    it('should handle the completion of a strings option with custom completion', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      expect(() => parser.parse('cmd -ss ', { compIndex: 8 })).toThrow(/^abc$/);
      expect(options.strings.complete).toHaveBeenCalledWith(anything, '', anything);
      options.strings.complete.mockClear();
      expect(() => parser.parse('cmd -ss 123', { compIndex: 8 })).toThrow(/^abc$/);
      expect(options.strings.complete).toHaveBeenCalledWith(anything, '', anything);
      options.strings.complete.mockClear();
      expect(() => parser.parse('cmd -ss 123', { compIndex: 10 })).toThrow(/^abc$/);
      expect(options.strings.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a strings option with custom completion that throws', () => {
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
      expect(() => parser.parse('cmd -ss ', { compIndex: 8 })).toThrow(/^$/);
      expect(options.strings.complete).toHaveBeenCalled();
    });

    it('should handle the completion of a variadic strings option', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-ss$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-ss$/);
      expect(() => parser.parse('cmd -s', { compIndex: 6 })).toThrow(/^-ss$/);
      expect(() => parser.parse('cmd -ss', { compIndex: 7 })).toThrow(/^-ss$/);
      expect(() => parser.parse('cmd -ss ', { compIndex: 8 })).toThrow(/^-ss$/);
      expect(() => parser.parse('cmd -ss=', { compIndex: 8 })).toThrow(/^$/);
    });

    it('should handle the completion of a numbers option with custom completion', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          complete: vi.fn().mockImplementation(() => ['abc']),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const anything = expect.anything();
      expect(() => parser.parse('cmd -ns ', { compIndex: 8 })).toThrow(/^abc$/);
      expect(options.numbers.complete).toHaveBeenCalledWith(anything, '', anything);
      options.numbers.complete.mockClear();
      expect(() => parser.parse('cmd -ns 123', { compIndex: 8 })).toThrow(/^abc$/);
      expect(options.numbers.complete).toHaveBeenCalledWith(anything, '', anything);
      options.numbers.complete.mockClear();
      expect(() => parser.parse('cmd -ns 123', { compIndex: 10 })).toThrow(/^abc$/);
      expect(options.numbers.complete).toHaveBeenCalledWith(anything, '12', anything);
    });

    it('should handle the completion of a numbers option with custom completion that throws', () => {
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
      expect(() => parser.parse('cmd -ns ', { compIndex: 8 })).toThrow(/^$/);
      expect(options.numbers.complete).toHaveBeenCalled();
    });

    it('should handle the completion of a variadic numbers option', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd ', { compIndex: 4 })).toThrow(/^-ns$/);
      expect(() => parser.parse('cmd -', { compIndex: 5 })).toThrow(/^-ns$/);
      expect(() => parser.parse('cmd -n', { compIndex: 6 })).toThrow(/^-ns$/);
      expect(() => parser.parse('cmd -ns', { compIndex: 7 })).toThrow(/^-ns$/);
      expect(() => parser.parse('cmd -ns ', { compIndex: 8 })).toThrow(/^-ns$/);
      expect(() => parser.parse('cmd -ns=', { compIndex: 8 })).toThrow(/^$/);
    });

    it('should throw the default completion when completing a cluster argument', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse('cmd --', { shortStyle: true, compIndex: 5 })).toThrow(/^$/);
      expect(() => parser.parse('cmd ff', { shortStyle: true, compIndex: 5 })).toThrow(/^$/);
    });
  });

  describe('parseAsync', () => {
    it('should handle the completion of a boolean option with async custom completion', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          complete: async () => ['abc'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parseAsync('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a boolean option with async custom completion that throws', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          complete: async () => {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parseAsync('cmd -b ', { compIndex: 7 })).rejects.toThrow(/^$/);
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
      await expect(parser.parseAsync('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a string option with async custom completion that throws', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          complete: async () => {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parseAsync('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^$/);
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
      await expect(parser.parseAsync('cmd -n ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a number option with async custom completion that throws', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          complete: async () => {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parseAsync('cmd -n ', { compIndex: 7 })).rejects.toThrow(/^$/);
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
      await expect(parser.parseAsync('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a strings option with async custom completion that throws', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          complete: async () => {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parseAsync('cmd -ss ', { compIndex: 8 })).rejects.toThrow(/^$/);
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
      await expect(parser.parseAsync('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^abc$/);
    });

    it('should handle the completion of a numbers option with async custom completion that throws', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          complete: async () => {
            throw 'abc';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parseAsync('cmd -ns ', { compIndex: 8 })).rejects.toThrow(/^$/);
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
      await expect(parser.parseAsync('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
    });
  });
});
