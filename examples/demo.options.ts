import { fg, sgr, singleBreak, doubleBreak, req, type Options } from 'tsargp';

/**
 * The option definitions
 */
export default {
  help: {
    type: 'help',
    names: ['-h', '--help'],
    desc: 'A help option. Prints this help message',
    usage:
      `${sgr('0', '1')}Argument parser for TypeScript.${doubleBreak}` +
      `  ${sgr('0', '33')}tsargp ${sgr('39')}--help ${sgr('32')}# print help${sgr('39')}`,
    footer:
      `MIT License${singleBreak}` +
      `Copyright (c) 2024 \x1b[3;1;36m TrulySimple${sgr('0')}${doubleBreak}` +
      `Report a bug: ${sgr('2')}https://github.com/trulysimple/tsargp/issues${sgr('0')}${singleBreak}`,
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
      names: sgr('0', '7', fg('138')),
      desc: sgr('0', '3', '9'),
    },
  },
  boolean: {
    type: 'boolean',
    names: ['-b'],
    desc: `A boolean option
    with:
    * a paragraph
    - ${sgr('4', fg('223'))}inline styles${sgr('39', '24')}
    1. and a list
    
    `,
    default: false,
    requires: req.and(
      'stringEnum',
      { numberEnum: 2 },
      req.or({ stringsRegex: ['a', 'b'] }, req.not({ numbersRange: [3, 4] })),
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
    round: 'nearest',
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
