import { describe, expect, it } from 'vitest';
import { type Options, AnsiFormatter, OptionValidator, req } from '../../lib';
import '../utils.spec'; // initialize globals

describe('AnsiFormatter', () => {
  describe('format', () => {
    it('should handle an option that requires the presence of another', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: 'required',
        },
        required: {
          type: 'boolean',
          names: ['-req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Requires -req.\n`);
    });

    it('should handle an option that requires the absence of another', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: req.not('required'),
        },
        required: {
          type: 'boolean',
          names: ['-req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Requires no -req.\n`);
    });

    it('should handle an option that requires options with specific values using expressions', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requires: req.one(
            {
              flag2: undefined,
              boolean: null,
            },
            req.all(
              {
                flag2: false,
                boolean: true,
              },
              req.not({
                string: 'a',
                number: 1,
                strings: ['a', 'b'],
                numbers: [1, 2],
              }),
            ),
          ),
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
          hide: true,
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
          hide: true,
        },
        string: {
          type: 'string',
          names: ['-s'],
          hide: true,
        },
        number: {
          type: 'number',
          names: ['-n'],
          hide: true,
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
          hide: true,
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --flag    A flag option. Requires ((-f2 and no -b) or ((-f2 == false and -b == true) and (-s != 'a' or -n != 1 or -ss != ['a', 'b'] or -ns != [1, 2]))).\n`,
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Requires not <fcn>.\n`);
    });

    it('should handle an option that is required if another is present', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: 'other',
        },
        other: {
          type: 'boolean',
          names: ['-req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Required if -req.\n`);
    });

    it('should handle an option that is required if another is absent', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: req.not('other'),
        },
        other: {
          type: 'boolean',
          names: ['-req'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Required if no -req.\n`);
    });

    it('should handle an option that is required if others are present or absent', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: { other1: undefined, other2: null },
        },
        other1: {
          type: 'boolean',
          names: ['-req1'],
          hide: true,
        },
        other2: {
          type: 'boolean',
          names: ['-req2'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --flag    A flag option. Required if (-req1 and no -req2).\n`,
      );
    });

    it('should handle an option that is required if other options have specific values using expressions', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f', '--flag'],
          desc: 'A flag option.',
          requiredIf: req.one(
            {
              flag2: undefined,
              boolean: null,
            },
            req.all(
              {
                flag2: false,
                boolean: true,
              },
              req.not({
                string: 'a',
                number: 1,
                strings: ['a', 'b'],
                numbers: [1, 2],
              }),
            ),
          ),
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
          hide: true,
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
          hide: true,
        },
        string: {
          type: 'string',
          names: ['-s'],
          hide: true,
        },
        number: {
          type: 'number',
          names: ['-n'],
          hide: true,
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
          hide: true,
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          hide: true,
        },
      } as const satisfies Options;
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(
        `  -f, --flag    A flag option. Required if ((-f2 and no -b) or ((-f2 == false and -b == true) and (-s != 'a' or -n != 1 or -ss != ['a', 'b'] or -ns != [1, 2]))).\n`,
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
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
      const message = new AnsiFormatter(new OptionValidator(options)).format();
      expect(message.wrap()).toEqual(`  -f, --flag    A flag option. Required if not <fcn>.\n`);
    });
  });
});
