import { describe, expect, it, vi } from 'vitest';
import type { Options, ParsingFlags } from '../../lib';
import { ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('validate', () => {
    const flags: ParsingFlags = { clusterPrefix: '-' };

    it('should ignore required inline parameter during completion', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          inline: 'always',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -s ', { compIndex: 9 })).rejects.toThrow(/^-s$/);
    });

    it('should ignore disallowed inline parameter during completion', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          enums: ['one', 'two'],
          inline: false,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse('cmd -s=', { compIndex: 7 })).rejects.toThrow(/^$/);
      await expect(parser.parse('cmd -s= ', { compIndex: 8 })).rejects.toThrow(/^-s$/);
    });

    it('should throw an error on positional marker specified with value', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: '--',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['--='])).rejects.toThrow(
        `Positional marker -- does not accept inline parameters.`,
      );
      await expect(parser.parse(['--=a'])).rejects.toThrow(
        `Positional marker -- does not accept inline parameters.`,
      );
    });

    it('should throw an error on niladic function option specified with inline parameter', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f='])).rejects.toThrow(
        `Option -f does not accept inline parameters.`,
      );
      await expect(parser.parse(['-f=a'])).rejects.toThrow(
        `Option -f does not accept inline parameters.`,
      );
      expect(options.function.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on non-niladic function option specified with inline parameter, despite it being disallowed', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          paramCount: 1,
          inline: false,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f='])).rejects.toThrow(
        `Option -f does not accept inline parameters.`,
      );
      await expect(parser.parse(['-f=a'])).rejects.toThrow(
        `Option -f does not accept inline parameters.`,
      );
    });

    it('should throw an error on command option specified with inline parameter', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-c='])).rejects.toThrow(
        `Option -c does not accept inline parameters.`,
      );
      await expect(parser.parse(['-c=a'])).rejects.toThrow(
        `Option -c does not accept inline parameters.`,
      );
      expect(options.command.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on flag option specified with inline parameter', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f='])).rejects.toThrow(
        `Option -f does not accept inline parameters.`,
      );
      await expect(parser.parse(['-f=a'])).rejects.toThrow(
        `Option -f does not accept inline parameters.`,
      );
    });

    it('should accept a boolean option with fallback value with missing inline parameter, despite it being required', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          inline: 'always',
          fallback: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b'])).resolves.toEqual({ boolean: true });
    });

    it('should accept a positional boolean option that disallows inline parameters', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          inline: false,
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['1'])).resolves.toEqual({ boolean: true });
    });

    it('should throw an error on boolean option with missing inline parameter, despite it being required', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          inline: 'always',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b'])).rejects.toThrow(`Option -b requires an inline parameter.`);
      await expect(parser.parse(['-b', '1'])).rejects.toThrow(
        `Option -b requires an inline parameter.`,
      );
    });

    it('should throw an error on boolean option with inline parameter, despite it being disallowed', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          inline: false,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b='])).rejects.toThrow(
        `Option -b does not accept inline parameters.`,
      );
      await expect(parser.parse(['-b=a'])).rejects.toThrow(
        `Option -b does not accept inline parameters.`,
      );
    });

    it('should parse throw an error on inline parameter to a variadic strings option', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss='])).rejects.toThrow(
        `Option -ss does not accept inline parameters.`,
      );
      await expect(parser.parse(['-ss=a'])).rejects.toThrow(
        `Option -ss does not accept inline parameters.`,
      );
    });

    it('should parse throw an error on inline parameter to a variadic numbers option', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns='])).rejects.toThrow(
        `Option -ns does not accept inline parameters.`,
      );
      await expect(parser.parse(['-ns=1'])).rejects.toThrow(
        `Option -ns does not accept inline parameters.`,
      );
    });

    it('should not consider an argument with an inline parameter as a cluster', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b=1'], flags)).resolves.toEqual({ boolean: true });
    });

    it('should throw an error on boolean option with missing inline cluster parameter, despite it being required', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['--bool'],
          clusterLetters: 'b',
          inline: 'always',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b'], flags)).rejects.toThrow(
        `Option --bool requires an inline parameter.`,
      );
    });

    it('should throw an error on boolean option with inline cluster parameter, despite it being disallowed', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['--bool'],
          clusterLetters: 'b',
          inline: false,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b1'], flags)).rejects.toThrow(
        `Option --bool does not accept inline parameters.`,
      );
    });

    it('should parse a boolean option with inline parameter', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b=1'], flags)).resolves.toEqual({ boolean: true });
    });

    it('should parse a string option with inline parameter', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s=1'], flags)).resolves.toEqual({ string: '1' });
    });

    it('should parse a number option with inline parameter', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n=1'], flags)).resolves.toEqual({ number: 1 });
    });

    it('should parse a delimited strings option with inline parameter', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ss=1,2'], flags)).resolves.toEqual({ strings: ['1', '2'] });
    });

    it('should parse a delimited numbers option with inline parameter', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          separator: ',',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-ns=1,2'], flags)).resolves.toEqual({ numbers: [1, 2] });
    });

    it('should parse a boolean option with inline cluster parameter', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['--bool'],
          clusterLetters: 'b',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-b1'], flags)).resolves.toEqual({ boolean: true });
    });

    it('should parse a string option with inline cluster parameter', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['--str'],
          clusterLetters: 's',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-s1'], flags)).resolves.toEqual({ string: '1' });
    });

    it('should parse a number option with inline cluster parameter', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['--num'],
          clusterLetters: 'n',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-n1'], flags)).resolves.toEqual({ number: 1 });
    });
  });
});
