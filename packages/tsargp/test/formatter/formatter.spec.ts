import { describe, expect, it } from 'vitest';
import { type Options, HelpFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle no options', () => {
      const message = new HelpFormatter(new OptionValidator({})).formatHelp();
      expect(message.wrap()).toEqual('');
    });

    it('should filter options with a single regular expression', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f', '--flag'],
        },
        flag2: {
          type: 'flag',
          desc: 'A flag option',
        },
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const config = { descr: { absolute: true }, filters: [/flag/] };
      const message = new HelpFormatter(validator, config).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag\n  A flag option\n`);
    });

    it('should filter options with multiple regular expressions', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f', '--flag'],
        },
        flag2: {
          type: 'flag',
          desc: 'A flag option',
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
          envVar: 'BOOLEAN',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const config = { items: [], filters: [/^-f/, /bool/i] };
      const message = new HelpFormatter(validator, config).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag\n  -b          <boolean>\n`);
    });

    it('should handle a function option', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f', '--function'],
          desc: 'A function option',
          exec() {},
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --function    A function option\n`);
    });

    it('should handle a command option', () => {
      const options = {
        command: {
          type: 'command',
          names: ['-f', '--command'],
          desc: 'A command option',
          options: {},
          cmd() {},
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --command    A command option\n`);
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -f, --flag    A flag option. Can be negated with -no-f, --no-flag.\n`,
      );
    });

    it('should handle a flag option that is always required', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          required: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Always required.\n`);
    });

    it('should handle a flag option with an external link', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          link: new URL('https://trulysimple.dev/tsargp/docs'),
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -f, --flag    A flag option. Refer to https://trulysimple.dev/tsargp/docs for details.\n`,
      );
    });

    it('should handle a flag option deprecated for a reason', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          deprecated: 'reason',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Deprecated for reason.\n`);
    });

    it('should handle a flag option with cluster letters', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          clusterLetters: 'fF',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -f, --flag    A flag option. Can be clustered with 'fF'.\n`,
      );
    });

    it('should handle a boolean option with an environment variable', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option.',
          envVar: 'VAR',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -b, --boolean  <boolean>  A boolean option. Can be specified through the VAR environment variable.\n`,
      );
    });

    it('should handle a string option that accepts positional arguments', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s', '--string'],
          desc: 'A string option.',
          positional: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -s, --string  <string>  A string option. Accepts positional parameters.\n`,
      );
    });

    it('should handle a number option that accepts positional arguments after marker', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n', '--number'],
          desc: 'A number option.',
          positional: '--',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -n, --number  <number>  A number option. Accepts positional parameters that may be preceded by --.\n`,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ss, --strings  <strings>  A strings option. Values are delimited by ','. May be specified multiple times.\n`,
      );
    });

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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -ns, --numbers  <numbers>  A numbers option. Values are delimited by ','. May be specified multiple times.\n`,
      );
    });
  });

  describe('formatGroups', () => {
    it('should handle an option with a group', () => {
      /** @ignore */
      function assert(_condition: unknown): asserts _condition {}
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option',
          group: 'group',
        },
      } as const satisfies Options;
      const groups = new HelpFormatter(new OptionValidator(options)).formatGroups();
      const message = groups.get('group');
      assert(message);
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option\n`);
    });
  });
});
