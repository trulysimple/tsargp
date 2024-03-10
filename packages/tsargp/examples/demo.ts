#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './demo.options.js';

try {
  const values = await new ArgumentParser(options).parseAsync();
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
