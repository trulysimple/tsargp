import { describe, expect, it } from 'vitest';
import { HelpFormatter } from './formatter.js';
import { req, type Options } from './options.js';

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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(/-f.*,.+--function.+A function option\./s);
      });
    });

    describe('boolean', () => {
      it('should hide an option from the help message when it asks so', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            hide: true,
          },
        } as const satisfies Options;
        expect(new HelpFormatter(options).formatHelp()).toEqual('');
      });

      it('should handle an option with a group', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            group: 'group',
          },
        } as const satisfies Options;
        const groups = new HelpFormatter(options).formatGroups(200);
        expect(groups.get('group')).toMatch(/-b.*,.+--boolean.+A boolean option\./s);
      });

      it('should handle a deprecated option', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            deprecated: 'reason',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(/-b.*,.+--boolean.+A boolean option\..+Deprecated for reason\./s);
      });

      it('should handle a required option', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            required: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(/-b.*,.+--boolean.+A boolean option\..+Always required\./s);
      });

      it('should handle an option with a single requirement', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            requires: 'required',
          },
          required: {
            type: 'boolean',
            names: ['-req', '--req'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(/-b.*,.+--boolean.+A boolean option\..+Requires.+-req.+\./s);
      });

      it('should handle a option with a requirement with a value', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            requires: 'required=abc',
          },
          required: {
            type: 'string',
            names: ['-req', '--req'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-b.*,.+--boolean.+A boolean option\..+Requires.+-req.+=.+'abc'.+\./s,
        );
      });

      it('should handle a option with a requirement expression', () => {
        const options = {
          boolean: {
            type: 'boolean',
            names: ['-b', '--boolean'],
            desc: 'A boolean option',
            requires: req.and('required1', req.or('required2=1', 'required2=2')),
          },
          required1: {
            type: 'boolean',
            names: ['-req1', '--req1'],
          },
          required2: {
            type: 'number',
            names: ['-req2', '--req2'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-b.*,.+--boolean.+A boolean option\..+Requires.+\(.+-req1.+and.+\(.+-req2.+=.+'1'.+or.+-req2.+=.+'2'.+\)\)\./s,
        );
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(/-s.*,.+--string.+<param>.+A string option\./s);
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-s.*,.+--string.+<string>.+A string option\..+Defaults to.+'123'.+\./s,
        );
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(/-s.*,.+--string.+'123'.+A string option\./s);
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-s.*,.+--string.+A string option\..+Values must be one of.+\{.+'one'.+,.+'two'.+\}\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-s.*,.+--string.+<string>.+A string option\..+Values must match the regex.+\/\\d\+\/s.+\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-s.*,.+--string.+<string>.+A string option\..+Values will be trimmed\./s,
        );
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-s.*,.+--string.+<string>.+A string option\..+Values will be converted to lower-case\./s,
        );
      });

      it('should handle a string option whose values will be converted to uppercase', () => {
        const options = {
          string: {
            type: 'string',
            names: ['-ss', '--string'],
            desc: 'A string option',
            case: 'upper',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-s.*,.+--string.+<string>.+A string option\..+Values will be converted to upper-case\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-n.*,.+--number.+<number>.+A number option\..+Defaults to.+123.+\./s,
        );
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(/-n.*,.+--number.+123.+A number option\./s);
      });

      it('should handle a number option with enumeration constraint', () => {
        const options = {
          numberEnum: {
            type: 'number',
            names: ['-ne', '--numberEnum'],
            desc: 'A number option',
            enums: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ne.*,.+--numberEnum.+A number option\..+Values must be one of.+\{.+1.+,.+2.+\}\./s,
        );
      });

      it('should handle a number option with a range constraint', () => {
        const options = {
          numberRange: {
            type: 'number',
            names: ['-nr', '--numberRange'],
            desc: 'A number option',
            range: [0, Infinity],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-nr.*,.+--numberRange.+<number>.+A number option\..+Values must be in the range.+\[.+0.+,.+Infinity.+\]\./s,
        );
      });
    });

    describe('strings', () => {
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Values are delimited by.+','.+\..+May be specified multiple times\./s,
        );
      });

      it('should handle a multivalued strings option with a default value', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            default: ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Accepts multiple parameters\..+Defaults to.+'one'.+'two'.+\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+'one,two'.+A strings option\..+Values are delimited by.+','.+\./s,
        );
      });

      it('should handle a multivalued strings option with enumerated values', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            enums: ['one', 'two'],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Accepts multiple parameters\..+Values must be one of.+\{.+'one'.+,.+'two'.+\}\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Values are delimited by.+','.+\..+Values must match the regex.+\/\\d\+\/s.+\./s,
        );
      });

      it('should handle a multivalued strings option that accepts positional arguments', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            positional: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Accepts multiple parameters\..+Accepts positional parameters\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Values are delimited by.+','.+\..+Values will be trimmed\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Values are delimited by.+','.+\..+Values will be converted to lower-case\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Values are delimited by.+','.+\..+Values will be converted to upper-case\./s,
        );
      });

      it('should handle a multivalued strings option that has a value count limit', () => {
        const options = {
          strings: {
            type: 'strings',
            names: ['-ss', '--strings'],
            desc: 'A strings option',
            limit: 2,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Accepts multiple parameters\..+Value count is limited to.+2.+\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ss.*,.+--strings.+<strings>.+A strings option\..+Values are delimited by.+','.+\..+Duplicate values will be removed\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ns.*,.+--numbers.+<numbers>.+A numbers option\..+Values are delimited by.+','.+\..+May be specified multiple times\./s,
        );
      });

      it('should handle a multivalued numbers option with a default value', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            default: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ns.*,.+--numbers.+<numbers>.+A numbers option\..+Accepts multiple parameters\..+Defaults to.+1.+2.+\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ns.*,.+--numbers.+'1,2'.+A numbers option\..+Values are delimited by.+','.+\./s,
        );
      });

      it('should handle a multivalued numbers option with enumerated values', () => {
        const options = {
          numbersEnum: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            enums: [1, 2],
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ns.*,.+--numbers.+<numbers>.+A numbers option\..+Accepts multiple parameters\..+Values must be one of.+\{.+1.+,.+2.+\}\./s,
        );
      });

      it('should handle a delimited numbers option with a range constraint', () => {
        const options = {
          numbersRange: {
            type: 'numbers',
            names: ['-nsr', '--numbersRange'],
            desc: 'A numbers option',
            range: [0, Infinity],
            separator: ',',
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ns.*,.+--numbers.+<numbers>.+A numbers option\..+Values are delimited by.+','.+\..+Values must be in the range.+\[.+0.+,.+Infinity.+\]\./s,
        );
      });

      it('should handle a multivalued numbers option that accepts positional arguments', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            positional: true,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ns.*,.+--numbers.+<numbers>.+A numbers option\..+Accepts multiple parameters\..+Accepts positional parameters\./s,
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
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ns.*,.+--numbers.+<numbers>.+A numbers option\..+Values are delimited by.+','.+\..+Duplicate values will be removed\./s,
        );
      });

      it('should handle a multivalued numbers option that has a value count limit', () => {
        const options = {
          numbers: {
            type: 'numbers',
            names: ['-ns', '--numbers'],
            desc: 'A numbers option',
            limit: 2,
          },
        } as const satisfies Options;
        const message = new HelpFormatter(options).formatHelp(200);
        expect(message).toMatch(
          /-ns.*,.+--numbers.+<numbers>.+A numbers option\..+Accepts multiple parameters\..+Value count is limited to.+2.+\./s,
        );
      });
    });
  });
});
