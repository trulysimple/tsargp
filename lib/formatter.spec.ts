import type { Options } from './options.js';

import { describe, expect, it } from 'vitest';
import { HelpFormatter } from './formatter.js';
import { resetStyle } from './styles.js';

describe('HelpFormatter', () => {
  describe('formatHelp', () => {
    it('should handle no options', () => {
      expect(new HelpFormatter({}).formatHelp()).toEqual(resetStyle);
    });

    it('should handle a function option', () => {
      const options = {
        function: {
          names: ['-f', '--function'],
          desc: 'A function option',
          type: 'function',
          default: () => {},
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-f, --function.+A function option\./s);
    });

    it('should handle a deprecated boolean option', () => {
      const options = {
        boolean: {
          names: ['-b', '--boolean'],
          desc: 'A boolean option',
          type: 'boolean',
          deprecated: 'reason',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-b, --boolean.+A boolean option\. Deprecated for reason\./s);
    });

    it('should handle a string option with a default value', () => {
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

    it('should handle a string option with an example value', () => {
      const options = {
        string: {
          names: ['-s', '--string'],
          desc: 'A string option',
          type: 'string',
          example: '123',
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-s, --string.+'123'.+A string option\./s);
    });

    it('should handle a number option with a default value', () => {
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

    it('should handle a number option with an example value', () => {
      const options = {
        number: {
          names: ['-n', '--number'],
          desc: 'A number option',
          type: 'number',
          example: 123,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-n, --number.+'123'.+A number option\./s);
    });

    it('should handle a string enumeration option', () => {
      const options = {
        stringEnum: {
          names: ['-se', '--stringEnum'],
          desc: 'A string option',
          type: 'string',
          enums: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-se, --stringEnum.+A string option\. Accepts values of \[one,two\]\./s,
      );
    });

    it('should handle a number enumeration option', () => {
      const options = {
        numberEnum: {
          names: ['-ne', '--numberEnum'],
          desc: 'A number option',
          type: 'number',
          enums: [1, 2],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(/-ne, --numberEnum.+A number option\. Accepts values of \[1,2\]\./s);
    });

    it('should handle a string option with a regex constraint', () => {
      const options = {
        stringRegex: {
          names: ['-sr', '--stringRegex'],
          desc: 'A string option',
          type: 'string',
          regex: /\d+/s,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-sr, --stringRegex.+\[string\].+A string option\. Accepts values matching \/\\d\+\/s\./s,
      );
    });

    it('should handle a number option with a range constraint', () => {
      const options = {
        numberRange: {
          names: ['-nr', '--numberRange'],
          desc: 'A number option',
          type: 'number',
          range: [0, Infinity],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-nr, --numberRange.+\[number\].+A number option\. Accepts values in the range.+\[0,Infinity\]\./s,
      );
    });

    it('should handle a strings option with a default value', () => {
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

    it('should handle a numbers option with a default value', () => {
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

    it('should handle a strings option with an example value', () => {
      const options = {
        strings: {
          names: ['-ss', '--strings'],
          desc: 'A strings option',
          type: 'strings',
          example: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-ss, --strings.+'one,two'.+A strings option\. Values are comma-separated\./s,
      );
    });

    it('should handle a numbers option with an example value', () => {
      const options = {
        numbers: {
          names: ['-ns', '--numbers'],
          desc: 'A numbers option',
          type: 'numbers',
          example: [1, 2],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-ns, --numbers.+'1,2'.+A numbers option\. Values are.+comma-separated\./s,
      );
    });

    it('should handle a strings enumeration option', () => {
      const options = {
        stringsEnum: {
          names: ['-sse', '--stringsEnum'],
          desc: 'A strings option',
          type: 'strings',
          enums: ['one', 'two'],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-sse, --stringsEnum.+\[strings\].+A strings option\. Values are comma-separated\..+Accepts values of.+\[one,two\]\./s,
      );
    });

    it('should handle a numbers enumeration option', () => {
      const options = {
        numbersEnum: {
          names: ['-nse', '--numbersEnum'],
          desc: 'A numbers option',
          type: 'numbers',
          enums: [1, 2],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-nse, --numbersEnum.+\[numbers\].+A numbers option\. Values are comma-separated\..+Accepts values of.+\[1,2\]\./s,
      );
    });

    it('should handle a strings option with a regex constraint', () => {
      const options = {
        stringsRegex: {
          names: ['-ssr', '--stringsRegex'],
          desc: 'A strings option',
          type: 'strings',
          regex: /\d+/s,
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-ssr, --stringsRegex.+\[strings\].+A strings option\. Values are comma-separated\..+Accepts values matching \/\\d\+\/s\./s,
      );
    });

    it('should handle a numbers option with a range constraint', () => {
      const options = {
        numbersRange: {
          names: ['-nsr', '--numbersRange'],
          desc: 'A numbers option',
          type: 'numbers',
          range: [0, Infinity],
        },
      } as const satisfies Options;
      const message = new HelpFormatter(options).formatHelp(80);
      expect(message).toMatch(
        /-nsr, --numbersRange.+\[numbers\].+A numbers option\. Values are comma-separated\..+Accepts values in the range.+\[0,Infinity\]\./s,
      );
    });
  });
});
