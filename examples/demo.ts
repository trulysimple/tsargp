#!/usr/bin/env node
import { ArgumentParser, fg, tf, clearStyle, req, fgColor, type Options } from 'tsargp';

/**
 * The option definitions
 */
const options = {
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
  boolean: {
    type: 'boolean',
    names: ['-b', '--boolean'],
    desc: 'A boolean option',
    deprecated: 'some reason',
    styles: {
      names: { clear: true, fg: fgColor('202') },
      desc: { clear: true, tf: [tf.invert, tf.strike, tf.italic] },
    },
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
    unique: true,
  },
  stringsEnum: {
    type: 'strings',
    names: ['', '--stringsEnum'],
    desc: 'A strings option',
    group: 'String',
    enums: ['one', 'two'],
    example: ['one', 'one'],
    positional: true,
    limit: 3,
  },
  numbersEnum: {
    type: 'numbers',
    names: ['', '--numbersEnum'],
    desc: 'A numbers option',
    group: 'Number',
    enums: [1, 2],
    example: [1, 1],
    separator: ',',
    append: true,
  },
  requires: {
    type: 'boolean',
    names: ['-req', ''],
    desc: 'A boolean option',
    requires: req.and(
      'stringEnum=one',
      'numberEnum=2',
      req.or('stringsRegex=a,b', 'numbersRange=3,4'),
    ),
  },
} as const satisfies Options;

/**
 * An interface for the option values (to demonstrate that they conform to it).
 */
interface CommandOptions {
  get boolean(): boolean;
  get stringRegex(): string;
  get numberRange(): number;
  get stringEnum(): 'one' | 'two' | undefined;
  get numberEnum(): 1 | 2 | undefined;
  get stringsRegex(): Array<string>;
  get numbersRange(): Array<number>;
  get stringsEnum(): Array<'one' | 'two'> | undefined;
  get numbersEnum(): Array<1 | 2> | undefined;
  get requires(): boolean;
}

// the main script
try {
  const values: CommandOptions = await new ArgumentParser(options).asyncParse();
  console.log(values);
} catch (err) {
  console.error(err);
}
