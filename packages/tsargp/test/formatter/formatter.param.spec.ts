import { describe, expect, it } from 'vitest';
import { type Options, HelpFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle a boolean option with a parameter name', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
          paramName: 'param',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -b, --boolean  true  A boolean option\n`);
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -n, --number  123  A number option\n`);
    });

    it('should handle a variadic strings option with a fallback value', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          fallback: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  [<strings>...]  A strings option. Accepts multiple parameters. Falls back to ['one', 'two'] if specified without parameter.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  'one' 'two'  A strings option. Accepts multiple parameters.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  1 2  A numbers option. Accepts multiple parameters.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  'one,two'  A strings option. Values are delimited by ','.\n`,
      );
    });

    it('should handle a delimited strings option with an example value with a regex', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          example: ['one', 'two'],
          separator: /[,;]/s,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  'one[,;]two'  A strings option. Values are delimited by /[,;]/s.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  '1,2'  A numbers option. Values are delimited by ','.\n`,
      );
    });

    it('should handle a delimited numbers option with an example value with a regex', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          example: [1, 2],
          separator: /[,;]/s,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  '1[,;]2'  A numbers option. Values are delimited by /[,;]/s.\n`,
      );
    });
  });
});
