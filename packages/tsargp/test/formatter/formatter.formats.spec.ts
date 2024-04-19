import { describe, describe as on, expect, it as should } from 'vitest';
import type { Options, HelpSections, HelpConfig } from '../../lib/options';
import { OptionRegistry } from '../../lib/options';
import { JsonFormatter, CsvFormatter, MdFormatter } from '../../lib/formatter';
import { style, cfg } from '../../lib/styles';
import { HelpItem, tf } from '../../lib/enums';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('JsonFormatter', () => {
  on('format', () => {
    should('handle zero options', () => {
      const registry = new OptionRegistry({});
      const formatter = new JsonFormatter(registry, cfg);
      expect(formatter.format().message).toEqual('[]');
    });

    should('handle a flag option with a group and a default callback', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          group: 'group',
          default: () => true, // JSON.stringify does not render functions
        },
      } as const satisfies Options;
      const registry = new OptionRegistry(options);
      const formatter = new JsonFormatter(registry, cfg);
      const expected = `[{"type":"flag","names":["-f"],"group":"group","preferredName":"-f"}]`;
      expect(formatter.format('group').message).toEqual(expected);
      expect(formatter.format('group').message).toEqual(expected); // <<-- keep this
    });
  });

  on('sections', () => {
    should('handle various options', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          group: 'group',
          default: () => true,
        },
        single: {
          type: 'single',
          names: ['-s', '--single'],
        },
      } as const satisfies Options;
      const config: HelpConfig = { items: [HelpItem.synopsis, HelpItem.default] };
      const registry = new OptionRegistry(options);
      const formatter = new JsonFormatter(registry, cfg, config);
      const sections: HelpSections = [{ type: 'groups' }];
      const expected =
        `[{"type":"flag","names":["-f"],"group":"group","preferredName":"-f"},` +
        `{"type":"single","names":["-s","--single"],"preferredName":"-s"}]`;
      expect(formatter.sections(sections).message).toEqual(expected);
      expect(formatter.sections(sections).message).toEqual(expected); // <<-- keep this
    });
  });
});

describe('CsvFormatter', () => {
  on('format', () => {
    should('handle zero options', () => {
      const registry = new OptionRegistry({});
      const formatter = new CsvFormatter(registry, cfg);
      expect(formatter.format().message).toEqual('');
    });

    should('handle a single-valued option with a group and a default callback', () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s', '--single'],
          synopsis: style(tf.clear) + 'A\n  number\t  option',
          group: 'group',
          default: () => 1,
        },
      } as const satisfies Options;
      const config: HelpConfig = { items: [HelpItem.synopsis, HelpItem.default] };
      const registry = new OptionRegistry(options);
      const formatter = new CsvFormatter(registry, cfg, config);
      const expected =
        `type\tgroup\tnames\tsynopsis\tdefault\n` +
        `single\tgroup\t-s,--single\tA number option\t() => 1`;
      expect(formatter.format('group').message).toEqual(expected);
      expect(formatter.format('group').message).toEqual(expected); // <<-- keep this
    });
  });

  on('sections', () => {
    should('handle help sections', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          group: 'group',
        },
        single: {
          type: 'single',
          names: ['-s', '--single'],
        },
      } as const satisfies Options;
      const config: HelpConfig = { items: [HelpItem.synopsis] };
      const registry = new OptionRegistry(options);
      const formatter = new CsvFormatter(registry, cfg, config);
      const sections: HelpSections = [{ type: 'groups' }];
      const expected = `type\tgroup\tnames\tsynopsis\nflag\tgroup\t-f\t\nsingle\t\t-s,--single\t`;
      expect(formatter.sections(sections).message).toEqual(expected);
      expect(formatter.sections(sections).message).toEqual(expected); // <<-- keep this
    });
  });
});

describe('MdFormatter', () => {
  on('format', () => {
    should('handle zero options', () => {
      const registry = new OptionRegistry({});
      const formatter = new MdFormatter(registry, cfg);
      expect(formatter.format().message).toEqual('');
    });

    should('handle a number option with a group and a default callback', () => {
      const options = {
        single: {
          type: 'single',
          names: ['-s', '--single'],
          synopsis: style(tf.clear) + 'A\n  number\t  option',
          group: 'group',
          default: () => 1,
        },
      } as const satisfies Options;
      const config: HelpConfig = { items: [HelpItem.synopsis, HelpItem.default] };
      const registry = new OptionRegistry(options);
      const formatter = new MdFormatter(registry, cfg, config);
      const expected =
        `| type | names | synopsis | default |\n` +
        `| ---- | ----- | -------- | ------- |\n` +
        `| single | -s,--single | A number option | () => 1 |`;
      expect(formatter.format('group').message).toEqual(expected);
      expect(formatter.format('group').message).toEqual(expected); // <<-- keep this
    });
  });

  on('sections', () => {
    should('handle help sections', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
        single: {
          type: 'single',
          names: ['-s', '--single'],
          group: 'group',
        },
      } as const satisfies Options;
      const config: HelpConfig = { items: [HelpItem.synopsis] };
      const registry = new OptionRegistry(options);
      const formatter = new MdFormatter(registry, cfg, config);
      const sections: HelpSections = [{ type: 'groups' }];
      const expected =
        `| type | names | synopsis |\n` +
        `| ---- | ----- | -------- |\n` +
        `| flag | -f |  |\n\n` +
        `## group\n\n` +
        `| type | names | synopsis |\n` +
        `| ---- | ----- | -------- |\n` +
        `| single | -s,--single |  |`;
      expect(formatter.sections(sections).message).toEqual(expected);
      expect(formatter.sections(sections).message).toEqual(expected); // <<-- keep this
    });
  });
});
