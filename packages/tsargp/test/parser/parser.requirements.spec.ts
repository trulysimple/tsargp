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
      expect(() => parser.parse(['-s', 'a', '1'])).toThrow(/Option -b requires -s != 'a'\./);
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
      expect(() => parser.parse(['1'])).toThrow(/Option -b requires -f1\./);
      expect(() => parser.parse(['-f1', '1'])).toThrow(/Option -b requires -f2\./);
      expect(() => parser.parse(['-f2', '1'])).toThrow(/Option -b requires -f1\./);
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
      expect(() => parser.parse(['1'])).toThrow(/Option -b requires \(-f1 or -f2\)\./);
      expect(() => parser.parse(['-f1', '1'])).not.toThrow();
      expect(() => parser.parse(['-f2', '1'])).not.toThrow();
      expect(() => parser.parse(['-f1', '-f2', '1'])).not.toThrow();
    });

    it('should throw an error on forward requirement not satisfied with an expression', () => {
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

    it('should throw an error on forward requirement not satisfied with a negated expression', () => {
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
    expect(() => parser.parse(['-f1', '1'])).toThrow(/Option -b requires <fcn>\./);
    expect(() => parser.parse(['-f2', '1'])).toThrow(/Option -b requires <fcn>\./);
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
    expect(() => parser.parse(['1'])).toThrow(/Option -b requires not <fcn>\./);
    expect(() => parser.parse(['-f1', '1'])).not.toThrow();
    expect(() => parser.parse(['-f2', '1'])).not.toThrow();
    expect(() => parser.parse(['-f1', '-f2', '1'])).toThrow(/Option -b requires not <fcn>\./);
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
    expect(() => parser.parse(['-f2'])).toThrow(/Option -f1 is required if -f2\./);
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
    expect(() => parser.parse(['-f2'])).toThrow(/Option -f1 is required if -f2\./);
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
    expect(() => parser.parse(['-f2'])).toThrow(/Option -f1 is required if -f2\./);
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
    expect(() => parser.parse([])).toThrow(/Option -f1 is required if no -f2\./);
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
    expect(() => parser.parse([])).toThrow(/Option -f1 is required if no -f2\./);
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
    expect(() => parser.parse([])).toThrow(/Option -f1 is required if no -f2\./);
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
    expect(() => parser.parse([])).toThrow(/Option -b is required if no -s\./);
    expect(() => parser.parse(['-s', 'b'])).toThrow(/Option -b is required if -s != 'a'\./);
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
    expect(() => parser.parse(['-f1', '-f2'])).toThrow(
      /Option -b is required if \(-f1 and -f2\)\./,
    );
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
    expect(() => parser.parse(['-f1'])).toThrow(/Option -b is required if -f1\./);
    expect(() => parser.parse(['-f2'])).toThrow(/Option -b is required if -f2\./);
    expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option -b is required if -f1\./);
  });

  it('should throw an error on conditional requirement not satisfied with an expression', () => {
    const options = {
      required: {
        type: 'flag',
        names: ['-f'],
        requiredIf: {
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
    expect(() => parser.parse(['-s', 'a'])).not.toThrow();
    expect(() => parser.parse(['-s', 'abc'])).not.toThrow();
    expect(() => parser.parse(['-s', 'abc', '-n', '123'])).not.toThrow();
    expect(() => parser.parse(['-s', 'abc', '-n', '123', '-ss', 'a', 'b'])).not.toThrow();
    expect(() =>
      parser.parse(['-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1', '2']),
    ).toThrow(
      /Option -f is required if \(-s = 'abc' and -n = 123 and -ss = \['a', 'b'\] and -ns = \[1, 2\]\)\./,
    );
  });

  it('should throw an error on conditional requirement not satisfied with a negated expression', () => {
    const options = {
      required: {
        type: 'flag',
        names: ['-f'],
        requiredIf: req.not({
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
    expect(() => parser.parse([])).toThrow(/Option -f is required if no -s\./);
    expect(() => parser.parse(['-s', 'a'])).toThrow(/Option -f is required if -s != 'abc'\./);
    expect(() => parser.parse(['-s', 'abc'])).toThrow(/Option -f is required if no -n\./);
    expect(() => parser.parse(['-s', 'abc', '-n', '1'])).toThrow(
      /Option -f is required if -n != 123\./,
    );
    expect(() => parser.parse(['-n', '123'])).toThrow(/Option -f is required if no -s\./);
    expect(() => parser.parse(['-s', 'abc', '-n', '123'])).toThrow(
      /Option -f is required if no -ss\./,
    );
    expect(() => parser.parse(['-s', 'abc', '-n', '123', '-ss', 'a'])).toThrow(
      /Option -f is required if -ss != \['a', 'b'\]\./,
    );
    expect(() => parser.parse(['-s', 'abc', '-n', '123', '-ss', 'a', 'b'])).toThrow(
      /Option -f is required if no -ns\./,
    );
    expect(() => parser.parse(['-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1'])).toThrow(
      /Option -f is required if -ns != \[1, 2\]\./,
    );
    expect(() =>
      parser.parse(['-s', 'abc', '-n', '123', '-ss', 'a', 'b', '-ns', '1', '2']),
    ).not.toThrow();
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
    expect(() => parser.parse([])).toThrow(/Option -b is required if <fcn>\./);
    expect(() => parser.parse(['-f1'])).not.toThrow();
    expect(() => parser.parse(['-f2'])).not.toThrow();
    expect(() => parser.parse(['-f1', '-f2'])).toThrow(/Option -b is required if <fcn>\./);
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
    expect(() => parser.parse(['-f1'])).toThrow(/Option -b is required if not <fcn>\./);
    expect(() => parser.parse(['-f2'])).toThrow(/Option -b is required if not <fcn>\./);
    expect(() => parser.parse(['-f1', '-f2'])).not.toThrow();
  });
});
