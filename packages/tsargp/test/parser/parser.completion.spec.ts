import { describe, describe as on, describe as when, expect, it as should, vi } from 'vitest';
import { TextMessage } from '../../lib/styles';
import { type Options } from '../../lib/options';
import { type ParsingFlags, ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    should('complete an empty command line', async () => {
      const parser = new ArgumentParser({});
      await expect(parser.parse('cmd', { compIndex: 4 })).rejects.toThrow(/^$/);
    });

    should('ignore the last parse callback when completing an option name', async () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          parse: vi.fn((param) => param),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -s 1 ', { compIndex: 9 })).rejects.toThrow(/^-s$/);
      expect(options.single.parse).not.toHaveBeenCalled();
    });

    should('be able to throw completion words from a parse callback', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          parse() {
            throw new TextMessage('abc');
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^abc$/);
    });

    when('parsing errors occur during completion', () => {
      should('ignore an unknown cluster letter', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            cluster: 'f',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        const flags: ParsingFlags = { clusterPrefix: '', compIndex: 7 };
        await expect(parser.parse('cmd  x ', flags)).rejects.toThrow(/^-f$/);
        await expect(parser.parse('cmd xb ', flags)).rejects.toThrow(/^-f$/);
      });

      should('ignore an unknown option', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd x ', { compIndex: 6 })).rejects.toThrow(/^-f$/);
      });

      should('ignore an invalid parameter', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            choices: ['abc'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -s a ', { compIndex: 9 })).rejects.toThrow(/^-s$/);
        await expect(parser.parse('cmd -s a -s ', { compIndex: 12 })).rejects.toThrow(/^abc$/);
      });

      should('ignore an error thrown by a parse callback of a flag option', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            parse: vi.fn(() => {
              throw 'abc';
            }),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
        expect(options.flag.parse).toHaveBeenCalledWith([''], {
          values: { flag: undefined },
          index: 0,
          name: '-f',
          comp: true,
          format: expect.anything(),
        });
        expect(options.flag.parse).toHaveBeenCalled();
      });

      should('ignore an error thrown by a parse callback of a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            parse: vi.fn(() => {
              throw 'abc';
            }),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -s 1 -s 1 ', { compIndex: 14 })).rejects.toThrow(/^-s$/);
        expect(options.single.parse).toHaveBeenCalledWith('1', {
          values: { single: undefined },
          index: 0,
          name: '-s',
          comp: true,
          format: expect.anything(),
        });
        expect(options.single.parse).toHaveBeenCalled();
      });
    });

    when('performing word completion', () => {
      should('handle a help option', async () => {
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

      should('handle a version option', async () => {
        const options = {
          version: {
            type: 'version',
            names: ['-v'],
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

      should('handle a command option', async () => {
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
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-c$/);
        await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-c$/);
        await expect(parser.parse('cmd -c', { compIndex: 6 })).rejects.toThrow(/^-c$/);
        await expect(parser.parse('cmd -c ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
        await expect(parser.parse('cmd -c=', { compIndex: 7 })).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd -c= ', { compIndex: 8 })).rejects.toThrow(/^-c$/);
        expect(options.command.parse).not.toHaveBeenCalled();
      });

      should('handle a flag option', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-f$/);
        await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-f$/);
        await expect(parser.parse('cmd -f', { compIndex: 6 })).rejects.toThrow(/^-f$/);
        expect(options.flag.parse).not.toHaveBeenCalled();
        await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
        expect(options.flag.parse).toHaveBeenCalled();
        options.flag.parse.mockClear();
        await expect(parser.parse('cmd -f=', { compIndex: 7 })).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd -f= ', { compIndex: 8 })).rejects.toThrow(/^-f$/);
        expect(options.flag.parse).not.toHaveBeenCalled(); // option was ignored
      });

      should('handle an array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^-a$/);
        await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^-a$/);
        await expect(parser.parse('cmd -a', { compIndex: 6 })).rejects.toThrow(/^-a$/);
        await expect(parser.parse('cmd -a ', { compIndex: 7 })).rejects.toThrow(/^-a$/);
        await expect(parser.parse('cmd -a 1', { compIndex: 8 })).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd -a 1 ', { compIndex: 9 })).rejects.toThrow(/^-a$/);
        await expect(parser.parse('cmd -a=', { compIndex: 7 })).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd -a= ', { compIndex: 8 })).rejects.toThrow(/^-a$/);
        await expect(parser.parse('cmd -a 1 -a', { compIndex: 11 })).rejects.toThrow(/^-a$/);
      });

      should('handle a flag option that wants to break the parsing loop', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            break: true,
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -f ', { compIndex: 7 })).rejects.toThrow(/^-f$/);
        expect(options.flag.parse).toHaveBeenCalled();
      });

      should('handle a positional marker', async () => {
        const options = {
          single: {
            type: 'single',
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^--$/);
        await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^--$/);
        await expect(parser.parse('cmd --', { compIndex: 6 })).rejects.toThrow(/^--$/);
        await expect(parser.parse('cmd -- ', { compIndex: 7 })).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd --=', { compIndex: 7 })).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd --= ', { compIndex: 8 })).rejects.toThrow(/^--$/);
      });

      should('handle a positional option with choices', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            choices: ['one', 'two'],
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

      should('handle a positional marker with choices', async () => {
        const options = {
          single: {
            type: 'single',
            choices: ['one', 'two'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd ', { compIndex: 4 })).rejects.toThrow(/^one\ntwo\n--$/);
        await expect(parser.parse('cmd -', { compIndex: 5 })).rejects.toThrow(/^--$/);
        await expect(parser.parse('cmd --', { compIndex: 6 })).rejects.toThrow(/^--$/);
        await expect(parser.parse('cmd -- ', { compIndex: 7 })).rejects.toThrow(/^one\ntwo$/);
        await expect(parser.parse('cmd -- o', { compIndex: 8 })).rejects.toThrow(/^one$/);
        await expect(parser.parse('cmd --=', { compIndex: 7 })).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd --= ', { compIndex: 8 })).rejects.toThrow(/^one\ntwo\n--$/);
      });

      should('handle a positional function option with parameter count', async () => {
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

      should('handle a cluster argument', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            cluster: 'f',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        const flags1: ParsingFlags = { clusterPrefix: '', compIndex: 6 };
        await expect(parser.parse('cmd  f', flags1)).rejects.toThrow(/^$/);
        await expect(parser.parse('cmd ff', flags1)).rejects.toThrow(/^$/);
        const flags2: ParsingFlags = { clusterPrefix: '-', compIndex: 7 };
        await expect(parser.parse('cmd   -', flags2)).rejects.toThrow(/^-f$/);
        await expect(parser.parse('cmd  -f', flags2)).rejects.toThrow(/^-f$/);
        await expect(parser.parse('cmd -ff', flags2)).rejects.toThrow(/^$/);
      });

      should('complete the parameter of a clustered option (and ignore the rest)', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            cluster: 'f',
          },
          single: {
            type: 'single',
            names: ['-s'],
            choices: ['one'],
            cluster: 's',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        const flags: ParsingFlags = { clusterPrefix: '', compIndex: 7 };
        await expect(parser.parse('cmd sf  rest', flags)).rejects.toThrow(/^one$/);
      });
    });

    when('a complete callback is specified', () => {
      should('ignore an error thrown by the complete callback', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            complete: vi.fn(() => {
              throw 'abc';
            }),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^$/);
        expect(options.single.complete).toHaveBeenCalled();
      });

      should('handle a single-valued option', async () => {
        const options = {
          single: {
            type: 'single',
            names: ['-s'],
            complete: vi.fn((param) => [param]),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -s ', { compIndex: 7 })).rejects.toThrow(/^$/);
        expect(options.single.complete).toHaveBeenCalledWith('', {
          values: { strings: undefined },
          index: 0,
          name: '-s',
          prev: [],
        });
        options.single.complete.mockClear();
        await expect(parser.parse('cmd -s 1', { compIndex: 8 })).rejects.toThrow(/^1$/);
        expect(options.single.complete).toHaveBeenCalledWith('1', {
          values: { single: undefined },
          index: 0,
          name: '-s',
          prev: [],
        });
      });

      should('handle an array-valued option', async () => {
        const options = {
          array: {
            type: 'array',
            names: ['-a'],
            complete: vi.fn((param) => [param]),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -a ', { compIndex: 7 })).rejects.toThrow(/^\n-a$/);
        expect(options.array.complete).toHaveBeenCalledWith('', {
          values: { strings: undefined },
          index: 0,
          name: '-a',
          prev: [],
        });
        options.array.complete.mockClear();
        await expect(parser.parse('cmd -a 1', { compIndex: 8 })).rejects.toThrow(/^1$/);
        expect(options.array.complete).toHaveBeenCalledWith('1', {
          values: { array: undefined },
          index: 0,
          name: '-a',
          prev: [],
        });
        options.array.complete.mockClear();
        await expect(parser.parse('cmd -a 1 ', { compIndex: 9 })).rejects.toThrow(/^\n-a$/);
        expect(options.array.complete).toHaveBeenCalledWith('', {
          values: { array: undefined },
          index: 0,
          name: '-a',
          prev: ['1'],
        });
      });

      should('handle a polyadic function option', async () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f'],
            paramCount: 2,
            parse: vi.fn(),
            complete() {
              return [this.type]; // test `this`
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd -f 1 2', { compIndex: 10 })).rejects.toThrow(/^function$/);
        expect(options.function.parse).not.toHaveBeenCalled();
      });

      should('handle a positional function option', async () => {
        const options = {
          function: {
            type: 'function',
            paramCount: 2,
            positional: true,
            complete: vi.fn((param) => [param]),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse('cmd a', { compIndex: 5 })).rejects.toThrow(/^a$/);
        expect(options.function.complete).toHaveBeenCalledWith('a', {
          values: { function: undefined },
          index: 0,
          name: '',
          prev: [],
        });
        options.function.complete.mockClear();
        await expect(parser.parse('cmd a a', { compIndex: 7 })).rejects.toThrow(/^a$/);
        expect(options.function.complete).toHaveBeenCalledWith('a', {
          values: { function: undefined },
          index: 0,
          name: '',
          prev: ['a'],
        });
        options.function.complete.mockClear();
        await expect(parser.parse('cmd a a a', { compIndex: 9 })).rejects.toThrow(/^a$/);
        expect(options.function.complete).toHaveBeenCalledWith('a', {
          values: { function: null },
          index: 0,
          name: '',
          prev: [],
        });
      });
    });
  });
});
