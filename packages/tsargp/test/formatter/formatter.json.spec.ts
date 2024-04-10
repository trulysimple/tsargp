import { describe, expect, it } from 'vitest';
import type { Options, HelpSections } from '../../lib';
import { JsonFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('JsonFormatter', () => {
  describe('formatHelp', () => {
    it('should handle no options', () => {
      const message = new JsonFormatter(new OptionValidator({})).formatHelp();
      expect(message.message).toEqual('[]');
    });

    it('should handle a flag option', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          required: true,
        },
      } as const satisfies Options;
      const message = new JsonFormatter(new OptionValidator(options)).formatHelp();
      expect(message.message).toEqual(
        `[{"type":"flag","names":["-f"],"required":true,"preferredName":"-f"}]`,
      );
    });
  });

  describe('formatGroup', () => {
    it('should handle a flag option with a group', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          group: 'Flags',
        },
      } as const satisfies Options;
      const message = new JsonFormatter(new OptionValidator(options)).formatGroup('Flags');
      expect(message?.message).toEqual(
        `[{"type":"flag","names":["-f"],"group":"Flags","preferredName":"-f"}]`,
      );
    });
  });

  describe('formatSections', () => {
    it('should handle help sections', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          required: true,
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'groups' }];
      const message = new JsonFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.message).toEqual(
        `[{"type":"flag","names":["-f"],"required":true,"preferredName":"-f"}]`,
      );
    });
  });
});
