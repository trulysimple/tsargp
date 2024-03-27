import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser, req } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
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
      expect(() => parser.parse(['-f1'])).toThrow(`Option -f1 requires -f2.`);
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
      expect(() => parser.parse(['-f1'])).toThrow(`Option -f1 requires -f2.`);
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
      expect(() => parser.parse(['-f1'])).toThrow(`Option -f1 requires -f2.`);
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
      expect(() => parser.parse(['-f1', '-f2'])).toThrow(`Option -f1 requires no -f2.`);
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
      expect(() => parser.parse(['-f1', '-f2'])).toThrow(`Option -f1 requires no -f2.`);
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
      expect(() => parser.parse(['-f1', '-f2'])).toThrow(`Option -f1 requires no -f2.`);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on forward requirement not satisfied with req.not', () => {
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
      expect(() => parser.parse(['-s', 'a', '1'])).toThrow(`Option -b requires -s != 'a'.`);
    });

    it('should throw an error on forward requirement not satisfied with req.all', () => {
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
      expect(() => parser.parse(['1'])).toThrow(`Option -b requires -f1.`);
      expect(() => parser.parse(['-f1', '1'])).toThrow(`Option -b requires -f2.`);
      expect(() => parser.parse(['-f2', '1'])).toThrow(`Option -b requires -f1.`);
      expect(() => parser.parse(['-f1', '-f2', '1'])).not.toThrow();
    });

    it('should throw an error on forward requirement not satisfied with req.one', () => {
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
      expect(() => parser.parse(['1'])).toThrow(`Option -b requires (-f1 or -f2).`);
      expect(() => parser.parse(['-f1', '1'])).not.toThrow();
      expect(() => parser.parse(['-f2', '1'])).not.toThrow();
      expect(() => parser.parse(['-f1', '-f2', '1'])).not.toThrow();
    });

    it('should throw an error on forward requirement not satisfied with required boolean values', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: {
            flag: false,
            boolean: true,
          },
        },
        flag: {
          type: 'flag',
          names: ['-f2'],
          negationNames: ['--no-f2'],
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).not.toThrow();
      expect(() => parser.parse(['-f'])).toThrow(`Option -f requires -f2.`);
      expect(() => parser.parse(['-f', '-f2'])).toThrow(`Option -f requires -f2 = false.`);
      expect(() => parser.parse(['-f', '--no-f2'])).toThrow(`Option -f requires -b.`);
      expect(() => parser.parse(['-f', '--no-f2', '-b', '0'])).toThrow(`Option -f requires -b = true.`);
      expect(() => parser.parse(['-f', '--no-f2', '-b', '1'])).not.toThrow();
    });

    it('should throw an error on forward requirement not satisfied with required string values', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: {
            string: 'abc',
            strings: ['a'],
          },
        },
        string: {
          type: 'string',
          names: ['-s'],
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).not.toThrow();
      expect(() => parser.parse(['-f'])).toThrow(`Option -f requires -s.`);
      expect(() => parser.parse(['-f', '-s', 'x'])).toThrow(`Option -f requires -s = 'abc'.`);
      expect(() => parser.parse(['-f', '-s', 'abc'])).toThrow(`Option -f requires -ss.`);
      expect(() => parser.parse(['-f', '-s', 'abc', '-ss'])).toThrow(`Option -f requires -ss = ['a'].`);
      expect(() => parser.parse(['-f', '-s', 'abc', '-ss', 'a'])).not.toThrow();
    });

    it('should throw an error on forward requirement not satisfied with required number values', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: {
            number: 123,
            numbers: [1],
          },
        },
        number: {
          type: 'number',
          names: ['-n'],
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse([])).not.toThrow();
      expect(() => parser.parse(['-f'])).toThrow(`Option -f requires -n.`);
      expect(() => parser.parse(['-f', '-n', '1'])).toThrow(`Option -f requires -n = 123.`);
      expect(() => parser.parse(['-f', '-n', '123'])).toThrow(`Option -f requires -ns.`);
      expect(() => parser.parse(['-f', '-n', '123', '-ns'])).toThrow(`Option -f requires -ns = [1].`);
      expect(() => parser.parse(['-f', '-n', '123', '-ns', '1'])).not.toThrow();
    });

    it('should throw an error on forward requirement not satisfied with negated required boolean values', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({
            flag: false,
            boolean: true,
          }),
        },
        flag: {
          type: 'flag',
          names: ['-f2'],
          negationNames: ['--no-f2'],
        },
        boolean: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f'])).not.toThrow();
      expect(() => parser.parse(['-f', '-f2'])).not.toThrow();
      expect(() => parser.parse(['-f', '--no-f2'])).not.toThrow();
      expect(() => parser.parse(['-f', '--no-f2', '-b', '0'])).not.toThrow();
      expect(() => parser.parse(['-f', '--no-f2', '-b', '1'])).toThrow(
        `Option -f requires (-f2 != false or -b != true).`,
      );
    });

    it('should throw an error on forward requirement not satisfied with negated required string values', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({
            string: 'abc',
            strings: ['a'],
          }),
        },
        string: {
          type: 'string',
          names: ['-s'],
        },
        strings: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f'])).not.toThrow();
      expect(() => parser.parse(['-f', '-s', 'x'])).not.toThrow();
      expect(() => parser.parse(['-f', '-s', 'abc'])).not.toThrow();
      expect(() => parser.parse(['-f', '-s', 'abc', '-ss'])).not.toThrow();
      expect(() => parser.parse(['-f', '-s', 'abc', '-ss', 'a'])).toThrow(
        `Option -f requires (-s != 'abc' or -ss != ['a']).`,
      );
    });

    it('should throw an error on forward requirement not satisfied with negated required number values', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.not({
            number: 123,
            numbers: [1],
          }),
        },
        number: {
          type: 'number',
          names: ['-n'],
        },
        numbers: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      expect(() => parser.parse(['-f'])).not.toThrow();
      expect(() => parser.parse(['-f', '-n', '1'])).not.toThrow();
      expect(() => parser.parse(['-f', '-n', '123'])).not.toThrow();
      expect(() => parser.parse(['-f', '-n', '123', '-ns'])).not.toThrow();
      expect(() => parser.parse(['-f', '-n', '123', '-ns', '1'])).toThrow(
        `Option -f requires (-n != 123 or -ns != [1]).`,
      );
    });
  });

  it('should throw an error on forward requirement not satisfied with a callback', () => {
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
        requires: (values) => values['flag1'] === values['flag2'],
      },
    } as const satisfies Options;
    options.boolean.requires.toString = () => 'fcn';
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).not.toThrow();
    expect(() => parser.parse(['1'])).not.toThrow();
    expect(() => parser.parse(['-f1', '1'])).toThrow(`Option -b requires <fcn>.`);
    expect(() => parser.parse(['-f2', '1'])).toThrow(`Option -b requires <fcn>.`);
    expect(() => parser.parse(['-f1', '-f2', '1'])).not.toThrow();
  });

  it('should throw an error on forward requirement not satisfied with a negated callback', () => {
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
        requires: req.not((values) => values['flag1'] === values['flag2']),
      },
    } as const satisfies Options;
    options.boolean.requires.item.toString = () => 'fcn';
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).not.toThrow();
    expect(() => parser.parse(['1'])).toThrow(`Option -b requires not <fcn>.`);
    expect(() => parser.parse(['-f1', '1'])).not.toThrow();
    expect(() => parser.parse(['-f2', '1'])).not.toThrow();
    expect(() => parser.parse(['-f1', '-f2', '1'])).toThrow(`Option -b requires not <fcn>.`);
  });

  it('should throw an error on option absent despite being required if another is present (1)', () => {
    const options = {
      required: {
        type: 'flag',
        names: ['-f1'],
        requiredIf: 'other',
      },
      other: {
        type: 'function',
        names: ['-f2'],
        break: true,
        exec: vi.fn(),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse(['-f2'])).toThrow(`Option -f1 is required if -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option absent despite being required if another is present (2)', () => {
    const options = {
      required: {
        type: 'flag',
        names: ['-f1'],
        requiredIf: { other: undefined },
      },
      other: {
        type: 'function',
        names: ['-f2'],
        break: true,
        exec: vi.fn(),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse(['-f2'])).toThrow(`Option -f1 is required if -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option absent despite being required if another is present (3)', () => {
    const options = {
      required: {
        type: 'flag',
        names: ['-f1'],
        requiredIf: req.not({ other: null }),
      },
      other: {
        type: 'function',
        names: ['-f2'],
        break: true,
        exec: vi.fn(),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse(['-f2'])).toThrow(`Option -f1 is required if -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option present despite being required if another is absent (1)', () => {
    const options = {
      required: {
        type: 'flag',
        names: ['-f1'],
        requiredIf: req.not('other'),
      },
      other: {
        type: 'function',
        names: ['-f2'],
        exec: vi.fn(),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).toThrow(`Option -f1 is required if no -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option present despite being required if another is absent (2)', () => {
    const options = {
      required: {
        type: 'flag',
        names: ['-f1'],
        requiredIf: { other: null },
      },
      other: {
        type: 'function',
        names: ['-f2'],
        exec: vi.fn(),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).toThrow(`Option -f1 is required if no -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option present despite being required if another is absent (3)', () => {
    const options = {
      required: {
        type: 'flag',
        names: ['-f1'],
        requiredIf: req.not({ other: undefined }),
      },
      other: {
        type: 'function',
        names: ['-f2'],
        exec: vi.fn(),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).toThrow(`Option -f1 is required if no -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on conditional requirement not satisfied with req.not', () => {
    const options = {
      string: {
        type: 'string',
        names: ['-s'],
      },
      boolean: {
        type: 'boolean',
        names: ['-b'],
        positional: true,
        requiredIf: req.not({ string: 'a' }),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).toThrow(`Option -b is required if no -s.`);
    expect(() => parser.parse(['-s', 'b'])).toThrow(`Option -b is required if -s != 'a'.`);
    expect(() => parser.parse(['-s', 'a', '1'])).not.toThrow();
  });

  it('should throw an error on conditional requirement not satisfied with req.all', () => {
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
        requiredIf: req.all('flag1', 'flag2'),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).not.toThrow();
    expect(() => parser.parse(['-f1'])).not.toThrow();
    expect(() => parser.parse(['-f2'])).not.toThrow();
    expect(() => parser.parse(['-f1', '-f2'])).toThrow(`Option -b is required if (-f1 and -f2).`);
  });

  it('should throw an error on conditional requirement not satisfied with req.one', () => {
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
        requiredIf: req.one('flag1', 'flag2'),
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).not.toThrow();
    expect(() => parser.parse(['-f1'])).toThrow(`Option -b is required if -f1.`);
    expect(() => parser.parse(['-f2'])).toThrow(`Option -b is required if -f2.`);
    expect(() => parser.parse(['-f1', '-f2'])).toThrow(`Option -b is required if -f1.`);
  });

  it('should throw an error on conditional requirement not satisfied with required boolean values', () => {
    const options = {
      requires: {
        type: 'flag',
        names: ['-f'],
        requiredIf: {
          flag: false,
          boolean: true,
        },
      },
      flag: {
        type: 'flag',
        names: ['-f2'],
        negationNames: ['--no-f2'],
      },
      boolean: {
        type: 'boolean',
        names: ['-b'],
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).not.toThrow();
    expect(() => parser.parse(['-f2'])).not.toThrow();
    expect(() => parser.parse(['--no-f2'])).not.toThrow();
    expect(() => parser.parse(['--no-f2', '-b', '0'])).not.toThrow();
    expect(() => parser.parse(['--no-f2', '-b', '1'])).toThrow(
      `Option -f is required if (-f2 = false and -b = true).`,
    );
  });

  it('should throw an error on conditional requirement not satisfied with required string values', () => {
    const options = {
      requires: {
        type: 'flag',
        names: ['-f'],
        requiredIf: {
          string: 'abc',
          strings: ['a'],
        },
      },
      string: {
        type: 'string',
        names: ['-s'],
      },
      strings: {
        type: 'strings',
        names: ['-ss'],
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).not.toThrow();
    expect(() => parser.parse(['-s', 'x'])).not.toThrow();
    expect(() => parser.parse(['-s', 'abc'])).not.toThrow();
    expect(() => parser.parse(['-s', 'abc', '-ss'])).not.toThrow();
    expect(() => parser.parse(['-s', 'abc', '-ss', 'a'])).toThrow(
      `Option -f is required if (-s = 'abc' and -ss = ['a']).`,
    );
  });

  it('should throw an error on conditional requirement not satisfied with required number values', () => {
    const options = {
      requires: {
        type: 'flag',
        names: ['-f'],
        requiredIf: {
          number: 123,
          numbers: [1],
        },
      },
      number: {
        type: 'number',
        names: ['-n'],
      },
      numbers: {
        type: 'numbers',
        names: ['-ns'],
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).not.toThrow();
    expect(() => parser.parse(['-n', '1'])).not.toThrow();
    expect(() => parser.parse(['-n', '123'])).not.toThrow();
    expect(() => parser.parse(['-n', '123', '-ns'])).not.toThrow();
    expect(() => parser.parse(['-n', '123', '-ns', '1'])).toThrow(
      `Option -f is required if (-n = 123 and -ns = [1]).`,
    );
  });

  it('should throw an error on conditional requirement not satisfied with negated required boolean values', () => {
    const options = {
      requires: {
        type: 'flag',
        names: ['-f'],
        requiredIf: req.not({
          flag: false,
          boolean: true,
        }),
      },
      flag: {
        type: 'flag',
        names: ['-f2'],
        negationNames: ['--no-f2'],
      },
      boolean: {
        type: 'boolean',
        names: ['-b'],
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).toThrow(`Option -f is required if no -f2.`);
    expect(() => parser.parse(['-f2'])).toThrow(`Option -f is required if -f2 != false.`);
    expect(() => parser.parse(['--no-f2'])).toThrow(`Option -f is required if no -b.`);
    expect(() => parser.parse(['--no-f2', '-b', '0'])).toThrow(`Option -f is required if -b != true.`);
    expect(() => parser.parse(['--no-f2', '-b', '1'])).not.toThrow();
  });

  it('should throw an error on conditional requirement not satisfied with negated required string values', () => {
    const options = {
      requires: {
        type: 'flag',
        names: ['-f'],
        requiredIf: req.not({
          string: 'abc',
          strings: ['a'],
        }),
      },
      string: {
        type: 'string',
        names: ['-s'],
      },
      strings: {
        type: 'strings',
        names: ['-ss'],
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).toThrow(`Option -f is required if no -s.`);
    expect(() => parser.parse(['-s', 'x'])).toThrow(`Option -f is required if -s != 'abc'.`);
    expect(() => parser.parse(['-s', 'abc'])).toThrow(`Option -f is required if no -ss.`);
    expect(() => parser.parse(['-s', 'abc', '-ss'])).toThrow(`Option -f is required if -ss != ['a'].`);
    expect(() => parser.parse(['-s', 'abc', '-ss', 'a'])).not.toThrow();
  });

  it('should throw an error on conditional requirement not satisfied with negated required number values', () => {
    const options = {
      requires: {
        type: 'flag',
        names: ['-f'],
        requiredIf: req.not({
          number: 123,
          numbers: [1],
        }),
      },
      number: {
        type: 'number',
        names: ['-n'],
      },
      numbers: {
        type: 'numbers',
        names: ['-ns'],
      },
    } as const satisfies Options;
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).toThrow(`Option -f is required if no -n.`);
    expect(() => parser.parse(['-n', '1'])).toThrow(`Option -f is required if -n != 123.`);
    expect(() => parser.parse(['-n', '123'])).toThrow(`Option -f is required if no -ns.`);
    expect(() => parser.parse(['-n', '123', '-ns'])).toThrow(`Option -f is required if -ns != [1].`);
    expect(() => parser.parse(['-n', '123', '-ns', '1'])).not.toThrow();
  });

  it('should throw an error on conditional requirement not satisfied with a callback', () => {
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
        requiredIf: (values) => values['flag1'] === values['flag2'],
      },
    } as const satisfies Options;
    options.boolean.requiredIf.toString = () => 'fcn';
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).toThrow(`Option -b is required if <fcn>.`);
    expect(() => parser.parse(['-f1'])).not.toThrow();
    expect(() => parser.parse(['-f2'])).not.toThrow();
    expect(() => parser.parse(['-f1', '-f2'])).toThrow(`Option -b is required if <fcn>.`);
  });

  it('should throw an error on conditional requirement not satisfied with a negated callback', () => {
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
        requiredIf: req.not((values) => values['flag1'] === values['flag2']),
      },
    } as const satisfies Options;
    options.boolean.requiredIf.item.toString = () => 'fcn';
    const parser = new ArgumentParser(options);
    expect(() => parser.parse([])).not.toThrow();
    expect(() => parser.parse(['-f1'])).toThrow(`Option -b is required if not <fcn>.`);
    expect(() => parser.parse(['-f2'])).toThrow(`Option -b is required if not <fcn>.`);
    expect(() => parser.parse(['-f1', '-f2'])).not.toThrow();
  });
});
