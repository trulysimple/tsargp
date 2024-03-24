import { describe, expect, it } from 'vitest';
import { type Options, HelpFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle a function option with a default value', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          exec() {},
          default: 'abc',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --function    A function option. Defaults to 'abc'.\n`);
    });

    it('should handle a function option with a default callback', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option.',
          exec() {},
          default: () => 0,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -f, --function    A function option. Defaults to <() => 0>.\n`,
      );
    });

    it('should handle a command option with a default value', () => {
      const options = {
        command: {
          type: 'command',
          names: ['-f', '--command'],
          desc: 'A command option.',
          options: {},
          cmd() {},
          default: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --command    A command option. Defaults to true.\n`);
    });

    it('should handle a command option with a default callback', () => {
      const options = {
        command: {
          type: 'command',
          names: ['-f', '--command'],
          desc: 'A command option.',
          options: {},
          cmd() {},
          default: () => 0,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -f, --command    A command option. Defaults to <() => 0>.\n`,
      );
    });

    it('should handle a flag option with a default value', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          default: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Defaults to true.\n`);
    });

    it('should handle a flag option with a default callback', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          default: () => true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toMatch(
        / {2}-f, --flag {4}A flag option\. Defaults to <\(\) => (true|!0)>\.\n$/,
      );
    });

    it('should handle a flag option with a default callback with a toString method', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          default: () => true,
        },
      } as const satisfies Options;
      options.flag.default.toString = () => 'fcn';
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Defaults to <fcn>.\n`);
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -b, --boolean  <boolean>  A boolean option. Defaults to true.\n`,
      );
    });

    it('should handle a boolean option with a default callback', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option.',
          default: () => true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toMatch(
        / {2}-b, --boolean {2}<boolean> {2}A boolean option\. Defaults to <\(\) => (true|!0)>\.\n$/,
      );
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -s, --string  <string>  A string option. Defaults to '123'.\n`,
      );
    });

    it('should handle a string option with a default callback', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s', '--string'],
          desc: 'A string option.',
          default: () => '123',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -s, --string  <string>  A string option. Defaults to <() => "123">.\n`,
      );
    });

    it('should handle a number option with a default value', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n', '--number'],
          desc: 'A number option.',
          default: 123,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -n, --number  <number>  A number option. Defaults to 123.\n`,
      );
    });

    it('should handle a number option with a default callback', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n', '--number'],
          desc: 'A number option.',
          default: () => 123,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -n, --number  <number>  A number option. Defaults to <() => 123>.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>...  A strings option. Accepts multiple parameters. Defaults to ['one', 'two'].\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>...  A strings option. Accepts multiple parameters. Defaults to <() => ["one", "two"]>.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toMatch(
        `  -ns, --numbers  <numbers>...  A numbers option. Accepts multiple parameters. Defaults to [1, 2].\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>...  A numbers option. Accepts multiple parameters. Defaults to <() => [1, 2]>.\n`,
      );
    });
  });
});
