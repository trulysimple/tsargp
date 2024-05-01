import { describe, describe as on, describe as when, expect, it as should, vi } from 'vitest';
import { ErrorMessage } from '../../lib/styles';
import { type Options, OptionValues } from '../../lib/options';
import { ArgumentParser } from '../../lib/parser';
import { AnsiFormatter, JsonFormatter } from '../../lib/formatter';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    should('handle zero arguments', async () => {
      await expect(new ArgumentParser({}).parse()).resolves.toEqual({});
      await expect(new ArgumentParser({}).parse('')).resolves.toEqual({});
      await expect(new ArgumentParser({}).parse([])).resolves.toEqual({});
    });

    should('throw an error on unknown option', async () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['--flag1'],
        },
        flag2: {
          type: 'flag',
          names: ['--flag2'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['fla'])).rejects.toThrow(`Unknown option fla.`);
      await expect(parser.parse(['flag'])).rejects.toThrow(
        `Unknown option flag. Similar names are: --flag1, --flag2.`,
      );
      await expect(parser.parse(['flags'])).rejects.toThrow(
        `Unknown option flags. Similar names are: --flag1, --flag2.`,
      );
    });

    should('throw an error on required option not specified', async () => {
      const options = {
        flag: {
          type: 'flag',
          required: true,
          preferredName: 'preferred',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).rejects.toThrow(`Option preferred is required.`);
    });

    when('parsing a help option', () => {
      should('throw an empty message when there are no formats', async () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            sections: [{ type: 'groups' }],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-h'], { progName: 'prog' })).rejects.toThrow(/^$/);
      });

      should('save the help message when the option explicitly asks so', async () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            formats: { ansi: AnsiFormatter },
            sections: [{ type: 'groups' }],
            saveMessage: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ help: undefined });
        await expect(parser.parse(['-h'])).resolves.toEqual({
          help: expect.objectContaining({
            message: expect.stringMatching(`  -h    Available formats are {'ansi'}.`),
          }),
        });
      });

      should('throw a help message with default settings', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            group: 'Args:',
          },
          help: {
            type: 'help',
            names: ['-h'],
            formats: { ansi: AnsiFormatter },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.not.toHaveProperty('help');
        await expect(parser.parse(['-h'], { progName: 'prog' })).rejects.toThrow(
          `Usage:\n\n  prog [-f] [-h]\n\nArgs:\n\n  -f\n\nOptions:\n\n  -h`,
        );
      });

      should('throw a help message with usage and custom indentation', async () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            group: 'group  heading',
            formats: { ansi: AnsiFormatter },
            sections: [
              { type: 'usage', title: 'usage  heading' },
              { type: 'groups', noWrap: true },
            ],
            config: { names: { indent: 0 } },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.not.toHaveProperty('help');
        await expect(parser.parse(['-h'], { progName: 'prog' })).rejects.toThrow(
          `usage heading\n\nprog [-h]\n\ngroup  heading\n\n-h`,
        );
      });

      should('throw a help message with a JSON format', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
          },
          help: {
            type: 'help',
            names: ['-h'],
            formats: { ansi: AnsiFormatter, json: JsonFormatter },
            useFormat: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-h', 'json'])).rejects.toThrow(
          `[{"type":"flag","names":["-f","--flag"],"preferredName":"-f"},` +
            `{"type":"help","names":["-h"],"formats":{},"useFormat":true,"preferredName":"-h"}]`,
        );
      });

      should('throw a help message with filtered options', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f', '--flag'],
          },
          flag2: {
            type: 'flag',
            synopsis: 'A flag option',
          },
          single: {
            type: 'single',
            names: ['-s', '--single'],
          },
          help: {
            type: 'help',
            names: ['-h'],
            formats: { ansi: AnsiFormatter },
            sections: [{ type: 'groups' }],
            useFilter: true,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-h', '-F', '-S'])).rejects.toThrow(
          `  -f, --flag\n  -s, --single  <param>`,
        );
      });

      should('throw the help message of a nested command with option filter', async () => {
        const options = {
          help: {
            type: 'help',
            names: ['-h'],
            formats: { ansi: AnsiFormatter },
            sections: [{ type: 'groups' }],
            useNested: true,
            useFilter: true,
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
            options: async () => ({
              // test asynchronous
              flag: {
                type: 'flag',
                names: ['-f'],
              },
              help: {
                type: 'help',
                names: ['-h'],
                formats: { ansi: AnsiFormatter },
                sections: [{ type: 'groups' }],
                useFilter: true,
              },
            }),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-h', '-h'])).rejects.toThrow('  -h');
        await expect(parser.parse(['-h', 'cmd1'])).rejects.toThrow('  cmd1  ...');
        await expect(parser.parse(['-h', 'cmd2'])).rejects.toThrow('  -f\n  -h');
        await expect(parser.parse(['-h', 'cmd2', '-f'])).rejects.toThrow('  -f');
      });
    });

    when('parsing a version option', () => {
      should('save the version message when the option explicitly asks so', async () => {
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

      should('throw a version message with fixed version', async () => {
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

      should('throw a version message with a resolve function', async () => {
        const options = {
          version: {
            type: 'version',
            names: ['-v'],
            resolve: (str) => `file://${import.meta.dirname}/../data/${str}`,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-v'])).rejects.toThrow(/^0.1.0$/);
      });

      should('throw an error when a package.json file cannot be found', async () => {
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

    when('parsing a flag option', () => {
      should('handle an asynchronous callback', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            parse: async () => 'abc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f'])).resolves.toEqual({ flag: 'abc' });
      });

      should('handle an asynchronous callback that throws', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            async parse(_, { format }) {
              throw new ErrorMessage(format(this.type)); // test `this`
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f'])).rejects.toThrow('flag');
      });

      should('handle a negation name', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '-no-f'],
            parse: (_, { name }) => name !== '-no-f',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f'])).resolves.toEqual({ flag: true });
        await expect(parser.parse(['-no-f'])).resolves.toEqual({ flag: false });
      });

      should('skip a certain number of remaining arguments', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            parse() {
              this.skipCount = 1; // test `this`
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2', 'skipped', '-f1'])).resolves.toEqual({
          flag1: true,
          flag2: undefined,
        });
      });

      should('avoid skipping arguments when the skip count is negative', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            parse() {
              this.skipCount = -1; // test `this`
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2', 'arg', '-f1'])).rejects.toThrow('Unknown option arg.');
      });

      should('replace the option value with the result of the parse callback', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            parse: vi.fn((param) => param),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ flag: undefined });
        expect(options.flag.parse).not.toHaveBeenCalled();
        await expect(parser.parse(['-f'])).resolves.toEqual({ flag: [] });
        expect(options.flag.parse).toHaveBeenCalledWith([], {
          values: { flag: [] }, // should have been { flag: undefined } at the time of call
          index: 0,
          name: '-f',
          comp: false,
          format: expect.anything(),
        });
        options.flag.parse.mockClear();
        await expect(parser.parse(['-f', '-f'])).resolves.toEqual({ flag: [] });
        expect(options.flag.parse).toHaveBeenCalledWith(['-f'], {
          values: { flag: [] }, // should have been { flag: undefined } at the time of call
          index: 0,
          name: '-f',
          comp: false,
          format: expect.anything(),
        });
        expect(options.flag.parse).toHaveBeenCalledTimes(2);
      });

      should('break the parsing loop when the option explicitly asks so', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            parse: vi.fn(() => 'abc'),
            break: true,
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f1', '-f2'])).resolves.toEqual({
          flag1: 'abc',
          flag2: undefined,
        });
        expect(options.flag1.parse).toHaveBeenCalled();
        expect(options.flag2.parse).not.toHaveBeenCalled();
      });

      should('expose parsed values to the parse callback', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            parse(_, { values }) {
              expect((values as OptionValues<typeof options>).flag2).toBeTruthy();
            },
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2', '-f1'])).resolves.toEqual({
          flag1: undefined,
          flag2: true,
        });
      });
    });

    when('parsing a command option', () => {
      should('handle a an asynchronous callback', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            parse: async () => 'abc',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c'])).resolves.toEqual({ command: 'abc' });
      });

      should('handle an asynchronous callback that throws', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            async parse(_, { format }) {
              throw new ErrorMessage(format(this.type)); // test `this`
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c'])).rejects.toThrow('command');
      });

      should('set the option value with the result of the parse callback', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            parse: vi.fn(() => 'abc'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ command: undefined });
        expect(options.command.parse).not.toHaveBeenCalled();
        await expect(parser.parse(['-c'])).resolves.toEqual({ command: 'abc' });
        expect(options.command.parse).toHaveBeenCalled();
      });

      should('handle nested option definitions', async () => {
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
            parse: vi.fn((param) => param),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c'])).resolves.toEqual({ command: { flag: undefined } });
        expect(options.command.parse).toHaveBeenCalledWith(
          { flag: undefined },
          {
            // should have been { command: undefined } at the time of call
            values: { command: { flag: undefined } },
            index: 0,
            name: '-c',
            format: expect.anything(),
          },
        );
        options.command.parse.mockClear();
        await expect(parser.parse(['-c', '-f'])).resolves.toEqual({ command: { flag: true } });
        expect(options.command.parse).toHaveBeenCalledWith(
          { flag: true },
          {
            // should have been { command: undefined } at the time of call
            values: { command: { flag: true } },
            index: 0,
            name: '-c',
            format: expect.anything(),
          },
        );
      });

      should('handle an options callback', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: vi.fn(() => ({
              flag: {
                type: 'flag',
                names: ['-f'],
              },
            })),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c', '-f'])).resolves.toEqual({ command: { flag: true } });
        expect(options.command.options).toHaveBeenCalled();
      });

      should('handle an async options callback', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            async options() {
              return {
                flag: {
                  type: 'flag',
                  names: this.names, // test `this`
                },
              };
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c', '-c'])).resolves.toEqual({ command: { flag: true } });
      });

      should('handle nested option definitions with asynchronous callbacks', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {
              flag1: {
                type: 'flag',
                names: ['-f1'],
                default: async () => true,
              },
              flag2: {
                type: 'flag',
                names: ['-f2'],
                parse: async () => true,
              },
            },
            parse(param) {
              expect(param).toEqual({ flag1: true, flag2: true });
              return param;
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-c', '-f2'])).resolves.toEqual({
          command: { flag1: true, flag2: true },
        });
      });
    });

    when('parsing a single-valued option', () => {
      should('throw an error on missing parameter', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s'])).rejects.toThrow(
          `Wrong number of parameters to option -s: requires exactly 1.`,
        );
      });

      should('replace the option value with the parameter', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ single: undefined });
        await expect(parser.parse(['-s', ''])).resolves.toEqual({ single: '' });
        await expect(parser.parse(['-s', '0', '-s', '1'])).resolves.toEqual({ single: '1' });
      });

      should('replace the option value with the result of the parse callback', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            parse: Number,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-s', ''])).resolves.toEqual({ single: 0 });
        await expect(parser.parse(['-s', '0', '-s', '1'])).resolves.toEqual({ single: 1 });
      });
    });

    when('parsing an array-valued option', () => {
      should('accept zero parameters', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a'])).resolves.toEqual({ array: [] });
      });

      should('replace the option value with the parameters', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toEqual({ array: undefined });
        await expect(parser.parse(['-a', ''])).resolves.toEqual({ array: [''] });
        await expect(parser.parse(['-a', '0', '-a', '1'])).resolves.toEqual({ array: ['1'] });
      });

      should('replace the option value with the result of the parse callback', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            parse: Number,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', ''])).resolves.toEqual({ array: [0] });
        await expect(parser.parse(['-a', '0', '-a', '1'])).resolves.toEqual({ array: [1] });
      });

      should('split parameters with a delimiter', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            separator: ',',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', '1,2'])).resolves.toEqual({ array: ['1', '2'] });
        await expect(parser.parse(['-a', '1,2', '-a'])).resolves.toEqual({ array: [] });
      });

      should('append values when the option explicitly asks so', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            append: true,
            separator: ',',
            parse: Number,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-a', '0', '-a', '1'])).resolves.toEqual({ array: [0, 1] });
        await expect(parser.parse(['-a', '0,1', '-a', '2,3'])).resolves.toEqual({
          array: [0, 1, 2, 3],
        });
      });
    });

    when('parsing a function option', () => {
      should('accept zero parameters', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f'])).resolves.toEqual({ function: null });
      });
    });
  });

  on('parseInto', () => {
    when('passing a class instance with previous values', () => {
      should('handle an option with no default value', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const values = new (class {
          flag: true | undefined = true;
        })();
        const parser = new ArgumentParser(options);
        await parser.parseInto(values, []);
        expect(values).toEqual({ flag: true });
      });

      should('handle an option with a default value', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: () => true,
          },
        } as const satisfies Options;
        const values = new (class {
          flag = false;
        })();
        const parser = new ArgumentParser(options);
        await parser.parseInto(values, []);
        expect(values).toEqual({ flag: true });
      });

      should('handle an option with a default value of undefined', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: undefined,
          },
        } as const satisfies Options;
        const values = new (class {
          flag: true | undefined = true;
        })();
        const parser = new ArgumentParser(options);
        await parser.parseInto(values, []);
        expect(values).toEqual({ flag: undefined });
      });
    });

    when('a deprecated option is specified', () => {
      should('report a warning', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            deprecated: '',
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

      should('report multiple warnings', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            deprecated: '',
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            deprecated: '',
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

      should('report a warning from a nested command', async () => {
        const options = {
          command: {
            type: 'command',
            names: ['-c'],
            options: {
              flag: {
                type: 'flag',
                names: ['-f'],
                deprecated: '',
              },
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        const values = { command: undefined };
        const { warning } = await parser.parseInto(values, ['-c', '-f']);
        expect(warning).toHaveLength(1);
        expect(warning?.message).toEqual(
          `Option -f is deprecated and may be removed in future releases.\n`,
        );
      });
    });
  });
});
