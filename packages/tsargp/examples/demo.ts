#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './demo.options.js';

/**
 * An interface for the option values. (To make sure that they abide by it.)
 */
interface Values {
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

try {
  const values: Values = await new ArgumentParser(options).parseAsync();
  if (!values.command) {
    console.log(values);
  }
} catch (err) {
  if (err instanceof Error) {
    console.error(`${err}`);
    process.exitCode = 1;
  } else {
    console.log(`${err}`); // help message, version or completion words
  }
}
