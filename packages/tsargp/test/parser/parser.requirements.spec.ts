import { describe, describe as on, describe as when, expect, it as should, vi } from 'vitest';
import { type Options, req } from '../../lib/options';
import { ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    should('throw an error when a required option with no name is not specified', async () => {
      const options = {
        single: {
          type: 'single',
          required: true,
          positional: true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).rejects.toThrow(`Option is required.`);
    });

    should('accept a forward requirement with req.all with zero items', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: req.all(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f'])).resolves.toEqual({ requires: true });
    });

    should('accept a conditional requirement with req.one with zero items', async () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: req.one(),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse([])).resolves.toEqual({ requires: undefined });
    });

    should('evaluate the required value of an option that has a default value', async () => {
      const options = {
        flag1: {
          type: 'flag',
          names: ['-f1'],
          requires: { flag2: true },
        },
        flag2: {
          type: 'flag',
          names: ['-f2'],
          default: () => true,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f1'])).resolves.toEqual({ flag1: true, flag2: true });
    });

    should('evaluate the required value of an option that has a parse callback', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          requires: { single: '1' },
        },
        single: {
          type: 'single',
          names: ['-s'],
          parse: async (param) => param,
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f', '-s', '0'])).rejects.toThrow(
        `Option -f requires -s == '1'.`,
      );
      await expect(parser.parse(['-f', '-s', '1'])).resolves.toEqual({ flag: true, single: '1' });
    });

    when('an option is required to be present', () => {
      should('throw an error on option absent, using an option key', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requires: 'flag2',
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f1'])).rejects.toThrow(`Option -f1 requires -f2.`);
      });

      should('throw an error on option absent, using a required undefined value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requires: { flag2: undefined },
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f1'])).rejects.toThrow(`Option -f1 requires -f2.`);
      });

      should('throw an error on option absent, using a negated null value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requires: req.not({ flag2: null }),
          },
          flag2: {
            type: 'function',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f1'])).rejects.toThrow(`Option -f1 requires -f2.`);
      });
    });

    when('an option is required to be absent', () => {
      should('throw an error on option present, using a negated option key', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requires: req.not('flag2'),
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            break: true, // test early requirements checking
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -f1 requires no -f2.`);
        expect(options.flag2.parse).not.toHaveBeenCalled();
      });

      should('throw an error on option present, using a required null value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requires: { flag2: null },
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            break: true, // test early requirements checking
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -f1 requires no -f2.`);
        expect(options.flag2.parse).not.toHaveBeenCalled();
      });

      should('throw an error on option present, using a negated undefined value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requires: req.not({ flag2: undefined }),
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            break: true, // test early requirements checking
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(`Option -f1 requires no -f2.`);
        expect(options.flag2.parse).not.toHaveBeenCalled();
      });
    });

    when('a forward requirement is specified', () => {
      should('throw an error on req.one with zero items', async () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requires: req.one(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f'])).rejects.toThrow(`Option -f requires.`);
      });

      should('throw an error on requirement not satisfied with req.not', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            requires: req.not({ single: '1' }),
          },
          single: {
            type: 'single',
            positional: true,
            preferredName: 'preferred',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f', '0'])).resolves.toMatchObject({});
        await expect(parser.parse(['0', '-f'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f', '1'])).rejects.toThrow(
          `Option -f requires preferred != '1'.`,
        );
        await expect(parser.parse(['1', '-f'])).rejects.toThrow(
          `Option -f requires preferred != '1'.`,
        );
      });

      should('throw an error on requirement not satisfied with req.all', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
          single: {
            type: 'single',
            positional: true,
            preferredName: 'preferred',
            requires: req.all('flag1', 'flag2'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['1'])).rejects.toThrow(`Option preferred requires -f1.`);
        await expect(parser.parse(['-f1', '1'])).rejects.toThrow(`Option preferred requires -f2.`);
        await expect(parser.parse(['-f2', '1'])).rejects.toThrow(`Option preferred requires -f1.`);
        await expect(parser.parse(['-f1', '-f2', '1'])).resolves.toMatchObject({});
      });

      should('throw an error on requirement not satisfied with req.one', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
          single: {
            type: 'single',
            positional: true,
            preferredName: 'preferred',
            requires: req.one('flag1', 'flag2'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['1'])).rejects.toThrow(
          `Option preferred requires (-f1 or -f2).`,
        );
        await expect(parser.parse(['-f1', '1'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f2', '1'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f1', '-f2', '1'])).resolves.toMatchObject({});
      });

      should(
        'throw an error on requirement not satisfied with required arbitrary value',
        async () => {
          const options = {
            flag: {
              type: 'flag',
              names: ['-f'],
              requires: {
                single: { a: 1, b: [2] },
                array: ['a', 2, { b: 'c' }],
              },
            },
            single: {
              type: 'single',
              names: ['-s'],
              parse: (param) => JSON.parse(param),
            },
            array: {
              type: 'array',
              names: ['-a'],
              parse: (param) => JSON.parse(param),
            },
          } as const satisfies Options;
          const parser = new ArgumentParser(options);
          await expect(parser.parse(['-f'])).rejects.toThrow(`Option -f requires -s.`);
          await expect(parser.parse(['-f', '-s', '{"a": 1, "b": [1]}'])).rejects.toThrow(
            `Option -f requires -s == {a: 1, b: [2]}.`,
          );
          await expect(parser.parse(['-f', '-s', '{"a": 1, "b": [2]}'])).rejects.toThrow(
            `Option -f requires -a.`,
          );
          await expect(
            parser.parse(['-f', '-s', '{"a": 1, "b": [2]}', '-a', '"a"', '2', '{"b": "d"}']),
          ).rejects.toThrow(`Option -f requires -a == ['a', 2, {b: 'c'}].`);
          await expect(
            parser.parse(['-f', '-s', '{"a": 1, "b": [2]}', '-a', '"a"', '2', '{"b": "c"}']),
          ).resolves.toMatchObject({});
        },
      );

      should(
        'throw an error on requirement not satisfied with negated arbitrary value',
        async () => {
          const options = {
            flag: {
              type: 'flag',
              names: ['-f'],
              requires: req.not({
                single: { a: 1, b: [2] },
                array: ['a', 2, { b: 'c' }],
              }),
            },
            single: {
              type: 'single',
              names: ['-s'],
              parse: (param) => JSON.parse(param),
            },
            array: {
              type: 'array',
              names: ['-a'],
              parse: (param) => JSON.parse(param),
            },
          } as const satisfies Options;
          const parser = new ArgumentParser(options);
          await expect(parser.parse(['-f'])).resolves.toMatchObject({});
          await expect(parser.parse(['-f', '-s', '{"a": 1, "b": [1]}'])).resolves.toMatchObject({});
          await expect(parser.parse(['-f', '-s', '{"a": 1, "b": [2]}'])).resolves.toMatchObject({});
          await expect(
            parser.parse(['-f', '-s', '{"a": 1, "b": [2]}', '-a', '"a"', '2', '{"b": "d"}']),
          ).resolves.toMatchObject({});
          await expect(
            parser.parse(['-f', '-s', '{"a": 1, "b": [2]}', '-a', '"a"', '2', '{"b": "c"}']),
          ).rejects.toThrow(
            `Option -f requires (-s != {a: 1, b: [2]} or -a != ['a', 2, {b: 'c'}]).`,
          );
        },
      );

      should('throw an error on requirement not satisfied with a callback', async () => {
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
            type: 'single',
            positional: true,
            preferredName: 'preferred',
            requires(values) {
              return !!this.positional && values['flag1'] === values['flag2']; // test `this`
            },
          },
        } as const satisfies Options;
        options.boolean.requires.toString = () => 'fcn';
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['1'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f1', '1'])).rejects.toThrow(
          `Option preferred requires <fcn>.`,
        );
        await expect(parser.parse(['-f2', '1'])).rejects.toThrow(
          `Option preferred requires <fcn>.`,
        );
        await expect(parser.parse(['-f1', '-f2', '1'])).resolves.toMatchObject({});
      });

      should('throw an error on requirement not satisfied with a negated callback', async () => {
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
            type: 'single',
            positional: true,
            preferredName: 'preferred',
            requires: req.not((values) => values['flag1'] === values['flag2']),
          },
        } as const satisfies Options;
        options.boolean.requires.item.toString = () => 'fcn';
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['1'])).rejects.toThrow(`Option preferred requires not <fcn>.`);
        await expect(parser.parse(['-f1', '1'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f2', '1'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f1', '-f2', '1'])).rejects.toThrow(
          `Option preferred requires not <fcn>.`,
        );
      });
    });

    when('an option is required if another is present', () => {
      should('throw an error on option absent, using an option key', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requiredIf: 'flag2',
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            break: true, // test early requirements checking
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -f1 is required if -f2.`);
        expect(options.flag2.parse).not.toHaveBeenCalled();
      });

      should('throw an error on option absent, using a required undefined value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requiredIf: { flag2: undefined },
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
            break: true, // test early requirements checking
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -f1 is required if -f2.`);
        expect(options.flag2.parse).not.toHaveBeenCalled();
      });

      should('throw an error on option absent, using a negated null value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requiredIf: req.not({ flag2: null }),
          },
          flag2: {
            type: 'function',
            names: ['-f2'],
            break: true, // test early requirements checking
            parse: vi.fn(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse(['-f2'])).rejects.toThrow(`Option -f1 is required if -f2.`);
        expect(options.flag2.parse).not.toHaveBeenCalled();
      });
    });

    when('an option is required if another is absent', () => {
      should('throw an error on option present, using a negated option key', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requiredIf: req.not('flag2'),
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).rejects.toThrow(`Option -f1 is required if no -f2.`);
      });

      should('throw an error on option present, using a required null value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requiredIf: { flag2: null },
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).rejects.toThrow(`Option -f1 is required if no -f2.`);
      });

      should('throw an error on option present, using a negated undefined value', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
            requiredIf: req.not({ flag2: undefined }),
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).rejects.toThrow(`Option -f1 is required if no -f2.`);
      });
    });

    when('a conditional requirement is specified', () => {
      should('throw an error on req.all with zero items', async () => {
        const options = {
          requires: {
            type: 'flag',
            names: ['-f'],
            requiredIf: req.all(),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).rejects.toThrow(`Option -f is required if.`);
      });

      should('throw an error on requirement not satisfied with req.not', async () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f'],
            requiredIf: req.not({ single: '1' }),
          },
          single: {
            type: 'single',
            positional: true,
            preferredName: 'preferred',
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).rejects.toThrow(`Option -f is required if no preferred.`);
        await expect(parser.parse(['0'])).rejects.toThrow(
          `Option -f is required if preferred != '1'.`,
        );
        await expect(parser.parse(['1'])).resolves.toMatchObject({});
      });

      should('throw an error on requirement not satisfied with req.all', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
          single: {
            type: 'single',
            positional: true,
            preferredName: 'preferred',
            requiredIf: req.all('flag1', 'flag2'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toMatchObject({});
        await expect(parser.parse(['-f1'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f2'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(
          `Option preferred is required if (-f1 and -f2).`,
        );
      });

      should('throw an error on requirement not satisfied with req.one', async () => {
        const options = {
          flag1: {
            type: 'flag',
            names: ['-f1'],
          },
          flag2: {
            type: 'flag',
            names: ['-f2'],
          },
          single: {
            type: 'single',
            positional: true,
            preferredName: 'preferred',
            requiredIf: req.one('flag1', 'flag2'),
          },
        } as const satisfies Options;
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toMatchObject({});
        await expect(parser.parse(['-f1'])).rejects.toThrow(`Option preferred is required if -f1.`);
        await expect(parser.parse(['-f2'])).rejects.toThrow(`Option preferred is required if -f2.`);
        await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(
          `Option preferred is required if -f1.`,
        );
      });

      should(
        'throw an error on requirement not satisfied with required arbitrary value',
        async () => {
          const options = {
            flag: {
              type: 'flag',
              names: ['-f'],
              requiredIf: {
                single: { a: 1, b: [2] },
                array: ['a', 2, { b: 'c' }],
              },
            },
            single: {
              type: 'single',
              names: ['-s'],
              parse: (param) => JSON.parse(param),
            },
            array: {
              type: 'array',
              names: ['-a'],
              parse: (param) => JSON.parse(param),
            },
          } as const satisfies Options;
          const parser = new ArgumentParser(options);
          await expect(parser.parse([])).resolves.toMatchObject({});
          await expect(parser.parse(['-s', '{"a": 1, "b": [1]}'])).resolves.toMatchObject({});
          await expect(parser.parse(['-s', '{"a": 1, "b": [2]}'])).resolves.toMatchObject({});
          await expect(
            parser.parse(['-s', '{"a": 1, "b": [2]}', '-a', '"a"', '2', '{"b": "d"}']),
          ).resolves.toMatchObject({});
          await expect(
            parser.parse(['-s', '{"a": 1, "b": [2]}', '-a', '"a"', '2', '{"b": "c"}']),
          ).rejects.toThrow(
            `Option -f is required if (-s == {a: 1, b: [2]} and -a == ['a', 2, {b: 'c'}]).`,
          );
        },
      );

      should(
        'throw an error on requirement not satisfied with negated arbitrary value',
        async () => {
          const options = {
            flag: {
              type: 'flag',
              names: ['-f'],
              requiredIf: req.not({
                single: { a: 1, b: [2] },
                array: ['a', 2, { b: 'c' }],
              }),
            },
            single: {
              type: 'single',
              names: ['-s'],
              parse: (param) => JSON.parse(param),
            },
            array: {
              type: 'array',
              names: ['-a'],
              parse: (param) => JSON.parse(param),
            },
          } as const satisfies Options;
          const parser = new ArgumentParser(options);
          await expect(parser.parse([])).rejects.toThrow(`Option -f is required if no -s.`);
          await expect(parser.parse(['-s', '{"a": 1, "b": [1]}'])).rejects.toThrow(
            `Option -f is required if -s != {a: 1, b: [2]}.`,
          );
          await expect(parser.parse(['-s', '{"a": 1, "b": [2]}'])).rejects.toThrow(
            `Option -f is required if no -a.`,
          );
          await expect(
            parser.parse(['-s', '{"a": 1, "b": [2]}', '-a', '"a"', '2', '{"b": "d"}']),
          ).rejects.toThrow(`Option -f is required if -a != ['a', 2, {b: 'c'}].`);
          await expect(
            parser.parse(['-s', '{"a": 1, "b": [2]}', '-a', '"a"', '2', '{"b": "c"}']),
          ).resolves.toMatchObject({});
        },
      );

      should('throw an error on requirement not satisfied with a callback', async () => {
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
            type: 'single',
            positional: true,
            preferredName: 'preferred',
            requiredIf(values) {
              return !!this.positional && values['flag1'] === values['flag2']; // test `this`
            },
          },
        } as const satisfies Options;
        options.boolean.requiredIf.toString = () => 'fcn';
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).rejects.toThrow(`Option preferred is required if <fcn>.`);
        await expect(parser.parse(['-f1'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f2'])).resolves.toMatchObject({});
        await expect(parser.parse(['-f1', '-f2'])).rejects.toThrow(
          `Option preferred is required if <fcn>.`,
        );
      });

      should('throw an error on requirement not satisfied with a negated callback', async () => {
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
            type: 'single',
            positional: true,
            preferredName: 'preferred',
            requiredIf: req.not((values) => values['flag1'] === values['flag2']),
          },
        } as const satisfies Options;
        options.boolean.requiredIf.item.toString = () => 'fcn';
        const parser = new ArgumentParser(options);
        await expect(parser.parse([])).resolves.toMatchObject({});
        await expect(parser.parse(['-f1'])).rejects.toThrow(
          `Option preferred is required if not <fcn>.`,
        );
        await expect(parser.parse(['-f2'])).rejects.toThrow(
          `Option preferred is required if not <fcn>.`,
        );
        await expect(parser.parse(['-f1', '-f2'])).resolves.toMatchObject({});
      });
    });
  });
});
