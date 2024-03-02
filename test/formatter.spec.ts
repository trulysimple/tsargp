import { describe, expect, it } from 'vitest';
import type { Options, FormatConfig } from '../lib';
import { HelpFormatter, req, style, tf, fg8, emptyStyles } from '../lib';

const config: FormatConfig = { styles: emptyStyles };

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle no options', () => {
      const message = new HelpFormatter({}).formatHelp();
      expect(message.toString()).toEqual('');
    });

    describe('fuction', () => {
      it('should handle a function option', () => {
        const options = {
          function: {
            type: 'function',
            names: ['-f', '--function'],
            desc: 'A function option',
            exec: () => {},
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --function    A function option\n');
      });
    });

    describe('flag', () => {
      it('should handle an option with no names or description', () => {
        const options = {
          flag: { type: 'flag' },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('\n');
      });

      it('should handle an option with no description', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f\n');
      });

      it('should handle an option with a link', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            link: new URL('https://trulysimple.dev/tsargp/docs'),
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -f, --flag    A flag option. Refer to https://trulysimple.dev/tsargp/docs for details.\n',
        );
      });

      it('should handle an option with custom styles', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option with custom styles',
            styles: {
              names: style(tf.clear, tf.inverse, fg8(138)),
              descr: style(tf.clear, tf.italic, tf.crossedOut),
            },
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option with custom styles\n');
      });

      it('should handle an option with inline styles in the description', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: `A flag option with ${style(tf.bold, fg8(123))}inline styles${style(tf.clear)}`,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option with inline styles\n');
      });

      it('should handle an option with paragraphs in the description', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: `A flag option with
            line breaks,\ttabs and ...

            paragraphs`,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toMatch(
          /^ {2}-f, --flag {4}A flag option with line breaks, tabs and ...\n\n {16}paragraphs\n$/,
        );
      });

      it('should handle an option with lists in the description', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: `A flag option with lists:
            - item1
            * item2
            1. item3`,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toMatch(
          /^ {2}-f, --flag {4}A flag option with lists:\n {16}- item1\n {16}\* item2\n {16}1\. item3\n$/,
        );
      });

      it('should hide an option from the help message when it asks so', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            hide: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('');
      });

      it('should handle an option with a group', () => {
        function assert(_condition: unknown): asserts _condition {}
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            group: 'group',
          },
        } as const satisfies Options;
        const groups = new HelpFormatter(options, config).formatGroups();
        const group = groups.get('group');
        assert(group);
        const message = group;
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option\n');
      });

      it('should handle a deprecated option', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            deprecated: 'reason',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option. Deprecated for reason.\n');
      });

      it('should handle a required option', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            required: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option. Always required.\n');
      });

      it('should handle an option that requires the presence of another', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            requires: 'required',
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
            hide: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option. Requires -req.\n');
      });

      it('should handle an option that requires the presence of another (2)', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            requires: { required: undefined },
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
            hide: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option. Requires -req.\n');
      });

      it('should handle an option that requires the absence of another', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            requires: req.not('required'),
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
            hide: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option. Requires no -req.\n');
      });

      it('should handle an option that requires the absence of another (2)', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            requires: { required: null },
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
            hide: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -f, --flag    A flag option. Requires no -req.\n');
      });

      it('should handle an option that requires another option with a value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            requires: { required: 'abc' },
          },
          required: {
            type: 'string',
            names: ['-req', '--req'],
            hide: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(`  -f, --flag    A flag option. Requires -req = 'abc'.\n`);
      });

      it('should handle a option with a requirement expression', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            requires: req.all('required1', req.one({ required2: 1 }, req.not({ required3: '2' }))),
          },
          required1: {
            type: 'boolean',
            names: ['-req1', '--req1'],
            hide: true,
          },
          required2: {
            type: 'number',
            names: ['-req2', '--req2'],
            hide: true,
          },
          required3: {
            type: 'string',
            names: ['-req3', '--req3'],
            hide: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -f, --flag    A flag option. Requires (-req1 and (-req2 = 1 or -req3 != '2')).\n`,
        );
      });

      it('should handle a flag option with negation names', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option.',
            negationNames: ['-no-f', '', '--no-flag'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -f, --flag    A flag option. Can be negated with -no-f or --no-flag.\n',
        );
      });
    });

    describe('boolean', () => {
      it('should not break columns in the help message when configured with negative values', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const config: FormatConfig = {
          breaks: { names: -1, param: -1, descr: -1 },
        };
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -b, --boolean  <boolean>  A boolean option\n');
      });

      it('should break columns in the help message when configured with positive indentation', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const config: FormatConfig = {
          breaks: { names: 1, param: 1, descr: 1 },
        };
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toMatch(
          /^\n {2}-b, --boolean\n {17}<boolean>\n {28}A boolean option\n$/,
        );
      });

      it('should break columns in the help message when configured with absolute indentation', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const config: FormatConfig = {
          indent: { paramAbsolute: true, descrAbsolute: true },
          breaks: { names: 1, param: 1, descr: 1 },
        };
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toMatch(
          /^\n {2}-b, --boolean\n {2}<boolean>\n {2}A boolean option\n$/,
        );
      });

      it('should break columns in the help message when configured with negative indentation', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const config: FormatConfig = {
          indent: { names: -1, param: -1, descr: -1 },
          breaks: { names: 1, param: 1, descr: 1 },
        };
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toMatch(
          /^\n-b, --boolean\n {12}<boolean>\n {20}A boolean option\n$/,
        );
      });

      it('should hide the option names from the help message when configured to do so', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const config: FormatConfig = { hidden: { names: true } };
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('    <boolean>  A boolean option\n');
      });

      it('should hide the option param from the help message when configured to do so', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const config: FormatConfig = { hidden: { param: true } };
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -b, --boolean    A boolean option\n');
      });

      it('should hide the option description from the help message when configured to do so', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const config: FormatConfig = { hidden: { descr: true } };
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -b, --boolean  <boolean>\n');
      });

      it('should handle a boolean option with a parameter name', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            paramName: 'param',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -b, --boolean  <param>  A boolean option\n');
      });

      it('should handle a boolean option with a parameter name with angle brackets', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            paramName: '<token>=<value>',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -b, --boolean  <token>=<value>  A boolean option\n');
      });

      it('should handle a boolean option with a default value', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option.',
            default: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -b, --boolean  <boolean>  A boolean option. Defaults to true.\n',
        );
      });

      it('should handle a boolean option with a default callback', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            default: () => true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -b, --boolean  <boolean>  A boolean option\n');
      });

      it('should handle a boolean option with an example value', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            example: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -b, --boolean  true  A boolean option\n');
      });
    });

    describe('string', () => {
      it('should handle a string option with a parameter name', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            paramName: 'param',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -s, --string  <param>  A string option\n');
      });

      it('should handle a string option with a parameter name with angle brackets', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            paramName: '<token>=<value>',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -s, --string  <token>=<value>  A string option\n');
      });

      it('should handle a string option with a default value', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option.',
            default: '123',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -s, --string  <string>  A string option. Defaults to '123'.\n`,
        );
      });

      it('should handle a string option with a default callback', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            default: () => '123',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -s, --string  <string>  A string option\n');
      });

      it('should handle a string option with an example value', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            example: '123',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(`  -s, --string  '123'  A string option\n`);
      });

      it('should handle a string option with enumeration constraint', () => {
        const options = {
          stringEnum: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option.',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -s, --string  <string>  A string option. Values must be one of {'one', 'two'}.\n`,
        );
      });

      it('should handle a string option with a regex constraint', () => {
        const options = {
          stringRegex: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option.',
            regex: /\d+/s,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -s, --string  <string>  A string option. Values must match the regex /\\d+/s.\n',
        );
      });

      it('should handle a string option whose values will be trimmed', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option.',
            trim: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -s, --string  <string>  A string option. Values will be trimmed.\n',
        );
      });

      it('should handle a string option whose values will be converted to lowercase', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option.',
            case: 'lower',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -s, --string  <string>  A string option. Values will be converted to lowercase.\n',
        );
      });

      it('should handle a string option whose values will be converted to uppercase', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option.',
            case: 'upper',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -s, --string  <string>  A string option. Values will be converted to uppercase.\n',
        );
      });
    });

    describe('number', () => {
      it('should handle a number option with a default value', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option.',
            default: 123,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -n, --number  <number>  A number option. Defaults to 123.\n',
        );
      });

      it('should handle a number option with a default callback', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            default: () => 123,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -n, --number  <number>  A number option\n');
      });

      it('should handle a number option with an example value', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            example: 123,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual('  -n, --number  123  A number option\n');
      });

      it('should handle a number option with enumeration constraint', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option.',
            enums: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -n, --number  <number>  A number option. Values must be one of {1, 2}.\n',
        );
      });

      it('should handle a number option with a range constraint', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option.',
            range: [0, Infinity],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -n, --number  <number>  A number option. Values must be in the range [0, Infinity].\n',
        );
      });

      it('should handle a number option with truncation', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option.',
            round: 'trunc',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -n, --number  <number>  A number option. Values will be rounded towards zero.\n',
        );
      });

      it('should handle a number option with ceil rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option.',
            round: 'ceil',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -n, --number  <number>  A number option. Values will be rounded up.\n',
        );
      });

      it('should handle a number option with floor rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option.',
            round: 'floor',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -n, --number  <number>  A number option. Values will be rounded down.\n',
        );
      });

      it('should handle a number option with nearest rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option.',
            round: 'round',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -n, --number  <number>  A number option. Values will be rounded to the nearest integer.\n',
        );
      });
    });

    describe('strings', () => {
      it('should handle a strings option delimited with a regular expression', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            append: true,
            separator: /[,;]/s,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -ss, --strings  <strings>  A strings option. Values are delimited by /[,;]/s. May be specified multiple times.\n',
        );
      });

      it('should handle a delimited strings option that can be specified multiple times', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            append: true,
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. May be specified multiple times.\n`,
        );
      });

      it('should handle a variadic strings option with a default value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            default: ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Accepts multiple parameters. Defaults to ['one', 'two'].\n`,
        );
      });

      it('should handle a variadic strings option with a default callback', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            default: () => ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -ss, --strings  <strings>  A strings option. Accepts multiple parameters.\n',
        );
      });

      it('should handle a strings option delimited with a regular expression with an example value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            example: ['one', 'two'],
            separator: /[,;]/s,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  'one[,;]two'  A strings option. Values are delimited by /[,;]/s.\n`,
        );
      });

      it('should handle a delimited strings option with an example value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            example: ['one', 'two'],
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  'one,two'  A strings option. Values are delimited by ','.\n`,
        );
      });

      it('should handle a variadic strings option with enumerated values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Accepts multiple parameters. Values must be one of {'one', 'two'}.\n`,
        );
      });

      it('should handle a delimited strings option with a regex constraint', () => {
        const options = {
          stringsRegex: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            regex: /\d+/s,
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. Values must match the regex /\\d+/s.\n`,
        );
      });

      it('should handle a variadic strings option that accepts positional arguments', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            positional: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -ss, --strings  <strings>  A strings option. Accepts multiple parameters. Accepts positional parameters.\n',
        );
      });

      it('should handle a variadic strings option that accepts positional arguments after marker', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            positional: '--',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -ss, --strings  <strings>  A strings option. Accepts multiple parameters. Accepts positional parameters that may be preceded by --.\n',
        );
      });

      it('should handle a delimited strings option whose values will be trimmed', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            separator: ',',
            trim: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. Values will be trimmed.\n`,
        );
      });

      it('should handle a delimited strings option whose values will be converted to lowercase', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            separator: ',',
            case: 'lower',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. Values will be converted to lowercase.\n`,
        );
      });

      it('should handle a delimited strings option whose values will be converted to uppercase', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            separator: ',',
            case: 'upper',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. Values will be converted to uppercase.\n`,
        );
      });

      it('should handle a variadic strings option that has a value count limit', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            limit: 2,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Accepts multiple parameters. Value count is limited to 2.\n`,
        );
      });

      it('should handle a delimited strings option whose values are unique', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option.',
            separator: ',',
            unique: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. Duplicate values will be removed.\n`,
        );
      });
    });

    describe('numbers', () => {
      it('should handle a delimited numbers option that can be specified multiple times', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            append: true,
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. May be specified multiple times.\n`,
        );
      });

      it('should handle a variadic numbers option with a default value', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            default: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toMatch(
          `  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters. Defaults to [1, 2].\n`,
        );
      });

      it('should handle a variadic numbers option with a default callback', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            default: () => [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          '  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters.\n',
        );
      });

      it('should handle a delimited numbers option with an example value', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            example: [1, 2],
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  '1,2'  A numbers option. Values are delimited by ','.\n`,
        );
      });

      it('should handle a variadic numbers option with enumerated values', () => {
        const options = {
          numbersEnum: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            enums: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters. Values must be one of {1, 2}.\n`,
        );
      });

      it('should handle a delimited numbers option with a range constraint', () => {
        const options = {
          numbersRange: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            range: [0, Infinity],
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Values must be in the range [0, Infinity].\n`,
        );
      });

      it('should handle a variadic numbers option that accepts positional arguments', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            positional: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters. Accepts positional parameters.\n`,
        );
      });

      it('should handle a delimited numbers option whose values are unique', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            separator: ',',
            unique: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Duplicate values will be removed.\n`,
        );
      });

      it('should handle a variadic numbers option that has a value count limit', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            limit: 2,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters. Value count is limited to 2.\n`,
        );
      });

      it('should handle a delimited numbers option with truncation', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            separator: ',',
            round: 'trunc',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Values will be rounded towards zero.\n`,
        );
      });

      it('should handle a variadic numbers option with ceil rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            round: 'ceil',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters. Values will be rounded up.\n`,
        );
      });

      it('should handle a delimited numbers option with floor rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            separator: ',',
            round: 'floor',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Values will be rounded down.\n`,
        );
      });

      it('should handle a variadic numbers option with nearest rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option.',
            round: 'round',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options, config).formatHelp();
        expect(message.wrap(0)).toEqual(
          `  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters. Values will be rounded to the nearest integer.\n`,
        );
      });
    });
  });
});
