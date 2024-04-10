import { describe, expect, it } from 'vitest';
import type { Options, FormatterConfig } from '../../lib';
import { OptionValidator, style, tf, HelpItem } from '../../lib';
import { JsonFormatter, CsvFormatter, MdFormatter } from '../../lib';
import '../utils.spec'; // initialize globals

describe('JsonFormatter', () => {
  describe('formatHelp', () => {
    it('should handle zero options', () => {
      const formatter = new JsonFormatter(new OptionValidator({}));
      expect([...formatter.groupNames]).toEqual([]);
      expect(formatter.formatHelp().message).toEqual('[]');
    });

    it('should handle a flag option with a group and a default callback', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          group: 'group',
          default: () => true,
        },
      } as const satisfies Options;
      const message = new JsonFormatter(new OptionValidator(options)).formatHelp('group');
      expect(message.message).toEqual(
        `[{"type":"flag","names":["-f","--flag"],"group":"group","preferredName":"-f"}]`,
      );
    });
  });

  describe('formatSections', () => {
    it('should handle help sections', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
        },
        flag: {
          type: 'flag',
          names: ['-f'],
          group: 'group',
        },
      } as const satisfies Options;
      const config: FormatterConfig = { items: [HelpItem.synopsis, HelpItem.default] };
      const formatter = new JsonFormatter(new OptionValidator(options), config);
      const message = formatter.formatSections([{ type: 'groups' }]);
      expect(message.message).toEqual(
        `[{"type":"string","names":["-s"],"preferredName":"-s"},` +
          `{"type":"flag","names":["-f"],"group":"group","preferredName":"-f"}]`,
      );
    });
  });
});

describe('CsvFormatter', () => {
  describe('formatHelp', () => {
    it('should handle zero options', () => {
      const formatter = new CsvFormatter(new OptionValidator({}));
      expect([...formatter.groupNames]).toEqual([]);
      expect(formatter.formatHelp().message).toEqual('');
    });

    it('should handle a number option with a group and a default callback', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n', '--number'],
          desc: style(tf.clear) + 'A\n  number\t  option',
          group: 'group',
          default: () => 1,
        },
      } as const satisfies Options;
      const config: FormatterConfig = { items: [HelpItem.synopsis, HelpItem.default] };
      const message = new CsvFormatter(new OptionValidator(options), config).formatHelp('group');
      expect(message.message).toEqual(
        `type\tgroup\tnames\tdesc\tdefault\n` +
          `number\tgroup\t-n,--number\tA number option\t() => 1`,
      );
    });
  });

  describe('formatSections', () => {
    it('should handle help sections', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
        },
        flag: {
          type: 'flag',
          names: ['-f'],
          group: 'group',
        },
      } as const satisfies Options;
      const config: FormatterConfig = { items: [HelpItem.synopsis] };
      const formatter = new CsvFormatter(new OptionValidator(options), config);
      const message = formatter.formatSections([{ type: 'groups' }]);
      expect(message.message).toEqual(
        `type\tgroup\tnames\tdesc\n` + `string\t\t-s\t\n` + `flag\tgroup\t-f\t`,
      );
    });
  });
});

describe('MdFormatter', () => {
  describe('formatHelp', () => {
    it('should handle zero options', () => {
      const formatter = new MdFormatter(new OptionValidator({}));
      expect([...formatter.groupNames]).toEqual([]);
      expect(formatter.formatHelp().message).toEqual('');
    });

    it('should handle a number option with a group and a default callback', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n', '--number'],
          desc: style(tf.clear) + 'A\n  number\t  option',
          group: 'group',
          default: () => 1,
        },
      } as const satisfies Options;
      const config: FormatterConfig = { items: [HelpItem.synopsis, HelpItem.default] };
      const message = new MdFormatter(new OptionValidator(options), config).formatHelp('group');
      expect(message.message).toEqual(
        ` | type | group | names | desc | default | \n` +
          ` | ---- | ----- | ----- | ---- | ------- | \n` +
          ` | number | group | -n,--number | A number option | () => 1 | `,
      );
    });
  });

  describe('formatSections', () => {
    it('should handle help sections', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
        },
        flag: {
          type: 'flag',
          names: ['-f'],
          group: 'group',
        },
      } as const satisfies Options;
      const config: FormatterConfig = { items: [HelpItem.synopsis] };
      const formatter = new MdFormatter(new OptionValidator(options), config);
      const message = formatter.formatSections([{ type: 'groups' }]);
      expect(message.message).toEqual(
        ` | type | group | names | desc | \n` +
          ` | ---- | ----- | ----- | ---- | \n` +
          ` | string |  | -s |  | \n\n` +
          `## group\n\n` +
          ` | type | group | names | desc | \n` +
          ` | ---- | ----- | ----- | ---- | \n` +
          ` | flag | group | -f |  | `,
      );
    });
  });
});
