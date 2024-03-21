import { describe, expect, it } from 'vitest';
import type { Options, HelpSections } from '../../lib';
import { HelpFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatSections', () => {
    it('should handle no sections', () => {
      const message = new HelpFormatter(new OptionValidator({})).formatSections();
      expect(message.wrap()).toEqual('');
    });

    it('should skip an empty text section', () => {
      const sections: HelpSections = [{ type: 'text', text: '' }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections);
      expect(message.wrap()).toEqual('');
    });

    it('should render a text section', () => {
      const sections: HelpSections = [{ type: 'text', text: 'text' }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections);
      expect(message.wrap()).toEqual('text');
    });

    it('should indent a text section', () => {
      const sections: HelpSections = [{ type: 'text', text: 'text', indent: 2 }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections);
      expect(message.wrap()).toEqual('  text');
    });

    it('should not wrap a text section', () => {
      const sections: HelpSections = [{ type: 'text', text: 'section  text', noWrap: true }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections);
      expect(message.wrap()).toEqual('section  text');
    });

    it('should render an empty usage section', () => {
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections);
      expect(message.wrap()).toEqual('');
    });

    it('should render a usage section with a program name', () => {
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections, 'prog');
      expect(message.wrap()).toEqual('prog');
    });

    it('should indent a usage section with a program name', () => {
      const sections: HelpSections = [{ type: 'usage', indent: 2 }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections, 'prog');
      expect(message.wrap()).toEqual('  prog');
    });

    it('should render a usage section with a heading (but not indent it)', () => {
      const sections: HelpSections = [{ type: 'usage', title: 'text', indent: 2 }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections);
      expect(message.wrap()).toEqual('text');
    });

    it('should render a usage section with a required flag option with a single name', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          required: true,
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new HelpFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.wrap()).toEqual('-f');
    });

    it('should render a usage section with a non-required flag option with multiple names', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new HelpFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.wrap()).toEqual('[(-f|--flag)]');
    });

    it('should render a usage section with a boolean option and a program name', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new HelpFormatter(validator).formatSections(sections, 'prog');
      expect(message.wrap()).toEqual('prog [-b <boolean>]');
    });

    it('should render a usage section with a boolean option with an example value and a heading', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          example: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const sections: HelpSections = [{ type: 'usage', title: 'text', indent: 2 }];
      const message = new HelpFormatter(validator).formatSections(sections, 'prog');
      expect(message.wrap()).toEqual('text\n\n  prog [-b true]');
    });

    it('should render an empty groups section', () => {
      const sections: HelpSections = [{ type: 'groups' }];
      const message = new HelpFormatter(new OptionValidator({})).formatSections(sections);
      expect(message.wrap()).toEqual('');
    });

    it('should render a groups section with a default group', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'groups' }];
      const message = new HelpFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.wrap()).toEqual('  -f, --flag    A flag option.');
    });

    it('should render a groups section with a custom heading for the default group', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'groups', title: 'text' }];
      const message = new HelpFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.wrap()).toEqual('text\n\n  -f, --flag    A flag option.');
    });

    it('should render a groups section with a custom phrase for group headings', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          group: 'group',
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'groups', phrase: '[%s]' }];
      const message = new HelpFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.wrap()).toEqual('[group]\n\n  -f, --flag    A flag option.');
    });

    it('should not wrap section texts', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const sections: HelpSections = [
        { type: 'text', text: 'section  text', noWrap: true },
        { type: 'usage', title: 'section  text', noWrap: true },
        { type: 'groups', title: 'section  text', noWrap: true },
      ];
      const message = new HelpFormatter(new OptionValidator(options)).formatSections(sections);
      expect(message.wrap()).toEqual(
        'section  text\n\nsection  text\n\n[(-f|--flag)]\n\nsection  text\n\n  -f, --flag    A flag option.',
      );
    });

    it('should include and exclude an option in a usage section', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f1'],
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const sections1: HelpSections = [{ type: 'usage', filter: ['flag1'] }];
      const sections2: HelpSections = [{ type: 'usage', filter: ['flag1'], exclude: true }];
      const formatter = new HelpFormatter(new OptionValidator(options));
      expect(formatter.formatSections(sections1).wrap()).toEqual('[-f1]');
      expect(formatter.formatSections(sections2).wrap()).toEqual('[-f2]');
    });

    it('should include and exclude an group in a groups section', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f1'],
          group: 'group1',
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
          group: 'group2',
        },
      } as const satisfies Options;
      const sections1: HelpSections = [{ type: 'groups', filter: ['group1'] }];
      const sections2: HelpSections = [{ type: 'groups', filter: ['group1'], exclude: true }];
      const formatter = new HelpFormatter(new OptionValidator(options));
      expect(formatter.formatSections(sections1).wrap()).toEqual('group1\n\n  -f1');
      expect(formatter.formatSections(sections2).wrap()).toEqual('group2\n\n  -f2');
    });
  });
});
