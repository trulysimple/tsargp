//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Options } from './index.js';

import { colors, ArgumentParser } from './index.js';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

export { OptionValues };

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
const usage = `${colors.reset}Truly simple argument parser for TypeScript.

  ${colors.yellow}tsarg ${colors.brightBlack}--help ${colors.green}# print help

${colors.reset}Options:

`;

const footer = `${colors.reset}

MIT License
Copyright (c) 2024 Diego Sogari

Report a bug: ${colors.brightBlack}https://github.com/disog/tsarg/issues${colors.reset}
`;

const options = {
  help: {
    names: ['-h', '--help'],
    desc: 'Print this help message',
    type: 'help',
    default: (help) => {
      throw `${usage}${help.formatHelp(process.stdout.columns)}${footer}`;
    },
  },
  version: {
    names: ['-v', '--version'],
    desc: 'Print the package version',
    type: 'function',
    default: () => {
      const path = join(dirname(import.meta.dirname), 'package.json');
      throw JSON.parse(readFileSync(path).toString()).version;
    },
  },
  boolean: {
    names: ['-b', '--boolean'],
    desc: 'A boolean option',
    type: 'boolean',
  },
  string: {
    names: ['-s', '--string'],
    desc: 'A string option',
    type: 'string',
    default: 'default',
  },
  number: {
    names: ['-n', '--number'],
    desc: 'A number option',
    type: 'number',
    default: -1.23,
  },
  deprecated: {
    names: ['-d', '--deprecated'],
    desc: 'A deprecated option with custom highlighting',
    type: 'string',
    deprecated: 'some reason',
    color: colors.red,
  },
  stringEnum: {
    names: ['-se', '--stringEnum'],
    desc: 'A string enumeration option',
    type: 'string',
    accepts: ['one', 'two'],
  },
  numberEnum: {
    names: ['-ne', '--numberEnum'],
    desc: 'A number enumeration option',
    type: 'number',
    accepts: [1, 2],
  },
  strings: {
    names: ['-ss', '--strings'],
    desc: 'A strings option',
    type: 'strings',
    default: ['one', 'two'],
  },
  numbers: {
    names: ['-ns', '--numbers'],
    desc: 'A numbers option',
    type: 'numbers',
    default: [1, 2],
  },
  stringsEnum: {
    names: ['', '--stringsEnum'],
    desc: 'A strings enumeration option',
    type: 'strings',
    accepts: ['one', 'two'],
  },
  numbersEnum: {
    names: ['', '--numbersEnum'],
    desc: 'A numbers enumeration option',
    type: 'numbers',
    accepts: [1, 2],
  },
} as const satisfies Options;

//--------------------------------------------------------------------------------------------------
// Interfaces
//--------------------------------------------------------------------------------------------------
interface CommandOptions {
  get boolean(): boolean;
  get string(): string;
  get number(): number;
  get deprecated(): string;
  get stringEnum(): string;
  get numberEnum(): number;
  get strings(): Array<string>;
  get numbers(): Array<number>;
  get stringsEnum(): Array<string>;
  get numbersEnum(): Array<number>;
}

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
class OptionValues implements CommandOptions {
  boolean!: boolean;
  string!: string;
  number!: number;
  deprecated!: string;
  stringEnum!: string;
  numberEnum!: number;
  strings!: Array<string>;
  numbers!: Array<number>;
  stringsEnum!: Array<string>;
  numbersEnum!: Array<number>;

  constructor() {
    new ArgumentParser(options).parseInto(this);
  }
}
