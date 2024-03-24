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

    it('should handle a number option with truncation', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n', '--number'],
          desc: 'A number option.',
          round: 'trunc',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -n, --number  <number>  A number option. Values will be rounded towards zero.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -n, --number  <number>  A number option. Values will be rounded up.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -n, --number  <number>  A number option. Values will be rounded down.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -n, --number  <number>  A number option. Values will be rounded to the nearest integer.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. Values will be converted to uppercase.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. Duplicate values will be removed.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Duplicate values will be removed.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Values will be rounded towards zero.\n`,
      );
    });

    it('should handle a delimited numbers option with ceil rounding', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          separator: ',',
          round: 'ceil',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Values will be rounded up.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Values will be rounded down.\n`,
      );
    });

    it('should handle a delimited numbers option with nearest rounding', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns', '--numbers'],
          desc: 'A numbers option.',
          separator: ',',
          round: 'round',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. Values will be rounded to the nearest integer.\n`,
      );
    });
  });
});
