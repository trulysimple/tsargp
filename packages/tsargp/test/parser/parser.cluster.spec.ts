import { describe, expect, it, vi } from 'vitest';
import type { Options, ParsingFlags } from '../../lib';
import { ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    const flags: ParsingFlags = { clusterPrefix: '-' };

    it('should throw an error on unrecognized cluster argument', async () => {
      const parser = new ArgumentParser({});
      await expect(parser.parse(['-'], flags)).rejects.toThrow(`Unknown option -.`);
      await expect(parser.parse(['-x'], flags)).rejects.toThrow(`Unknown option -x.`);
    });

    it('should parse a flag option in a cluster argument with empty prefix', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['f'], { clusterPrefix: '' })).resolves.toEqual({ flag: true });
    });

    it('should parse a flag option in a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f'], flags)).resolves.toEqual({ flag: true });
    });

    it('should parse a boolean option in a cluster argument', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['--bool'],
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b', '1'], flags)).resolves.toEqual({ boolean: true });
    });

    it('should parse a string option in a cluster argument', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['--str'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s', '1'], flags)).resolves.toEqual({ string: '1' });
    });

    it('should parse a number option in a cluster argument', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['--num'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '1'], flags)).resolves.toEqual({ number: 1 });
    });

    it('should parse a strings option in a cluster argument', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['--ss'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s', '1', '2'], flags)).resolves.toEqual({ strings: ['1', '2'] });
    });

    it('should parse a numbers option in a cluster argument', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['--ns'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n', '1', '2'], flags)).resolves.toEqual({ numbers: [1, 2] });
    });

    it('should parse a function option in a cluster argument', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['--fcn'],
          clusterLetters: 'f',
          exec: vi.fn().mockImplementation(() => true),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ff'], flags)).resolves.toEqual({ function: true });
      expect(options.function.exec).toHaveBeenCalledTimes(2);
    });

    it('should throw an error on string option with fallback value in the middle of a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
        string: {
          type: 'string',
          names: ['--str'],
          fallback: '',
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-sf'], flags)).rejects.toThrow(
        `Option letter s must be the last in a cluster.`,
      );
    });

    it('should throw an error on number option with fallback value in the middle of a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
        number: {
          type: 'number',
          names: ['--num'],
          fallback: 0,
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-nf'], flags)).rejects.toThrow(
        `Option letter n must be the last in a cluster.`,
      );
    });

    it('should throw an error on variadic strings option in the middle of a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
        strings: {
          type: 'strings',
          names: ['--ss'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-sf'], flags)).rejects.toThrow(
        `Option letter s must be the last in a cluster.`,
      );
    });

    it('should throw an error on variadic numbers option in the middle of a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
        numbers: {
          type: 'numbers',
          names: ['--ns'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-nf'], flags)).rejects.toThrow(
        `Option letter n must be the last in a cluster.`,
      );
    });

    it('should throw an error on variadic function option in the middle of a cluster argument (1)', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'x',
        },
        function: {
          type: 'function',
          names: ['--fcn'],
          paramCount: -1,
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-fx'], flags)).rejects.toThrow(
        `Option letter f must be the last in a cluster.`,
      );
    });

    it('should throw an error on variadic function option in the middle of a cluster argument (2)', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'x',
        },
        function: {
          type: 'function',
          names: ['--fcn'],
          paramCount: [0, 1],
          clusterLetters: 'f',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-fx'], flags)).rejects.toThrow(
        `Option letter f must be the last in a cluster.`,
      );
    });

    it('should throw an error on command option in the middle of a cluster argument', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['--flag'],
          clusterLetters: 'f',
        },
        command: {
          type: 'command',
          names: ['--cmd'],
          clusterLetters: 'c',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-cf'], flags)).rejects.toThrow(
        `Option letter c must be the last in a cluster.`,
      );
    });

    it('should parse a nameless positional option in a cluster argument', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          positional: true,
          clusterLetters: 'b',
        },
        string: {
          type: 'string',
          names: ['--str'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b'], flags)).resolves.toEqual({
        boolean: undefined,
        string: undefined,
      });
      await expect(parser.parse(['-b1'], flags)).resolves.toEqual({
        boolean: true,
        string: undefined,
      });
      await expect(parser.parse(['-b', '1'], flags)).resolves.toEqual({
        boolean: true,
        string: undefined,
      });
      await expect(parser.parse(['-bs', '1', 'abc'], flags)).resolves.toEqual({
        boolean: true,
        string: 'abc',
      });
      await expect(parser.parse(['-sb', 'abc', '1'], flags)).resolves.toEqual({
        boolean: true,
        string: 'abc',
      });
    });

    it('should parse options in a cluster argument for a nested command', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['--cmd'],
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
          clusterPrefix: '-',
          clusterLetters: 'c',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-c', '-fsn', '1', '2'], flags)).resolves.toEqual({
        command: {
          flag: true,
          string: '1',
          number: 2,
        },
      });
    });
  });
});
