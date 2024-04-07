import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser, OptionValues } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('validate', () => {
    it('should validate', () => {
      expect(new ArgumentParser({}).validate()).toEqual({});
    });
  });

  describe('parse', () => {
    it('should handle no arguments', async () => {
      await expect(new ArgumentParser({}).parse('')).resolves.toEqual({});
      await expect(new ArgumentParser({}).parse([])).resolves.toEqual({});
    });

    it('should throw an error on unknown option name specified in arguments', async () => {
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
      await expect(parser.parse(['boo'])).rejects.toThrow(`Unknown option boo.`);
      await expect(parser.parse(['bool'])).rejects.toThrow(
        `Unknown option bool. Similar names are: --boolean1, --boolean2.`,
      );
      await expect(parser.parse(['bool-ean'])).rejects.toThrow(
        `Unknown option bool-ean. Similar names are: --boolean1, --boolean2.`,
      );
    });

    it('should throw an error when a required option is not specified', async () => {
      const options = {
        required: {
          type: 'boolean',
          names: ['-b'],
          required: true,
          preferredName: 'preferred',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).rejects.toThrow(`Option preferred is required.`);
    });

    describe('help', () => {
      it('should save a help message when a help option asks so', async () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            sections: [{ type: 'groups' }],
            saveMessage: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ help: undefined });
        await expect(parser.parse(['-h'])).resolves.toEqual({
          help: expect.objectContaining({ message: expect.stringMatching(/^ {2}-h$/) }),
        });
      });

      it('should throw a help message with default settings', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            group: 'Args:',
          },
          help: {
            type: 'help',
            names: ['-h'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.not.toHaveProperty('help');
        await expect(parser.parse(['-h'], { progName: 'prog' })).rejects.toThrow(
          `Usage:\n\n  prog [-f] [-h]\n\nArgs:\n\n  -f\n\nOptions:\n\n  -h`,
        );
      });

      it('should throw a help message with usage and custom indentation', async () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            group: 'group  heading',
            sections: [
              { type: 'usage', title: 'usage  heading' },
              { type: 'groups', noWrap: true },
            ],
            format: { names: { indent: 0 } },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.not.toHaveProperty('help');
        await expect(parser.parse(['-h'], { progName: 'prog' })).rejects.toThrow(
          `usage heading\n\nprog [-h]\n\ngroup  heading\n\n-h`,
        );
      });

      it('should throw a help message with filtered options', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f', '--flag'],
          },
          flag2: {
            type: 'flag',
            desc: 'A flag option',
          },
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
          },
          help: {
            type: 'help',
            names: ['-h'],
            sections: [{ type: 'groups' }],
            useFilter: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-h', '-F', '-B'])).rejects.toThrow(
          `  -f, --flag\n  -b, --boolean  <boolean>`,
        );
      });

      it('should throw the help message of a nested command with filter', async () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            sections: [{ type: 'groups' }],
            useFilter: true,
            useNested: true,
          },
          command1: {
            type: 'command',
            names: ['cmd1'],
            options: {
              flag: {
                type: 'flag',
                names: ['-f'],
              },
            },
          },
          command2: {
            type: 'command',
            names: ['cmd2'],
            options: {
              flag: {
                type: 'flag',
                names: ['-f'],
              },
              help: {
                type: 'help',
                names: ['-h'],
                sections: [{ type: 'groups' }],
                useFilter: true,
              },
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-h', '-h'])).rejects.toThrow('  -h');
        await expect(parser.parse(['-h', 'cmd1'])).rejects.toThrow('  cmd1  ...');
        await expect(parser.parse(['-h', 'cmd2'])).rejects.toThrow('  -f\n  -h');
        await expect(parser.parse(['-h', 'cmd2', '-f'])).rejects.toThrow('  -f');
      });
    });

    describe('version', () => {
      it('should save a version message when a version option asks so', async () => {
        const options = {
          version: {
            type: 'version',
            names: ['-v'],
            version: '0.1.0',
            saveMessage: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ version: undefined });
        await expect(parser.parse(['-v'])).resolves.toEqual({ version: '0.1.0' });
      });

      it('should throw a version message on a version option with fixed version', async () => {
        const options = {
          version: {
            type: 'version',
            names: ['-v'],
            version: '0.1.0',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.not.toHaveProperty('version');
        await expect(parser.parse(['-v'])).rejects.toThrow(/^0.1.0$/);
      });

      it('should throw a version message on a version option with a resolve function', async () => {
        const options = {
          version: {
            type: 'version',
            names: ['-v'],
            resolve: (str) => `file://${import.meta.dirname}/${str}`,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-v'])).rejects.toThrow(/^0.1.0$/);
      });

      it('should throw an error on a version option that cannot resolve a package.json file', async () => {
        const options = {
          version: {
            type: 'version',
            names: ['-v'],
            resolve: () => `file:///abc`,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-v'])).rejects.toThrow(`Could not find a "package.json" file.`);
      });
    });

    describe('function', () => {
      it('should handle a function option with an asynchronous callback', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            exec: async () => 'abc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f'])).resolves.toEqual({ function: 'abc' });
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
        await expect(parser.parse(['-f'])).rejects.toThrow('abc');
      });

      it('should skip a certain number of remaining arguments', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f1'],
          },
          function: {
            type: 'function',
            names: ['-f2'],
            exec() {
              this.skipCount = 1;
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2', 'skipped', '-f1'])).resolves.toEqual({
          flag: true,
          function: undefined,
        });
      });

      it('should not skip any argument when the skip count is negative', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f1'],
          },
          function: {
            type: 'function',
            names: ['-f2'],
            exec() {
              this.skipCount = -1;
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2', 'arg', '-f1'])).rejects.toThrow('Unknown option arg.');
      });

      it('should throw an error on function option specified with value', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f='])).rejects.toThrow(
          `Option -f does not accept inline parameters.`,
        );
        await expect(parser.parse(['-f=a'])).rejects.toThrow(
          `Option -f does not accept inline parameters.`,
        );
        expect(options.function.exec).not.toHaveBeenCalled();
      });

      it('should handle a function option', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            exec: vi.fn().mockImplementation(() => 'abc'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ function: undefined });
        expect(options.function.exec).not.toHaveBeenCalled();
        await expect(parser.parse(['-f'])).resolves.toEqual({ function: 'abc' });
        expect(options.function.exec).toHaveBeenCalledWith({
          // should have been { function: undefined } at the time of call
          values: { function: 'abc' },
          index: 0,
          name: '-f',
          param: [],
          comp: false,
        });
        options.function.exec.mockClear();
        await expect(parser.parse(['-f', '-f'])).resolves.toEqual({ function: 'abc' });
        expect(options.function.exec).toHaveBeenCalledWith({
          // should have been { function: undefined } at the time of call
          values: { function: 'abc' },
          index: 0,
          name: '-f',
          param: ['-f'],
          comp: false,
        });
        expect(options.function.exec).toHaveBeenCalledTimes(2);
      });

      it('should handle a function option that throws', async () => {
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
        await expect(parser.parse(['-f'])).rejects.toThrow('abc');
        expect(options.function.exec).toHaveBeenCalled();
      });

      it('should break the parsing loop when a function option explicitly asks so', async () => {
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
        await expect(parser.parse(['-f1', '-f2'])).resolves.toEqual({
          function1: 'abc',
          function2: undefined,
        });
        expect(options.function1.exec).toHaveBeenCalled();
        expect(options.function2.exec).not.toHaveBeenCalled();
      });

      it('should set specified values during parsing', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f1'],
            exec({ values }) {
              expect((values as OptionValues<typeof options>).flag).toBeTruthy();
            },
          },
          flag: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2', '-f1'])).resolves.toEqual({
          function: undefined,
          flag: true,
        });
      });
    });

    describe('command', () => {
      it('should handle a command option with an asynchronous callback', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            exec: async () => 'abc',
            options: {},
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c'])).resolves.toEqual({ command: 'abc' });
      });

      it('should handle a command option with an asynchronous callback that throws', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            async exec() {
              throw 'abc';
            },
            options: {},
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c'])).rejects.toThrow('abc');
      });

      it('should throw an error on command option specified with value', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {},
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c='])).rejects.toThrow(
          `Option -c does not accept inline parameters.`,
        );
        await expect(parser.parse(['-c=a'])).rejects.toThrow(
          `Option -c does not accept inline parameters.`,
        );
        expect(options.command.exec).not.toHaveBeenCalled();
      });

      it('should handle a command option', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {},
            exec: vi.fn().mockImplementation(() => 'abc'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ command: undefined });
        expect(options.command.exec).not.toHaveBeenCalled();
        await expect(parser.parse(['-c'])).resolves.toEqual({ command: 'abc' });
        expect(options.command.exec).toHaveBeenCalled();
      });

      it('should handle a command option that throws', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {},
            exec: vi.fn().mockImplementation(() => {
              throw 'abc';
            }),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c'])).rejects.toThrow('abc');
        expect(options.command.exec).toHaveBeenCalled();
      });

      it('should handle a command option with options', async () => {
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
            exec: vi.fn().mockImplementation(({ param }) => param),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c'])).resolves.toEqual({ command: { flag: undefined } });
        expect(options.command.exec).toHaveBeenCalledWith({
          // should have been { command: undefined } at the time of call
          values: { command: { flag: undefined } },
          index: 0,
          name: '-c',
          param: { flag: undefined },
        });
        options.command.exec.mockClear();
        await expect(parser.parse(['-c', '-f'])).resolves.toEqual({ command: { flag: true } });
        expect(options.command.exec).toHaveBeenCalledWith({
          // should have been { command: undefined } at the time of call
          values: { command: { flag: true } },
          index: 0,
          name: '-c',
          param: { flag: true },
        });
      });

      it('should handle a command option with an options callback', async () => {
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
            exec: vi.fn().mockImplementation(() => 'abc'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c', '-f'])).resolves.toEqual({ command: 'abc' });
        expect(options.command.options).toHaveBeenCalled();
        expect(options.command.exec).toHaveBeenCalledWith({
          // should have been { command: undefined } at the time of call
          values: { command: 'abc' },
          index: 0,
          name: '-c',
          param: { flag: true },
        });
      });

      it('should handle a command option with options with async callbacks', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {
              flag: {
                type: 'flag',
                names: ['-f'],
                default: async () => true,
              },
              boolean: {
                type: 'boolean',
                names: ['-b'],
                parse: async () => true,
              },
            },
            exec({ param }) {
              expect(param).toEqual({ flag: true, boolean: true });
              return param;
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c', '-b', '1'])).resolves.toEqual({
          command: { flag: true, boolean: true },
        });
      });
    });

    describe('flag', () => {
      it('should throw an error on flag option specified with value', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f='])).rejects.toThrow(
          `Option -f does not accept inline parameters.`,
        );
        await expect(parser.parse(['-f=a'])).rejects.toThrow(
          `Option -f does not accept inline parameters.`,
        );
      });

      it('should handle a flag option with negation names', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ flag: undefined });
        await expect(parser.parse(['-f'])).resolves.toEqual({ flag: true });
        await expect(parser.parse(['-no-f'])).resolves.toEqual({ flag: false });
      });
    });

    describe('boolean', () => {
      it('should throw an error on boolean option with missing parameter', async () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-b'])).rejects.toThrow(`Missing parameter to -b.`);
      });

      it('should handle a boolean option', async () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ boolean: undefined });
        await expect(parser.parse(['-b', ' +0.0 '])).resolves.toEqual({ boolean: false });
        await expect(parser.parse(['-b', ' 1 '])).resolves.toEqual({ boolean: true });
        await expect(parser.parse(['--boolean', ''])).resolves.toEqual({ boolean: false });
        await expect(parser.parse(['-b=1', '-b=0'])).resolves.toEqual({ boolean: false });
        await expect(parser.parse(['-b', '1', '-b', '0'])).resolves.toEqual({ boolean: false });
      });

      it('should handle a boolean option with truth names', async () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            truthNames: ['true'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-b', ' abc '])).resolves.toEqual({ boolean: false });
        await expect(parser.parse(['-b', ' True '])).resolves.toEqual({ boolean: true });
      });

      it('should handle a boolean option with falsity names', async () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            falsityNames: ['false'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-b', ' False '])).resolves.toEqual({ boolean: false });
        await expect(parser.parse(['-b', ' abc '])).resolves.toEqual({ boolean: true });
      });

      it('should handle a boolean option with truth and falsity names', async () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            truthNames: ['true'],
            falsityNames: ['false'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-b', ' False '])).resolves.toEqual({ boolean: false });
        await expect(parser.parse(['-b', ' True '])).resolves.toEqual({ boolean: true });
      });

      it('should throw an error on invalid parameter to boolean option with case-sensitive truth and falsity names', async () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            truthNames: ['true'],
            falsityNames: ['false'],
            caseSensitive: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-b', 'False'])).rejects.toThrow(
          `Invalid parameter to -b: 'False'. Possible values are {'true', 'false'}.`,
        );
        await expect(parser.parse(['-b', 'True'])).rejects.toThrow(
          `Invalid parameter to -b: 'True'. Possible values are {'true', 'false'}.`,
        );
      });
    });

    describe('string', () => {
      it('should throw an error on string option with missing parameter', async () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s'])).rejects.toThrow(`Missing parameter to -s.`);
      });

      it('should handle a string option', async () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ string: undefined });
        await expect(parser.parse(['-s', '123'])).resolves.toEqual({ string: '123' });
        await expect(parser.parse(['--string', ''])).resolves.toEqual({ string: '' });
        await expect(parser.parse(['-s=1', '-s==2'])).resolves.toEqual({ string: '=2' });
        await expect(parser.parse(['-s', '1', '-s', '2'])).resolves.toEqual({ string: '2' });
      });
    });

    describe('number', () => {
      it('should throw an error on number option with missing parameter', async () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-n'])).rejects.toThrow(`Missing parameter to -n.`);
      });

      it('should handle a number option', async () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ number: undefined });
        await expect(parser.parse(['-n', '123'])).resolves.toEqual({ number: 123 });
        await expect(parser.parse(['--number', ''])).resolves.toEqual({ number: 0 });
        await expect(parser.parse(['-n=1', '-n==2'])).resolves.toEqual({ number: NaN });
        await expect(parser.parse(['-n', '1', '-n', '2'])).resolves.toEqual({ number: 2 });
      });
    });

    describe('strings', () => {
      it('should throw an error on variadic strings option with missing parameter', async () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-ss'])).rejects.toThrow(`Missing parameter to -ss.`);
      });

      it('should throw an error on delimited strings option with missing parameter', async () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-ss'])).rejects.toThrow(`Missing parameter to -ss.`);
      });

      it('should parse an inline parameter of a strings option as a single parameter', async () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-ss=one', 'two'])).rejects.toThrow(`Unknown option two.`);
      });

      it('should handle a strings option that can be specified multiple times', async () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            append: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ strings: undefined });
        await expect(parser.parse(['-ss', '123', '456'])).resolves.toEqual({
          strings: ['123', '456'],
        });
        await expect(parser.parse(['--strings', '', '   '])).resolves.toEqual({
          strings: ['', '   '],
        });
        await expect(parser.parse(['-ss=123', '-ss==456'])).resolves.toEqual({
          strings: ['123', '=456'],
        });
        await expect(parser.parse(['-ss', 'a', 'b', '-ss', 'c', 'd'])).resolves.toEqual({
          strings: ['a', 'b', 'c', 'd'],
        });
      });

      it('should handle a strings option specified with multiple parameters', async () => {
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
        await expect(parser.parse(['-ss', 'one', 'two'])).resolves.toEqual({
          strings: ['one', 'two'],
          flag: undefined,
        });
        await expect(parser.parse(['-ss', 'one', 'two', '-f'])).resolves.toEqual({
          strings: ['one', 'two'],
          flag: true,
        });
        await expect(parser.parse(['-ss', 'one', 'two', '-ss', 'one=two', 'one'])).resolves.toEqual(
          {
            strings: ['one=two', 'one'],
            flag: undefined,
          },
        );
      });
    });

    describe('numbers', () => {
      it('should throw an error on variadic numbers option with missing parameter', async () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-ns'])).rejects.toThrow(`Missing parameter to -ns.`);
      });

      it('should throw an error on delimited numbers option with missing parameter', async () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-ns'])).rejects.toThrow(`Missing parameter to -ns.`);
      });

      it('should parse an inline parameter of a numbers option as a single parameter', async () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-ns=1', '2'])).rejects.toThrow(`Unknown option 2.`);
      });

      it('should handle a numbers option that can be specified multiple times', async () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            append: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ numbers: undefined });
        await expect(parser.parse(['-ns', '456', ' 123 '])).resolves.toEqual({
          numbers: [456, 123],
        });
        await expect(parser.parse(['--numbers', '', '   '])).resolves.toEqual({ numbers: [0, 0] });
        await expect(parser.parse(['-ns=456', '-ns=123'])).resolves.toEqual({
          numbers: [456, 123],
        });
        await expect(parser.parse(['-ns', '5', '-ns', '6', '7'])).resolves.toEqual({
          numbers: [5, 6, 7],
        });
      });

      it('should handle a numbers option specified with multiple parameters', async () => {
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
        await expect(parser.parse(['-ns', '1', '2'])).resolves.toEqual({
          numbers: [1, 2],
          flag: undefined,
        });
        await expect(parser.parse(['-ns', '1', '2', '-f'])).resolves.toEqual({
          numbers: [1, 2],
          flag: true,
        });
        await expect(parser.parse(['-ns', '1', '2', '-ns', '2', '1'])).resolves.toEqual({
          numbers: [2, 1],
          flag: undefined,
        });
      });
    });
  });

  describe('parseInto', () => {
    it('should handle a class instance with previous values and no default', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const values = new (class {
        flag = false;
      })();
      const parser = new ArgumentParser(options);
      await parser.parseInto(values, []);
      expect(values).toEqual({ flag: false });
    });

    it('should handle a class instance with previous values and a default', async () => {
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
      const parser = new ArgumentParser(options);
      await parser.parseInto(values, []);
      expect(values).toEqual({ flag: true });
    });

    it('should handle a class instance with previous values and a default of undefined', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          default: undefined,
        },
      } as const satisfies Options;
      const values = new (class {
        flag = false;
      })();
      const parser = new ArgumentParser(options);
      await parser.parseInto(values, []);
      expect(values).toEqual({ flag: undefined });
    });

    it('should output a warning on a deprecated option', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          deprecated: 'yes',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      const values = { flag: undefined };
      const { warning } = await parser.parseInto(values, ['-f', '-f']);
      expect(warning).toHaveLength(1);
      expect(warning?.message).toEqual(
        `Option -f is deprecated and may be removed in future releases.\n`,
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
      const parser = new ArgumentParser(options);
      const values = { flag1: undefined, flag2: undefined };
      const { warning } = await parser.parseInto(values, ['-f1', '-f2']);
      expect(warning).toHaveLength(2);
      expect(warning?.message).toEqual(
        `Option -f1 is deprecated and may be removed in future releases.\n` +
          `Option -f2 is deprecated and may be removed in future releases.\n`,
      );
    });
  });
});
