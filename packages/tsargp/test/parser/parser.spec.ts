import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser, OptionValues, HelpMessage } from '../../lib';
import '../utils.spec'; // initialize globals

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

    describe('help', () => {
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
    });

    describe('command', () => {
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
    });

    describe('flag', () => {
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
    });

    describe('boolean', () => {
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
    });

    describe('string', () => {
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
    });

    describe('number', () => {
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
    });

    describe('strings', () => {
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
    });

    describe('numbers', () => {
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
