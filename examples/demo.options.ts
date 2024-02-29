import type { Options, OptionValues } from 'tsargp';
import { fg, style, req, tf, fg8 } from 'tsargp';

/**
 * The hello option definitions
 */
const helloOpts = {
  /**
   * A help option that throws the help message of the hello command.
   */
  help: {
    type: 'help',
    names: ['-h', '--help'],
    desc: 'The help option for the hello command. Prints this help message',
  },
  /**
   * A strings option that receives positional arguments for the hello command.
   */
  strings: {
    type: 'strings',
    default: ['world'],
    positional: true,
  },
  // command: {
  //   type: 'command',
  //   names: ['hello'],
  //   desc: 'A command option. Logs the arguments passed after it',
  //   options: helloOpts,
  //   cmd(){}
  // },
} as const satisfies Options;

/**
 * The main option definitions
 */
export default {
  /**
   * A help option that throws the help message of the main command.
   */
  help: {
    type: 'help',
    names: ['-h', '--help'],
    desc: 'A help option. Prints this help message',
    usage: `${style(tf.clear, tf.bold)}Argument parser for TypeScript.

  ${style(tf.clear, fg.yellow)}tsargp ${style(fg.default)}--help ${style(fg.green)}# print help${style(fg.default)}`,
    footer: `MIT License
Copyright (c) 2024 ${style(tf.bold, tf.italic, fg.cyan)}TrulySimple${style(tf.clear)}

Report a bug: ${style(tf.faint)}https://github.com/trulysimple/tsargp/issues${style(tf.clear)}
`,
  },
  /**
   * A version option that throws the package version.
   */
  version: {
    type: 'version',
    names: ['-v', '--version'],
    desc: 'A version option. Prints the package version',
    resolve: import.meta.resolve,
  },
  /**
   * A flag option that is deprecated for some reason.
   */
  flag: {
    type: 'flag',
    names: ['-f', '--flag'],
    negationNames: ['--no-flag'],
    desc: 'A flag option',
    deprecated: 'some reason',
    styles: {
      names: style(tf.clear, tf.inverse, fg8(138)),
      descr: style(tf.clear, tf.italic, tf.crossedOut),
    },
  },
  /**
   * A command option that logs the arguments passed after it.
   */
  command: {
    type: 'command',
    names: ['hello'],
    desc: 'A command option. Logs the arguments passed after it',
    options: helloOpts,
    cmd(_, cmdValues) {
      const values = cmdValues as OptionValues<typeof helloOpts>;
      console.log(...values.strings);
    },
  },
  /**
   * A boolean option that has inline styles and requirements.
   */
  boolean: {
    type: 'boolean',
    names: ['-b', '--boolean'],
    desc: `A boolean option
    with:
    * a paragraph
    - ${style(tf.underlined, fg8(223))}inline styles${style(fg.default, tf.notUnderlined)}
    1. and a list
    
    `,
    default: false,
    requires: req.all(
      'stringEnum',
      { numberEnum: 2 },
      req.one({ stringsRegex: ['a', 'b'] }, req.not({ numbersRange: [3, 4] })),
    ),
  },
  /**
   * A string option that has a regex constraint.
   */
  stringRegex: {
    type: 'string',
    names: ['-s', '--stringRegex'],
    desc: 'A string option',
    group: 'String',
    regex: /^\d+$/,
    default: '123456789',
    paramName: 'my string',
  },
  /**
   * A number option that has a range constraint.
   */
  numberRange: {
    type: 'number',
    names: ['-n', '--numberRange'],
    desc: 'A number option',
    group: 'Number',
    range: [-Infinity, 0],
    default: -1.23,
    paramName: 'my number',
  },
  /**
   * A string option that has an enumeration constraint.
   */
  stringEnum: {
    type: 'string',
    names: ['-se', '--stringEnum'],
    desc: 'A string option',
    group: 'String',
    enums: ['one', 'two'],
    example: 'one',
  },
  /**
   * A number option that has an enumeration constraint.
   */
  numberEnum: {
    type: 'number',
    names: ['-ne', '--numberEnum'],
    desc: 'A number option',
    group: 'Number',
    enums: [1, 2],
    example: 1,
  },
  /**
   * A strings option that has a regex constraint.
   */
  stringsRegex: {
    type: 'strings',
    names: ['-ss', '--strings'],
    desc: 'A strings option',
    group: 'String',
    regex: /^[\w-]+$/,
    default: ['one', 'two'],
    separator: ',',
    trim: true,
    case: 'upper',
  },
  /**
   * A numbers option that has a range constraint.
   */
  numbersRange: {
    type: 'numbers',
    names: ['-ns', '--numbers'],
    desc: 'A numbers option',
    group: 'Number',
    range: [0, Infinity],
    default: [1, 2],
    round: 'round',
  },
  /**
   * A strings option that has an enumeration constraint.
   */
  stringsEnum: {
    type: 'strings',
    names: ['', '--stringsEnum'],
    desc: 'A strings option',
    group: 'String',
    enums: ['one', 'two'],
    example: ['one', 'two'],
    positional: '--',
    limit: 3,
  },
  /**
   * A numbers option that has an enumeration constraint.
   */
  numbersEnum: {
    type: 'numbers',
    names: ['', '--numbersEnum'],
    desc: 'A numbers option',
    group: 'Number',
    enums: [1, 2],
    example: [1, 2],
    separator: ',',
    append: true,
    unique: true,
  },
} as const satisfies Options;
