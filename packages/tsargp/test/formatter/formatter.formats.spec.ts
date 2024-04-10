import { describe, expect, it } from 'vitest';
import type { Options, FormatterConfig, HelpSections } from '../../lib';
import { OptionValidator, style, tf, HelpItem } from '../../lib';
import { JsonFormatter, CsvFormatter, MdFormatter } from '../../lib';
import '../utils.spec'; // initialize globals

describe('JsonFormatter', () => {
  describe('formatHelp', () => {
    it('should handle zero options', () => {
      const formatter = new JsonFormatter(new OptionValidator({}));
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
      const formatter = new JsonFormatter(new OptionValidator(options));
      const expected = `[{"type":"flag","names":["-f","--flag"],"group":"group","preferredName":"-f"}]`;
      expect(formatter.formatHelp('group').message).toEqual(expected);
      expect(formatter.formatHelp('group').message).toEqual(expected); // <<-- keep this
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
      const config: FormatterConfig = { items: [HelpItem.desc, HelpItem.default] };
      const formatter = new JsonFormatter(new OptionValidator(options), config);
      const sections: HelpSections = [{ type: 'groups' }];
      const expected =
        `[{"type":"string","names":["-s"],"preferredName":"-s"},` +
        `{"type":"flag","names":["-f"],"group":"group","preferredName":"-f"}]`;
      expect(formatter.formatSections(sections).message).toEqual(expected);
      expect(formatter.formatSections(sections).message).toEqual(expected); // <<-- keep this
    });
  });
});

describe('CsvFormatter', () => {
  describe('formatHelp', () => {
    it('should handle zero options', () => {
      const formatter = new CsvFormatter(new OptionValidator({}));
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
      const config: FormatterConfig = { items: [HelpItem.desc, HelpItem.default] };
      const formatter = new CsvFormatter(new OptionValidator(options), config);
      const expected =
        `type\tgroup\tnames\tdesc\tdefault\n` +
        `number\tgroup\t-n,--number\tA number option\t() => 1`;
      expect(formatter.formatHelp('group').message).toEqual(expected);
      expect(formatter.formatHelp('group').message).toEqual(expected); // <<-- keep this
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
      const config: FormatterConfig = { items: [HelpItem.desc] };
      const formatter = new CsvFormatter(new OptionValidator(options), config);
      const sections: HelpSections = [{ type: 'groups' }];
      const expected = `type\tgroup\tnames\tdesc\n` + `string\t\t-s\t\n` + `flag\tgroup\t-f\t`;
      expect(formatter.formatSections(sections).message).toEqual(expected);
      expect(formatter.formatSections(sections).message).toEqual(expected); // <<-- keep this
    });
  });
});

describe('MdFormatter', () => {
  describe('formatHelp', () => {
    it('should handle zero options', () => {
      const formatter = new MdFormatter(new OptionValidator({}));
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
      const config: FormatterConfig = { items: [HelpItem.desc, HelpItem.default] };
      const formatter = new MdFormatter(new OptionValidator(options), config);
      const expected =
        `| type | names | desc | default |\n` +
        `| ---- | ----- | ---- | ------- |\n` +
        `| number | -n,--number | A number option | () => 1 |`;
      expect(formatter.formatHelp('group').message).toEqual(expected);
      expect(formatter.formatHelp('group').message).toEqual(expected); // <<-- keep this
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
      const config: FormatterConfig = { items: [HelpItem.desc] };
      const formatter = new MdFormatter(new OptionValidator(options), config);
      const sections: HelpSections = [{ type: 'groups' }];
      const expected =
        `| type | names | desc |\n` +
        `| ---- | ----- | ---- |\n` +
        `| string | -s |  |\n\n` +
        `## group\n\n` +
        `| type | names | desc |\n` +
        `| ---- | ----- | ---- |\n` +
        `| flag | -f |  |`;
      expect(formatter.formatSections(sections).message).toEqual(expected);
      expect(formatter.formatSections(sections).message).toEqual(expected); // <<-- keep this
    });
  });
});
