import { describe, expect, it } from 'vitest';
import { type Options, AnsiFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('AnsiFormatter', () => {
  describe('format', () => {
    it('should handle a function option with a single required parameter', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option',
          paramCount: 1,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --function  <param>  A function option\n`);
    });

    it('should handle a function option with a single optional parameter required to be inline', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          paramCount: [0, 1],
          inline: 'always',
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --function  [=<param>]  A function option. Requires inline parameters.\n`,
      );
    });

    it('should handle a function option with a single optional parameter', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option',
          paramCount: [0, 1],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --function  [<param>]  A function option\n`);
    });

    it('should handle a function option with an exact parameter count', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          paramCount: 2,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --function  <param>...  A function option. Accepts 2 parameters.\n`,
      );
    });

    it('should handle a function option with a range parameter count', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          paramCount: [1, 2],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --function  <param>...  A function option. Accepts between 1 and 2 parameters.\n`,
      );
    });

    it('should handle a function option with a minimum parameter count (1)', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          paramCount: [1, Infinity],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --function  <param>...  A function option. Accepts multiple parameters.\n`,
      );
    });

    it('should handle a function option with a minimum parameter count (2)', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          paramCount: [2, Infinity],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --function  <param>...  A function option. Accepts at least 2 parameters.\n`,
      );
    });

    it('should handle a function option with a maximum parameter count', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          paramCount: [0, 2],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --function  [<param>...]  A function option. Accepts at most 2 parameters.\n`,
      );
    });

    it('should handle a function option with unlimited parameter count (1)', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          paramCount: -1,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --function  [<param>...]  A function option. Accepts multiple parameters.\n`,
      );
    });

    it('should handle a function option with unlimited parameter count (2)', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          paramCount: [0, Infinity],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --function  [<param>...]  A function option. Accepts multiple parameters.\n`,
      );
    });

    it('should handle a function option with a parameter name', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option',
          paramName: 'myParam',
          paramCount: 1,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --function  <myParam>  A function option\n`);
    });

    it('should handle a boolean option that disallows inline parameters', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option.',
          inline: false,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -b, --boolean  <boolean>  A boolean option. Disallows inline parameters.\n`,
      );
    });

    it('should handle a boolean option that requires inline parameters', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option.',
          inline: 'always',
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -b, --boolean  =<boolean>  A boolean option. Requires inline parameters.\n`,
      );
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -b, --boolean  <param>  A boolean option\n`);
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -b, --boolean  <token>=<value>  A boolean option\n`);
    });

    it('should handle a boolean option with a fallback value', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option.',
          fallback: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -b, --boolean  [<boolean>]  A boolean option. Falls back to true if specified without parameter.\n`,
      );
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -b, --boolean  true  A boolean option\n`);
    });

    it('should handle a boolean option with fallback and example values', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option.',
          fallback: true,
          example: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -b, --boolean  [true]  A boolean option. Falls back to true if specified without parameter.\n`,
      );
    });

    it('should handle a string option with a fallback value', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s', '--string'],
          desc: 'A string option.',
          fallback: '123',
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -s, --string  [<string>]  A string option. Falls back to '123' if specified without parameter.\n`,
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -s, --string  '123'  A string option\n`);
    });

    it('should handle a number option with a fallback value', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n', '--number'],
          desc: 'A number option.',
          fallback: 123,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -n, --number  [<number>]  A number option. Falls back to 123 if specified without parameter.\n`,
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -n, --number  123  A number option\n`);
    });

    it('should handle a variadic strings option with a fallback value', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          fallback: ['1', '2'],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  [<strings>...]  A strings option. Accepts multiple parameters. Falls back to ['1', '2'] if specified without parameter.\n`,
      );
    });

    it('should handle a variadic strings option with an example value', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          example: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  'one' 'two'...  A strings option. Accepts multiple parameters.\n`,
      );
    });

    it('should handle a variadic numbers option with a fallback value', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          fallback: [1, 2],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  [<numbers>...]  A numbers option. Accepts multiple parameters. Falls back to [1, 2] if specified without parameter.\n`,
      );
    });

    it('should handle a variadic numbers option with an example value', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          example: [1, 2],
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  1 2...  A numbers option. Accepts multiple parameters.\n`,
      );
    });

    it('should handle a strings option delimited by a string with an example value', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          example: ['one', 'two'],
          separator: ',',
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  'one,two'  A strings option. Values are delimited by ','.\n`,
      );
    });

    it('should handle a strings option delimited by a regex with an example value', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          example: ['one', 'two'],
          separator: /[,;]/s,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  'one[,;]two'  A strings option. Values are delimited by /[,;]/s.\n`,
      );
    });

    it('should handle a numbers delimited by a string option with an example value', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          example: [1, 2],
          separator: ',',
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  '1,2'  A numbers option. Values are delimited by ','.\n`,
      );
    });

    it('should handle a numbers option delimited by a regex with an example value', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          example: [1, 2],
          separator: /[,;]/s,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  '1[,;]2'  A numbers option. Values are delimited by /[,;]/s.\n`,
      );
    });
  });
});
