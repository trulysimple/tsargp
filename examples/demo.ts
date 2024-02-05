//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import { ArgumentParser, HelpFormatter, type Options, fg, tf, resetStyle } from 'tsargp';
import { dirname, join } from 'path';
import { promises } from 'fs';

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
const usage = `${tf.bold}Argument parser for TypeScript.${resetStyle}

  ${fg.yellow}tsargp ${fg.brightBlack}--help ${fg.green}# print help${fg.default}

${tf.bold}Options:${resetStyle}

`;

const footer = `

MIT License
Copyright (c) 2024 ${fg.cyan}TrulySimple${fg.default}

Report a bug: ${fg.brightBlack}https://github.com/trulysimple/tsargp/issues
${resetStyle}`;

const options = {
  help: {
    names: ['-h', '--help'],
    desc: 'Print this help message',
    type: 'function',
    default: () => {
      const help = new HelpFormatter(options).formatHelp();
      throw `${usage}${help}${footer}`;
    },
  },
  version: {
    names: ['-v', '--version'],
    desc: 'Print the package version',
    type: 'function',
    default: async () => {
      const packageJsonPath = join(dirname(import.meta.dirname), 'package.json');
      const packageJsonData = await promises.readFile(packageJsonPath);
      const { version: packageVersion } = JSON.parse(packageJsonData.toString());
      throw packageVersion;
    },
  },
  boolean: {
    names: ['-b', '--boolean'],
    desc: 'A boolean option with custom styling.',
    type: 'boolean',
    deprecated: 'some reason',
    styles: {
      names: [fg.red],
      desc: [tf.invert, tf.strike, tf.italic],
    },
  },
  stringRegex: {
    names: ['-s', '--stringRegex'],
    desc: 'A string option with a default value and a regex constraint',
    type: 'string',
    regex: /\d+/s,
    default: '123',
  },
  numberRange: {
    names: ['-n', '--numberRange'],
    desc: 'A number option with a default value and a range constraint',
    type: 'number',
    range: [-Infinity, 0],
    default: -1.23,
  },
  stringEnum: {
    names: ['-se', '--stringEnum'],
    desc: 'A string enumeration option with an example value',
    type: 'string',
    enums: ['one', 'two'],
    example: 'one',
  },
  numberEnum: {
    names: ['-ne', '--numberEnum'],
    desc: 'A number enumeration option with an example value',
    type: 'number',
    enums: [1, 2],
    example: 1,
  },
  stringsRegex: {
    names: ['-ss', '--strings'],
    desc: 'A strings option with a default value and a regex constraint',
    type: 'strings',
    regex: /\w+/s,
    default: ['one', 'two'],
  },
  numbersRange: {
    names: ['-ns', '--numbers'],
    desc: 'A numbers option with a default value and a range constraint',
    type: 'numbers',
    range: [0, Infinity],
    default: [1, 2],
  },
  stringsEnum: {
    names: ['', '--stringsEnum'],
    desc: 'A strings enumeration option with an example value',
    type: 'strings',
    enums: ['one', 'two'],
    example: ['one', 'one'],
  },
  numbersEnum: {
    names: ['', '--numbersEnum'],
    desc: 'A numbers enumeration option with an example value',
    type: 'numbers',
    enums: [1, 2],
    example: [1, 1],
  },
  requiresAll: {
    names: ['', '--requiresAll'],
    desc: 'An option that requires all of a set of other options',
    type: 'boolean',
    requiresAll: ['stringEnum', 'numberEnum'],
  },
  requiresOne: {
    names: ['', '--requiresOne'],
    desc: 'An option that requires one of a set of other options',
    type: 'boolean',
    requiresOne: ['stringRegex', 'numberRange'],
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
  get requiresAll(): boolean;
  get requiresOne(): boolean;
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
