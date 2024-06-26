import type { Options, OptionValues } from 'tsargp';
import { fg, style, req, tf, fg8 } from 'tsargp';

/**
 * The hello option definitions.
 */
const helloOpts = {
  /**
   * A strings option that receives positional arguments for the hello command.
   */
  strings: {
    type: 'strings',
    default: ['world'],
    positional: true,
    group: 'Arguments:',
  },
  /**
   * A help option that throws the help message of the hello command.
   */
  help: {
    type: 'help',
    names: ['-h', '--help'],
    desc: 'The help option for the hello command. Prints this help message.',
    config: {
      param: { align: 'merge' },
      descr: { indent: -10 },
    },
    useFormat: true,
    useFilter: true,
  },
  /**
   * A recursive command option that logs the arguments passed after it.
   */
  hello: {
    type: 'command',
    names: ['hello'],
    desc: 'A recursive command option. Logs the arguments passed after it.',
    options: (): Options => helloOpts,
    exec({ param }): number {
      const vals = param as OptionValues<typeof helloOpts>;
      const calls = vals.hello ?? 0;
      console.log(`[tail call #${calls}]`, ...vals.strings);
      return calls + 1;
    },
  },
} as const satisfies Options;

/**
 * The main option definitions.
 */
export default {
  /**
   * A help option that throws the help message of the main command.
   */
  help: {
    type: 'help',
    names: ['-h', '--help'],
    desc: 'A help option. Prints this help message.',
    sections: [
      {
        type: 'text',
        text: `${style(tf.bold)}Argument parser for TypeScript.`,
      },
      {
        type: 'groups',
      },
      {
        type: 'usage',
        title: 'Usage:',
        indent: 2,
        filter: ['help', 'version', 'helpCmd'],
        comment: `${style(fg.green)}# get help`,
      },
      {
        type: 'usage',
        indent: 2,
        breaks: 1,
        filter: ['hello'],
        comment: `${style(fg.green)}# execute the hello command`,
        required: ['hello'],
      },
      {
        type: 'usage',
        indent: 2,
        breaks: 1,
        filter: ['help', 'version', 'helpCmd', 'hello'],
        exclude: true,
        requires: { boolean: 'stringEnum' },
      },
      {
        type: 'text',
        text: `MIT License.
Copyright (c) 2024 ${style(tf.bold, tf.italic)}TrulySimple${style(tf.clear)}

Report a bug: ${style(fg.brightBlack)}https://github.com/trulysimple/tsargp/issues`,
        noWrap: true,
      },
    ],
    useNested: true,
    useFormat: true,
    useFilter: true,
  },
  /**
   * A version option that throws the package version.
   */
  version: {
    type: 'version',
    names: ['-v', '--version'],
    desc: 'A version option. Prints the package version.',
    resolve: import.meta.resolve,
  },
  /**
   * A flag option that is deprecated for some reason.
   */
  flag: {
    type: 'flag',
    names: ['-f', '--flag'],
    negationNames: ['--no-flag'],
    desc: 'A flag option.',
    deprecated: 'some reason',
    styles: {
      names: style(tf.clear, tf.inverse, fg8(138)),
      descr: style(tf.clear, tf.italic, tf.crossedOut),
    },
  },
  /**
   * A command option that logs the arguments passed after it.
   */
  hello: helloOpts.hello,
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
    truthNames: ['yes'],
    falsityNames: ['no'],
    requires: req.all('stringEnum', req.one({ strings: ['a', 'b'] }, req.not({ numbers: [3, 4] }))),
  },
  /**
   * A string option that has a regex constraint.
   */
  stringRegex: {
    type: 'string',
    names: ['-s', '--stringRegex'],
    desc: 'A string option.',
    group: 'String options:',
    regex: /^\d+$/,
    default: '123456789',
    paramName: 'my str',
    clusterLetters: 's',
  },
  /**
   * A number option that has a range constraint.
   */
  numberRange: {
    type: 'number',
    names: ['-n', '--numberRange'],
    desc: 'A number option.',
    group: 'Number options:',
    range: [-Infinity, 0],
    default: -1.23,
    paramName: 'my num',
    clusterLetters: 'n',
  },
  /**
   * A string option that has an enumeration constraint.
   */
  stringEnum: {
    type: 'string',
    names: ['-se', '--stringEnum'],
    desc: 'A string option.',
    group: 'String options:',
    enums: ['one', 'two'],
    example: 'one',
    inline: false,
  },
  /**
   * A number option that has an enumeration constraint.
   */
  numberEnum: {
    type: 'number',
    names: ['-ne', '--numberEnum'],
    desc: 'A number option.',
    group: 'Number options:',
    enums: [1, 2],
    example: 1,
    inline: 'always',
  },
  /**
   * A delimited strings option whose values are trimmed and converted to uppercase.
   */
  strings: {
    type: 'strings',
    names: ['-ss', '--strings'],
    desc: 'A strings option.',
    group: 'String options:',
    default: ['one'],
    fallback: ['two'],
    separator: ',',
    trim: true,
    case: 'upper',
  },
  /**
   * A variadic numbers option whose values are rounded to the nearest integer.
   */
  numbers: {
    type: 'numbers',
    names: ['-ns', '--numbers'],
    desc: 'A numbers option.',
    group: 'Number options:',
    default: [1, 2],
    conv: 'round',
  },
  /**
   * A variadic strings option that accepts positional arguments, but no more than 3 values.
   */
  stringsLimit: {
    type: 'strings',
    names: ['', '--stringsLimit'],
    desc: 'A strings option.',
    group: 'String options:',
    example: ['one'],
    positional: '--',
    limit: 3,
  },
  /**
   * A delimited numbers option whose values are unique and can be specified multiple times.
   */
  numbersUnique: {
    type: 'numbers',
    names: ['', '--numbersUnique'],
    desc: 'A numbers option.',
    group: 'Number options:',
    example: [1, 2],
    separator: ',',
    append: true,
    unique: true,
  },
} as const satisfies Options;
