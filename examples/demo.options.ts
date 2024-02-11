import { fg, tf, clearStyle, req, type Options, fgColor } from 'tsargp';

/**
 * The option definitions
 */
export default {
  help: {
    type: 'help',
    names: ['-h', '--help'],
    desc: 'A help option. Prints this help message',
    usage: `${clearStyle}${tf.bold}Argument parser for TypeScript.${clearStyle}

    ${fg.yellow}tsargp ${fg.default}--help ${fg.green}# print help${fg.default}`,
    footer: `MIT License
Copyright (c) 2024 ${tf.italic}${tf.bold}${fg.cyan}TrulySimple${clearStyle}

Report a bug: ${tf.faint}https://github.com/trulysimple/tsargp/issues${clearStyle}
`,
  },
  version: {
    type: 'version',
    names: ['-v', '--version'],
    desc: 'A version option. Prints the package version',
  },
  flag: {
    type: 'flag',
    names: ['-f', '--flag'],
    negationNames: ['--no-flag'],
    desc: 'A flag option',
    deprecated: 'some reason',
    styles: {
      names: { clear: true, fg: fgColor('208'), tf: [tf.invert] },
      desc: { clear: true, tf: [tf.strike, tf.italic] },
    },
  },
  boolean: {
    type: 'boolean',
    names: ['-b'],
    desc: 'A boolean option',
    default: false,
    requires: req.and('stringEnum', 'numberEnum=2', req.or('stringsRegex=a,b', 'numbersRange=3,4')),
  },
  stringRegex: {
    type: 'string',
    names: ['-s', '--stringRegex'],
    desc: 'A string option',
    group: 'String',
    regex: /\d+/s,
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
    regex: /\w+/s,
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
    round: 'nearest',
  },
  stringsEnum: {
    type: 'strings',
    names: ['', '--stringsEnum'],
    desc: 'A strings option',
    group: 'String',
    enums: ['one', 'two'],
    example: ['one', 'two'],
    positional: true,
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
