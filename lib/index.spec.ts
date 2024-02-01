import type { Options } from './index.js';

import { describe, expect, it } from 'vitest';
import { HelpFormatter } from './index.js';

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('with no options', () => {
      expect(new HelpFormatter().formatHelp()).toEqual('');
    });

    it('with a help option', () => {
      const options = {
        help: {
          names: ['-h', '--help'],
          desc: 'A help option',
          type: 'help',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-h, --help.+A help option\./s);
    });

    it('with a function option', () => {
      const options = {
        function: {
          names: ['-f', '--function'],
          desc: 'A function option',
          type: 'function',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-f, --function.+A function option\./s);
    });

    it('with a boolean option', () => {
      const options = {
        boolean: {
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
          type: 'boolean',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-b, --boolean.+A boolean option\./s);
    });

    it('with a string option', () => {
      const options = {
        string: {
          names: ['-s', '--string'],
          desc: 'A string option',
          type: 'string',
          default: '123',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-s, --string.+\[string\].+A string option\. Defaults to '123'\./s);
    });

    it('with a number option', () => {
      const options = {
        number: {
          names: ['-n', '--number'],
          desc: 'A number option',
          type: 'number',
          default: 123,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-n, --number.+\[number\].+A number option\. Defaults to '123'\./s);
    });

    it('with a deprecated option', () => {
      const options = {
        deprecated: {
          names: ['-d', '--deprecated'],
          desc: 'A deprecated option',
          type: 'string',
          deprecated: 'reason',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-d, --deprecated.+A deprecated option\. Deprecated for reason\./s);
    });

    it('with a string enumeration option', () => {
      const options = {
        stringEnum: {
          names: ['-se', '--stringEnum'],
          desc: 'A string enumeration option',
          type: 'string',
          accepts: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-se, --stringEnum.+A string enumeration option\. Accepts values in.+\[one,two\]\./s,
      );
    });

    it('with a number enumeration option', () => {
      const options = {
        numberEnum: {
          names: ['-ne', '--numberEnum'],
          desc: 'A number enumeration option',
          type: 'number',
          accepts: [1, 2],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-ne, --numberEnum.+A number enumeration option\. Accepts values in.+\[1,2\]\./s,
      );
    });

    it('with a strings option', () => {
      const options = {
        strings: {
          names: ['-ss', '--strings'],
          desc: 'A strings option',
          type: 'strings',
          default: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-ss, --strings.+\[strings\].+A strings option\. Values are comma-separated\..+Defaults to 'one,two'\./s,
      );
    });

    it('with a numbers option', () => {
      const options = {
        numbers: {
          names: ['-ns', '--numbers'],
          desc: 'A numbers option',
          type: 'numbers',
          default: [1, 2],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-ns, --numbers.+\[numbers\].+A numbers option\. Values are.+comma-separated\..+Defaults to '1,2'\./s,
      );
    });

    it('with a strings enumeration option', () => {
      const options = {
        stringsEnum: {
          names: ['-sse', '--stringsEnum'],
          desc: 'A strings enumeration option',
          type: 'strings',
          accepts: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-sse, --stringsEnum.+A strings enumeration option\. Values are.+comma-separated\. Accepts values in.+\[one,two\]\./s,
      );
    });

    it('with a numbers enumeration option', () => {
      const options = {
        numbersEnum: {
          names: ['-nse', '--numbersEnum'],
          desc: 'A numbers enumeration option',
          type: 'numbers',
          accepts: [1, 2],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-nse, --numbersEnum.+A numbers enumeration option\. Values are.+comma-separated\. Accepts values in.+\[1,2\]\./s,
      );
    });
  });
});
