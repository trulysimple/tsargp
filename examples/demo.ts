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
const usage = `${clearStyle}${tf.bold}Argument parser for TypeScript.${clearStyle}

  ${fg.yellow}tsargp ${fg.default}--help ${fg.green}# print help${fg.default}`;

const footer = `MIT License
Copyright (c) 2024 ${tf.italic}${tf.bold}${fg.cyan}TrulySimple${clearStyle}

Report a bug: ${tf.faint}https://github.com/trulysimple/tsargp/issues${clearStyle}`;

const options = {
  help: {
    type: 'function',
    names: ['-h', '--help'],
    desc: 'A function option. Prints this help message',
    exec: () => {
      const help = [usage];
      const groups = new HelpFormatter(options).formatGroups();
      for (const [group, message] of groups.entries()) {
        help.push(`${tf.bold}${group || 'Global'} options:`, `${message}${clearStyle}`);
      }
      help.push(footer);
      throw help.join('\n\n') + '\n';
    },
  },
  version: {
    type: 'function',
    names: ['-v', '--version'],
    desc: 'A function option. Prints the package version',
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
    desc: 'A boolean option',
    deprecated: 'some reason',
    styles: {
      names: [clearStyle, fg.red],
      desc: [clearStyle, tf.invert, tf.strike, tf.italic],
    },
  },
  stringRegex: {
    type: 'string',
    names: ['-s', '--stringRegex'],
    desc: 'A string option',
    group: 'String',
    regex: /\d+/s,
    default: '123456789',
  },
  numberRange: {
    type: 'number',
    names: ['-n', '--numberRange'],
    desc: 'A number option',
    group: 'Number',
    range: [-Infinity, 0],
    default: -1.23,
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
