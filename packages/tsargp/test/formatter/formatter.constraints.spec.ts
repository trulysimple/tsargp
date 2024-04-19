import { describe, describe as on, expect, it as should } from 'vitest';
import { type Options, OptionRegistry } from '../../lib/options';
import { AnsiFormatter } from '../../lib/formatter';
import { cfg } from '../../lib/styles';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('AnsiFormatter', () => {
  on('format', () => {
    should('handle a single-valued option with a regex constraint', () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          regex: /\d+/s,
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -s  <param>  Values must match the regex /\\d+/s.\n`);
    });

    should('handle a single-valued option with a choices array constraint', () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          choices: ['one', 'two'],
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -s  <param>  Values must be one of {'one', 'two'}.\n`);
    });

    should('handle a single-valued option with a choices record constraint', () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s'],
          choices: { one: 'two' },
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(`  -s  <param>  Values must be one of {'one'}.\n`);
    });

    should('handle an array-valued option with a limit constraint', () => {
      const options = {
        array: {
          type: 'array',
          names: ['-a'],
          limit: 2,
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(
        `  -a  [<param>...]  Accepts multiple parameters. Element count is limited to 2.\n`,
      );
    });

    should('handle an array-valued option with a unique constraint', () => {
      const options = {
        array: {
          type: 'array',
          names: ['-a'],
          unique: true,
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const message = new AnsiFormatter(registry, cfg).format();
      expect(message.wrap()).toEqual(
        `  -a  [<param>...]  Accepts multiple parameters. Duplicate values will be removed.\n`,
      );
    });
  });
});
