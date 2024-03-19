import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser, req } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should throw an error on option with a value different than required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: false },
        },
        required: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-b', '1'])).toThrow(/Option -f requires -b = false\./);
    });

    it('should throw an error on option with a value equal to required when negated', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({ required: false }),
        },
        required: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-b', '0'])).toThrow(/Option -f requires -b != false\./);
    });

    it('should ignore required value on option when using an async custom parse', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: false },
        },
        required: {
          type: 'boolean',
          names: ['-b'],
          parse: async () => true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-b', '1'])).not.toThrow();
    });

    it('should throw an error on string option with a value different than required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: '0' },
        },
        required: {
          type: 'string',
          names: ['-s'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-s', '1'])).toThrow(/Option -f requires -s = '0'\./);
    });

    it('should throw an error on string option with a value equal to required when negated', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({ required: '0' }),
        },
        required: {
          type: 'string',
          names: ['-s'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-s', '0'])).toThrow(/Option -f requires -s != '0'\./);
    });

    it('should ignore required value on string option when using an async custom parse', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: '0' },
        },
        required: {
          type: 'string',
          names: ['-s'],
          parse: async () => '1',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-s', '1'])).not.toThrow();
    });

    it('should throw an error on number option with a value different than required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: 0 },
        },
        required: {
          type: 'number',
          names: ['-n'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-n', '1'])).toThrow(/Option -f requires -n = 0\./);
    });

    it('should throw an error on number option with a value equal to required when negated', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({ required: 0 }),
        },
        required: {
          type: 'number',
          names: ['-n'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-n', '0'])).toThrow(/Option -f requires -n != 0\./);
    });

    it('should ignore required value on number option when using an async custom parse', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: 0 },
        },
        required: {
          type: 'number',
          names: ['-n'],
          parse: async () => 1,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-n', '1'])).not.toThrow();
    });

    it('should throw an error on strings option with a value different than required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: ['0', '1'] },
        },
        required: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-ss', '1'])).toThrow(
        /Option -f requires -ss = \['0', '1'\]\./,
      );
    });

    it('should throw an error on strings option with a value equal to required when negated', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({ required: ['0', '1'] }),
        },
        required: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-ss', '0', '1'])).toThrow(
        /Option -f requires -ss != \['0', '1'\]\./,
      );
    });

    it('should ignore required value on strings option when using an async custom parse', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: ['0'] },
        },
        required: {
          type: 'strings',
          names: ['-ss'],
          parse: async () => '1',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-ss', '1'])).not.toThrow();
    });

    it('should throw an error on numbers option with a value different than required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: [0, 1] },
        },
        required: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-ns', '1'])).toThrow(/Option -f requires -ns = \[0, 1\]\./);
    });

    it('should throw an error on numbers option with a value equal to required when negated', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({ required: [0, 1] }),
        },
        required: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-ns', '0', '1'])).toThrow(
        /Option -f requires -ns != \[0, 1\]\./,
      );
    });

    it('should ignore required value on numbers option when using an async custom parse', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: [0] },
        },
        required: {
          type: 'numbers',
          names: ['-ns'],
          parse: async () => 1,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f', '-ns', '1'])).not.toThrow();
    });

    it('should throw an error on option absent despite being required to be present (1)', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: 'required',
        },
        required: {
          type: 'function',
          names: ['-f2'],
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f1'])).toThrow(/Option -f1 requires -f2\./);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option absent despite being required to be present (2)', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: undefined },
        },
        required: {
          type: 'function',
          names: ['-f2'],
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f1'])).toThrow(/Option -f1 requires -f2\./);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option absent despite being required to be present (3)', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: req.not({ required: null }),
        },
        required: {
          type: 'function',
          names: ['-f2'],
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f1'])).toThrow(/Option -f1 requires -f2\./);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option present despite being required to be absent (1)', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: req.not('required'),
        },
        required: {
          type: 'function',
          names: ['-f2'],
          break: true,
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option -f1 requires no -f2\./);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option present despite being required to be absent (2)', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: null },
        },
        required: {
          type: 'function',
          names: ['-f2'],
          break: true,
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option -f1 requires no -f2\./);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option present despite being required to be absent (3)', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: req.not({ required: undefined }),
        },
        required: {
          type: 'function',
          names: ['-f2'],
          break: true,
          exec: vi.fn(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option -f1 requires no -f2\./);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error when an option requirement is not satisfied with req.not', () => {
      const options = {
        string: {
          type: 'string',
          names: ['-s'],
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: true,
          requires: req.not({ string: 'a' }),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).not.toThrow();
      expect(() => parser.parse(['1'])).not.toThrow();
      expect(() => parser.parse(['-s', 'b', '1'])).not.toThrow();
      expect(() => parser.parse(['-s', 'a', '1'])).toThrow(/Option -b requires -s != 'a'\./);
    });

    it('should throw an error when an option requirement is not satisfied with req.all', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f1'],
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: true,
          requires: req.all('flag1', 'flag2'),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).not.toThrow();
      expect(() => parser.parse(['1'])).toThrow(/Option -b requires -f1\./);
      expect(() => parser.parse(['-f1', '1'])).toThrow(/Option -b requires -f2\./);
      expect(() => parser.parse(['-f2', '1'])).toThrow(/Option -b requires -f1\./);
      expect(() => parser.parse(['-f1', '-f2', '1'])).not.toThrow();
    });

    it('should throw an error when an option requirement is not satisfied with req.one', () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f1'],
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
          positional: true,
          requires: req.one('flag1', 'flag2'),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).not.toThrow();
      expect(() => parser.parse(['1'])).toThrow(/Option -b requires \(-f1 or -f2\)\./);
      expect(() => parser.parse(['-f1', '1'])).not.toThrow();
      expect(() => parser.parse(['-f2', '1'])).not.toThrow();
      expect(() => parser.parse(['-f1', '-f2', '1'])).not.toThrow();
    });

    it('should throw an error when an option requirement is not satisfied with an expression', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: {
            string: 'abc',
            number: 123,
            strings: ['a', 'b'],
            numbers: [1, 2],
          },
        },
        string: {
          type: 'string',
          names: ['-s'],
        },
        number: {
          type: 'number',
          names: ['-n'],
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).not.toThrow();
      expect(() => parser.parse(['-f'])).toThrow(/Option -f requires -s\./);
      expect(() => parser.parse(['-f', '-s', 'a'])).toThrow(/Option -f requires -s = 'abc'\./);
      expect(() => parser.parse(['-f', '-s', 'abc'])).toThrow(/Option -f requires -n\./);
      expect(() => parser.parse(['-f', '-s', 'abc', '-n', '1'])).toThrow(
        /Option -f requires -n = 123\./,
      );
      expect(() => parser.parse(['-f', '-n', '123'])).toThrow(/Option -f requires -s\./);
      expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123'])).toThrow(
        /Option -f requires -ss\./,
      );
      expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a'])).toThrow(
        /Option -f requires -ss = \['a', 'b'\]\./,
      );
      expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b'])).toThrow(
        /Option -f requires -ns\./,
      );
      expect(() =>
        parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1']),
      ).toThrow(/Option -f requires -ns = \[1, 2\]\./);
      expect(() =>
        parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1', '2']),
      ).not.toThrow();
    });

    it('should throw an error when an option requirement is not satisfied with a negated expression', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({
            string: 'abc',
            number: 123,
            strings: ['a', 'b'],
            numbers: [1, 2],
          }),
        },
        string: {
          type: 'string',
          names: ['-s'],
        },
        number: {
          type: 'number',
          names: ['-n'],
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).not.toThrow();
      expect(() => parser.parse(['-f'])).not.toThrow();
      expect(() => parser.parse(['-f', '-s', 'a'])).not.toThrow();
      expect(() => parser.parse(['-f', '-s', 'abc'])).not.toThrow();
      expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123'])).not.toThrow();
      expect(() => parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b'])).not.toThrow();
      expect(() =>
        parser.parse(['-f', '-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1', '2']),
      ).toThrow(
        /Option -f requires \(-s != 'abc' or -n != 123 or -ss != \['a', 'b'\] or -ns != \[1, 2\]\)\./,
      );
    });
  });
});
