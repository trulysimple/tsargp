import { describe, expect, it, vi } from 'vitest';
import { type Options, ArgumentParser, req } from '../../lib';
import '../utils.spec'; // initialize globals

describe('ArgumentParser', () => {
  describe('parse', () => {
    it('should evaluate required value on flag option when using a default value', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: true },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
          default: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f1'])).resolves.toEqual({
        requires: true,
        required: true,
      });
    });

    it('should evaluate required value on flag option when using an async default value', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: true },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
          default: async () => true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f1'])).resolves.toEqual({
        requires: true,
        required: true,
      });
    });

    it('should evaluate required value on boolean option when using an async custom parse', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: true },
        },
        required: {
          type: 'boolean',
          names: ['-b'],
          parse: async () => true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f', '-b', ''])).resolves.toEqual({
        requires: true,
        required: true,
      });
    });

    it('should evaluate required value on string option when using an async custom parse', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: '1' },
        },
        required: {
          type: 'string',
          names: ['-s'],
          parse: async () => '1',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f', '-s', ''])).resolves.toEqual({
        requires: true,
        required: '1',
      });
    });

    it('should evaluate required value on number option when using an async custom parse', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: 1 },
        },
        required: {
          type: 'number',
          names: ['-n'],
          parse: async () => 1,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f', '-n', ''])).resolves.toEqual({
        requires: true,
        required: 1,
      });
    });

    it('should evaluate required value on strings option when using an async custom parse', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: ['1'] },
        },
        required: {
          type: 'strings',
          names: ['-ss'],
          parse: async () => '1',
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f', '-ss', ''])).resolves.toEqual({
        requires: true,
        required: ['1'],
      });
    });

    it('should evaluate required value on numbers option when using an async custom parse', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: [1] },
        },
        required: {
          type: 'numbers',
          names: ['-ns'],
          parse: async () => 1,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f', '-ns', ''])).resolves.toEqual({
        requires: true,
        required: [1],
      });
    });

    it('should throw an error on option absent despite being required to be present (1)', async () => {
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
      await expect(parser.parse(['-f1'])).rejects.toThrow(`Option -f1 requires -f2.`);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option absent despite being required to be present (2)', async () => {
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
      await expect(parser.parse(['-f1'])).rejects.toThrow(`Option -f1 requires -f2.`);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option absent despite being required to be present (3)', async () => {
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
      await expect(parser.parse(['-f1'])).rejects.toThrow(`Option -f1 requires -f2.`);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option present despite being required to be absent (1)', async () => {
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
      await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -f1 requires no -f2.`);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option present despite being required to be absent (2)', async () => {
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
      await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -f1 requires no -f2.`);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on option present despite being required to be absent (3)', async () => {
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
      await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -f1 requires no -f2.`);
      expect(options.required.exec).not.toHaveBeenCalled();
    });

    it('should throw an error on forward requirement not satisfied with req.not', async () => {
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
      await expect(parser.parse([])).resolves.toMatchObject({});
      await expect(parser.parse(['1'])).resolves.toMatchObject({});
      await expect(parser.parse(['-s', 'b', '1'])).resolves.toMatchObject({});
      await expect(parser.parse(['-s', 'a', '1'])).rejects.toThrow(`Option -b requires -s != 'a'.`);
    });

    it('should throw an error on forward requirement not satisfied with req.all', async () => {
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
      await expect(parser.parse([])).resolves.toMatchObject({});
      await expect(parser.parse(['1'])).rejects.toThrow(`Option -b requires -f1.`);
      await expect(parser.parse(['-f1', '1'])).rejects.toThrow(`Option -b requires -f2.`);
      await expect(parser.parse(['-f2', '1'])).rejects.toThrow(`Option -b requires -f1.`);
      await expect(parser.parse(['-f1', '-f2', '1'])).resolves.toMatchObject({});
    });

    it('should throw an error on forward requirement not satisfied with req.one', async () => {
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
      await expect(parser.parse([])).resolves.toMatchObject({});
      await expect(parser.parse(['1'])).rejects.toThrow(`Option -b requires (-f1 or -f2).`);
      await expect(parser.parse(['-f1', '1'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f2', '1'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f1', '-f2', '1'])).resolves.toMatchObject({});
    });

    it('should throw an error on forward requirement not satisfied with required boolean values', async () => {
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
      await expect(parser.parse([])).resolves.toMatchObject({});
      await expect(parser.parse(['-f'])).rejects.toThrow(`Option -f requires -f2.`);
      await expect(parser.parse(['-f', '-f2'])).rejects.toThrow(`Option -f requires -f2 = false.`);
      await expect(parser.parse(['-f', '--no-f2'])).rejects.toThrow(`Option -f requires -b.`);
      await expect(parser.parse(['-f', '--no-f2', '-b', '0'])).rejects.toThrow(
        `Option -f requires -b = true.`,
      );
      await expect(parser.parse(['-f', '--no-f2', '-b', '1'])).resolves.toMatchObject({});
    });

    it('should throw an error on forward requirement not satisfied with required string values', async () => {
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
      await expect(parser.parse([])).resolves.toMatchObject({});
      await expect(parser.parse(['-f'])).rejects.toThrow(`Option -f requires -s.`);
      await expect(parser.parse(['-f', '-s', 'x'])).rejects.toThrow(
        `Option -f requires -s = 'abc'.`,
      );
      await expect(parser.parse(['-f', '-s', 'abc'])).rejects.toThrow(`Option -f requires -ss.`);
      await expect(parser.parse(['-f', '-s', 'abc', '-ss'])).rejects.toThrow(
        `Option -f requires -ss = ['a'].`,
      );
      await expect(parser.parse(['-f', '-s', 'abc', '-ss', 'a'])).resolves.toMatchObject({});
    });

    it('should throw an error on forward requirement not satisfied with required number values', async () => {
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
      await expect(parser.parse([])).resolves.toMatchObject({});
      await expect(parser.parse(['-f'])).rejects.toThrow(`Option -f requires -n.`);
      await expect(parser.parse(['-f', '-n', '1'])).rejects.toThrow(`Option -f requires -n = 123.`);
      await expect(parser.parse(['-f', '-n', '123'])).rejects.toThrow(`Option -f requires -ns.`);
      await expect(parser.parse(['-f', '-n', '123', '-ns'])).rejects.toThrow(
        `Option -f requires -ns = [1].`,
      );
      await expect(parser.parse(['-f', '-n', '123', '-ns', '1'])).resolves.toMatchObject({});
    });

    it('should throw an error on forward requirement not satisfied with negated required boolean values', async () => {
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
      await expect(parser.parse(['-f'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-f2'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '--no-f2'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '--no-f2', '-b', '0'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '--no-f2', '-b', '1'])).rejects.toThrow(
        `Option -f requires (-f2 != false or -b != true).`,
      );
    });

    it('should throw an error on forward requirement not satisfied with negated required string values', async () => {
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
      await expect(parser.parse(['-f'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-s', 'x'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-s', 'abc'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-s', 'abc', '-ss'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-s', 'abc', '-ss', 'a'])).rejects.toThrow(
        `Option -f requires (-s != 'abc' or -ss != ['a']).`,
      );
    });

    it('should throw an error on forward requirement not satisfied with negated required number values', async () => {
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
      await expect(parser.parse(['-f'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-n', '1'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-n', '123'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-n', '123', '-ns'])).resolves.toMatchObject({});
      await expect(parser.parse(['-f', '-n', '123', '-ns', '1'])).rejects.toThrow(
        `Option -f requires (-n != 123 or -ns != [1]).`,
      );
    });
  });

  it('should throw an error on forward requirement not satisfied with an async callback', async () => {
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
        requires: async (values) => values['flag1'] === values['flag2'],
      },
    } as const satisfies Options;
    options.boolean.requires.toString = () => 'fcn';
    const parser = new ArgumentParser(options);
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['1'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1', '1'])).rejects.toThrow(`Option -b requires <fcn>.`);
    await expect(parser.parse(['-f2', '1'])).rejects.toThrow(`Option -b requires <fcn>.`);
    await expect(parser.parse(['-f1', '-f2', '1'])).resolves.toMatchObject({});
  });

  it('should throw an error on forward requirement not satisfied with a callback', async () => {
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
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['1'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1', '1'])).rejects.toThrow(`Option -b requires <fcn>.`);
    await expect(parser.parse(['-f2', '1'])).rejects.toThrow(`Option -b requires <fcn>.`);
    await expect(parser.parse(['-f1', '-f2', '1'])).resolves.toMatchObject({});
  });

  it('should throw an error on forward requirement not satisfied with a negated callback', async () => {
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
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['1'])).rejects.toThrow(`Option -b requires not <fcn>.`);
    await expect(parser.parse(['-f1', '1'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f2', '1'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1', '-f2', '1'])).rejects.toThrow(
      `Option -b requires not <fcn>.`,
    );
  });

  it('should throw an error on option absent despite being required if another is present (1)', async () => {
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
    await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -f1 is required if -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option absent despite being required if another is present (2)', async () => {
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
    await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -f1 is required if -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option absent despite being required if another is present (3)', async () => {
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
    await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -f1 is required if -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option present despite being required if another is absent (1)', async () => {
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
    await expect(parser.parse([])).rejects.toThrow(`Option -f1 is required if no -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option present despite being required if another is absent (2)', async () => {
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
    await expect(parser.parse([])).rejects.toThrow(`Option -f1 is required if no -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on option present despite being required if another is absent (3)', async () => {
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
    await expect(parser.parse([])).rejects.toThrow(`Option -f1 is required if no -f2.`);
    expect(options.other.exec).not.toHaveBeenCalled();
  });

  it('should throw an error on conditional requirement not satisfied with req.not', async () => {
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
    await expect(parser.parse([])).rejects.toThrow(`Option -b is required if no -s.`);
    await expect(parser.parse(['-s', 'b'])).rejects.toThrow(`Option -b is required if -s != 'a'.`);
    await expect(parser.parse(['-s', 'a', '1'])).resolves.toMatchObject({});
  });

  it('should throw an error on conditional requirement not satisfied with req.all', async () => {
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
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f2'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(
      `Option -b is required if (-f1 and -f2).`,
    );
  });

  it('should throw an error on conditional requirement not satisfied with req.one', async () => {
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
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1'])).rejects.toThrow(`Option -b is required if -f1.`);
    await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -b is required if -f2.`);
    await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -b is required if -f1.`);
  });

  it('should throw an error on conditional requirement not satisfied with required boolean values', async () => {
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
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['-f2'])).resolves.toMatchObject({});
    await expect(parser.parse(['--no-f2'])).resolves.toMatchObject({});
    await expect(parser.parse(['--no-f2', '-b', '0'])).resolves.toMatchObject({});
    await expect(parser.parse(['--no-f2', '-b', '1'])).rejects.toThrow(
      `Option -f is required if (-f2 = false and -b = true).`,
    );
  });

  it('should throw an error on conditional requirement not satisfied with required string values', async () => {
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
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['-s', 'x'])).resolves.toMatchObject({});
    await expect(parser.parse(['-s', 'abc'])).resolves.toMatchObject({});
    await expect(parser.parse(['-s', 'abc', '-ss'])).resolves.toMatchObject({});
    await expect(parser.parse(['-s', 'abc', '-ss', 'a'])).rejects.toThrow(
      `Option -f is required if (-s = 'abc' and -ss = ['a']).`,
    );
  });

  it('should throw an error on conditional requirement not satisfied with required number values', async () => {
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
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['-n', '1'])).resolves.toMatchObject({});
    await expect(parser.parse(['-n', '123'])).resolves.toMatchObject({});
    await expect(parser.parse(['-n', '123', '-ns'])).resolves.toMatchObject({});
    await expect(parser.parse(['-n', '123', '-ns', '1'])).rejects.toThrow(
      `Option -f is required if (-n = 123 and -ns = [1]).`,
    );
  });

  it('should throw an error on conditional requirement not satisfied with negated required boolean values', async () => {
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
    await expect(parser.parse([])).rejects.toThrow(`Option -f is required if no -f2.`);
    await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -f is required if -f2 != false.`);
    await expect(parser.parse(['--no-f2'])).rejects.toThrow(`Option -f is required if no -b.`);
    await expect(parser.parse(['--no-f2', '-b', '0'])).rejects.toThrow(
      `Option -f is required if -b != true.`,
    );
    await expect(parser.parse(['--no-f2', '-b', '1'])).resolves.toMatchObject({});
  });

  it('should throw an error on conditional requirement not satisfied with negated required string values', async () => {
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
    await expect(parser.parse([])).rejects.toThrow(`Option -f is required if no -s.`);
    await expect(parser.parse(['-s', 'x'])).rejects.toThrow(
      `Option -f is required if -s != 'abc'.`,
    );
    await expect(parser.parse(['-s', 'abc'])).rejects.toThrow(`Option -f is required if no -ss.`);
    await expect(parser.parse(['-s', 'abc', '-ss'])).rejects.toThrow(
      `Option -f is required if -ss != ['a'].`,
    );
    await expect(parser.parse(['-s', 'abc', '-ss', 'a'])).resolves.toMatchObject({});
  });

  it('should throw an error on conditional requirement not satisfied with negated required number values', async () => {
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
    await expect(parser.parse([])).rejects.toThrow(`Option -f is required if no -n.`);
    await expect(parser.parse(['-n', '1'])).rejects.toThrow(`Option -f is required if -n != 123.`);
    await expect(parser.parse(['-n', '123'])).rejects.toThrow(`Option -f is required if no -ns.`);
    await expect(parser.parse(['-n', '123', '-ns'])).rejects.toThrow(
      `Option -f is required if -ns != [1].`,
    );
    await expect(parser.parse(['-n', '123', '-ns', '1'])).resolves.toMatchObject({});
  });

  it('should throw an error on conditional requirement not satisfied with an async callback', async () => {
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
        requiredIf: async (values) => values['flag1'] === values['flag2'],
      },
    } as const satisfies Options;
    options.boolean.requiredIf.toString = () => 'fcn';
    const parser = new ArgumentParser(options);
    await expect(parser.parse([])).rejects.toThrow(`Option -b is required if <fcn>.`);
    await expect(parser.parse(['-f1'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f2'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -b is required if <fcn>.`);
  });

  it('should throw an error on conditional requirement not satisfied with a callback', async () => {
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
    await expect(parser.parse([])).rejects.toThrow(`Option -b is required if <fcn>.`);
    await expect(parser.parse(['-f1'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f2'])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -b is required if <fcn>.`);
  });

  it('should throw an error on conditional requirement not satisfied with a negated callback', async () => {
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
    await expect(parser.parse([])).resolves.toMatchObject({});
    await expect(parser.parse(['-f1'])).rejects.toThrow(`Option -b is required if not <fcn>.`);
    await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -b is required if not <fcn>.`);
    await expect(parser.parse(['-f1', '-f2'])).resolves.toMatchObject({});
  });
});
