#!/usr/bin/env node
export {};
try {
  console.log((await import('./demo.js')).values);
} catch (err) {
  console.error(err);
}
