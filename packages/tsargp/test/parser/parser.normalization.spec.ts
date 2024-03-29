import { describe, expect, it } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should handle a string option with trimming normalization', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          trim: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s', ' one '])).resolves.toEqual({ string: 'one' });
    });

    it('should handle a string option with lowercase normalization', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'lower',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s', 'OnE'])).resolves.toEqual({ string: 'one' });
    });

    it('should handle a string option with uppercase normalization', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          case: 'upper',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s', 'oNe'])).resolves.toEqual({ string: 'ONE' });
    });

    it('should handle a number option with math normalization', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          conv: 'trunc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '0.1'])).resolves.toEqual({ number: 0 });
      await expect(parser.parse(['-n', '0.5'])).resolves.toEqual({ number: 0 });
      await expect(parser.parse(['-n', '0.9'])).resolves.toEqual({ number: 0 });
      await expect(parser.parse(['-n', '-.1'])).resolves.toEqual({ number: -0 });
      await expect(parser.parse(['-n', '-.5'])).resolves.toEqual({ number: -0 });
      await expect(parser.parse(['-n', '-.9'])).resolves.toEqual({ number: -0 });
    });

    it('should handle a strings option with trimming normalization', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          trim: true,
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', ' one, two '])).resolves.toEqual({
        strings: ['one', 'two'],
      });
    });

    it('should handle a strings option with lowercase normalization', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'lower',
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'OnE,T O.'])).resolves.toEqual({
        strings: ['one', 't o.'],
      });
    });

    it('should handle a strings option with uppercase normalization', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          case: 'upper',
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss', 'o?Ne,2ki'])).resolves.toEqual({
        strings: ['O?NE', '2KI'],
      });
    });

    it('should handle a numbers option math normalization', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          conv: 'trunc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns', '0.1', '-.1'])).resolves.toEqual({ numbers: [0, -0] });
      await expect(parser.parse(['-ns', '0.5', '-.5'])).resolves.toEqual({ numbers: [0, -0] });
      await expect(parser.parse(['-ns', '0.9', '-.9'])).resolves.toEqual({ numbers: [0, -0] });
    });
  });
});
