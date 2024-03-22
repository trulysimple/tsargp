import { describe, expect, it } from 'vitest';
import { type Options, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should accept no arguments when expecting a cluster argument', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse([], { shortStyle: true })).toEqual({ flag: undefined });
    });

    it('should skip the first dash in a cluster argument', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-f'], { shortStyle: true })).toEqual({ flag: true });
    });

    it('should throw an error on unknown option letter', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['f-'], { shortStyle: true })).toThrow('Unknown option -.');
    });

    it('should skip options with no names in a cluster argument', () => {
      const options = {
        boolean: {
          type: 'boolean',
          positional: true,
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['b'], { shortStyle: true })).toEqual({ boolean: undefined });
    });

    it('should parse a boolean option in a cluster argument', () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['b', '1'], { shortStyle: true })).toEqual({ boolean: true });
    });

    it('should parse a string option in a cluster argument', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['s', '1'], { shortStyle: true })).toEqual({ string: '1' });
    });

    it('should parse a number option in a cluster argument', () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['n', '1'], { shortStyle: true })).toEqual({ number: 1 });
    });

    it('should parse a strings option in a cluster argument', () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['s', '1', '2'], { shortStyle: true })).toEqual({ strings: ['1', '2'] });
    });

    it('should parse a numbers option in a cluster argument', () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['n', '1', '2'], { shortStyle: true })).toEqual({ numbers: [1, 2] });
    });

    it('should throw an error on variadic strings option in the middle of a cluster argument', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['sf'], { shortStyle: true })).toThrow(
        'Variadic array option s must be the last in a cluster.',
      );
    });

    it('should throw an error on variadic numbers option in the middle of a cluster argument', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['nf'], { shortStyle: true })).toThrow(
        'Variadic array option n must be the last in a cluster.',
      );
    });

    it('should parse options in a cluster argument for a nested command', () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          options: {
            flag: {
              type: 'flag',
              names: ['-f'],
              clusterLetters: 'f',
            },
            string: {
              type: 'string',
              names: ['-s'],
              clusterLetters: 's',
            },
            number: {
              type: 'number',
              names: ['-n'],
              clusterLetters: 'n',
            },
          },
          cmd: (_, values) => values,
          shortStyle: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(parser.parse(['-c', 'fsn', '1', '2'])).toEqual({
        command: {
          flag: true,
          string: '1',
          number: 2,
        },
      });
    });
  });
});
