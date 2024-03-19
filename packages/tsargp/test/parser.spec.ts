import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser, req, OptionValues, HelpMessage } from '../lib';
import './utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle empty command', () => {
      expect(new ArgumentParser({}).validate().parse('')).toEqual({});
    });

    it('should handle zero arguments', () => {
      expect(new ArgumentParser({}).validate().parse([])).toEqual({});
    });

    it('should throw an error on unknown option name specified in arguments', () => {
      const options = {
        boolean1: {
          type: 'boolean',
          names: ['--boolean1'],
        },
        boolean2: {
          type: 'boolean',
          names: ['--boolean2'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['boo'])).toThrow(/Unknown option boo\./);
      expect(() => parser.parse(['bool'])).toThrow(
        /Unknown option bool. Similar names are \[--boolean1, --boolean2\]\./,
      );
      expect(() => parser.parse(['bool-ean'])).toThrow(
        /Unknown option bool-ean. Similar names are \[--boolean1, --boolean2\]\./,
      );
    });

    it('should throw an error when a required option with no name is not specified', () => {
      const options = {
        required: {
          type: 'boolean',
          required: true,
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).toThrow(/Option is required\./);
    });

    it('should throw an error when a required option is not specified', () => {
      const options = {
        required: {
          type: 'boolean',
          names: ['-b'],
          required: true,
          preferredName: 'preferred',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).toThrow(/Option preferred is required\./);
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

    describe('requires', () => {
      it('should throw an error on option absent despite being required to be present (1)', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: 'required',
          },
          required: {
            type: 'function',
            names: ['-f2'],
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f1'])).toThrow(/Option -f1 requires -f2\./);
        expect(options.required.exec).not.toHaveBeenCalled();
      });

      it('should throw an error on option absent despite being required to be present (2)', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: { required: undefined },
          },
          required: {
            type: 'function',
            names: ['-f2'],
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f1'])).toThrow(/Option -f1 requires -f2\./);
        expect(options.required.exec).not.toHaveBeenCalled();
      });

      it('should throw an error on option absent despite being required to be present (3)', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: req.not({ required: null }),
          },
          required: {
            type: 'function',
            names: ['-f2'],
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f1'])).toThrow(/Option -f1 requires -f2\./);
        expect(options.required.exec).not.toHaveBeenCalled();
      });

      it('should throw an error on option present despite being required to be absent (1)', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: req.not('required'),
          },
          required: {
            type: 'function',
            names: ['-f2'],
            break: true,
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option -f1 requires no -f2\./);
        expect(options.required.exec).not.toHaveBeenCalled();
      });

      it('should throw an error on option present despite being required to be absent (2)', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: { required: null },
          },
          required: {
            type: 'function',
            names: ['-f2'],
            break: true,
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option -f1 requires no -f2\./);
        expect(options.required.exec).not.toHaveBeenCalled();
      });

      it('should throw an error on option present despite being required to be absent (3)', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f1'],
            requires: req.not({ required: undefined }),
          },
          required: {
            type: 'function',
            names: ['-f2'],
            break: true,
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option -f1 requires no -f2\./);
        expect(options.required.exec).not.toHaveBeenCalled();
      });

      it('should throw an error when an option requirement is not satisfied with req.not', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: true,
            requires: req.not({ string: 'a' }),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse([])).not.toThrow();
        expect(() => parser.parse(['1'])).not.toThrow();
        expect(() => parser.parse(['-s', 'b', '1'])).not.toThrow();
        expect(() => parser.parse(['-s', 'a', '1'])).toThrow(/Option -b requires -s != 'a'\./);
      });

      it('should throw an error when an option requirement is not satisfied with req.all', () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: true,
            requires: req.all('flag1', 'flag2'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse([])).not.toThrow();
        expect(() => parser.parse(['1'])).toThrow(/Option -b requires -f1\./);
        expect(() => parser.parse(['-f1', '1'])).toThrow(/Option -b requires -f2\./);
        expect(() => parser.parse(['-f2', '1'])).toThrow(/Option -b requires -f1\./);
        expect(() => parser.parse(['-f1', '-f2', '1'])).not.toThrow();
      });

      it('should throw an error when an option requirement is not satisfied with req.one', () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: true,
            requires: req.one('flag1', 'flag2'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse([])).not.toThrow();
        expect(() => parser.parse(['1'])).toThrow(/Option -b requires \(-f1 or -f2\)\./);
        expect(() => parser.parse(['-f1', '1'])).not.toThrow();
        expect(() => parser.parse(['-f2', '1'])).not.toThrow();
        expect(() => parser.parse(['-f1', '-f2', '1'])).not.toThrow();
      });

      it('should throw an error when an option requirement is not satisfied with an expression', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: {
              string: 'abc',
              number: 123,
              strings: ['a', 'b'],
              numbers: [1, 2],
            },
          },
          string: {
            type: 'string',
            names: ['-s'],
          },
          number: {
            type: 'number',
            names: ['-n'],
          },
          strings: {
            type: 'strings',
            names: ['-ss'],
          },
          numbers: {
            type: 'numbers',
            names: ['-ns'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse([])).not.toThrow();
        expect(() => parser.parse(['-f'])).toThrow(/Option -f requires -s\./);
        expect(() => parser.parse(['-f', '-s', 'a'])).toThrow(/Option -f requires -s = 'abc'\./);
        expect(() => parser.parse(['-f', '-s', 'abc'])).toThrow(/Option -f requires -n\./);
        expect(() => parser.parse(['-f', '-s', 'abc', '-n', '1'])).toThrow(
          /Option -f requires -n = 123\./,
        );
        expect(() => parser.parse(['-f', '-n', '123'])).toThrow(/Option -f requires -s\./);
        expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123'])).toThrow(
          /Option -f requires -ss\./,
        );
        expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a'])).toThrow(
          /Option -f requires -ss = \['a', 'b'\]\./,
        );
        expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b'])).toThrow(
          /Option -f requires -ns\./,
        );
        expect(() =>
          parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1']),
        ).toThrow(/Option -f requires -ns = \[1, 2\]\./);
        expect(() =>
          parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1', '2']),
        ).not.toThrow();
      });

      it('should throw an error when an option requirement is not satisfied with a negated expression', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: req.not({
              string: 'abc',
              number: 123,
              strings: ['a', 'b'],
              numbers: [1, 2],
            }),
          },
          string: {
            type: 'string',
            names: ['-s'],
          },
          number: {
            type: 'number',
            names: ['-n'],
          },
          strings: {
            type: 'strings',
            names: ['-ss'],
          },
          numbers: {
            type: 'numbers',
            names: ['-ns'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse([])).not.toThrow();
        expect(() => parser.parse(['-f'])).not.toThrow();
        expect(() => parser.parse(['-f', '-s', 'a'])).not.toThrow();
        expect(() => parser.parse(['-f', '-s', 'abc'])).not.toThrow();
        expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123'])).not.toThrow();
        expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b'])).not.toThrow();
        expect(() =>
          parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1', '2']),
        ).toThrow(
          /Option -f requires \(-s != 'abc' or -n != 123 or -ss != \['a', 'b'\] or -ns != \[1, 2\]\)\./,
        );
      });
    });

    describe('help', () => {
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

      it('should throw a help message with no usage or footer', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            group: 'Args',
          },
          help: {
            type: 'help',
            names: ['-h'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).not.toHaveProperty('help');
        try {
          parser.parse(['-h']);
        } catch (err) {
          expect((err as HelpMessage).wrap(0)).toMatch(/^Args:\n\n {2}-f\n\nOptions:\n\n {2}-h\n/);
        }
      });

      it('should throw a help message with usage and footer and custom indentation', () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            usage: 'example  usage',
            footer: 'example  footer',
            group: 'example  heading',
            format: { indent: { names: 0 } },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).not.toHaveProperty('help');
        try {
          parser.parse(['-h']);
        } catch (err) {
          expect((err as HelpMessage).wrap(0)).toMatch(
            /^example usage\n\nexample heading:\n\n-h\n\nexample footer\n/,
          );
        }
      });

      it('should throw a help message that does not split texts into words', () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            usage: '  example  usage',
            footer: '  example  footer',
            group: '  example  heading',
            noSplit: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        try {
          parser.parse(['-h']);
        } catch (err) {
          expect((err as HelpMessage).wrap(0)).toMatch(
            /^ {2}example {2}usage\n\n {2}example {2}heading\n\n {2}-h\n\n {2}example {2}footer\n/,
          );
        }
      });
    });

    describe('version', () => {
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

      it('should throw a version message on a version option with fixed version', () => {
        const options = {
          version: {
            type: 'version',
            names: ['-v'],
            version: '0.1.0',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).not.toHaveProperty('version');
        expect(() => parser.parse(['-v'])).toThrow(/^0.1.0$/);
      });
    });

    describe('function', () => {
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

      it('should handle a function option with a callback that throws during completion', () => {
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

      it('should throw an error on function option specified with value', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f='])).toThrow(/Option -f does not accept inline values\./);
        expect(() => parser.parse(['-f=a'])).toThrow(/Option -f does not accept inline values\./);
        expect(options.function.exec).not.toHaveBeenCalled();
      });

      it('should handle a function option', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            exec: vi.fn().mockImplementation(() => 'abc'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ function: undefined });
        expect(options.function.exec).not.toHaveBeenCalled();
        expect(parser.parse(['-f'])).toEqual({ function: 'abc' });
        const anything = expect.anything();
        expect(options.function.exec).toHaveBeenCalledWith(anything, false, anything);
        options.function.exec.mockClear();
        expect(parser.parse(['-f', '-f'])).toEqual({ function: 'abc' });
        expect(options.function.exec).toHaveBeenCalledTimes(2);
      });

      it('should handle a function option that throws', () => {
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
        expect(() => parser.parse(['-f'])).toThrow('abc');
        expect(options.function.exec).toHaveBeenCalled();
      });

      it('should break the parsing loop when a function option explicitly asks so', () => {
        const options = {
          function1: {
            type: 'function',
            names: ['-f1'],
            exec: vi.fn().mockImplementation(() => 'abc'),
            break: true,
          },
          function2: {
            type: 'function',
            names: ['-f2'],
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-f1', '-f2'])).toEqual({ function1: 'abc', function2: undefined });
        expect(options.function1.exec).toHaveBeenCalled();
        expect(options.function2.exec).not.toHaveBeenCalled();
      });

      it('should set default values when breaking the parsing loop', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f1'],
            break: true,
            exec(values) {
              expect((values as OptionValues<typeof options>).flag).toBeTruthy();
            },
          },
          flag: {
            type: 'flag',
            names: ['-f2'],
            default: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-f1'])).toEqual({ function: undefined, flag: true });
      });

      it('should not set default values during parsing', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f1'],
            exec(values) {
              expect((values as OptionValues<typeof options>).flag).toBeUndefined();
            },
          },
          flag: {
            type: 'flag',
            names: ['-f2'],
            default: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-f1'])).toEqual({ function: undefined, flag: true });
      });

      it('should set specified values during parsing', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f1'],
            exec(values) {
              expect((values as OptionValues<typeof options>).flag).toBeTruthy();
            },
          },
          flag: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-f2', '-f1'])).toEqual({ function: undefined, flag: true });
      });

      it('should handle a function option with a default value', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            default: false,
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ function: false });
        expect(options.function.exec).not.toHaveBeenCalled();
      });

      it('should handle a function option with a default callback', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            default: () => false,
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ function: false });
        expect(options.function.exec).not.toHaveBeenCalled();
      });

      it('should handle a function option with an async default callback', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            default: async () => false,
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ function: expect.toResolve(false) });
        expect(options.function.exec).not.toHaveBeenCalled();
      });
    });

    describe('command', () => {
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

      it('should throw an error on command option specified with value', () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {},
            cmd: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-c='])).toThrow(/Option -c does not accept inline values\./);
        expect(() => parser.parse(['-c=a'])).toThrow(/Option -c does not accept inline values\./);
        expect(options.command.cmd).not.toHaveBeenCalled();
      });

      it('should handle a command option', () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {},
            cmd: vi.fn().mockImplementation(() => 'abc'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ command: undefined });
        expect(options.command.cmd).not.toHaveBeenCalled();
        expect(parser.parse(['-c'])).toEqual({ command: 'abc' });
        expect(options.command.cmd).toHaveBeenCalled();
      });

      it('should handle a command option that throws', () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {},
            cmd: vi.fn().mockImplementation(() => {
              throw 'abc';
            }),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-c'])).toThrow('abc');
        expect(options.command.cmd).toHaveBeenCalled();
      });

      it('should set default values before calling a command callback', () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {},
            cmd(values) {
              expect((values as OptionValues<typeof options>).flag).toBeTruthy();
            },
          },
          flag: {
            type: 'flag',
            names: ['-f'],
            default: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-c'])).toEqual({ command: undefined, flag: true });
      });

      it('should handle a command option with options', () => {
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
            cmd: vi.fn().mockImplementation(() => 'abc'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-c'])).toEqual({ command: 'abc' });
        const cmdValues1 = expect.objectContaining({ flag: undefined });
        expect(options.command.cmd).toHaveBeenCalledWith(expect.anything(), cmdValues1);
        options.command.cmd.mockClear();
        expect(parser.parse(['-c', '-f'])).toEqual({ command: 'abc' });
        const cmdValues2 = expect.objectContaining({ flag: true });
        expect(options.command.cmd).toHaveBeenCalledWith(expect.anything(), cmdValues2);
      });

      it('should handle a command option with an options callback', () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: vi.fn().mockImplementation(() => ({
              flag: {
                type: 'flag',
                names: ['-f'],
              },
            })),
            cmd: vi.fn().mockImplementation(() => 'abc'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-c', '-f'])).toEqual({ command: 'abc' });
        expect(options.command.options).toHaveBeenCalled();
        const cmdValues = expect.objectContaining({ flag: true });
        expect(options.command.cmd).toHaveBeenCalledWith(expect.anything(), cmdValues);
      });

      it('should handle a command option with a default value', () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            default: false,
            options: {},
            cmd: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ command: false });
        expect(options.command.cmd).not.toHaveBeenCalled();
      });

      it('should handle a command option with a default callback', () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            default: () => false,
            options: {},
            cmd: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ command: false });
        expect(options.command.cmd).not.toHaveBeenCalled();
      });

      it('should handle a command option with an async default callback', () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            default: async () => false,
            options: {},
            cmd: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ command: expect.toResolve(false) });
        expect(options.command.cmd).not.toHaveBeenCalled();
      });
    });

    describe('flag', () => {
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

      it('should throw an error on flag option specified with value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f='])).toThrow(/Option -f does not accept inline values\./);
        expect(() => parser.parse(['-f=a'])).toThrow(/Option -f does not accept inline values\./);
      });

      it('should handle a flag option with negation names', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ flag: undefined });
        expect(parser.parse(['-f'])).toEqual({ flag: true });
        expect(parser.parse(['-no-f'])).toEqual({ flag: false });
      });

      it('should handle a flag option with an environment variable', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f1'],
            envVar: 'FLAG',
            requires: 'required',
          },
          required: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['FLAG'] = '1';
        expect(() => parser.parse([])).toThrow(/Option -f1 requires -f2\./);
        expect(parser.parse(['-f2'])).toEqual({ flag: true, required: true });
        process.env['FLAG'] = '0';
        expect(() => parser.parse([])).toThrow(/Option -f1 requires -f2\./);
        expect(parser.parse(['-f2'])).toEqual({ flag: false, required: true });
      });

      it('should handle a flag option with a default value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: false,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ flag: false });
      });

      it('should handle a flag option with a default callback', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
            default: () => false,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ flag: false });
      });

      it('should handle a flag option with an async default callback', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
            default: async () => false,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ flag: expect.toResolve(false) });
      });
    });

    describe('boolean', () => {
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

      it('should throw an error on boolean option with a value different than required', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: false },
          },
          required: {
            type: 'boolean',
            names: ['-b'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-b', '1'])).toThrow(/Option -f requires -b = false\./);
      });

      it('should throw an error on boolean option with a value equal to required when negated', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: req.not({ required: false }),
          },
          required: {
            type: 'boolean',
            names: ['-b'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-b', '0'])).toThrow(/Option -f requires -b != false\./);
      });

      it('should ignore required value on boolean option when using an async custom parse', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: false },
          },
          required: {
            type: 'boolean',
            names: ['-b'],
            parse: async () => true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-b', '1'])).not.toThrow();
      });

      it('should throw an error on boolean option with missing parameter', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-b'])).toThrow(/Missing parameter to -b\./);
      });

      it('should throw an error on boolean option with missing parameter after positional marker', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: '--',
            preferredName: 'abc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(/Missing parameter to abc\./);
      });

      it('should throw an error on boolean option with positional marker specified with value', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--='])).toThrow(
          /Positional marker -- does not accept inline values\./,
        );
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker -- does not accept inline values\./,
        );
      });

      it('should handle a boolean option', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ boolean: undefined });
        expect(parser.parse(['-b', ' +0.0 '])).toEqual({ boolean: false });
        expect(parser.parse(['-b', ' 1 '])).toEqual({ boolean: true });
        expect(parser.parse(['--boolean', ''])).toEqual({ boolean: false });
        expect(parser.parse(['-b=1', '-b= False '])).toEqual({ boolean: false });
      });

      it('should handle a boolean option with an environment variable', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            envVar: 'BOOLEAN',
            requires: 'required',
          },
          required: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['BOOLEAN'] = '1';
        expect(() => parser.parse([])).toThrow(/Option -b requires -f\./);
        expect(parser.parse(['-f'])).toEqual({ boolean: true, required: true });
        process.env['BOOLEAN'] = '0';
        expect(() => parser.parse([])).toThrow(/Option -b requires -f\./);
        expect(parser.parse(['-f'])).toEqual({ boolean: false, required: true });
      });

      it('should handle a boolean option with a default value', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            default: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ boolean: true });
      });

      it('should handle a boolean option with a default callback', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            default: () => true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ boolean: true });
      });

      it('should handle a boolean option with an async default callback', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            default: async () => true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ boolean: expect.toResolve(true) });
      });

      it('should handle a boolean option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          boolean: true,
        });
        expect(parser.parse(['-f', '0', '1'])).toEqual({
          flag: true,
          boolean: true,
        });
        expect(parser.parse(['0', '-f', '1'])).toEqual({
          flag: true,
          boolean: true,
        });
        expect(parser.parse(['0', '1', '-f'])).toEqual({
          flag: true,
          boolean: true,
        });
      });

      it('should handle a boolean option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          boolean: true,
        });
        expect(parser.parse(['--', '0', '1'])).toEqual({
          flag: undefined,
          boolean: true,
        });
        expect(parser.parse(['--', '0', '-f'])).toEqual({
          flag: undefined,
          boolean: true,
        });
        expect(parser.parse(['-b', '0', '--', '1'])).toEqual({
          flag: undefined,
          boolean: true,
        });
      });

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
    });

    describe('string', () => {
      it('should throw a name suggestion on parse failure from positional string option', () => {
        const regex = new RegExp(
          `Invalid parameter to -s: 's'\\. Possible values are \\['abc'\\]\\.\n\n` +
            `Did you mean to specify an option name instead of s\\? Similar names are \\[-s\\]\\.`,
        );
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            enums: ['abc'],
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['s'])).toThrow(regex);
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

      it('should throw an error on string option with a value different than required', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: '0' },
          },
          required: {
            type: 'string',
            names: ['-s'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-s', '1'])).toThrow(/Option -f requires -s = '0'\./);
      });

      it('should throw an error on string option with a value equal to required when negated', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: req.not({ required: '0' }),
          },
          required: {
            type: 'string',
            names: ['-s'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-s', '0'])).toThrow(/Option -f requires -s != '0'\./);
      });

      it('should ignore required value on string option when using an async custom parse', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: '0' },
          },
          required: {
            type: 'string',
            names: ['-s'],
            parse: async () => '1',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-s', '1'])).not.toThrow();
      });

      it('should throw an error on string option with missing parameter', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-s'])).toThrow(/Missing parameter to -s\./);
      });

      it('should throw an error on string option with missing parameter after positional marker', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            positional: '--',
            preferredName: 'abc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(/Missing parameter to abc\./);
      });

      it('should throw an error on string option with positional marker specified with value', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--='])).toThrow(
          /Positional marker -- does not accept inline values\./,
        );
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker -- does not accept inline values\./,
        );
      });

      it('should handle a string option', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ string: undefined });
        expect(parser.parse(['-s', '123'])).toEqual({ string: '123' });
        expect(parser.parse(['--string', ''])).toEqual({ string: '' });
        expect(parser.parse(['-s=1', '-s==2'])).toEqual({ string: '=2' });
      });

      it('should throw an error on string option with env. variable that fails validation', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            envVar: 'STRING',
            regex: /\d+/s,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['STRING'] = 'abc';
        expect(() => parser.parse([])).toThrow(
          /Invalid parameter to STRING: 'abc'\. Value must match the regex \/\\d\+\/s\./,
        );
      });

      it('should handle a string option with an environment variable', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            envVar: 'STRING',
            requires: 'required',
          },
          required: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['STRING'] = '123';
        expect(() => parser.parse([])).toThrow(/Option -s requires -f\./);
        expect(parser.parse(['-f'])).toEqual({ string: '123', required: true });
      });

      it('should handle a string option with a default value', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            default: '123',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ string: '123' });
      });

      it('should handle a string option with a default callback', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            default: () => '123',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ string: '123' });
      });

      it('should handle a string option with an async default callback', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            default: async () => '123',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ string: expect.toResolve('123') });
      });

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
      });

      it('should throw an error on string value not matching regex', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            regex: /\d+/s,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
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
      });

      it('should handle a string option with trimming normalization', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            trim: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-s', ' one '])).toEqual({ string: 'one' });
      });

      it('should handle a string option with lowercase normalization', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            case: 'lower',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-s', 'OnE'])).toEqual({ string: 'one' });
      });

      it('should handle a string option with uppercase normalization', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            case: 'upper',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-s', 'oNe'])).toEqual({ string: 'ONE' });
      });

      it('should throw an error on string value not in enumeration', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-s', 'abc'])).toThrow(
          /Invalid parameter to -s: 'abc'\. Possible values are \['one', 'two'\]\./,
        );
      });

      it('should handle a string option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          string: {
            type: 'string',
            names: ['-s'],
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          string: '1',
        });
        expect(parser.parse(['-f', '0', '1'])).toEqual({
          flag: true,
          string: '1',
        });
        expect(parser.parse(['0', '-f', '1'])).toEqual({
          flag: true,
          string: '1',
        });
        expect(parser.parse(['0', '1', '-f'])).toEqual({
          flag: true,
          string: '1',
        });
      });

      it('should handle a string option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          string: {
            type: 'string',
            names: ['-s'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          string: '1',
        });
        expect(parser.parse(['--', '0', '1'])).toEqual({
          flag: undefined,
          string: '1',
        });
        expect(parser.parse(['--', '0', '-f'])).toEqual({
          flag: undefined,
          string: '-f',
        });
        expect(parser.parse(['-s', '0', '--', '1'])).toEqual({
          flag: undefined,
          string: '1',
        });
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
    });

    describe('number', () => {
      it('should throw a name suggestion on parse failure from positional number option', () => {
        const regex = new RegExp(
          `Invalid parameter to -n: 1\\. Possible values are \\[123\\]\\.\n\n` +
            `Did you mean to specify an option name instead of 1\\?`,
        );
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [123],
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['1'])).toThrow(regex);
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

      it('should throw an error on number option with a value different than required', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 0 },
          },
          required: {
            type: 'number',
            names: ['-n'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-n', '1'])).toThrow(/Option -f requires -n = 0\./);
      });

      it('should throw an error on number option with a value equal to required when negated', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: req.not({ required: 0 }),
          },
          required: {
            type: 'number',
            names: ['-n'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-n', '0'])).toThrow(/Option -f requires -n != 0\./);
      });

      it('should ignore required value on number option when using an async custom parse', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: 0 },
          },
          required: {
            type: 'number',
            names: ['-n'],
            parse: async () => 1,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-n', '1'])).not.toThrow();
      });

      it('should throw an error on number option with missing parameter', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-n'])).toThrow(/Missing parameter to -n\./);
      });

      it('should throw an error on number option with missing parameter after positional marker', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            positional: '--',
            preferredName: 'abc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(/Missing parameter to abc\./);
      });

      it('should throw an error on number option with positional marker specified with value', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--='])).toThrow(
          /Positional marker -- does not accept inline values\./,
        );
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker -- does not accept inline values\./,
        );
      });

      it('should handle a number option', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ number: undefined });
        expect(parser.parse(['-n', '123'])).toEqual({ number: 123 });
        expect(parser.parse(['--number', '0'])).toEqual({ number: 0 });
        expect(parser.parse(['-n=1', '-n=2'])).toEqual({ number: 2 });
      });

      it('should throw an error on number option with env. variable that fails validation', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            envVar: 'NUMBER',
            range: [0, Infinity],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['NUMBER'] = '-3';
        expect(() => parser.parse([])).toThrow(
          /Invalid parameter to NUMBER: -3\. Value must be in the range \[0, Infinity\]\./,
        );
      });

      it('should handle a number option with an environment variable', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            envVar: 'NUMBER',
            requires: 'required',
          },
          required: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['NUMBER'] = '123';
        expect(() => parser.parse([])).toThrow(/Option -n requires -f\./);
        expect(parser.parse(['-f'])).toEqual({ number: 123, required: true });
      });

      it('should handle a number option with a default value', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            default: 123,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ number: 123 });
      });

      it('should handle a number option with a default callback', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            default: () => 123,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ number: 123 });
      });

      it('should handle a number option with an async default callback', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            default: async () => 123,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ number: expect.toResolve(123) });
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
      });

      it('should throw an error on number value not in range', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            range: [0, Infinity],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
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
      });

      it('should throw an error on number value not in enumeration', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            enums: [1, 2],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-n', '3'])).toThrow(
          /Invalid parameter to -n: 3\. Possible values are \[1, 2\]\./,
        );
      });

      it('should handle a number option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          number: {
            type: 'number',
            names: ['-s'],
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          number: 1,
        });
        expect(parser.parse(['-f', '0', '1'])).toEqual({
          flag: true,
          number: 1,
        });
        expect(parser.parse(['0', '-f', '1'])).toEqual({
          flag: true,
          number: 1,
        });
        expect(parser.parse(['0', '1', '-f'])).toEqual({
          flag: true,
          number: 1,
        });
      });

      it('should handle a number option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          number: {
            type: 'number',
            names: ['-n'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          number: 1,
        });
        expect(parser.parse(['--', '0', '1'])).toEqual({
          flag: undefined,
          number: 1,
        });
        expect(parser.parse(['--', '0', '-f'])).toEqual({
          flag: undefined,
          number: NaN,
        });
        expect(parser.parse(['-n', '0', '--', '1'])).toEqual({
          flag: undefined,
          number: 1,
        });
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

      it('should handle a number option with truncation', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'trunc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-n', '0.1'])).toEqual({ number: 0 });
        expect(parser.parse(['-n', '0.5'])).toEqual({ number: 0 });
        expect(parser.parse(['-n', '0.9'])).toEqual({ number: 0 });
        expect(parser.parse(['-n', '-.1'])).toEqual({ number: -0 });
        expect(parser.parse(['-n', '-.5'])).toEqual({ number: -0 });
        expect(parser.parse(['-n', '-.9'])).toEqual({ number: -0 });
      });

      it('should handle a number option with ceil rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'ceil',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-n', '0.1'])).toEqual({ number: 1 });
        expect(parser.parse(['-n', '0.5'])).toEqual({ number: 1 });
        expect(parser.parse(['-n', '0.9'])).toEqual({ number: 1 });
        expect(parser.parse(['-n', '-.1'])).toEqual({ number: -0 });
        expect(parser.parse(['-n', '-.5'])).toEqual({ number: -0 });
        expect(parser.parse(['-n', '-.9'])).toEqual({ number: -0 });
      });

      it('should handle a number option with floor rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'floor',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-n', '0.1'])).toEqual({ number: 0 });
        expect(parser.parse(['-n', '0.5'])).toEqual({ number: 0 });
        expect(parser.parse(['-n', '0.9'])).toEqual({ number: 0 });
        expect(parser.parse(['-n', '-.1'])).toEqual({ number: -1 });
        expect(parser.parse(['-n', '-.5'])).toEqual({ number: -1 });
        expect(parser.parse(['-n', '-.9'])).toEqual({ number: -1 });
      });

      it('should handle a number option with nearest rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'round',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-n', '0.1'])).toEqual({ number: 0 });
        expect(parser.parse(['-n', '0.5'])).toEqual({ number: 1 });
        expect(parser.parse(['-n', '0.9'])).toEqual({ number: 1 });
        expect(parser.parse(['-n', '-.1'])).toEqual({ number: -0 });
        expect(parser.parse(['-n', '-.5'])).toEqual({ number: -0 });
        expect(parser.parse(['-n', '-.9'])).toEqual({ number: -1 });
      });
    });

    describe('strings', () => {
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

      it('should throw an error on strings option with a value different than required', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: ['0', '1'] },
          },
          required: {
            type: 'strings',
            names: ['-ss'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-ss', '1'])).toThrow(
          /Option -f requires -ss = \['0', '1'\]\./,
        );
      });

      it('should throw an error on strings option with a value equal to required when negated', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: req.not({ required: ['0', '1'] }),
          },
          required: {
            type: 'strings',
            names: ['-ss'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-ss', '0', '1'])).toThrow(
          /Option -f requires -ss != \['0', '1'\]\./,
        );
      });

      it('should ignore required value on strings option when using an async custom parse', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: ['0'] },
          },
          required: {
            type: 'strings',
            names: ['-ss'],
            parse: async () => '1',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-ss', '1'])).not.toThrow();
      });

      it('should throw an error on strings option with missing parameter', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-ss'])).toThrow(/Missing parameter to -ss\./);
      });

      it('should throw an error on strings option with missing parameter after positional marker', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            separator: ',',
            positional: '--',
            preferredName: 'abc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(/Missing parameter to abc\./);
      });

      it('should throw an error on strings option with positional marker specified with value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--='])).toThrow(
          /Positional marker -- does not accept inline values\./,
        );
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker -- does not accept inline values\./,
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

      it('should throw a name suggestion on parse failure from variadic strings option', () => {
        const regex = new RegExp(
          `Option -ss has too many values \\(1\\)\\. Should have at most 0\\.\n\n` +
            `Did you mean to specify an option name instead of ss\\? Similar names are \\[-ss\\]\\.`,
        );
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            limit: 0,
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['ss'])).toThrow(regex);
        expect(() => parser.parse(['-ss', 'ss'])).toThrow(regex);
      });

      it('should handle a strings option that can be specified multiple times', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            append: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ strings: undefined });
        expect(parser.parse(['-ss', '123', '456'])).toEqual({ strings: ['123', '456'] });
        expect(parser.parse(['--strings'])).toEqual({ strings: [] });
        expect(parser.parse(['--strings', '   '])).toEqual({ strings: ['   '] });
        expect(parser.parse(['-ss=123', '-ss==456'])).toEqual({ strings: ['123', '=456'] });
        expect(parser.parse(['-ss', 'a', 'b', '-ss', 'c', 'd'])).toEqual({
          strings: ['a', 'b', 'c', 'd'],
        });
      });

      it('should throw an error on strings option with env. variable that fails validation', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            envVar: 'STRINGS',
            separator: ',',
            regex: /\d+/s,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['STRINGS'] = '123,abc';
        expect(() => parser.parse([])).toThrow(
          /Invalid parameter to STRINGS: 'abc'\. Value must match the regex \/\\d\+\/s\./,
        );
      });

      it('should handle a strings option with an environment variable', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            envVar: 'STRINGS',
            separator: ',',
            case: 'upper',
            requires: 'required',
          },
          required: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['STRINGS'] = 'one,two';
        expect(() => parser.parse([])).toThrow(/Option -ss requires -f\./);
        expect(parser.parse(['-f'])).toEqual({ strings: ['ONE', 'TWO'], required: true });
      });

      it('should handle a strings option with a default value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            default: ['one', 'two'],
            case: 'upper',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ strings: ['ONE', 'TWO'] });
      });

      it('should handle a strings option with a default callback', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            default: () => ['one', 'two'],
            case: 'upper',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ strings: ['ONE', 'TWO'] });
      });

      it('should handle a strings option with an async default callback', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            default: async () => ['one', 'two'],
            case: 'upper',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ strings: expect.toResolve(['ONE', 'TWO']) });
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
      });

      it('should handle a strings option specified with multiple parameters', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
          },
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ss', 'one', 'two'])).toMatchObject({ strings: ['one', 'two'] });
        expect(parser.parse(['-ss', 'one', 'two', '-f'])).toMatchObject({
          strings: ['one', 'two'],
        });
        expect(parser.parse(['-ss', 'one', 'two', '-ss', 'one=two', 'one'])).toMatchObject({
          strings: ['one=two', 'one'],
        });
      });

      it('should throw an error on strings value not matching regex', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            regex: /\d+/s,
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-ss', '123,abc'])).toThrow(
          /Invalid parameter to -ss: 'abc'\. Value must match the regex \/\\d\+\/s\./,
        );
      });

      it('should handle a strings option with trimming normalization', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            trim: true,
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ss', ' one, two '])).toEqual({ strings: ['one', 'two'] });
      });

      it('should handle a strings option with lowercase normalization', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            case: 'lower',
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ss', 'OnE,T O.'])).toEqual({ strings: ['one', 't o.'] });
      });

      it('should handle a strings option with uppercase normalization', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            case: 'upper',
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ss', 'o?Ne,2ki'])).toEqual({ strings: ['O?NE', '2KI'] });
      });

      it('should throw an error on strings value not in enumeration', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            enums: ['one', 'two'],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-ss', 'abc'])).toThrow(
          /Invalid parameter to -ss: 'abc'\. Possible values are \['one', 'two'\]\./,
        );
      });

      it('should handle a strings option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          strings: {
            type: 'strings',
            names: ['-ss'],
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          strings: ['0', '1'],
        });
        expect(parser.parse(['-f', '0', '1'])).toEqual({
          flag: true,
          strings: ['0', '1'],
        });
        expect(parser.parse(['0', '-f', '1'])).toEqual({
          flag: true,
          strings: ['1'],
        });
        expect(parser.parse(['0', '1', '-f'])).toEqual({
          flag: true,
          strings: ['0', '1'],
        });
      });

      it('should handle a strings option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          strings: {
            type: 'strings',
            names: ['-ss'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          strings: ['0', '1'],
        });
        expect(parser.parse(['--', '0', '1'])).toEqual({
          flag: undefined,
          strings: ['0', '1'],
        });
        expect(parser.parse(['--', '0', '-f'])).toEqual({
          flag: undefined,
          strings: ['0', '-f'],
        });
        expect(parser.parse(['-ss', '0', '--', '1'])).toEqual({
          flag: undefined,
          strings: ['1'],
        });
        expect(parser.parse(['--'])).toEqual({
          flag: undefined,
          strings: [],
        });
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
    });

    describe('numbers', () => {
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

      it('should throw an error on numbers option with a value different than required', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: [0, 1] },
          },
          required: {
            type: 'numbers',
            names: ['-ns'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-ns', '1'])).toThrow(
          /Option -f requires -ns = \[0, 1\]\./,
        );
      });

      it('should throw an error on numbers option with a value equal to required when negated', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: req.not({ required: [0, 1] }),
          },
          required: {
            type: 'numbers',
            names: ['-ns'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-ns', '0', '1'])).toThrow(
          /Option -f requires -ns != \[0, 1\]\./,
        );
      });

      it('should ignore required value on numbers option when using an async custom parse', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: { required: [0] },
          },
          required: {
            type: 'numbers',
            names: ['-ns'],
            parse: async () => 1,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f', '-ns', '1'])).not.toThrow();
      });

      it('should throw an error on numbers option with missing parameter', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-ns'])).toThrow(/Missing parameter to -ns\./);
      });

      it('should throw an error on numbers option with missing parameter after positional marker', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            separator: ',',
            positional: '--',
            preferredName: 'abc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(/Missing parameter to abc\./);
      });

      it('should throw an error on numbers option with positional marker specified with value', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--='])).toThrow(
          /Positional marker -- does not accept inline values\./,
        );
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker -- does not accept inline values\./,
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

      it('should throw a name suggestion on parse failure from variadic numbers option', () => {
        const regex = new RegExp(
          `Option -ns has too many values \\(1\\)\\. Should have at most 0\\.\n\n` +
            `Did you mean to specify an option name instead of ns\\? Similar names are \\[-ns\\]\\.`,
        );
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            limit: 0,
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['ns'])).toThrow(regex);
        expect(() => parser.parse(['-ns', 'ns'])).toThrow(regex);
      });

      it('should handle a numbers option that can be specified multiple times', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            append: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ numbers: undefined });
        expect(parser.parse(['-ns', '456', ' 123 '])).toEqual({ numbers: [456, 123] });
        expect(parser.parse(['--numbers'])).toEqual({ numbers: [] });
        expect(parser.parse(['--numbers', '   '])).toEqual({ numbers: [0] });
        expect(parser.parse(['-ns=456', '-ns=123'])).toEqual({ numbers: [456, 123] });
        expect(parser.parse(['-ns', '5', '-ns', '6', '7'])).toEqual({ numbers: [5, 6, 7] });
      });

      it('should throw an error on numbers option with env. variable that fails validation', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            envVar: 'NUMBERS',
            separator: ',',
            range: [0, Infinity],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['NUMBERS'] = '1,-3';
        expect(() => parser.parse([])).toThrow(
          /Invalid parameter to NUMBERS: -3\. Value must be in the range \[0, Infinity\]\./,
        );
      });

      it('should handle a numbers option with an environment variable', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            envVar: 'NUMBERS',
            separator: ',',
            round: 'trunc',
            requires: 'required',
          },
          required: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        process.env['NUMBERS'] = '1.1,2.2';
        expect(() => parser.parse([])).toThrow(/Option -ns requires -f\./);
        expect(parser.parse(['-f'])).toEqual({ numbers: [1, 2], required: true });
      });

      it('should handle a numbers option with a default value', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            default: [1.1, 2.2],
            round: 'trunc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ numbers: [1, 2] });
      });

      it('should handle a numbers option with a default callback', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            default: () => [1.1, 2.2],
            round: 'trunc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ numbers: [1, 2] });
      });

      it('should handle a numbers option with an async default callback', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            default: async () => [1.1, 2.2],
            round: 'trunc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toEqual({ numbers: expect.toResolve([1, 2]) });
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
      });

      it('should handle a numbers option specified with multiple parameters', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
          },
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ns', '1', '2'])).toMatchObject({ numbers: [1, 2] });
        expect(parser.parse(['-ns', '1', '2', '-f'])).toMatchObject({ numbers: [1, 2] });
        expect(parser.parse(['-ns', '1', '2', '-ns', '2', '1'])).toMatchObject({ numbers: [2, 1] });
      });

      it('should throw an error on numbers value not in range', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            range: [0, Infinity],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-ns', '1,-3'])).toThrow(
          /Invalid parameter to -ns: -3\. Value must be in the range \[0, Infinity\]\./,
        );
        expect(() => parser.parse(['-ns', 'a'])).toThrow(
          /Invalid parameter to -ns: NaN\. Value must be in the range \[0, Infinity\]\./,
        );
      });

      it('should throw an error on numbers value not in enumeration', () => {
        const options = {
          numbers: {
            names: ['-ns'],
            type: 'numbers',
            enums: [1, 2],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-ns', '1,3'])).toThrow(
          /Invalid parameter to -ns: 3\. Possible values are \[1, 2\]\./,
        );
      });

      it('should handle a numbers option with positional arguments', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            positional: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          numbers: [0, 1],
        });
        expect(parser.parse(['-f', '0', '1'])).toEqual({
          flag: true,
          numbers: [0, 1],
        });
        expect(parser.parse(['0', '-f', '1'])).toEqual({
          flag: true,
          numbers: [1],
        });
        expect(parser.parse(['0', '1', '-f'])).toEqual({
          flag: true,
          numbers: [0, 1],
        });
      });

      it('should handle a numbers option with positional arguments after marker', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['0', '1'])).toEqual({
          flag: undefined,
          numbers: [0, 1],
        });
        expect(parser.parse(['--', '0', '1'])).toEqual({
          flag: undefined,
          numbers: [0, 1],
        });
        expect(parser.parse(['--', '0', '-f'])).toEqual({
          flag: undefined,
          numbers: [0, NaN],
        });
        expect(parser.parse(['-ns', '0', '--', '1'])).toEqual({
          flag: undefined,
          numbers: [1],
        });
        expect(parser.parse(['--'])).toEqual({
          flag: undefined,
          numbers: [],
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
              const res = value
                .split(',')
                .flatMap((val) => val.split('|').map((val) => Number(val)));
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

      it('should handle a numbers option with truncation', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'trunc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ns', '0.1', '-.1'])).toEqual({ numbers: [0, -0] });
        expect(parser.parse(['-ns', '0.5', '-.5'])).toEqual({ numbers: [0, -0] });
        expect(parser.parse(['-ns', '0.9', '-.9'])).toEqual({ numbers: [0, -0] });
      });

      it('should handle a numbers option with ceil rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'ceil',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ns', '0.1', '-.1'])).toEqual({ numbers: [1, -0] });
        expect(parser.parse(['-ns', '0.5', '-.5'])).toEqual({ numbers: [1, -0] });
        expect(parser.parse(['-ns', '0.9', '-.9'])).toEqual({ numbers: [1, -0] });
      });

      it('should handle a numbers option with floor rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'floor',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ns', '0.1', '-.1'])).toEqual({ numbers: [0, -1] });
        expect(parser.parse(['-ns', '0.5', '-.5'])).toEqual({ numbers: [0, -1] });
        expect(parser.parse(['-ns', '0.9', '-.9'])).toEqual({ numbers: [0, -1] });
      });

      it('should handle a numbers option with nearest rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'round',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ns', '0.1', '-.1'])).toEqual({ numbers: [0, -0] });
        expect(parser.parse(['-ns', '0.5', '-.5'])).toEqual({ numbers: [1, -0] });
        expect(parser.parse(['-ns', '0.9', '-.9'])).toEqual({ numbers: [1, -1] });
      });
    });
  });

  describe('parseInto', () => {
    it('should handle a class instance with previous values and no default', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const values = new (class {
        flag = false;
      })();
      new ArgumentParser(options).parseInto(values, []);
      expect(values).toEqual({ flag: false });
    });

    it('should handle a class instance with previous values and a default', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          default: true,
        },
      } as const satisfies Options;
      const values = new (class {
        flag = false;
      })();
      new ArgumentParser(options).parseInto(values, []);
      expect(values).toEqual({ flag: true });
    });
  });
});

describe('parseAsync', () => {
  it('should throw a version message on a version option with a resolve function', async () => {
    const options = {
      function: {
        type: 'version',
        names: ['-v'],
        resolve: (str) => `file://${import.meta.dirname}/${str}`,
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    await expect(parser.parseAsync(['-v'])).rejects.toThrow(/^0.1.0$/);
  });

  it('should throw an error on a version option that cannot resolve a package.json file', async () => {
    const options = {
      function: {
        type: 'version',
        names: ['-v'],
        resolve: () => `file:///abc`,
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    await expect(parser.parseAsync(['-v'])).rejects.toThrow(
      /Could not find a "package.json" file\./,
    );
  });

  it('should handle a function option with an asynchronous callback', async () => {
    const options = {
      function: {
        type: 'function',
        names: ['-f'],
        exec: async () => 'abc',
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    await expect(parser.parseAsync(['-f'])).resolves.toEqual({ function: 'abc' });
  });

  it('should handle a function option with an asynchronous callback that throws', async () => {
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
    await expect(parser.parseAsync(['-f'])).rejects.toThrow(/^abc$/);
  });

  it('should handle a command option with an asynchronous callback', async () => {
    const options = {
      command: {
        type: 'command',
        names: ['-c'],
        cmd: async () => 'abc',
        options: {},
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    await expect(parser.parseAsync(['-c'])).resolves.toEqual({ command: 'abc' });
  });

  it('should handle a command option with an asynchronous callback that throws', async () => {
    const options = {
      command: {
        type: 'command',
        names: ['-c'],
        async cmd() {
          throw 'abc';
        },
        options: {},
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    await expect(parser.parseAsync(['-c'])).rejects.toThrow(/^abc$/);
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

describe('doParse', () => {
  it('should output a warning on a deprecated option', () => {
    const options = {
      flag: {
        type: 'flag',
        names: ['-f'],
        deprecated: 'yes',
      },
    } as const satisfies Options;
    const values = { flag: undefined };
    const parser = new ArgumentParser(options);
    const { warnings } = parser.doParse(values, ['-f', '-f']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toHaveProperty(
      'message',
      expect.stringMatching(/Option -f is deprecated and may be removed in future releases\./),
    );
  });
});

describe('tryParse', () => {
  it('should output an error on parse failure', async () => {
    const options = {
      flag: {
        type: 'flag',
        names: ['-f'],
        required: true,
      },
    } as const satisfies Options;
    const values = { flag: false };
    const parser = new ArgumentParser(options);
    await expect(parser.tryParse(values, [])).resolves.toHaveProperty(
      'message',
      expect.stringMatching(/Option -f is required\./),
    );
  });

  it('should output a warning on a single deprecated option', async () => {
    const options = {
      flag: {
        type: 'flag',
        names: ['-f'],
        deprecated: 'yes',
      },
    } as const satisfies Options;
    const values = { flag: undefined };
    const parser = new ArgumentParser(options);
    await expect(parser.tryParse(values, ['-f', '-f'])).resolves.toHaveProperty(
      'message',
      expect.stringMatching(/Option -f is deprecated and may be removed in future releases\./),
    );
  });

  it('should output a warning on multiple deprecated options', async () => {
    const options = {
      flag1: {
        type: 'flag',
        names: ['-f1'],
        deprecated: 'yes',
      },
      flag2: {
        type: 'flag',
        names: ['-f2'],
        deprecated: 'yes',
      },
    } as const satisfies Options;
    const values = { flag1: undefined, flag2: undefined };
    const parser = new ArgumentParser(options);
    await expect(parser.tryParse(values, ['-f1', '-f2'])).resolves.toHaveProperty(
      'message',
      expect.stringMatching(
        new RegExp(
          'Option -f1 is deprecated and may be removed in future releases.\n' +
            'Option -f2 is deprecated and may be removed in future releases.',
        ),
      ),
    );
  });
});
