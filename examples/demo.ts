#!/usr/bin/env node

//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import { ArgumentParser, HelpFormatter, type Options, fg, tf, clearStyle, req } from 'tsargp';
import { dirname, join } from 'path';
import { promises } from 'fs';

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
const usage = `${tf.bold}Argument parser for TypeScript.${clearStyle}

  ${fg.yellow}tsargp ${fg.default}--help ${fg.green}# print help${fg.default}

${tf.bold}Options:${clearStyle}

`;

const footer = `

MIT License
Copyright (c) 2024 ${tf.italic}${tf.bold}${fg.cyan}TrulySimple${clearStyle}

Report a bug: ${tf.faint}https://github.com/trulysimple/tsargp/issues
${clearStyle}`;

const options = {
  help: {
    type: 'function',
    names: ['-h', '--help'],
    desc: 'Print this help message',
    exec: () => {
      const help = new HelpFormatter(options).formatHelp();
      throw `${usage}${help}${footer}`;
    },
  },
  version: {
    type: 'function',
    names: ['-v', '--version'],
    desc: 'Print the package version',
    exec: async () => {
      const packageJsonPath = join(dirname(import.meta.dirname), 'package.json');
      const packageJsonData = await promises.readFile(packageJsonPath);
      const { version: packageVersion } = JSON.parse(packageJsonData.toString());
      throw packageVersion;
    },
  },
  boolean: {
    type: 'boolean',
    names: ['-b', '--boolean'],
    desc: 'A deprecated boolean option with custom styling.',
    deprecated: 'some reason',
    styles: {
      names: [clearStyle, fg.red],
      desc: [clearStyle, tf.invert, tf.strike, tf.italic],
    },
  },
  stringRegex: {
    type: 'string',
    names: ['-s', '--stringRegex'],
    desc: 'A string option with a default value and a regex constraint',
    regex: /\d+/s,
    default: '123456789',
  },
  numberRange: {
    type: 'number',
    names: ['-n', '--numberRange'],
    desc: 'A number option with a default value and a range constraint',
    range: [-Infinity, 0],
    default: -1.23,
  },
  stringEnum: {
    type: 'string',
    names: ['-se', '--stringEnum'],
    desc: 'A string option with an example value and an enumeration constraint',
    enums: ['one', 'two'],
    example: 'one',
  },
  numberEnum: {
    type: 'number',
    names: ['-ne', '--numberEnum'],
    desc: 'A number option with an example value and an enumeration constraint',
    enums: [1, 2],
    example: 1,
  },
  stringsRegex: {
    type: 'strings',
    names: ['-ss', '--strings'],
    desc: 'A strings option with a default value and a regex constraint',
    regex: /\w+/s,
    default: ['one', 'two'],
    separator: ',',
    trim: true,
  },
  numbersRange: {
    type: 'numbers',
    names: ['-ns', '--numbers'],
    desc: 'A numbers option with a default value and a range constraint',
    range: [0, Infinity],
    default: [1, 2],
    multivalued: true,
    unique: true,
  },
  stringsEnum: {
    type: 'strings',
    names: ['', '--stringsEnum'],
    desc: 'A strings option with an example value and an enumeration constraint',
    enums: ['one', 'two'],
    example: ['one', 'one'],
    multivalued: true,
    positional: true,
    limit: 3,
  },
  numbersEnum: {
    type: 'numbers',
    names: ['', '--numbersEnum'],
    desc: 'A numbers option with an example value and an enumeration constraint',
    enums: [1, 2],
    example: [1, 1],
    separator: ',',
    append: true,
  },
  requires: {
    type: 'boolean',
    names: ['-req', ''],
    desc: 'An option that requires other options',
    requires: req.and(
      'stringEnum=one',
      'numberEnum=2',
      req.or('stringsRegex=a,b', 'numbersRange=3,4'),
    ),
  },
} as const satisfies Options;

//--------------------------------------------------------------------------------------------------
// Interfaces
//--------------------------------------------------------------------------------------------------
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

//--------------------------------------------------------------------------------------------------
// Main script
//--------------------------------------------------------------------------------------------------
try {
  const values: CommandOptions = await new ArgumentParser(options).asyncParse();
  console.log(values);
} catch (err) {
  console.error(err);
}
