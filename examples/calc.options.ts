import type { Options, OptionValues } from 'tsargp';

/**
 * The option definitions for a multi-argument operation.
 */
const multiOpts = {
  /**
   * A numbers option that receives unlimited positional arguments.
   */
  numbers: {
    type: 'numbers',
    preferredName: 'numbers',
    desc: 'The numbers to operate on.',
    default: [],
    positional: true,
    group: 'Arguments',
  },
} as const satisfies Options;

/**
 * The option definitions for a dual-argument operation.
 */
const binaryOpts = {
  /**
   * A numbers option that receives at most two positional arguments.
   */
  numbers: { ...multiOpts.numbers, limit: 2 },
} as const satisfies Options;

/**
 * The main option definitions
 */
const options = {
  /**
   * A help option that throws the help message.
   */
  help: {
    type: 'help',
    names: ['help'],
    desc: 'Prints this help message.',
  },
  /**
   * A command that sums multiple numbers.
   */
  add: {
    type: 'command',
    names: ['add'],
    desc: 'A command that sums multiple numbers.',
    options: (): Options => ({ ...multiOpts, ...options }),
    cmd(_, cmdValues): number {
      const vals = cmdValues as OptionValues<typeof options & typeof multiOpts>;
      const other = vals.add ?? vals.sub ?? vals.mult ?? vals.div ?? 0;
      return vals.numbers.reduce((acc, val) => acc + val, other);
    },
  },
  /**
   * A command that subtracts two numbers.
   */
  sub: {
    type: 'command',
    names: ['sub'],
    desc: 'A command that subtracts two numbers.',
    options: (): Options => ({ ...binaryOpts, ...options }),
    cmd(_, cmdValues): number {
      const vals = cmdValues as OptionValues<typeof options & typeof binaryOpts>;
      const other = vals.add ?? vals.sub ?? vals.mult ?? vals.div ?? NaN;
      const [a, b] = vals.numbers;
      return a === undefined ? NaN : b === undefined ? a - other : a - b;
    },
  },
  /**
   * A command that multiplies multiple numbers.
   */
  mult: {
    type: 'command',
    names: ['mult'],
    desc: 'A command that multiplies multiple numbers.',
    options: (): Options => ({ ...multiOpts, ...options }),
    cmd(_, cmdValues): number {
      const vals = cmdValues as OptionValues<typeof options & typeof multiOpts>;
      const other = vals.add ?? vals.sub ?? vals.mult ?? vals.div ?? 1;
      return vals.numbers.reduce((acc, val) => acc * val, other);
    },
  },
  /**
   * A command that divides two numbers.
   */
  div: {
    type: 'command',
    names: ['div'],
    desc: 'A command that divides two numbers.',
    options: (): Options => ({ ...binaryOpts, ...options }),
    cmd(_, cmdValues): number {
      const vals = cmdValues as OptionValues<typeof options & typeof binaryOpts>;
      const other = vals.add ?? vals.sub ?? vals.mult ?? vals.div ?? NaN;
      const [a, b] = vals.numbers;
      return a === undefined ? NaN : b === undefined ? a / other : a / b;
    },
  },
} as const satisfies Options;

export default options;
