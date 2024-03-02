import type { AsyncExpectationResult, MatcherState } from '@vitest/expect';
import { describe, expect, it } from 'vitest';
import type { ConcreteStyles } from '../lib';
import { checkRequiredArray, gestaltSimilarity, getArgs, splitPhrase } from '../lib/utils';

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
  received: Promise<unknown>,
  expected: unknown,
): AsyncExpectationResult {
  const actual = await received;
  const pass = this.equals(actual, expected);
  const message = () => `expected ${actual} to match ${expected}`;
  return { message, pass, actual, expected };
}

expect.extend({ toResolve });

export const emptyStyles: ConcreteStyles = {
  boolean: '',
  string: '',
  number: '',
  regex: '',
  option: '',
  param: '',
  url: '',
  text: '',
};

describe('getArgs', () => {
  describe('with no completion index', () => {
    it('should handle zero arguments', () => {
      expect(getArgs('')).toEqual([]);
    });

    it('should ignore whitespace', () => {
      expect(getArgs(' type script ')).toEqual(['type', 'script']);
    });

    it('should handle arguments with quotes', () => {
      expect(getArgs(`"type script" 'is fun'`)).toEqual(['type script', 'is fun']);
    });

    it('should handle quotes alongside arguments', () => {
      expect(getArgs(`type" script is "fun`)).toEqual(['type script is fun']);
    });

    it('should handle quotes inside quotes', () => {
      expect(getArgs(`"'type' 'script'"`)).toEqual([`'type' 'script'`]);
      expect(getArgs(`'"type" "script"'`)).toEqual([`"type" "script"`]);
    });
  });

  describe('with completion index', () => {
    it('when it is by itself', () => {
      expect(getArgs('', 0)).toEqual(['\0']);
      expect(getArgs('  ', 1)).toEqual(['\0']);
    });

    it('when it is inside an argument', () => {
      expect(getArgs('type', 2)).toEqual(['ty\0pe']);
      expect(getArgs('"type script"', 5)).toEqual(['type\0 script']);
    });

    it('when it is at either side of an argument', () => {
      expect(getArgs('type', 0)).toEqual(['\0type']);
      expect(getArgs('type', 4)).toEqual(['type\0']);
    });
  });
});

describe('checkRequiredArray', () => {
  describe('when negate is false', () => {
    it('should return true on both arrays empty', () => {
      expect(checkRequiredArray([], [], false, false)).toBeTruthy();
    });

    it('should return true on both arrays with the same values', () => {
      expect(checkRequiredArray([1, 2, 3], [1, 2, 3], false, false)).toBeTruthy();
    });

    it('should return false on arrays with different lengths', () => {
      expect(checkRequiredArray([1, 2], [1, 2, 3], false, false)).toBeFalsy();
    });

    it('should return false on arrays with the same values but in different order', () => {
      expect(checkRequiredArray([1, 2, 3], [3, 2, 1], false, false)).toBeFalsy();
    });

    it('should return true on arrays with the same values in different order but unique', () => {
      expect(checkRequiredArray([1, 2, 3], [3, 2, 1], false, true)).toBeTruthy();
    });

    it('should return true on arrays with different lengths but unique', () => {
      expect(checkRequiredArray([1, 2], [2, 2, 1], false, true)).toBeTruthy();
    });

    it('should return false on arrays with different values', () => {
      expect(checkRequiredArray([1, 2], [1], false, true)).toBeFalsy();
      expect(checkRequiredArray([1], [1, 3], false, true)).toBeFalsy();
    });
  });

  describe('when negate is true', () => {
    it('should return true on both arrays empty', () => {
      expect(checkRequiredArray([], [], true, false)).toBeFalsy();
    });

    it('should return true on both arrays with the same values', () => {
      expect(checkRequiredArray([1, 2, 3], [1, 2, 3], true, false)).toBeFalsy();
    });

    it('should return false on arrays with different lengths', () => {
      expect(checkRequiredArray([1, 2], [1, 2, 3], true, false)).toBeTruthy();
    });

    it('should return false on arrays with the same values but in different order', () => {
      expect(checkRequiredArray([1, 2, 3], [3, 2, 1], true, false)).toBeTruthy();
    });

    it('should return true on arrays with the same values in different order but unique', () => {
      expect(checkRequiredArray([1, 2, 3], [3, 2, 1], true, true)).toBeFalsy();
    });

    it('should return true on arrays with different lengths but unique', () => {
      expect(checkRequiredArray([1, 2], [2, 2, 1], true, true)).toBeFalsy();
    });

    it('should return false on arrays with different values', () => {
      expect(checkRequiredArray([1, 2], [1], true, true)).toBeTruthy();
      expect(checkRequiredArray([1], [1, 3], true, true)).toBeTruthy();
    });
  });
});

describe('gestaltSimilarity', () => {
  it('should return NaN on empty strings', () => {
    expect(gestaltSimilarity('', '')).toBeNaN();
  });

  it('should return a percentage of the number of different characters', () => {
    expect(gestaltSimilarity('aaaaa', 'aaaaa')).toEqual(1); // cspell:disable-line
    expect(gestaltSimilarity('aaaaa', 'baaaa')).toEqual(0.8); // cspell:disable-line
    expect(gestaltSimilarity('aaaaa', 'bbaaa')).toEqual(0.6); // cspell:disable-line
    expect(gestaltSimilarity('aaaaa', 'bbbaa')).toEqual(0.4); // cspell:disable-line
    expect(gestaltSimilarity('aaaaa', 'bbbba')).toEqual(0.2); // cspell:disable-line
    expect(gestaltSimilarity('aaaaa', 'bbbbb')).toEqual(0); // cspell:disable-line
  });

  it('should return less similarity when characters are swapped', () => {
    expect(gestaltSimilarity('flag', 'galf')).toBeCloseTo(0.25, 2); // cspell:disable-line
    expect(gestaltSimilarity('flag', 'glaf')).toBeCloseTo(0.5, 2); // cspell:disable-line
    expect(gestaltSimilarity('flag', 'fgxx')).toBeCloseTo(0.5, 2); // cspell:disable-line
    expect(gestaltSimilarity('flag', 'gfxx')).toBeCloseTo(0.25, 2); // cspell:disable-line
  });
});

describe('splitPhrase', () => {
  it('should handle a phrase with no words', () => {
    expect(splitPhrase('')).toEqual(['']);
  });

  it('should handle a phrase with just words', () => {
    expect(splitPhrase('type (script) is fun')).toEqual(['type (script) is fun']);
  });

  it('should handle a phrase with words and groups', () => {
    expect(splitPhrase('(type|script) is fun')).toEqual(['type is fun', 'script is fun']);
  });

  it('should handle a phrase with groups with empty alternatives', () => {
    expect(splitPhrase('(|) is fun')).toEqual([' is fun', ' is fun']);
  });
});
