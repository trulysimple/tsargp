#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './calc.options.js';

try {
  const values = await new ArgumentParser(options).parseAsync();
  const result = values.add ?? values.sub ?? values.mult ?? values.div ?? NaN;
  console.log(result);
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
    process.exitCode = 1;
  } else {
    // help message, version or completion words
    console.log(`${err}`);
  }
}
