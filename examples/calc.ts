#!/usr/bin/env node
import { ArgumentParser } from 'tsargp';
import options from './calc.options.js';

try {
  const values = await new ArgumentParser(options).parseAsync();
  const result = values.add ?? values.sub ?? values.mult ?? values.div ?? NaN;
  console.log(result);
} catch (err) {
  if (typeof err === 'string') {
    console.log(err);
  } else {
    console.error(err);
    process.exitCode = 1;
  }
}
