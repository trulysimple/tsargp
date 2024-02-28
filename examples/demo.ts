#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './demo.options.js';

try {
  const values = await new ArgumentParser(options).parseAsync();
  if (!values.command) {
    console.log(values);
  }
} catch (err) {
  if (typeof err === 'string') {
    console.log(err);
  } else {
    console.error(err);
    process.exitCode = 1;
  }
}
