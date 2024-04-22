import { describe, describe as on, expect, it as should } from 'vitest';
import { type Options, type HelpConfig, OptionRegistry } from '../../lib/options';
import { AnsiFormatter } from '../../lib/formatter';
import { cfg } from '../../lib/styles';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('AnsiFormatter', () => {
  on('format', () => {
    should('handle zero options', () => {
      const formatter = new AnsiFormatter(new OptionRegistry({}), cfg);
      expect(formatter.format().wrap()).toEqual('');
    });

    should('handle a flag option with a group', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          group: 'group',
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format('group');
      expect(message.wrap()).toEqual(`  -f\n`);
    });

    should('filter options using a single regular expression', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f', '--flag'],
        },
        flag2: {
          type: 'flag',
          synopsis: 'A flag option',
        },
        single: {
          type: 'single',
          names: ['-s'],
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const config: HelpConfig = { descr: { absolute: true }, filter: ['flag'] };
      const message = new AnsiFormatter(registry, cfg, config).format();
      expect(message.wrap()).toEqual(`  -f, --flag\n  A flag option\n`);
    });

    should('filter an option with environment variable using multiple regular expressions', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f'],
        },
        flag2: {
          type: 'flag',
        },
        single: {
          type: 'single',
          names: ['-s'],
          sources: ['SINGLE'],
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const config: HelpConfig = { items: [], filter: ['-f', 'sing'] };
      const message = new AnsiFormatter(registry, cfg, config).format();
      expect(message.wrap()).toEqual(`  -f\n  -s  <param>\n`);
    });

    should('handle a help option', () => {
      const options = {
        help: {
          type: 'help',
          names: ['-h'],
          useNested: true,
          useFormat: true,
          useFilter: true,
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(
        `  -h    ` +
          `Uses the next argument as the name of a nested command. ` +
          `Uses the next argument as the name of a help format. ` +
          `Uses the remaining arguments as option filter.\n`,
      );
    });

    should('handle help formats', () => {
      const options = {
        help: {
          type: 'help',
          names: ['-h'],
          formats: { ansi: AnsiFormatter },
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -h    Available formats are {'ansi'}.\n`);
    });

    should('handle a function option', () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -f  [<param>...]  Accepts multiple parameters.\n`);
    });

    should('handle a command option', () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -c  ...\n`);
    });

    should('handle an option that is always required', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          required: true,
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -f    Always required.\n`);
    });

    should('handle a flag option with an external reference', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          link: new URL('https://trulysimple.dev/tsargp/docs'),
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(
        `  -f    Refer to https://trulysimple.dev/tsargp/docs for details.\n`,
      );
    });

    should('handle a flag option deprecated for a reason', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          deprecated: 'reason',
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -f    Deprecated for reason.\n`);
    });

    should('handle a flag option with cluster letters', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          cluster: 'fF',
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -f    Can be clustered with 'fF'.\n`);
    });

    should('handle a flag option that reads data from standard input', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          stdin: true,
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -f    Reads data from standard input.\n`);
    });

    should('handle a flag option with an environment variable', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          sources: ['VAR', new URL('file://path')],
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -f    Reads environment data from VAR, file://path/.\n`);
    });

    should('handle a single-valued option that accepts positional arguments', () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          positional: true,
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -s  <param>  Accepts positional arguments.\n`);
    });

    should('handle a single-valued option that accepts positional arguments after marker', () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          positional: '--',
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(
        `  -s  <param>  Accepts positional arguments that may be preceded by --.\n`,
      );
    });

    should('handle an array-valued option whose parameters can be delimited', () => {
      const options = {
        array: {
          type: 'array',
          names: ['-a'],
          separator: ',',
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(
        `  -a  [<param>...]  Values can be delimited with ','. Accepts multiple parameters.\n`,
      );
    });

    should('handle an array-valued option that can be specified multiple times', () => {
      const options = {
        array: {
          type: 'array',
          names: ['-a'],
          append: true,
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(
        `  -a  [<param>...]  Accepts multiple parameters. Can be specified multiple times.\n`,
      );
    });
  });
});
