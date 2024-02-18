import type { AsyncExpectationResult, MatcherState } from '@vitest/expect';
import { expect } from 'vitest';

interface CustomMatchers<R = unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toResolve(expected: any): R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

async function toResolve(
  this: MatcherState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  received: Promise<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any,
): AsyncExpectationResult {
  const actual = await received;
  const pass = this.equals(actual, expected);
  const message = () => `expected ${actual} to match ${expected}`;
  return { message, pass, actual, expected };
}
expect.extend({ toResolve });
