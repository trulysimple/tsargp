import { describe, expect, it } from 'vitest';
import { type Options, HelpFormatter, OptionValidator, req } from '../../lib';
import '../utils.spec'; // initialize globals

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle an option that requires the presence of another (1)', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: 'required',
        },
        required: {
          type: 'boolean',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option. Requires -req.\n');
    });

    it('should handle an option that requires the presence of another (2)', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: { required: undefined },
        },
        required: {
          type: 'boolean',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option. Requires -req.\n');
    });

    it('should handle an option that requires the absence of another (1)', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: req.not('required'),
        },
        required: {
          type: 'boolean',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option. Requires no -req.\n');
    });

    it('should handle an option that requires the absence of another (2)', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: { required: null },
        },
        required: {
          type: 'boolean',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option. Requires no -req.\n');
    });

    it('should handle an option that requires another option with a specific value', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: { required: 'abc' },
        },
        required: {
          type: 'string',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Requires -req = 'abc'.\n`);
    });

    it('should handle an option with a forward requirement expression', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: req.all('required1', req.one({ required2: 1 }, req.not({ required3: '2' }))),
        },
        required1: {
          type: 'boolean',
          names: ['-req1', '--req1'],
          hide: true,
        },
        required2: {
          type: 'number',
          names: ['-req2', '--req2'],
          hide: true,
        },
        required3: {
          type: 'string',
          names: ['-req3', '--req3'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -f, --flag    A flag option. Requires (-req1 and (-req2 = 1 or -req3 != '2')).\n`,
      );
    });

    it('should handle an option with a forward requirement callback', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: () => true,
        },
      } as const satisfies Options;
      options.flag.requires.toString = () => 'fcn';
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Requires <fcn>.\n`);
    });

    it('should handle an option with a negated forward requirement callback', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: req.not(() => true),
        },
      } as const satisfies Options;
      options.flag.requires.item.toString = () => 'fcn';
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Requires not <fcn>.\n`);
    });

    it('should handle an option that is required if another is present (1)', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: 'other',
        },
        other: {
          type: 'boolean',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option. Required if -req.\n');
    });

    it('should handle an option that is required if another is present (2)', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: { other: undefined },
        },
        other: {
          type: 'boolean',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option. Required if -req.\n');
    });

    it('should handle an option that is required if another is absent (1)', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: req.not('other'),
        },
        other: {
          type: 'boolean',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option. Required if no -req.\n');
    });

    it('should handle an option that is required if another is absent (2)', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: { other: null },
        },
        other: {
          type: 'boolean',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual('  -f, --flag    A flag option. Required if no -req.\n');
    });

    it('should handle an option that is required if another option has a specific value', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: { other: 'abc' },
        },
        other: {
          type: 'string',
          names: ['-req', '--req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Required if -req = 'abc'.\n`);
    });

    it('should handle an option with a conditional requirement expression', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: req.all('other1', req.one({ other2: 1 }, req.not({ other3: '2' }))),
        },
        other1: {
          type: 'boolean',
          names: ['-req1', '--req1'],
          hide: true,
        },
        other2: {
          type: 'number',
          names: ['-req2', '--req2'],
          hide: true,
        },
        other3: {
          type: 'string',
          names: ['-req3', '--req3'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(
        `  -f, --flag    A flag option. Required if (-req1 and (-req2 = 1 or -req3 != '2')).\n`,
      );
    });

    it('should handle an option with a conditional requirement callback', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: () => true,
        },
      } as const satisfies Options;
      options.flag.requiredIf.toString = () => 'fcn';
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Required if <fcn>.\n`);
    });

    it('should handle an option with a negated conditional requirement callback', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: req.not(() => true),
        },
      } as const satisfies Options;
      options.flag.requiredIf.item.toString = () => 'fcn';
      const message = new HelpFormatter(new OptionValidator(options)).formatHelp();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Required if not <fcn>.\n`);
    });
  });
});
