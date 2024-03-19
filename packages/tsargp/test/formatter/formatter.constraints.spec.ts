import { describe, expect, it } from 'vitest';
import { type Options, HelpFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle a string option with enumeration constraint', () => {
      const options = {
        stringEnum: {
          type: 'string',
          names: ['-s', '--string'],
          desc: 'A string option.',
          enums: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        '  -s, --string  <string>  A string option. Values must match the regex /\\d+/s.\n',
      );
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        '  -n, --number  <number>  A number option. Values must be in the range [0, Infinity].\n',
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. Values must match the regex /\\d+/s.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Values must be in the range [0, Infinity].\n`,
      );
    });

    it('should handle a variadic strings option that has a value count constraint', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          limit: 2,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>  A strings option. Accepts multiple parameters. Value count is limited to 2.\n`,
      );
    });

    it('should handle a variadic numbers option that has a value count constraint', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          limit: 2,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters. Value count is limited to 2.\n`,
      );
    });

    it('should handle a variadic strings option with enumeration constraint', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          enums: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>  A strings option. Accepts multiple parameters. Values must be one of {'one', 'two'}.\n`,
      );
    });

    it('should handle a variadic numbers option with enumeration constraint', () => {
      const options = {
        numbersEnum: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          enums: [1, 2],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Accepts multiple parameters. Values must be one of {1, 2}.\n`,
      );
    });
  });
});
