import { describe, expect, it } from 'vitest';
import type { Options, HelpSections } from '../../lib';
import { JsonFormatter, CsvFormatter, MdFormatter, OptionValidator, style, tf } from '../../lib';
import { fieldNames } from '../../lib/options';
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
      const sections: HelpSections = [{ type: 'groups' }];
      const message = new JsonFormatter(new OptionValidator(options)).formatSections(sections);
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
      expect(formatter.formatHelp().message).toEqual(fieldNames.join('\t'));
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
      const message = new CsvFormatter(new OptionValidator(options)).formatHelp('group');
      expect(message.message).toEqual(
        fieldNames.join('\t') +
          `\nnumber\tgroup\t-n,--number\tA number option` +
          '\t'.repeat(16) +
          '() => 1' +
          '\t'.repeat(9),
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
      const sections: HelpSections = [{ type: 'groups' }];
      const message = new CsvFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.message).toEqual(
        fieldNames.join('\t') +
          `\nstring\t\t-s` +
          '\t'.repeat(26) +
          `\nflag\tgroup\t-f` +
          '\t'.repeat(26),
      );
    });
  });
});

describe('MdFormatter', () => {
  describe('formatHelp', () => {
    it('should handle zero options', () => {
      const formatter = new MdFormatter(new OptionValidator({}));
      expect([...formatter.groupNames]).toEqual([]);
      expect(formatter.formatHelp().message).toEqual(
        ' | ' +
          fieldNames.join(' | ') +
          ` | \n | ` +
          fieldNames.map((field) => '-'.repeat(field.length)).join(' | ') +
          ' | ',
      );
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
      const message = new MdFormatter(new OptionValidator(options)).formatHelp('group');
      expect(message.message).toEqual(
        ' | ' +
          fieldNames.join(' | ') +
          ` | \n | ` +
          fieldNames.map((field) => '-'.repeat(field.length)).join(' | ') +
          ` | \n | number | group | -n,--number | A number option` +
          ' | '.repeat(16) +
          '() => 1' +
          ' | '.repeat(10),
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
      const sections: HelpSections = [{ type: 'groups' }];
      const message = new MdFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.message).toEqual(
        ' | ' +
          fieldNames.join(' | ') +
          ` | \n | ` +
          fieldNames.map((field) => '-'.repeat(field.length)).join(' | ') +
          ` | \n | string |  | -s` +
          ' | '.repeat(27) +
          '\n\n## group\n\n | ' +
          fieldNames.join(' | ') +
          ` | \n | ` +
          fieldNames.map((field) => '-'.repeat(field.length)).join(' | ') +
          ` | \n | flag | group | -f` +
          ' | '.repeat(27),
      );
    });
  });
});
