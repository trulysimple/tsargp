import { describe, describe as on, describe as when, expect, it as should } from 'vitest';
import { type Options, OptionRegistry } from '../../lib/options';
import { AnsiFormatter } from '../../lib/formatter';
import { cfg } from '../../lib/styles';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('AnsiFormatter', () => {
  on('format', () => {
    when('a default value is specified', () => {
      should('handle a boolean value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: true,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        const message = new AnsiFormatter(registry, cfg).format();
        expect(message.wrap()).toEqual(`  -f    Defaults to true.\n`);
      });

      should('handle a string value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: 'abc',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        const message = new AnsiFormatter(registry, cfg).format();
        expect(message.wrap()).toEqual(`  -f    Defaults to 'abc'.\n`);
      });

      should('handle a number value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: 123,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        const message = new AnsiFormatter(registry, cfg).format();
        expect(message.wrap()).toEqual(`  -f    Defaults to 123.\n`);
      });

      should('handle a string array value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: ['one', 'two'],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        const message = new AnsiFormatter(registry, cfg).format();
        expect(message.wrap()).toEqual(`  -f    Defaults to ['one', 'two'].\n`);
      });

      should('handle a number array value', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: [1, 2],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        const message = new AnsiFormatter(registry, cfg).format();
        expect(message.wrap()).toMatch(`  -f    Defaults to [1, 2].\n`);
      });
    });

    when('a default callback is specified', () => {
      should('handle a callback without toString method', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: () => 0,
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        const message = new AnsiFormatter(registry, cfg).format();
        expect(message.wrap()).toEqual(`  -f    Defaults to <() => 0>.\n`);
      });

      should('handle a callback with a toString method', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            default: () => true,
          },
        } as const satisfies Options;
        options.flag.default.toString = () => 'fcn';
        const registry = new OptionRegistry(options);
        const message = new AnsiFormatter(registry, cfg).format();
        expect(message.wrap()).toEqual(`  -f    Defaults to <fcn>.\n`);
      });
    });
  });
});
