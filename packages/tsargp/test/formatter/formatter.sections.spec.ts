import { describe, expect, it } from 'vitest';
import type { Options, HelpConfig, HideSections } from '../../lib';
import { HelpFormatter, OptionValidator, style, tf } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatFull', () => {
    it('should handle no options', () => {
      const message = new HelpFormatter(new OptionValidator({})).formatFull();
      expect(message.wrap()).toEqual('');
    });

    it('should render the introduction section', () => {
      const config: HelpConfig = { sections: { intro: 'intro' } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('intro');
    });

    it('should omit the introduction section', () => {
      const config: HelpConfig = { sections: { intro: 'intro' } };
      const hide: HideSections = { intro: true };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull(hide);
      expect(message.wrap()).toEqual('');
    });

    it('should indent the introduction section', () => {
      const config: HelpConfig = { sections: { intro: 'intro' }, indent: { intro: 2 } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('  intro');
    });

    it('should break the introduction section', () => {
      const config: HelpConfig = { sections: { intro: 'intro' }, breaks: { intro: 2 } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('\n\nintro');
    });

    it('should render the usage section', () => {
      const config: HelpConfig = { sections: { usage: 'usage' } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('Usage:\n\n  usage');
    });

    it('should render the usage section with a custom heading', () => {
      const config: HelpConfig = { sections: { usage: 'usage', usageTitle: 'title' } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('title:\n\n  usage');
    });

    it('should omit the usage section', () => {
      const config: HelpConfig = { sections: { usage: 'usage' } };
      const hide: HideSections = { usage: true };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull(hide);
      expect(message.wrap()).toEqual('');
    });

    it('should indent the usage section', () => {
      const config: HelpConfig = { sections: { usage: 'usage' }, indent: { usage: 0 } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('Usage:\n\nusage');
    });

    it('should break the usage section', () => {
      const config: HelpConfig = { sections: { usage: 'usage' }, breaks: { usage: 1 } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('Usage:\n  usage');
    });

    it('should break the usage section title', () => {
      const config: HelpConfig = {
        sections: { intro: 'intro', usage: 'usage' },
        breaks: { usageTitle: 1 },
      };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('intro\nUsage:\n\n  usage');
    });

    it('should render the footer section', () => {
      const config: HelpConfig = { sections: { footer: 'footer' } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('footer');
    });

    it('should omit the footer section', () => {
      const config: HelpConfig = { sections: { footer: 'footer' } };
      const hide: HideSections = { footer: true };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull(hide);
      expect(message.wrap()).toEqual('');
    });

    it('should indent the footer section', () => {
      const config: HelpConfig = { sections: { footer: 'footer' }, indent: { footer: 2 } };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('  footer');
    });

    it('should break the footer section', () => {
      const config: HelpConfig = {
        sections: { intro: 'intro', footer: 'footer' },
        breaks: { footer: 1 },
      };
      const message = new HelpFormatter(new OptionValidator({}), config).formatFull();
      expect(message.wrap()).toEqual('intro\nfooter');
    });

    it('should render the option groups', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatFull();
      expect(message.wrap()).toEqual('Options:\n\n  -f, --flag    A flag option.');
    });

    it('should render the default option group with a custom name', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const config: HelpConfig = { sections: { optionsTitle: 'title' } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatFull();
      expect(message.wrap()).toEqual('title:\n\n  -f, --flag    A flag option.');
    });

    it('should omit the option groups', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const hide: HideSections = { groups: true };
      const message = new HelpFormatter(new OptionValidator(options)).formatFull(hide);
      expect(message.wrap()).toEqual('');
    });

    it('should break the option groups', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const config: HelpConfig = { breaks: { groups: 1 } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatFull();
      expect(message.wrap()).toEqual('Options:\n  -f, --flag    A flag option.');
    });

    it('should break the option group headings', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const config: HelpConfig = { sections: { intro: 'intro' }, breaks: { groupTitle: 1 } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatFull();
      expect(message.wrap()).toEqual('intro\nOptions:\n\n  -f, --flag    A flag option.');
    });

    it('should render the default usage text', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const config: HelpConfig = { sections: { usage: true } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatFull();
      expect(message.wrap()).toEqual(
        'Usage:\n\n  [(-f|--flag)]\n\nOptions:\n\n  -f, --flag    A flag option.',
      );
    });

    it('should render the default usage text with a program title', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const config: HelpConfig = { sections: { usage: true } };
      const message = new HelpFormatter(validator, config).formatFull({}, 'prog');
      expect(message.wrap()).toEqual(
        'Usage:\n\n  prog [(-f|--flag)]\n\nOptions:\n\n  -f, --flag    A flag option.',
      );
    });

    it('should indent the usage options in the default usage text with a program title', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const config: HelpConfig = { sections: { usage: true }, indent: { usageOptions: 2 } };
      const message = new HelpFormatter(validator, config).formatFull({}, 'prog');
      expect(message.wrap()).toEqual(
        'Usage:\n\n  prog  [(-f|--flag)]\n\nOptions:\n\n  -f, --flag    A flag option.',
      );
    });

    it('should break the usage options in the default usage text with a program title', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const config: HelpConfig = { sections: { usage: true }, breaks: { usageOptions: 1 } };
      const message = new HelpFormatter(validator, config).formatFull({}, 'prog');
      expect(message.wrap()).toEqual(
        'Usage:\n\n  prog\n       [(-f|--flag)]\n\nOptions:\n\n  -f, --flag    A flag option.',
      );
    });

    it('should indent the usage options in the default usage text with a program title, relative to the beginning of the line', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      const config: HelpConfig = {
        sections: { usage: true },
        indent: { usageOptionsAbsolute: true },
        breaks: { usageOptions: 1 },
      };
      const message = new HelpFormatter(validator, config).formatFull({}, 'prog');
      expect(message.wrap()).toEqual(
        'Usage:\n\n  prog\n [(-f|--flag)]\n\nOptions:\n\n  -f, --flag    A flag option.',
      );
    });

    it('should indent all headings', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const config: HelpConfig = { sections: { usage: 'usage' }, indent: { headings: 2 } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatFull();
      expect(message.wrap()).toEqual(
        '  Usage:\n\n  usage\n\n  Options:\n\n  -f, --flag    A flag option.',
      );
    });

    it('should stylize all headings', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const config: HelpConfig = {
        sections: { usage: 'usage' },
        misc: { headingStyle: style(tf.clear) },
      };
      const message = new HelpFormatter(new OptionValidator(options), config).formatFull();
      expect(message.wrap(0, true)).toMatch(/\x9b0mUsage:.+\x9b0mOptions:/s);
    });

    it('should use custom phrase for all headings', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const config: HelpConfig = { sections: { usage: 'usage' }, misc: { headingPhrase: '[%s]' } };
      const message = new HelpFormatter(new OptionValidator(options), config).formatFull();
      expect(message.wrap()).toEqual(
        '[Usage]\n\n  usage\n\n[Options]\n\n  -f, --flag    A flag option.',
      );
    });

    it('should not wrap section texts', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
        },
      } as const satisfies Options;
      const config: HelpConfig = {
        sections: {
          intro: '  intro',
          usage: 'usage  text',
          footer: '  footer',
          usageTitle: 'usage  title',
          optionsTitle: 'options  title',
        },
        misc: { noWrap: true },
      };
      const message = new HelpFormatter(new OptionValidator(options), config).formatFull();
      expect(message.wrap()).toEqual(
        '  intro\n\nusage  title:\n\n  usage  text\n\noptions  title:\n\n  -f, --flag    A flag option.\n\n  footer',
      );
    });
  });
});
