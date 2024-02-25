import { describe, expect, it } from 'vitest';
import { HelpFormatter, req, style, tf, fg8, type Options } from '../lib';

// eslint-disable-next-line no-control-regex
const sequenceRegex = /(?:\x9b[\d;]+[BCGm])+/g;

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle no options', () => {
      expect(new HelpFormatter({}).formatHelp()).toEqual('');
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--functionA function option.`);
      });
    });

    describe('flag', () => {
      it('should handle an option with custom styles', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option with custom styles',
            styles: {
              names: style(tf.clear, tf.inverse, fg8(138)),
              desc: style(tf.clear, tf.italic, tf.crossedOut),
            },
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option with custom styles.`);
      });

      it('should handle an option with inline styles in the description', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: `A flag option with ${style(tf.bold, fg8(123))}inline styles${style(tf.clear)}.`,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option with inline styles.`);
      });

      it('should handle an option with paragraphs in the description', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: `A flag option with
            line breaks,\ttabs and ...

            paragraphs.`,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-f,--flagA flag option with line breaks, tabs and...\n\nparagraphs.`,
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(/-f,--flagA flag option with lists:\n- item1\n\* item2\n1. item3/);
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
        expect(new HelpFormatter(options).formatHelp()).toEqual('');
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
        const groups = new HelpFormatter(options).formatGroups(200);
        const group = groups.get('group');
        assert(group);
        const message = group.replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option.`);
      });

      it('should handle a deprecated option', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            deprecated: 'reason',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option. Deprecated for reason.`);
      });

      it('should handle a required option', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            required: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option. Always required.`);
      });

      it('should handle an option that requires the presence of another', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            requires: 'required',
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option. Requires -req.`);
      });

      it('should handle an option that requires the presence of another (2)', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            requires: { required: undefined },
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option. Requires -req.`);
      });

      it('should handle an option that requires the absence of another', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            requires: req.not('required'),
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option. Requires no -req.`);
      });

      it('should handle an option that requires the absence of another (2)', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            requires: { required: null },
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option. Requires no -req.`);
      });

      it('should handle an option that requires another option with a value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            requires: { required: 'abc' },
          },
          required: {
            type: 'string',
            names: ['-req', '--req'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option. Requires -req = 'abc'.`);
      });

      it('should handle a option with a requirement expression', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-f,--flagA flag option. Requires (-req1 and (-req2 = 1 or -req3 != '2')).`,
        );
      });

      it('should handle a flag option with negation names', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', '--flag'],
            desc: 'A flag option',
            negationNames: ['-no-f', '', '--no-flag'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-f,--flagA flag option. Can be negated with -no-f or --no-flag.`);
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
        const config = { breaks: { names: -1, param: -1, desc: -1 } };
        const formatter = new HelpFormatter(options, config);
        const message = formatter.formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(/^-b,--boolean<boolean>A boolean option\.$/);
      });

      it('should break columns in the help message when configured with positive values', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const config = { breaks: { names: 1, param: 1, desc: 1 } };
        const formatter = new HelpFormatter(options, config);
        const message = formatter.formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(/^\n-b,--boolean\n<boolean>\nA boolean option\.$/);
      });

      it('should hide the option names from the help message when configured to do so', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const formatter = new HelpFormatter(options, { hidden: { names: true } });
        const message = formatter.formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(/^<boolean>A boolean option\.$/);
      });

      it('should hide the option param from the help message when configured to do so', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const formatter = new HelpFormatter(options, { hidden: { param: true } });
        const message = formatter.formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(/^-b,--booleanA boolean option\./);
      });

      it('should hide the option description from the help message when configured to do so', () => {
        const options = {
          flag: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
          },
        } as const satisfies Options;
        const formatter = new HelpFormatter(options, { hidden: { desc: true } });
        const message = formatter.formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(/^-b,--boolean<boolean>$/);
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-b,--boolean<param>A boolean option.`);
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-b,--boolean<token>=<value>A boolean option.`);
      });

      it('should handle a boolean option with a default value', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            default: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-b,--boolean<boolean>A boolean option. Defaults to true.`);
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-b,--boolean` + `trueA boolean option.`);
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-s,--string<param>A string option.`);
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-s,--string<token>=<value>A string option.`);
      });

      it('should handle a string option with a default value', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            default: '123',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-s,--string<string>A string option. Defaults to '123'.`);
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-s,--string'123'A string option.`);
      });

      it('should handle a string option with enumeration constraint', () => {
        const options = {
          stringEnum: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-s,--string<string>A string option. Values must be one of {'one', 'two'}.`,
        );
      });

      it('should handle a string option with a regex constraint', () => {
        const options = {
          stringRegex: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            regex: /\d+/s,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-s,--string<string>A string option. Values must match the regex /\\d+/s.`,
        );
      });

      it('should handle a string option whose values will be trimmed', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            trim: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-s,--string<string>A string option. Values will be trimmed.`);
      });

      it('should handle a string option whose values will be converted to lowercase', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            case: 'lower',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-s,--string<string>A string option. Values will be converted to lowercase.`,
        );
      });

      it('should handle a string option whose values will be converted to uppercase', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-s', '--string'],
            desc: 'A string option',
            case: 'upper',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-s,--string<string>A string option. Values will be converted to uppercase.`,
        );
      });
    });

    describe('number', () => {
      it('should handle a number option with a default value', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            default: 123,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-n,--number<number>A number option. Defaults to 123.`);
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
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-n,--number123A number option.`);
      });

      it('should handle a number option with enumeration constraint', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            enums: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-n,--number<number>A number option. Values must be one of {1, 2}.`,
        );
      });

      it('should handle a number option with a range constraint', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            range: [0, Infinity],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-n,--number<number>A number option. Values must be in the range [0, Infinity].`,
        );
      });

      it('should handle a number option with truncation', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            round: 'trunc',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-n,--number<number>A number option. Values will be truncated.`);
      });

      it('should handle a number option with ceil rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            round: 'ceil',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-n,--number<number>A number option. Values will be rounded to the ceil integer.`,
        );
      });

      it('should handle a number option with floor rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            round: 'floor',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-n,--number<number>A number option. Values will be rounded to the floor integer.`,
        );
      });

      it('should handle a number option with nearest rounding', () => {
        const options = {
          number: {
            type: 'number',
            names: ['-n', '--number'],
            desc: 'A number option',
            round: 'nearest',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-n,--number<number>A number option. Values will be rounded to the nearest integer.`,
        );
      });
    });

    describe('strings', () => {
      it('should handle a strings option delimited with a regular expression', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            append: true,
            separator: /[,;]/s,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Values are delimited by /[,;]/s. May be specified multiple times.`,
        );
      });

      it('should handle a delimited strings option that can be specified multiple times', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            append: true,
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Values are delimited by ','. May be specified multiple times.`,
        );
      });

      it('should handle a variadic strings option with a default value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            default: ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Accepts multiple parameters. Defaults to ['one', 'two'].`,
        );
      });

      it('should handle a strings option delimited with a regular expression with an example value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            example: ['one', 'two'],
            separator: /[,;]/s,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings'one[,;]two'A strings option. Values are delimited by /[,;]/s.`,
        );
      });

      it('should handle a delimited strings option with an example value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            example: ['one', 'two'],
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings'one,two'A strings option. Values are delimited by ','.`,
        );
      });

      it('should handle a variadic strings option with enumerated values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Accepts multiple parameters. Values must be one of {'one', 'two'}.`,
        );
      });

      it('should handle a delimited strings option with a regex constraint', () => {
        const options = {
          stringsRegex: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            regex: /\d+/s,
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Values are delimited by ','. Values must match the regex /\\d+/s.`,
        );
      });

      it('should handle a variadic strings option that accepts positional arguments', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            positional: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Accepts multiple parameters. Accepts positional parameters.`,
        );
      });

      it('should handle a variadic strings option that accepts positional arguments after marker', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            positional: '--',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Accepts multiple parameters. Accepts positional parameters preceded by --.`,
        );
      });

      it('should handle a delimited strings option whose values will be trimmed', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            separator: ',',
            trim: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Values are delimited by ','. Values will be trimmed.`,
        );
      });

      it('should handle a delimited strings option whose values will be converted to lowercase', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            separator: ',',
            case: 'lower',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Values are delimited by ','. Values will be converted to lowercase.`,
        );
      });

      it('should handle a delimited strings option whose values will be converted to uppercase', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            separator: ',',
            case: 'upper',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Values are delimited by ','. Values will be converted to uppercase.`,
        );
      });

      it('should handle a variadic strings option that has a value count limit', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            limit: 2,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Accepts multiple parameters. Value count is limited to 2.`,
        );
      });

      it('should handle a delimited strings option whose values are unique', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            separator: ',',
            unique: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ss,--strings<strings>A strings option. Values are delimited by ','. Duplicate values will be removed.`,
        );
      });
    });

    describe('numbers', () => {
      it('should handle a delimited numbers option that can be specified multiple times', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            append: true,
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Values are delimited by ','. May be specified multiple times.`,
        );
      });

      it('should handle a variadic numbers option with a default value', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            default: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Accepts multiple parameters. Defaults to [1, 2].`,
        );
      });

      it('should handle a delimited numbers option with an example value', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            example: [1, 2],
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(`-ns,--numbers'1,2'A numbers option. Values are delimited by ','.`);
      });

      it('should handle a variadic numbers option with enumerated values', () => {
        const options = {
          numbersEnum: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            enums: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Accepts multiple parameters. Values must be one of {1, 2}.`,
        );
      });

      it('should handle a delimited numbers option with a range constraint', () => {
        const options = {
          numbersRange: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            range: [0, Infinity],
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Values are delimited by ','. Values must be in the range [0, Infinity].`,
        );
      });

      it('should handle a variadic numbers option that accepts positional arguments', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            positional: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Accepts multiple parameters. Accepts positional parameters.`,
        );
      });

      it('should handle a delimited numbers option whose values are unique', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            separator: ',',
            unique: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Values are delimited by ','. Duplicate values will be removed.`,
        );
      });

      it('should handle a variadic numbers option that has a value count limit', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            limit: 2,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Accepts multiple parameters. Value count is limited to 2.`,
        );
      });

      it('should handle a delimited numbers option with truncation', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            separator: ',',
            round: 'trunc',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Values are delimited by ','. Values will be truncated.`,
        );
      });

      it('should handle a variadic numbers option with ceil rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            round: 'ceil',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Accepts multiple parameters. Values will be rounded to the ceil integer.`,
        );
      });

      it('should handle a delimited numbers option with floor rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            separator: ',',
            round: 'floor',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Values are delimited by ','. Values will be rounded to the floor integer.`,
        );
      });

      it('should handle a variadic numbers option with nearest rounding', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            round: 'nearest',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200).replace(sequenceRegex, '');
        expect(message).toMatch(
          `-ns,--numbers<numbers>A numbers option. Accepts multiple parameters. Values will be rounded to the nearest integer.`,
        );
      });
    });
  });
});
