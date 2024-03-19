import { describe, expect, it } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a string option with trimming normalization', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          trim: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-s', ' one '])).toEqual({ string: 'one' });
    });

    it('should handle a string option with lowercase normalization', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'lower',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-s', 'OnE'])).toEqual({ string: 'one' });
    });

    it('should handle a string option with uppercase normalization', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'upper',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-s', 'oNe'])).toEqual({ string: 'ONE' });
    });

    it('should handle a number option with truncation', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          round: 'trunc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-n', '0.1'])).toEqual({ number: 0 });
      expect(parser.parse(['-n', '0.5'])).toEqual({ number: 0 });
      expect(parser.parse(['-n', '0.9'])).toEqual({ number: 0 });
      expect(parser.parse(['-n', '-.1'])).toEqual({ number: -0 });
      expect(parser.parse(['-n', '-.5'])).toEqual({ number: -0 });
      expect(parser.parse(['-n', '-.9'])).toEqual({ number: -0 });
    });

    it('should handle a number option with ceil rounding', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          round: 'ceil',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-n', '0.1'])).toEqual({ number: 1 });
      expect(parser.parse(['-n', '0.5'])).toEqual({ number: 1 });
      expect(parser.parse(['-n', '0.9'])).toEqual({ number: 1 });
      expect(parser.parse(['-n', '-.1'])).toEqual({ number: -0 });
      expect(parser.parse(['-n', '-.5'])).toEqual({ number: -0 });
      expect(parser.parse(['-n', '-.9'])).toEqual({ number: -0 });
    });

    it('should handle a number option with floor rounding', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          round: 'floor',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-n', '0.1'])).toEqual({ number: 0 });
      expect(parser.parse(['-n', '0.5'])).toEqual({ number: 0 });
      expect(parser.parse(['-n', '0.9'])).toEqual({ number: 0 });
      expect(parser.parse(['-n', '-.1'])).toEqual({ number: -1 });
      expect(parser.parse(['-n', '-.5'])).toEqual({ number: -1 });
      expect(parser.parse(['-n', '-.9'])).toEqual({ number: -1 });
    });

    it('should handle a number option with nearest rounding', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          round: 'round',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-n', '0.1'])).toEqual({ number: 0 });
      expect(parser.parse(['-n', '0.5'])).toEqual({ number: 1 });
      expect(parser.parse(['-n', '0.9'])).toEqual({ number: 1 });
      expect(parser.parse(['-n', '-.1'])).toEqual({ number: -0 });
      expect(parser.parse(['-n', '-.5'])).toEqual({ number: -0 });
      expect(parser.parse(['-n', '-.9'])).toEqual({ number: -1 });
    });

    it('should handle a strings option with trimming normalization', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          trim: true,
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ss', ' one, two '])).toEqual({ strings: ['one', 'two'] });
    });

    it('should handle a strings option with lowercase normalization', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'lower',
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ss', 'OnE,T O.'])).toEqual({ strings: ['one', 't o.'] });
    });

    it('should handle a strings option with uppercase normalization', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'upper',
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ss', 'o?Ne,2ki'])).toEqual({ strings: ['O?NE', '2KI'] });
    });

    it('should handle a numbers option with truncation', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'trunc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ns', '0.1', '-.1'])).toEqual({ numbers: [0, -0] });
      expect(parser.parse(['-ns', '0.5', '-.5'])).toEqual({ numbers: [0, -0] });
      expect(parser.parse(['-ns', '0.9', '-.9'])).toEqual({ numbers: [0, -0] });
    });

    it('should handle a numbers option with ceil rounding', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'ceil',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ns', '0.1', '-.1'])).toEqual({ numbers: [1, -0] });
      expect(parser.parse(['-ns', '0.5', '-.5'])).toEqual({ numbers: [1, -0] });
      expect(parser.parse(['-ns', '0.9', '-.9'])).toEqual({ numbers: [1, -0] });
    });

    it('should handle a numbers option with floor rounding', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'floor',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ns', '0.1', '-.1'])).toEqual({ numbers: [0, -1] });
      expect(parser.parse(['-ns', '0.5', '-.5'])).toEqual({ numbers: [0, -1] });
      expect(parser.parse(['-ns', '0.9', '-.9'])).toEqual({ numbers: [0, -1] });
    });

    it('should handle a numbers option with nearest rounding', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          round: 'round',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-ns', '0.1', '-.1'])).toEqual({ numbers: [0, -0] });
      expect(parser.parse(['-ns', '0.5', '-.5'])).toEqual({ numbers: [1, -0] });
      expect(parser.parse(['-ns', '0.9', '-.9'])).toEqual({ numbers: [1, -1] });
    });
  });
});
