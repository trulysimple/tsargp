//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type { URL as _URL } from 'url';

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * A collection of global variables to configure the behavior of the library.
 * @internal
 */
export const overrides: {
  /**
   * Overrides the terminal width of the standard output stream.
   */
  stdoutCols?: number;
  /**
   * Overrides the terminal width of the standard error stream.
   */
  stderrCols?: number;
} = {};

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * A helper type to alias another type while eliding type resolution in IntelliSense.
 * @template T The type to be aliased
 */
export type Alias<T> = T extends T ? T : T;

/**
 * A helper type to resolve types in IntelliSense.
 * @template T The type to be resolved
 */
export type Resolve<T> = T & unknown;

/**
 * A helper type to enumerate numbers.
 * @template N The type of last enumerated number
 */
export type Enumerate<N extends number, Acc extends Array<number> = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

/**
 * A helper type to remove optionality from types and properties.
 * @template T The source type
 */
export type Concrete<T> = { [K in keyof T]-?: Concrete<T[K]> };

/**
 * A helper type to remove the readonly attribute from a type.
 * @template T The source type
 */
export type Writable<T> = { -readonly [P in keyof T]: Writable<T[P]> };

/**
 * For some reason the global definition of `URL` has issues with static methods.
 */
export interface URL extends _URL {}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Gets a list of command arguments from a raw command line.
 * @param line The command line
 * @param compIndex The completion index, if any
 * @returns The list of arguments
 * @internal
 */
export function getArgs(line: string, compIndex: number = NaN): Array<string> {
  /** @ignore */
  function append(char: string) {
    if (arg === undefined) {
      arg = char;
    } else {
      arg += char;
    }
  }
  const result = new Array<string>();
  let arg: string | undefined;
  for (let i = 0, quote = ''; i < line.length; ++i) {
    if (i == compIndex) {
      append('\0');
    }
    switch (line[i]) {
      case '\n':
      case ' ':
        if (quote) {
          append(line[i]);
        } else if (arg !== undefined) {
          result.push(arg);
          arg = undefined;
        }
        break;
      case `'`:
      case '"':
        if (quote == line[i]) {
          quote = '';
        } else if (quote) {
          append(line[i]);
        } else {
          quote = line[i];
        }
        break;
      default:
        append(line[i]);
    }
  }
  if (line.length == compIndex) {
    append('\0');
  }
  if (arg !== undefined) {
    result.push(arg);
  }
  return result;
}

/**
 * Checks the specified value of an array option against a required value.
 * @param actual The specified value
 * @param expected The required value
 * @param negate True if the requirement should be negated
 * @param unique True if array elements should be unique
 * @returns True if the requirement was satisfied
 * @internal
 */
export function checkRequiredArray<T extends string | number>(
  actual: ReadonlyArray<T>,
  expected: ReadonlyArray<T>,
  negate: boolean,
  unique: boolean,
): boolean {
  if (unique) {
    const set = new Set(expected);
    for (const val of actual) {
      if (!set.delete(val)) {
        return negate;
      }
    }
    if (set.size > 0) {
      return negate;
    }
  } else if (actual.length !== expected.length) {
    return negate;
  } else {
    for (let i = 0; i < actual.length; ++i) {
      if (actual[i] !== expected[i]) {
        return negate;
      }
    }
  }
  return !negate;
}

/**
 * The longest strings that are substrings of both strings.
 * @param S The source string
 * @param T The target string
 * @returns The length of the largest substrings and their indices in both strings
 * @see https://www.wikiwand.com/en/Longest_common_substring
 */
function longestCommonSubstrings(S: string, T: string): [number, Array<[number, number]>] {
  const dp = new Array<number>(T.length);
  const indices = new Array<[number, number]>();
  let z = 0;
  for (let i = 0, last = 0; i < S.length; ++i) {
    for (let j = 0; j < T.length; ++j) {
      if (S[i] == T[j]) {
        const a = i == 0 || j == 0 ? 1 : last + 1;
        if (a >= z) {
          if (a > z) {
            z = a;
            indices.length = 0;
          }
          indices.push([i - z + 1, j - z + 1]);
        }
        last = dp[j];
        dp[j] = a;
      } else {
        last = dp[j];
        dp[j] = 0;
      }
    }
  }
  return [z, indices];
}

/**
 * Gets the maximum number of matching characters of two strings, which are defined as some longest
 * common substring plus (recursively) the matching characters on both sides of it.
 * @param S The source string
 * @param T The target string
 * @returns The number of matching characters
 */
function matchingCharacters(S: string, T: string): number {
  const [z, indices] = longestCommonSubstrings(S, T);
  return indices.reduce((acc, [i, j]) => {
    const l = matchingCharacters(S.slice(0, i), T.slice(0, j));
    const r = matchingCharacters(S.slice(i + z), T.slice(j + z));
    return Math.max(acc, z + l + r);
  }, 0);
}

/**
 * Gets the similarity of two strings based on the Gestalt algorithm.
 * @param S The source string
 * @param T The target string
 * @returns The similarity between the two strings
 * @see https://www.wikiwand.com/en/Gestalt_pattern_matching
 * @internal
 */
export function gestaltSimilarity(S: string, T: string): number {
  return (2 * matchingCharacters(S, T)) / (S.length + T.length);
}

/**
 * Split a phrase into multiple alternatives
 * @param phrase The phrase string
 * @returns The phrase alternatives
 * @internal
 */
export function splitPhrase(phrase: string): Array<string> {
  const [l, c, r] = phrase.split(/\(([^)|]*\|[^)]*)\)/, 3);
  return c ? c.split('|').map((alt) => l + alt + r) : [l];
}

/**
 * Asserts that a condition is true. This is a no-op.
 * @param _condition The condition
 * @internal
 */
export function assert(_condition: unknown): asserts _condition {}

/**
 * Converts a string to boolean.
 * @param str The string value
 * @returns True if the string evaluates to true
 * @internal
 */
export function isTrue(str: string): boolean {
  return !(Number(str) == 0 || str.trim().match(/^\s*false\s*$/i));
}
