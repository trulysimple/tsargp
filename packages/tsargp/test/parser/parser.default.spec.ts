import { describe, expect, it, vi } from 'vitest';
import { type Options, type OptionValues, ArgumentParser } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should set default values when breaking the parsing loop', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f1'],
          break: true,
          exec(values) {
            expect((values as OptionValues<typeof options>).flag).toBeTruthy();
          },
        },
        flag: {
          type: 'flag',
          names: ['-f2'],
          default: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f1'])).resolves.toEqual({ function: undefined, flag: true });
    });

    it('should not set default values during parsing', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f1'],
          exec(values) {
            expect((values as OptionValues<typeof options>).flag).toBeUndefined();
          },
        },
        flag: {
          type: 'flag',
          names: ['-f2'],
          default: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f1'])).resolves.toEqual({ function: undefined, flag: true });
    });

    it('should handle a function option with a default value', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          default: false,
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ function: false });
      expect(options.function.exec).not.toHaveBeenCalled();
    });

    it('should handle a function option with a default callback', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          default: () => false,
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ function: false });
      expect(options.function.exec).not.toHaveBeenCalled();
    });

    it('should handle a function option with an async default callback', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          default: async () => false,
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ function: false });
      expect(options.function.exec).not.toHaveBeenCalled();
    });

    it('should set default values before calling a command callback', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          options: {},
          cmd(values) {
            expect((values as OptionValues<typeof options>).flag).toBeTruthy();
          },
        },
        flag: {
          type: 'flag',
          names: ['-f'],
          default: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-c'])).resolves.toEqual({ command: undefined, flag: true });
    });

    it('should handle a command option with a default value', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          default: false,
          options: {},
          cmd: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ command: false });
      expect(options.command.cmd).not.toHaveBeenCalled();
    });

    it('should handle a command option with a default callback', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          default: () => false,
          options: {},
          cmd: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ command: false });
      expect(options.command.cmd).not.toHaveBeenCalled();
    });

    it('should handle a command option with an async default callback', async () => {
      const options = {
        command: {
          type: 'command',
          names: ['-c'],
          default: async () => false,
          options: {},
          cmd: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ command: false });
      expect(options.command.cmd).not.toHaveBeenCalled();
    });

    it('should handle a flag option with a default value', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          default: false,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ flag: false });
    });

    it('should handle a flag option with a default callback', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          negationNames: ['-no-f'],
          default: () => false,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ flag: false });
    });

    it('should handle a flag option with an async default callback', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          negationNames: ['-no-f'],
          default: async () => false,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ flag: false });
    });

    it('should handle a boolean option with a default value', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          default: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ boolean: true });
    });

    it('should handle a boolean option with a default callback', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          default: () => true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ boolean: true });
    });

    it('should handle a boolean option with an async default callback', async () => {
      const options = {
        boolean: {
          type: 'boolean',
          names: ['-b'],
          default: async () => true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ boolean: true });
    });

    it('should handle a string option with a default value', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          default: '123',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ string: '123' });
    });

    it('should handle a string option with a default callback', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          default: () => '123',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ string: '123' });
    });

    it('should handle a string option with an async default callback', async () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
          default: async () => '123',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ string: '123' });
    });

    it('should handle a number option with a default value', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          default: 123,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ number: 123 });
    });

    it('should handle a number option with a default callback', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          default: () => 123,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ number: 123 });
    });

    it('should handle a number option with an async default callback', async () => {
      const options = {
        number: {
          type: 'number',
          names: ['-n'],
          default: async () => 123,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ number: 123 });
    });

    it('should handle a strings option with a default value', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          default: ['one', 'two'],
          case: 'upper',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ strings: ['ONE', 'TWO'] });
    });

    it('should handle a strings option with a default callback', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          default: () => ['one', 'two'],
          case: 'upper',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ strings: ['ONE', 'TWO'] });
    });

    it('should handle a strings option with an async default callback', async () => {
      const options = {
        strings: {
          type: 'strings',
          names: ['-ss'],
          default: async () => ['one', 'two'],
          case: 'upper',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ strings: ['ONE', 'TWO'] });
    });

    it('should handle a numbers option with a default value', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          default: [1.1, 2.2],
          conv: 'trunc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ numbers: [1, 2] });
    });

    it('should handle a numbers option with a default callback', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          default: () => [1.1, 2.2],
          conv: 'trunc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ numbers: [1, 2] });
    });

    it('should handle a numbers option with an async default callback', async () => {
      const options = {
        numbers: {
          type: 'numbers',
          names: ['-ns'],
          default: async () => [1.1, 2.2],
          conv: 'trunc',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ numbers: [1, 2] });
    });
  });
});
