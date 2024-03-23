#!/usr/bin/env node
import { ArgumentParser, WarnMessage } from 'tsargp';
import options from './demo.options.js';

/**
 * An interface for the option values. (To make sure that they comply with it.)
 */
interface Values {
  helpCmd: undefined;
  flag: boolean | undefined;
  command: number | undefined;
  boolean: boolean;
  stringRegex: string;
  numberRange: number;
  stringEnum: 'one' | 'two' | undefined;
  numberEnum: 1 | 2 | undefined;
  stringsRegex: string[];
  numbersRange: number[];
  stringsEnum: Array<'one' | 'two'> | undefined;
  numbersEnum: Array<1 | 2> | undefined;
}

const values = {} as Values;
const error = await new ArgumentParser(options).tryParse(values);
if (error instanceof Error) {
  console.error(`${error}`);
  process.exitCode = 1;
} else if (error instanceof WarnMessage) {
  console.error(`${error}`);
  if (!values.command) {
    console.log(values);
  }
} else if (error) {
  console.log(`${error}`); // help, version or completion words
} else if (!values.command) {
  console.log(values);
}
