import { describe, expect, it } from 'vitest';
import type { Options, HelpSections } from '../../lib';
import { AnsiFormatter, OptionValidator } from '../../lib';
import '../utils.spec'; // initialize globals

describe('AnsiFormatter', () => {
  describe('sections', () => {
    it('should handle no sections', () => {
      const message = new AnsiFormatter(new OptionValidator({})).sections([]);
      expect(message.wrap()).toEqual('');
    });

    it('should skip a text section with no content', () => {
      const sections: HelpSections = [{ type: 'text' }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('');
    });

    it('should render a text section', () => {
      const sections: HelpSections = [{ type: 'text', text: 'text' }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('text');
    });

    it('should indent a text section', () => {
      const sections: HelpSections = [{ type: 'text', text: 'text', indent: 2 }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('  text');
    });

    it('should break a text section', () => {
      const sections: HelpSections = [{ type: 'text', text: 'text', breaks: 1 }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('\ntext');
    });

    it('should render a text section with a heading (but not indent the heading)', () => {
      const sections: HelpSections = [{ type: 'text', title: 'title', indent: 2 }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('title');
    });

    it('should break a text section with a heading', () => {
      const sections: HelpSections = [{ type: 'text', title: 'title', breaks: 1 }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('\ntitle');
    });

    it('should render an empty usage section', () => {
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('');
    });

    it('should render a usage section with a program name', () => {
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections, 'prog');
      expect(message.wrap()).toEqual('prog');
    });

    it('should indent a usage section with a program name', () => {
      const sections: HelpSections = [{ type: 'usage', indent: 2 }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections, 'prog');
      expect(message.wrap()).toEqual('  prog');
    });

    it('should break a usage section with a program name', () => {
      const sections: HelpSections = [{ type: 'usage', breaks: 1 }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections, 'prog');
      expect(message.wrap()).toEqual('\nprog');
    });

    it('should render a usage section with a heading (but not indent the heading)', () => {
      const sections: HelpSections = [{ type: 'usage', title: 'title', indent: 2 }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('title');
    });

    it('should break a usage section with a heading', () => {
      const sections: HelpSections = [{ type: 'usage', title: 'title', breaks: 1 }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
      expect(message.wrap()).toEqual('\ntitle');
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
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
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
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
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
      const message = new AnsiFormatter(validator).sections(sections, 'prog');
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
      const sections: HelpSections = [{ type: 'usage', title: 'title', indent: 2 }];
      const message = new AnsiFormatter(validator).sections(sections, 'prog');
      expect(message.wrap()).toEqual('title\n\n  prog [-b true]');
    });

    it('should render a usage section with a nameless positional option', () => {
      const options = {
        boolean: {
          type: 'boolean',
          positional: true,
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
      expect(message.wrap()).toEqual('[<boolean>]');
    });

    it('should render a usage section with an example value with required inline parameter', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          example: true,
          inline: 'always',
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'usage' }];
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
      expect(message.wrap()).toEqual('[-b=true]');
    });

    it('should render an empty groups section', () => {
      const sections: HelpSections = [{ type: 'groups' }];
      const message = new AnsiFormatter(new OptionValidator({})).sections(sections);
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
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
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
      const sections: HelpSections = [{ type: 'groups', title: 'title' }];
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
      expect(message.wrap()).toEqual('title\n\n  -f, --flag    A flag option.');
    });

    it('should break a groups section with a default group', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'groups', breaks: 1 }];
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
      expect(message.wrap()).toEqual('\n  -f, --flag    A flag option.');
    });

    it('should break a groups section with a custom heading for the default group', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const sections: HelpSections = [{ type: 'groups', title: 'title', breaks: 1 }];
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
      expect(message.wrap()).toEqual('\ntitle\n\n  -f, --flag    A flag option.');
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
        { type: 'text', title: 'section  title', text: 'section  text', noWrap: true },
        { type: 'usage', title: 'section  title', noWrap: true },
        { type: 'groups', title: 'section  title', noWrap: true },
      ];
      const message = new AnsiFormatter(new OptionValidator(options)).sections(sections);
      expect(message.wrap()).toEqual(
        'section  title\n\nsection  text\n\nsection  title\n\n[(-f|--flag)]\n\nsection  title\n\n  -f, --flag    A flag option.',
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
      const sections3: HelpSections = [{ type: 'usage', filter: ['flag1'], required: ['flag1'] }];
      const sections4: HelpSections = [{ type: 'usage', filter: ['flag2', 'flag1'] }];
      const formatter = new AnsiFormatter(new OptionValidator(options));
      expect(formatter.sections(sections1).wrap()).toEqual('[-f1]');
      expect(formatter.sections(sections2).wrap()).toEqual('[-f2]');
      expect(formatter.sections(sections3).wrap()).toEqual('-f1');
      expect(formatter.sections(sections4).wrap()).toEqual('[-f2] [-f1]');
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
      const sections3: HelpSections = [{ type: 'groups', filter: ['group2', 'group1'] }];
      const formatter = new AnsiFormatter(new OptionValidator(options));
      expect(formatter.sections(sections1).wrap()).toEqual('group1\n\n  -f1');
      expect(formatter.sections(sections2).wrap()).toEqual('group2\n\n  -f2');
      expect(formatter.sections(sections3).wrap()).toEqual('group2\n\n  -f2\n\ngroup1\n\n  -f1');
    });

    it('should group options according to an adjacency list in a usage section', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f1'],
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
        },
        flag3: {
          type: 'flag',
          names: ['-f3'],
        },
      } as const satisfies Options;
      const case0 = {};
      const case1 = { requires: { flag1: 'flag2' } };
      const case2 = { requires: { flag2: 'flag1' } };
      const case3 = { requires: { flag1: 'flag2', flag2: 'flag1' } };
      const case4 = { requires: { flag1: 'flag2', flag2: 'flag3' } };
      const case5 = { requires: { flag2: 'flag1', flag3: 'flag2' } };
      const case6 = { requires: { flag1: 'flag2', flag3: 'flag2' } };
      const case7 = { requires: { flag1: 'flag3', flag2: 'flag3' } };
      const case8 = { requires: { flag1: 'flag2', flag3: 'flag1' } };
      const case9 = { requires: { flag2: 'flag3', flag3: 'flag2' } };
      const case10 = { requires: { flag1: 'flag2', flag2: 'flag3', flag3: 'flag1' } };
      const case11: HelpSections = [
        {
          type: 'usage',
          filter: ['flag3', 'flag2', 'flag1'],
          requires: { flag1: 'flag2', flag2: 'flag3' },
        },
      ];
      const case12: HelpSections = [
        {
          type: 'usage',
          filter: ['flag3', 'flag2', 'flag1'],
          requires: { flag1: 'flag2', flag3: 'flag1' },
        },
      ];
      const formatter = new AnsiFormatter(new OptionValidator(options));
      expect(formatter.sections([{ type: 'usage', ...case0 }]).wrap()).toEqual('[-f1] [-f2] [-f3]');
      expect(formatter.sections([{ type: 'usage', ...case1 }]).wrap()).toEqual('[[-f1] -f2] [-f3]');
      expect(formatter.sections([{ type: 'usage', ...case2 }]).wrap()).toEqual('[-f1 [-f2]] [-f3]');
      expect(formatter.sections([{ type: 'usage', ...case3 }]).wrap()).toEqual('[-f1 -f2] [-f3]');
      expect(formatter.sections([{ type: 'usage', ...case4 }]).wrap()).toEqual('[[[-f1] -f2] -f3]');
      expect(formatter.sections([{ type: 'usage', ...case5 }]).wrap()).toEqual('[-f1 [-f2 [-f3]]]');
      expect(formatter.sections([{ type: 'usage', ...case6 }]).wrap()).toEqual('[[-f1] -f2 [-f3]]');
      expect(formatter.sections([{ type: 'usage', ...case7 }]).wrap()).toEqual('[[-f1] -f3 [-f2]]');
      expect(formatter.sections([{ type: 'usage', ...case8 }]).wrap()).toEqual('[[-f1 [-f3]] -f2]');
      expect(formatter.sections([{ type: 'usage', ...case9 }]).wrap()).toEqual('[-f1] [-f2 -f3]');
      expect(formatter.sections([{ type: 'usage', ...case10 }]).wrap()).toEqual('[-f1 -f2 -f3]');
      expect(formatter.sections(case11).wrap()).toEqual('[-f3 [-f2 [-f1]]]');
      expect(formatter.sections(case12).wrap()).toEqual('[[[-f3] -f1] -f2]');
    });

    it('should group options according to an adjacency list in a usage section, when an option is always required', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f1'],
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
        },
        flag3: {
          type: 'flag',
          names: ['-f3'],
          required: true,
        },
      } as const satisfies Options;
      const case0 = {};
      const case1 = { requires: { flag1: 'flag2' } };
      const case2 = { requires: { flag2: 'flag1' } };
      const case3 = { requires: { flag1: 'flag2', flag2: 'flag1' } };
      const case4 = { requires: { flag1: 'flag2', flag2: 'flag3' } };
      const case5 = { requires: { flag2: 'flag1', flag3: 'flag2' } };
      const case6 = { requires: { flag1: 'flag2', flag3: 'flag2' } };
      const case7 = { requires: { flag1: 'flag3', flag2: 'flag3' } };
      const case8 = { requires: { flag1: 'flag2', flag3: 'flag1' } };
      const case9 = { requires: { flag2: 'flag3', flag3: 'flag2' } };
      const case10 = { requires: { flag1: 'flag2', flag2: 'flag3', flag3: 'flag1' } };
      const case11: HelpSections = [
        {
          type: 'usage',
          filter: ['flag3', 'flag2', 'flag1'],
          requires: { flag1: 'flag2', flag2: 'flag3' },
        },
      ];
      const case12: HelpSections = [
        {
          type: 'usage',
          filter: ['flag3', 'flag2', 'flag1'],
          requires: { flag1: 'flag2', flag3: 'flag1' },
        },
      ];
      const formatter = new AnsiFormatter(new OptionValidator(options));
      expect(formatter.sections([{ type: 'usage', ...case0 }]).wrap()).toEqual('[-f1] [-f2] -f3');
      expect(formatter.sections([{ type: 'usage', ...case1 }]).wrap()).toEqual('[[-f1] -f2] -f3');
      expect(formatter.sections([{ type: 'usage', ...case2 }]).wrap()).toEqual('[-f1 [-f2]] -f3');
      expect(formatter.sections([{ type: 'usage', ...case3 }]).wrap()).toEqual('[-f1 -f2] -f3');
      expect(formatter.sections([{ type: 'usage', ...case4 }]).wrap()).toEqual('[[-f1] -f2] -f3');
      expect(formatter.sections([{ type: 'usage', ...case5 }]).wrap()).toEqual('-f1 -f2 -f3');
      expect(formatter.sections([{ type: 'usage', ...case6 }]).wrap()).toEqual('[-f1] -f2 -f3');
      expect(formatter.sections([{ type: 'usage', ...case7 }]).wrap()).toEqual('[-f1] -f3 [-f2]');
      expect(formatter.sections([{ type: 'usage', ...case8 }]).wrap()).toEqual('-f1 -f3 -f2');
      expect(formatter.sections([{ type: 'usage', ...case9 }]).wrap()).toEqual('[-f1] -f2 -f3');
      expect(formatter.sections([{ type: 'usage', ...case10 }]).wrap()).toEqual('-f1 -f2 -f3');
      expect(formatter.sections(case11).wrap()).toEqual('-f3 [-f2 [-f1]]');
      expect(formatter.sections(case12).wrap()).toEqual('-f3 -f1 -f2');
    });
  });
});
