import { describe, expect, it } from 'vitest';
import type { Options, HelpConfig } from '../../lib';
import { HelpFormatter, OptionValidator, style, tf, fg8 } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle an option with no names or description', () => {
      const options = {
        flag: { type: 'flag' },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('\n');
    });

    it('should handle an option with no description', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f\n');
    });

    it('should handle an option with custom styles', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option with custom styles',
          styles: {
            names: style(tf.clear, tf.inverse, fg8(138)),
            descr: style(tf.clear, tf.italic, tf.crossedOut),
          },
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option with custom styles\n');
    });

    it('should handle an option with inline styles in the description', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: `A flag option with ${style(tf.bold, fg8(123))}inline styles${style(tf.clear)}`,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option with inline styles\n');
    });

    it('should handle an option with paragraphs in the description', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: `A flag option with
          line breaks,\ttabs and ...

          paragraphs`,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toMatch(
        /^ {2}-f, --flag {4}A flag option with line breaks, tabs and ...\n\n {16}paragraphs\n$/,
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toMatch(
        /^ {2}-f, --flag {4}A flag option with lists:\n {16}- item1\n {16}\* item2\n {16}1\. item3\n$/,
      );
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
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('');
    });

    it('should not break columns in the help message when configured with negative values', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
        },
      } as const satisfies Options;
      const config: HelpConfig = { breaks: { names: -1, param: -1, descr: -1 } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatHelp();
      expect(message.wrap()).toEqual('  -b, --boolean  <boolean>  A boolean option\n');
    });

    it('should break columns in the help message when configured with positive indentation', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
        },
      } as const satisfies Options;
      const config: HelpConfig = { breaks: { names: 1, param: 1, descr: 1 } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatHelp();
      expect(message.wrap()).toMatch(
        /^\n {2}-b, --boolean\n {17}<boolean>\n {28}A boolean option\n$/,
      );
    });

    it('should break columns in the help message when configured with absolute indentation', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
        },
      } as const satisfies Options;
      const config: HelpConfig = {
        indent: { paramAbsolute: true, descrAbsolute: true },
        breaks: { names: 1, param: 1, descr: 1 },
      };
      const message = new HelpFormatter(new OptionValidator(options), config).formatHelp();
      expect(message.wrap()).toMatch(
        /^\n {2}-b, --boolean\n {2}<boolean>\n {2}A boolean option\n$/,
      );
    });

    it('should break columns in the help message when configured with negative indentation', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
        },
      } as const satisfies Options;
      const config: HelpConfig = {
        indent: { names: -1, param: -1, descr: -1 },
        breaks: { names: 1, param: 1, descr: 1 },
      };
      const message = new HelpFormatter(new OptionValidator(options), config).formatHelp();
      expect(message.wrap()).toMatch(/^\n-b, --boolean\n {12}<boolean>\n {20}A boolean option\n$/);
    });

    it('should hide the option names from the help message when configured to do so', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
        },
      } as const satisfies Options;
      const config: HelpConfig = { hidden: { names: true } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatHelp();
      expect(message.wrap()).toEqual('    <boolean>  A boolean option\n');
    });

    it('should hide the option param from the help message when configured to do so', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
        },
      } as const satisfies Options;
      const config: HelpConfig = { hidden: { param: true } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatHelp();
      expect(message.wrap()).toEqual('  -b, --boolean    A boolean option\n');
    });

    it('should hide the option description from the help message when configured to do so', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
        },
      } as const satisfies Options;
      const config: HelpConfig = { hidden: { descr: true } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatHelp();
      expect(message.wrap()).toEqual('  -b, --boolean  <boolean>\n');
    });

    it('should indent name slots in compact mode', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', null, '--flag'],
          desc: 'A flag option',
        },
      } as const satisfies Options;
      const config: HelpConfig = { indent: { compactNames: true } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option\n');
    });
  });
});
