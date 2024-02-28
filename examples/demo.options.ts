import { fg, style, req, tf, fg8, type Options } from 'tsargp';

/**
 * The option definitions
 */
export default {
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
  version: {
    type: 'version',
    names: ['-v', '--version'],
    desc: 'A version option. Prints the package version',
    resolve: import.meta.resolve,
  },
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
  boolean: {
    type: 'boolean',
    names: ['-b'],
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
  stringRegex: {
    type: 'string',
    names: ['-s', '--stringRegex'],
    desc: 'A string option',
    group: 'String',
    regex: /^\d+$/,
    default: '123456789',
    paramName: 'my string',
  },
  numberRange: {
    type: 'number',
    names: ['-n', '--numberRange'],
    desc: 'A number option',
    group: 'Number',
    range: [-Infinity, 0],
    default: -1.23,
    paramName: 'my number',
  },
  stringEnum: {
    type: 'string',
    names: ['-se', '--stringEnum'],
    desc: 'A string option',
    group: 'String',
    enums: ['one', 'two'],
    example: 'one',
  },
  numberEnum: {
    type: 'number',
    names: ['-ne', '--numberEnum'],
    desc: 'A number option',
    group: 'Number',
    enums: [1, 2],
    example: 1,
  },
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
  numbersRange: {
    type: 'numbers',
    names: ['-ns', '--numbers'],
    desc: 'A numbers option',
    group: 'Number',
    range: [0, Infinity],
    default: [1, 2],
    round: 'round',
  },
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
