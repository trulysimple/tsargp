import { describe, expect, it } from 'vitest';
import type { Options, ParsingFlags } from '../../lib';
import { ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    const flags: ParsingFlags = { shortStyle: true };

    it('should accept no arguments when expecting a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([], flags)).resolves.toEqual({ flag: undefined });
    });

    it('should skip the first dash in a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f'], flags)).resolves.toEqual({ flag: true });
    });

    it('should throw an error on unknown option in cluster', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['f-'], flags)).rejects.toThrow(`Unknown option -.`);
    });

    it('should skip options with no names in a cluster argument', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          positional: true,
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['b'], flags)).resolves.toEqual({ boolean: undefined });
      await expect(parser.parse(['b', '1'], flags)).resolves.toEqual({ boolean: true });
    });

    it('should parse a boolean option in a cluster argument', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['b', '1'], flags)).resolves.toEqual({ boolean: true });
    });

    it('should parse a string option in a cluster argument', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['s', '1'], flags)).resolves.toEqual({ string: '1' });
    });

    it('should parse a number option in a cluster argument', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['n', '1'], flags)).resolves.toEqual({ number: 1 });
    });

    it('should parse a strings option in a cluster argument', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['s', '1', '2'], flags)).resolves.toEqual({ strings: ['1', '2'] });
    });

    it('should parse a numbers option in a cluster argument', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['n', '1', '2'], flags)).resolves.toEqual({ numbers: [1, 2] });
    });

    it('should parse a function option in a cluster argument', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          clusterLetters: 'f',
          exec: () => true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['f'], flags)).resolves.toEqual({ function: true });
    });

    it('should throw an error on string option with fallback value in the middle of a cluster argument', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          fallback: '',
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['sx'], flags)).rejects.toThrow(
        `Option letter s must be the last in a cluster.`,
      );
    });

    it('should throw an error on number option with fallback value in the middle of a cluster argument', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          fallback: 0,
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['nx'], flags)).rejects.toThrow(
        `Option letter n must be the last in a cluster.`,
      );
    });

    it('should throw an error on variadic strings option in the middle of a cluster argument', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['sx'], flags)).rejects.toThrow(
        `Option letter s must be the last in a cluster.`,
      );
    });

    it('should throw an error on variadic numbers option in the middle of a cluster argument', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['nx'], flags)).rejects.toThrow(
        `Option letter n must be the last in a cluster.`,
      );
    });

    it('should throw an error on variadic function option in the middle of a cluster argument (1)', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: -1,
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['fx'], flags)).rejects.toThrow(
        `Option letter f must be the last in a cluster.`,
      );
    });

    it('should throw an error on variadic function option in the middle of a cluster argument (2)', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: [0, 1],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['fx'], flags)).rejects.toThrow(
        `Option letter f must be the last in a cluster.`,
      );
    });

    it('should throw an error on command option in the middle of a cluster argument', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          options: {},
          exec() {},
          clusterLetters: 'c',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['cx'], flags)).rejects.toThrow(
        `Option letter c must be the last in a cluster.`,
      );
    });

    it('should parse options in a cluster argument for a nested command', async () => {
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
          exec: ({ param }) => param,
          shortStyle: true,
          clusterLetters: 'c',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['c', 'fsn', '1', '2'], flags)).resolves.toEqual({
        command: {
          flag: true,
          string: '1',
          number: 2,
        },
      });
    });
  });
});
