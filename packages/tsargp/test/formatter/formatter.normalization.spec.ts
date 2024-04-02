import { describe, expect, it } from 'vitest';
import { type Options, HelpFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle a string option whose values will be trimmed', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s', '--string'],
          desc: 'A string option.',
          trim: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -s, --string  <string>  A string option. Values will be trimmed.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -s, --string  <string>  A string option. Values will be converted to lowercase.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -s, --string  <string>  A string option. Values will be converted to uppercase.\n`,
      );
    });

    it('should handle a number option with math conversion', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n', '--number'],
          desc: 'A number option.',
          conv: 'trunc',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -n, --number  <number>  A number option. Values will be converted with Math.trunc.\n`,
      );
    });

    it('should handle a variadic strings option whose values will be trimmed', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          trim: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>...  A strings option. Accepts multiple parameters. Values will be trimmed.\n`,
      );
    });

    it('should handle a variadic strings option whose values will be converted to lowercase', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          case: 'lower',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>...  A strings option. Accepts multiple parameters. Values will be converted to lowercase.\n`,
      );
    });

    it('should handle a variadic strings option whose values will be converted to uppercase', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          case: 'upper',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>...  A strings option. Accepts multiple parameters. Values will be converted to uppercase.\n`,
      );
    });

    it('should handle a variadic strings option whose values are unique', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss', '--strings'],
          desc: 'A strings option.',
          unique: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>...  A strings option. Accepts multiple parameters. Duplicate values will be removed.\n`,
      );
    });

    it('should handle a variadic numbers option whose values are unique', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          unique: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>...  A numbers option. Accepts multiple parameters. Duplicate values will be removed.\n`,
      );
    });

    it('should handle a variadic numbers option with math conversion', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          conv: 'trunc',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>...  A numbers option. Accepts multiple parameters. Values will be converted with Math.trunc.\n`,
      );
    });
  });
});
