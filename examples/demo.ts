#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './demo.options.js';

/**
 * An interface for the option values (to demonstrate that they conform to it).
 */
interface CommandOptions {
  get flag(): boolean | undefined;
  get boolean(): boolean;
  get stringRegex(): string;
  get numberRange(): number;
  get stringEnum(): 'one' | 'two' | undefined;
  get numberEnum(): 1 | 2 | undefined;
  get stringsRegex(): Array<string>;
  get numbersRange(): Array<number>;
  get stringsEnum(): Array<'one' | 'two'> | undefined;
  get numbersEnum(): Array<1 | 2> | undefined;
}

// the main script
try {
  const values: CommandOptions = await new ArgumentParser(options).parseAsync();
  console.log(values);
} catch (err) {
  console.error(err);
}
