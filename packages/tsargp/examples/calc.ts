#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './calc.options.js';

try {
  const values = await new ArgumentParser(options).parse();
  const result = values.add ?? values.sub ?? values.mult ?? values.div ?? NaN;
  console.log(result);
} catch (err) {
  if (err instanceof Error) {
    console.error(`${err}`);
    process.exitCode = 1;
  } else {
    console.log(`${err}`); // help message or completion words
  }
}
