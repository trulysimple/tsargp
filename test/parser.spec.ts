import { describe, expect, it, vi } from 'vitest';
import { ArgumentParser, req, type Options, OptionValues } from '../lib';
import './utils.spec';

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle zero arguments', () => {
      expect(new ArgumentParser({}).validate().parse([])).toMatchObject({});
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
      expect(() => parser.parse(['boo'])).toThrow(/Unknown option .+boo.+\.$/);
      expect(() => parser.parse(['bool'])).toThrow(
        /Unknown option .+bool.+.\nSimilar names are: .+--boolean1.+, .+--boolean2.+\./,
      );
      expect(() => parser.parse(['bool-ean'])).toThrow(
        /Unknown option .+bool-ean.+.\nSimilar names are: .+--boolean1.+, .+--boolean2.+\./,
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
      expect(() => parser.parse([])).toThrow(/Option .+preferred.+ is required\./);
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
        expect(() => parser.parse(['-f1'])).toThrow(/Option .+-f1.+ requires .+-f2.+\./);
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
        expect(() => parser.parse(['-f1'])).toThrow(/Option .+-f1.+ requires .+-f2.+\./);
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
        expect(() => parser.parse(['-f1'])).toThrow(/Option .+-f1.+ requires .+-f2.+\./);
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
        expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option .+-f1.+ requires no .+-f2.+\./);
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
        expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option .+-f1.+ requires no .+-f2.+\./);
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
        expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option .+-f1.+ requires no .+-f2.+\./);
        expect(options.required.exec).not.toHaveBeenCalled();
      });

      it('should throw an error when an option requirement is not satisfied', () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['req0'],
            requires: req.all(
              'required1',
              req.one({ required2: [' a', 'b '] }, req.not({ required3: ['c'] })),
            ),
          },
          required1: {
            type: 'flag',
            names: ['req1'],
          },
          required2: {
            type: 'strings',
            names: ['req2'],
            separator: '|',
            unique: true,
            trim: true,
          },
          required3: {
            type: 'strings',
            names: ['req3'],
            preferredName: 'preferred',
            positional: true,
            requires: req.all('required1', 'required4'),
          },
          required4: {
            type: 'function',
            names: ['req4'],
            exec: () => {},
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse([])).not.toThrow();
        expect(() => parser.parse(['req0'])).toThrow(/Option .+req0.+ requires .+req1.+\./);
        expect(() => parser.parse(['req0', 'req1'])).toThrow(
          /Option .+req0.+ requires \(.+req2.+ or .+preferred.+\)\./,
        );
        expect(() => parser.parse(['req0', 'req1', 'req2=a'])).toThrow(
          /Option .+req0.+ requires \(.+req2.+ = \[.+'a'.+, .+'b'.+\] or .+preferred.+\)\./,
        );
        expect(() => parser.parse(['a'])).toThrow(/Option .+preferred.+ requires .+req1.+\./);
        expect(() => parser.parse(['req1', 'a'])).toThrow(
          /Option .+preferred.+ requires .+req4.+\./,
        );
        expect(() => parser.parse(['req0', 'req1', 'c'])).toThrow(
          /Option .+req0.+ requires \(.+req2.+ or .+preferred.+ != \[.+'c'.+\]\)\./,
        );
        expect(() => parser.parse(['req0', 'req1', 'req2', 'a|a|b'])).not.toThrow();
        expect(() => parser.parse(['req0', 'req1', 'req2', 'b|b|a'])).not.toThrow();
        expect(() => parser.parse(['req1', 'req4', 'a'])).not.toThrow();
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

      it('should throw a help message', () => {
        const options = {
          function: {
            type: 'help',
            names: ['-h'],
            usage: 'usage',
            footer: 'footer',
            format: { indent: { names: 3 } },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-h'])).toThrow(/^usage\n.+Options:\n.+-h.+footer$/s);
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
          function: {
            type: 'version',
            names: ['-v'],
            version: '0.1.0',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
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
        expect(options.function.exec).toHaveBeenCalled();
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
        expect(() => parser.parse(['-f=a'])).toThrow(
          /Option .+-f.+ does not accept inline values\./,
        );
        expect(options.function.exec).not.toHaveBeenCalled();
      });

      it('should handle a function option', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f', '--function'],
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).not.toHaveProperty('function');
        expect(options.function.exec).not.toHaveBeenCalled();
        parser.parse(['-f']);
        expect(options.function.exec).toHaveBeenCalled();
      });

      it('should break the parsing loop when a function option explicitly asks so', () => {
        const options = {
          function1: {
            type: 'function',
            names: ['-f1'],
            exec: vi.fn(),
            break: true,
          },
          function2: {
            type: 'function',
            names: ['-f2'],
            exec: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        parser.parse(['-f1', '-f2']);
        expect(options.function1.exec).toHaveBeenCalled();
        expect(options.function2.exec).not.toHaveBeenCalled();
      });

      it('should not fill default values during parsing', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f1'],
            exec: (values) => {
              expect(values).toHaveProperty('flag');
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
        expect(parser.parse(['-f1'])).toMatchObject({ flag: true });
      });

      it('should fill specified values during parsing', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f1'],
            exec: (values) => {
              expect(values).toHaveProperty('flag');
              expect((values as OptionValues<typeof options>).flag).toBeTruthy();
            },
          },
          flag: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-f2', '-f1'])).toMatchObject({ flag: true });
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
          function: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-f=a'])).toThrow(
          /Option .+-f.+ does not accept inline values\./,
        );
      });

      it('should handle a flag option with negation names', () => {
        const options = {
          boolean: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ boolean: undefined });
        expect(parser.parse(['-f'])).toMatchObject({ boolean: true });
        expect(parser.parse(['-no-f'])).toMatchObject({ boolean: false });
      });

      it('should handle a flag option with a default value', () => {
        const options = {
          boolean: {
            type: 'flag',
            names: ['-f'],
            default: false,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ boolean: false });
      });

      it('should handle a flag option with a default callback', () => {
        const options = {
          boolean: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
            default: () => false,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ boolean: false });
      });

      it('should handle a flag option with an async default callback', () => {
        const options = {
          boolean: {
            type: 'flag',
            names: ['-f'],
            negationNames: ['-no-f'],
            default: async () => false,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ boolean: expect.toResolve(false) });
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
        expect(() => parser.parse('cmd -b ', { compIndex: 7 })).toThrow(/^abc$/);
        expect(options.boolean.complete).toHaveBeenCalled();
      });

      it('should handle the completion of a boolean option with custom completion that throws', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            complete: vi.fn().mockImplementation(() => {
              throw '';
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
        expect(() => parser.parse(['-f', '-b', '1'])).toThrow(
          /Option .+-f.+ requires .+-b.+ = .+false.+\./,
        );
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
        expect(() => parser.parse(['-f', '-b', '0'])).toThrow(
          /Option .+-f.+ requires .+-b.+ != .+false.+\./,
        );
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
        expect(() => parser.parse(['-b'])).toThrow(/Missing parameter to .+-b.+\./);
      });

      it('should throw an error on boolean option with missing parameter after positional marker', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(
          /Missing parameter after positional marker .+--.+\./,
        );
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
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker .+--.+ does not accept inline values\./,
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
        expect(parser.parse([])).toMatchObject({ boolean: undefined });
        expect(parser.parse(['-b', ' +0.0 '])).toMatchObject({ boolean: false });
        expect(parser.parse(['-b', ' 1 '])).toMatchObject({ boolean: true });
        expect(parser.parse(['--boolean', ''])).toMatchObject({ boolean: false });
        expect(parser.parse(['-b=1', '-b= False '])).toMatchObject({ boolean: false });
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
        expect(parser.parse([])).toMatchObject({ boolean: true });
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
        expect(parser.parse([])).toMatchObject({ boolean: true });
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
        expect(parser.parse([])).toMatchObject({ boolean: expect.toResolve(true) });
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
        expect(parser.parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          boolean: true,
        });
        expect(parser.parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          boolean: true,
        });
        expect(parser.parse(['0', '1', '-f'])).toMatchObject({
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
        expect(parser.parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
        expect(parser.parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
        expect(parser.parse(['-b', '0', '--', '1'])).toMatchObject({
          flag: undefined,
          boolean: true,
        });
      });

      it('should handle a boolean option with custom parsing', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            parse: (_, value) => value.includes('123'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-b', '0123'])).toMatchObject({ boolean: true });
      });

      it('should handle a boolean option with async custom parsing', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b'],
            parse: async (_, value) => value.includes('123'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-b', '0123'])).toMatchObject({ boolean: expect.toResolve(true) });
      });
    });

    describe('string', () => {
      it('should handle the completion of a string option with custom completion', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            complete: vi.fn().mockImplementation(() => ['abc']),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse('cmd -s ', { compIndex: 7 })).toThrow(/^abc$/);
        expect(options.string.complete).toHaveBeenCalled();
      });

      it('should handle the completion of a string option with custom completion that throws', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            complete: vi.fn().mockImplementation(() => {
              throw '';
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
        expect(() => parser.parse(['-f', '-s', '1'])).toThrow(
          /Option .+-f.+ requires .+-s.+ = .+'0'.+\./,
        );
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
        expect(() => parser.parse(['-f', '-s', '0'])).toThrow(
          /Option .+-f.+ requires .+-s.+ != .+'0'.+\./,
        );
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
        expect(() => parser.parse(['-s'])).toThrow(/Missing parameter to .+-s.+\./);
      });

      it('should throw an error on string option with missing parameter after positional marker', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(
          /Missing parameter after positional marker .+--.+\./,
        );
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
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker .+--.+ does not accept inline values\./,
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
        expect(parser.parse([])).toMatchObject({ string: undefined });
        expect(parser.parse(['-s', '123'])).toMatchObject({ string: '123' });
        expect(parser.parse(['--string', ''])).toMatchObject({ string: '' });
        expect(parser.parse(['-s=1', '-s=2'])).toMatchObject({ string: '2' });
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
        expect(parser.parse([])).toMatchObject({ string: '123' });
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
        expect(parser.parse([])).toMatchObject({ string: '123' });
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
        expect(parser.parse([])).toMatchObject({ string: expect.toResolve('123') });
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
        expect(parser.parse([])).toMatchObject({ string: undefined });
        expect(parser.parse(['-s', '456'])).toMatchObject({ string: '456' });
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
          /Invalid parameter to .+-s.+: .+'abc'.+\. Value must match the regex .+\/\\d\+\/s.+\./,
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
        expect(parser.parse([])).toMatchObject({ string: undefined });
        expect(parser.parse(['-s', 'one'])).toMatchObject({ string: 'one' });
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
        expect(parser.parse(['-s', ' one '])).toMatchObject({ string: 'one' });
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
        expect(parser.parse(['-s', 'OnE'])).toMatchObject({ string: 'one' });
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
        expect(parser.parse(['-s', 'oNe'])).toMatchObject({ string: 'ONE' });
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
          /Invalid parameter to .+-s.+: .+'abc'.+\. Possible values are \[.+'one'.+, .+'two'.+\]\./,
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          string: '1',
        });
        expect(parser.parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          string: '1',
        });
        expect(parser.parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          string: '1',
        });
        expect(parser.parse(['0', '1', '-f'])).toMatchObject({
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          string: '1',
        });
        expect(parser.parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          string: '1',
        });
        expect(parser.parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          string: '-f',
        });
        expect(parser.parse(['-s', '0', '--', '1'])).toMatchObject({
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
            parse: (_, value) => value.slice(2),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-s', 'abcde'])).toMatchObject({ string: 'CDE' });
      });

      it('should handle a string option with async custom parsing', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s'],
            case: 'upper',
            parse: async (_, value) => value.slice(2),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-s', 'abcde'])).toMatchObject({ string: expect.toResolve('CDE') });
      });
    });

    describe('number', () => {
      it('should handle the completion of a number option with custom completion', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            complete: vi.fn().mockImplementation(() => ['abc']),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse('cmd -n ', { compIndex: 7 })).toThrow(/^abc$/);
        expect(options.number.complete).toHaveBeenCalled();
      });

      it('should handle the completion of a number option with custom completion that throws', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            complete: vi.fn().mockImplementation(() => {
              throw '';
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
        expect(() => parser.parse(['-f', '-n', '1'])).toThrow(
          /Option .+-f.+ requires .+-n.+ = .+0.+\./,
        );
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
        expect(() => parser.parse(['-f', '-n', '0'])).toThrow(
          /Option .+-f.+ requires .+-n.+ != .+0.+\./,
        );
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
        expect(() => parser.parse(['-n'])).toThrow(/Missing parameter to .+-n.+\./);
      });

      it('should throw an error on number option with missing parameter after positional marker', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(
          /Missing parameter after positional marker .+--.+\./,
        );
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
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker .+--.+ does not accept inline values\./,
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
        expect(parser.parse([])).toMatchObject({ number: undefined });
        expect(parser.parse(['-n', '123'])).toMatchObject({ number: 123 });
        expect(parser.parse(['--number', '0'])).toMatchObject({ number: 0 });
        expect(parser.parse(['-n=1', '-n=2'])).toMatchObject({ number: 2 });
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
        expect(parser.parse([])).toMatchObject({ number: 123 });
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
        expect(parser.parse([])).toMatchObject({ number: 123 });
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
        expect(parser.parse([])).toMatchObject({ number: expect.toResolve(123) });
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
        expect(parser.parse([])).toMatchObject({ number: undefined });
        expect(parser.parse(['-n', '0'])).toMatchObject({ number: 0 });
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
          /Invalid parameter to .+-n.+: .+-3.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
        );
        expect(() => parser.parse(['-n', 'a'])).toThrow(
          /Invalid parameter to .+-n.+: .+a.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
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
        expect(parser.parse([])).toMatchObject({ number: undefined });
        expect(parser.parse(['-n', '1'])).toMatchObject({ number: 1 });
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
          /Invalid parameter to .+-n.+: .+3.+\. Possible values are \[.+1.+, .+2.+\]\./,
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          number: 1,
        });
        expect(parser.parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          number: 1,
        });
        expect(parser.parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          number: 1,
        });
        expect(parser.parse(['0', '1', '-f'])).toMatchObject({
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          number: 1,
        });
        expect(parser.parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          number: 1,
        });
        expect(parser.parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          number: NaN,
        });
        expect(parser.parse(['-n', '0', '--', '1'])).toMatchObject({
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
            parse: (_, value) => Number(value) + 2,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-n', '1.2'])).toMatchObject({ number: 4 });
      });

      it('should handle a number option with async custom parsing', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'ceil',
            parse: async (_, value) => Number(value) + 2,
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-n', '1.2'])).toMatchObject({ number: expect.toResolve(4) });
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
        expect(parser.parse(['-n', '0.1'])).toMatchObject({ number: 0 });
        expect(parser.parse(['-n', '0.5'])).toMatchObject({ number: 0 });
        expect(parser.parse(['-n', '0.9'])).toMatchObject({ number: 0 });
        expect(parser.parse(['-n', '-.1'])).toMatchObject({ number: -0 });
        expect(parser.parse(['-n', '-.5'])).toMatchObject({ number: -0 });
        expect(parser.parse(['-n', '-.9'])).toMatchObject({ number: -0 });
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
        expect(parser.parse(['-n', '0.1'])).toMatchObject({ number: 1 });
        expect(parser.parse(['-n', '0.5'])).toMatchObject({ number: 1 });
        expect(parser.parse(['-n', '0.9'])).toMatchObject({ number: 1 });
        expect(parser.parse(['-n', '-.1'])).toMatchObject({ number: -0 });
        expect(parser.parse(['-n', '-.5'])).toMatchObject({ number: -0 });
        expect(parser.parse(['-n', '-.9'])).toMatchObject({ number: -0 });
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
        expect(parser.parse(['-n', '0.1'])).toMatchObject({ number: 0 });
        expect(parser.parse(['-n', '0.5'])).toMatchObject({ number: 0 });
        expect(parser.parse(['-n', '0.9'])).toMatchObject({ number: 0 });
        expect(parser.parse(['-n', '-.1'])).toMatchObject({ number: -1 });
        expect(parser.parse(['-n', '-.5'])).toMatchObject({ number: -1 });
        expect(parser.parse(['-n', '-.9'])).toMatchObject({ number: -1 });
      });

      it('should handle a number option with nearest rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n'],
            round: 'nearest',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-n', '0.1'])).toMatchObject({ number: 0 });
        expect(parser.parse(['-n', '0.5'])).toMatchObject({ number: 1 });
        expect(parser.parse(['-n', '0.9'])).toMatchObject({ number: 1 });
        expect(parser.parse(['-n', '-.1'])).toMatchObject({ number: -0 });
        expect(parser.parse(['-n', '-.5'])).toMatchObject({ number: -0 });
        expect(parser.parse(['-n', '-.9'])).toMatchObject({ number: -1 });
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
        expect(() => parser.parse('cmd -ss ', { compIndex: 8 })).toThrow(/^abc$/);
        expect(options.strings.complete).toHaveBeenCalled();
      });

      it('should handle the completion of a strings option with custom completion that throws', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            complete: vi.fn().mockImplementation(() => {
              throw '';
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
          /Option .+-f.+ requires .+-ss.+ = \[.+'0'.+, .+'1'.+\]\./,
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
          /Option .+-f.+ requires .+-ss.+ != \[.+'0'.+, .+'1'.+\]\./,
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
        expect(() => parser.parse(['-ss'])).toThrow(/Missing parameter to .+-ss.+\./);
      });

      it('should throw an error on strings option with missing parameter after positional marker', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss'],
            separator: ',',
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(
          /Missing parameter after positional marker .+--.+\./,
        );
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
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker .+--.+ does not accept inline values\./,
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
          /Option .+-ss.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
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
          /Option .+-ss.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
        );
      });

      it('should throw a name suggestion on parse failure from variadic strings option', () => {
        const regex = new RegExp(
          `Option .+-ss.+ has too many values \\(.+1.+\\)\\. Should have at most .+0.+\\.` +
            `\nDid you mean to specify an option name instead of .+ss.+\\?` +
            `\nSimilar names are: .+-ss.+\\.`,
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
        expect(parser.parse([])).toMatchObject({ strings: undefined });
        expect(parser.parse(['-ss', '123', '456'])).toMatchObject({ strings: ['123', '456'] });
        expect(parser.parse(['--strings'])).toMatchObject({ strings: [] });
        expect(parser.parse(['--strings', '   '])).toMatchObject({ strings: ['   '] });
        expect(parser.parse(['-ss=123', '-ss=456'])).toMatchObject({ strings: ['123', '456'] });
        expect(parser.parse(['-ss', 'a', 'b', '-ss', 'c', 'd'])).toMatchObject({
          strings: ['a', 'b', 'c', 'd'],
        });
      });

      it('should handle a strings option with a default value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            default: ['one', 'two'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ strings: ['one', 'two'] });
      });

      it('should handle a strings option with a default callback', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            default: () => ['one', 'two'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ strings: ['one', 'two'] });
      });

      it('should handle a strings option with an async default callback', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            default: async () => ['one', 'two'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ strings: expect.toResolve(['one', 'two']) });
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
        expect(parser.parse([])).toMatchObject({ strings: undefined });
        expect(parser.parse(['-ss', ' one , one '])).toMatchObject({ strings: ['one', 'one'] });
        expect(parser.parse(['-ss', ' two '])).toMatchObject({ strings: ['two'] });
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
          /Invalid parameter to .+-ss.+: .+'abc'.+\. Value must match the regex .+\/\\d\+\/s.+\./,
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
        expect(parser.parse(['-ss', ' one, two '])).toMatchObject({ strings: ['one', 'two'] });
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
        expect(parser.parse(['-ss', 'OnE,T O.'])).toMatchObject({ strings: ['one', 't o.'] });
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
        expect(parser.parse(['-ss', 'o?Ne,2ki'])).toMatchObject({ strings: ['O?NE', '2KI'] });
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
          /Invalid parameter to .+-ss.+: .+'abc'.+\. Possible values are \[.+'one'.+, .+'two'.+\]\./,
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          strings: ['0', '1'],
        });
        expect(parser.parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          strings: ['0', '1'],
        });
        expect(parser.parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          strings: ['1'],
        });
        expect(parser.parse(['0', '1', '-f'])).toMatchObject({
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          strings: ['0', '1'],
        });
        expect(parser.parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          strings: ['0', '1'],
        });
        expect(parser.parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          strings: ['0', '-f'],
        });
        expect(parser.parse(['-ss', '0', '--', '1'])).toMatchObject({
          flag: undefined,
          strings: ['1'],
        });
        expect(parser.parse(['--'])).toMatchObject({
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
            parse: (_, value): string | Promise<string> => {
              const res = value.slice(2);
              return value.startsWith('a') ? res : Promise.resolve(res);
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ss'])).toMatchObject({ strings: [] });
        expect(parser.parse(['-ss', 'abcd', 'abCD'])).toMatchObject({ strings: ['CD'] });
        expect(parser.parse(['-ss', 'abcd', '12CD'])).toMatchObject({
          strings: expect.toResolve(['CD']),
        });
        expect(parser.parse(['-ss', '12CD', 'abcd'])).toMatchObject({
          strings: expect.toResolve(['CD']),
        });
        expect(parser.parse(['-ss', '12CD', '34cd'])).toMatchObject({
          strings: expect.toResolve(['CD']),
        });
        expect(parser.parse(['-ss', 'abcd', '-ss'])).toMatchObject({ strings: [] });
        expect(parser.parse(['-ss', '12CD', '-ss'])).toMatchObject({
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
            parseDelimited: (_, value): Array<string> | Promise<Array<string>> => {
              const res = value.split(',').flatMap((val) => val.split('|'));
              return value.startsWith('a') ? res : Promise.resolve(res);
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-ss'])).toThrow(/Missing parameter to .+-ss.+\./);
        expect(parser.parse(['-ss', 'a,b|B', '-ss', 'a,B|b'])).toMatchObject({
          strings: ['A', 'B'],
        });
        expect(parser.parse(['-ss', 'a,b|B', '-ss', 'c,d|D'])).toMatchObject({
          strings: expect.toResolve(['A', 'B', 'C', 'D']),
        });
        expect(parser.parse(['-ss', 'c,d|D', '-ss', 'a,b|B'])).toMatchObject({
          strings: expect.toResolve(['C', 'D', 'A', 'B']),
        });
        expect(parser.parse(['-ss', 'c,d|D', '-ss', 'C|D'])).toMatchObject({
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
        expect(() => parser.parse('cmd -ns ', { compIndex: 8 })).toThrow(/^abc$/);
        expect(options.numbers.complete).toHaveBeenCalled();
      });

      it('should handle the completion of a numbers option with custom completion that throws', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            complete: vi.fn().mockImplementation(() => {
              throw '';
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
          /Option .+-f.+ requires .+-ns.+ = \[.+0.+, .+1.+\]\./,
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
          /Option .+-f.+ requires .+-ns.+ != \[.+0.+, .+1.+\]\./,
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
        expect(() => parser.parse(['-ns'])).toThrow(/Missing parameter to .+-ns.+\./);
      });

      it('should throw an error on numbers option with missing parameter after positional marker', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            separator: ',',
            positional: '--',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['--'])).toThrow(
          /Missing parameter after positional marker .+--.+\./,
        );
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
        expect(() => parser.parse(['--=a'])).toThrow(
          /Positional marker .+--.+ does not accept inline values\./,
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
          /Option .+-ns.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
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
          /Option .+-ns.+ has too many values \(.+3.+\)\. Should have at most .+2.+\./,
        );
      });

      it('should throw a name suggestion on parse failure from variadic numbers option', () => {
        const regex = new RegExp(
          `Option .+-ns.+ has too many values \\(.+1.+\\)\\. Should have at most .+0.+\\.` +
            `\nDid you mean to specify an option name instead of .+ns.+\\?` +
            `\nSimilar names are: .+-ns.+\\.`,
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
        expect(parser.parse([])).toMatchObject({ numbers: undefined });
        expect(parser.parse(['-ns', '456', ' 123 '])).toMatchObject({ numbers: [456, 123] });
        expect(parser.parse(['--numbers'])).toMatchObject({ numbers: [] });
        expect(parser.parse(['--numbers', '   '])).toMatchObject({ numbers: [0] });
        expect(parser.parse(['-ns=456', '-ns=123'])).toMatchObject({ numbers: [456, 123] });
        expect(parser.parse(['-ns', '5', '-ns', '6', '7'])).toMatchObject({ numbers: [5, 6, 7] });
      });

      it('should handle a numbers option with a default value', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            default: [1, 2],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ numbers: [1, 2] });
      });

      it('should handle a numbers option with a default callback', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            default: () => [1, 2],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ numbers: [1, 2] });
      });

      it('should handle a numbers option with an async default callback', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            default: async () => [1, 2],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse([])).toMatchObject({ numbers: expect.toResolve([1, 2]) });
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
        expect(parser.parse([])).toMatchObject({ numbers: undefined });
        expect(parser.parse(['-ns', ' 1 , 1 '])).toMatchObject({ numbers: [1, 1] });
        expect(parser.parse(['-ns', ' 2 '])).toMatchObject({ numbers: [2] });
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
          /Invalid parameter to .+-ns.+: .+-3.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
        );
        expect(() => parser.parse(['-ns', 'a'])).toThrow(
          /Invalid parameter to .+-ns.+: .+a.+\. Value must be in the range \[.+0.+, .+Infinity.+\]\./,
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
          /Invalid parameter to .+-ns.+: .+3.+\. Possible values are \[.+1.+, .+2.+\]\./,
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          numbers: [0, 1],
        });
        expect(parser.parse(['-f', '0', '1'])).toMatchObject({
          flag: true,
          numbers: [0, 1],
        });
        expect(parser.parse(['0', '-f', '1'])).toMatchObject({
          flag: true,
          numbers: [1],
        });
        expect(parser.parse(['0', '1', '-f'])).toMatchObject({
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
        expect(parser.parse(['0', '1'])).toMatchObject({
          flag: undefined,
          numbers: [0, 1],
        });
        expect(parser.parse(['--', '0', '1'])).toMatchObject({
          flag: undefined,
          numbers: [0, 1],
        });
        expect(parser.parse(['--', '0', '-f'])).toMatchObject({
          flag: undefined,
          numbers: [0, NaN],
        });
        expect(parser.parse(['-ns', '0', '--', '1'])).toMatchObject({
          flag: undefined,
          numbers: [1],
        });
        expect(parser.parse(['--'])).toMatchObject({
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
            parse: (_, value): number | Promise<number> => {
              const res = Number(value) + 2;
              return value.startsWith('1') ? res : Promise.resolve(res);
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ns'])).toMatchObject({ numbers: [] });
        expect(parser.parse(['-ns', '1.2', '1.7'])).toMatchObject({ numbers: [4] });
        expect(parser.parse(['-ns', '1.2', '2.2'])).toMatchObject({
          numbers: expect.toResolve([4, 5]),
        });
        expect(parser.parse(['-ns', '2.2', '1.2'])).toMatchObject({
          numbers: expect.toResolve([5, 4]),
        });
        expect(parser.parse(['-ns', '2.2', '2.7'])).toMatchObject({
          numbers: expect.toResolve([5]),
        });
        expect(parser.parse(['-ns', '1.2', '-ns'])).toMatchObject({ numbers: [] });
        expect(parser.parse(['-ns', '2.2', '-ns'])).toMatchObject({
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
            parseDelimited: (_, value): Array<number> | Promise<Array<number>> => {
              const res = value
                .split(',')
                .flatMap((val) => val.split('|').map((val) => Number(val)));
              return value.startsWith('1') ? res : Promise.resolve(res);
            },
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(() => parser.parse(['-ns'])).toThrow(/Missing parameter to .+-ns.+\./);
        expect(parser.parse(['-ns', '1.1,2.2|2.3'])).toMatchObject({ numbers: [2, 3] });
        expect(parser.parse(['-ns', '1.1,2.2|2.3', '-ns', '11|12'])).toMatchObject({
          numbers: [2, 3, 11, 12],
        });
        expect(parser.parse(['-ns', '1.1,2.2|2.3', '-ns', '21|22'])).toMatchObject({
          numbers: expect.toResolve([2, 3, 21, 22]),
        });
        expect(parser.parse(['-ns', '21|22', '-ns', '1.1,2.2|2.3'])).toMatchObject({
          numbers: expect.toResolve([21, 22, 2, 3]),
        });
        expect(parser.parse(['-ns', '21|22', '-ns', '20.2|21.2'])).toMatchObject({
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
        expect(parser.parse(['-ns', '0.1', '-.1'])).toMatchObject({ numbers: [0, -0] });
        expect(parser.parse(['-ns', '0.5', '-.5'])).toMatchObject({ numbers: [0, -0] });
        expect(parser.parse(['-ns', '0.9', '-.9'])).toMatchObject({ numbers: [0, -0] });
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
        expect(parser.parse(['-ns', '0.1', '-.1'])).toMatchObject({ numbers: [1, -0] });
        expect(parser.parse(['-ns', '0.5', '-.5'])).toMatchObject({ numbers: [1, -0] });
        expect(parser.parse(['-ns', '0.9', '-.9'])).toMatchObject({ numbers: [1, -0] });
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
        expect(parser.parse(['-ns', '0.1', '-.1'])).toMatchObject({ numbers: [0, -1] });
        expect(parser.parse(['-ns', '0.5', '-.5'])).toMatchObject({ numbers: [0, -1] });
        expect(parser.parse(['-ns', '0.9', '-.9'])).toMatchObject({ numbers: [0, -1] });
      });

      it('should handle a numbers option with nearest rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns'],
            round: 'nearest',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        expect(parser.parse(['-ns', '0.1', '-.1'])).toMatchObject({ numbers: [0, -0] });
        expect(parser.parse(['-ns', '0.5', '-.5'])).toMatchObject({ numbers: [1, -0] });
        expect(parser.parse(['-ns', '0.9', '-.9'])).toMatchObject({ numbers: [1, -1] });
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
      expect(values).toMatchObject({ flag: false });
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
      expect(values).toMatchObject({ flag: true });
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
        /^Could not find a 'package.json' file\.$/,
      );
    });

    it('should handle a function option with an asynchronous callback', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec: async () => {
            throw 'function';
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parseAsync(['-f'])).rejects.toThrow(/^function$/);
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
  });
});
