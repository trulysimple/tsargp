import { describe, expect, it, vi } from 'vitest';
import type { NamingRules } from '../lib/utils';
import {
  overrides,
  areEqual,
  gestaltSimilarity,
  findSimilar,
  getArgs,
  selectAlternative,
  isTrue,
  matchNamingRules,
  escapeRegExp,
  combineRegExp,
  findInObject,
} from '../lib/utils';

/*
  Initialization section. Do not do any of the following:
  - wrap this code in an IIFE, default export or vitest's `beforeAll`
  - assign `undefined` to `process.env`, as it will be converted to the string 'undefined'
*/
{
  overrides.stderrCols = 0;
  overrides.stdoutCols = 0;
  resetEnv();
}

/** @ignore */
export function resetEnv() {
  for (const name of ['FORCE_COLOR', 'NO_COLOR', 'TERM', 'COMP_LINE', 'COMP_POINT']) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete process.env[name];
  }
}

describe('getArgs', () => {
  describe('with no completion index', () => {
    it('should handle zero arguments', () => {
      expect(getArgs('')).toEqual([]);
      expect(getArgs('cmd')).toEqual([]);
    });

    it('should ignore leading and trailing whitespace', () => {
      expect(getArgs(' cmd')).toEqual([]);
      expect(getArgs(' cmd  type  script ')).toEqual(['type', 'script']);
    });

    it('should handle quoted arguments', () => {
      expect(getArgs(`cmd "" ''`)).toEqual(['', '']);
      expect(getArgs(`cmd " " ' '`)).toEqual([' ', ' ']);
      expect(getArgs(`cmd "'" '"'`)).toEqual([`'`, '"']);
      expect(getArgs(`cmd "type script" 'is fun'`)).toEqual(['type script', 'is fun']);
      expect(getArgs(`cmd type" "script' 'is fun`)).toEqual(['type script is', 'fun']);
      expect(getArgs(`cmd "'type' script" 'is "fun"'`)).toEqual([`'type' script`, 'is "fun"']);
    });
  });

  describe('with completion index', () => {
    it('when it is by itself', () => {
      expect(getArgs('cmd ', 4)).toEqual(['']);
    });

    it('when it is over an argument', () => {
      expect(getArgs('cmd type', 4)).toEqual(['']);
      expect(getArgs('cmd type', 6)).toEqual(['ty']);
      expect(getArgs('cmd "type script"', 10)).toEqual(['type ']);
    });

    it('when it is past the end of the line', () => {
      expect(getArgs('cmd', 4)).toEqual(['']);
      expect(getArgs('cmd ""', 8)).toEqual(['', '']);
      expect(getArgs('cmd type', 9)).toEqual(['type', '']);
    });
  });
});

describe('areEqual', () => {
  it('should return true on both arrays empty', () => {
    expect(areEqual([], [], false)).toBeTruthy();
  });

  it('should return true on arrays with the same values', () => {
    expect(areEqual([1, 2, 3], [1, 2, 3], false)).toBeTruthy();
  });

  it('should return false on arrays with different lengths', () => {
    expect(areEqual([1, 2], [1, 2, 3], false)).toBeFalsy();
  });

  it('should return false on arrays with the same values but in different order', () => {
    expect(areEqual([1, 2, 3], [3, 2, 1], false)).toBeFalsy();
  });

  it('should return true on arrays with the same values in different order but unique', () => {
    expect(areEqual([1, 2, 3], [3, 2, 1], true)).toBeTruthy();
  });

  it('should return true on arrays with different lengths but unique', () => {
    expect(areEqual([1, 2], [2, 2, 1], true)).toBeTruthy();
  });

  it('should return false on arrays with different values', () => {
    expect(areEqual([1, 2], [1], true)).toBeFalsy();
    expect(areEqual([1], [1, 3], true)).toBeFalsy();
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

describe('findSimilar', () => {
  it('should handle empty names', () => {
    expect(findSimilar('', ['abc'])).toHaveLength(1);
    expect(findSimilar('abc', [])).toHaveLength(0);
  });

  it('should return names in decreasing order of similarity ', () => {
    const similar = findSimilar('abc', ['a', 'ab', 'abc', 'abcd']);
    expect(similar).toEqual(['abcd', 'ab', 'a']);
  });

  it('should filter names by similarity threshold', () => {
    const similar = findSimilar('abc', ['a', 'ab', 'abc', 'abcd'], 0.6);
    expect(similar).toEqual(['abcd', 'ab']);
  });
});

describe('selectAlternative', () => {
  it('should handle an empty phrase', () => {
    expect(selectAlternative('')).toEqual('');
  });

  it('should handle a phrase with no groups', () => {
    expect(selectAlternative('type|script (is fun)')).toEqual('type|script (is fun)');
  });

  it('should handle a phrase with unmatched parentheses', () => {
    expect(selectAlternative('type (script')).toEqual('type (script');
    expect(selectAlternative('type )script')).toEqual('type )script');
  });

  it('should handle a phrase with empty groups', () => {
    expect(selectAlternative('type (|) script', 0)).toEqual('type  script');
    expect(selectAlternative('type (|) script', 1)).toEqual('type  script');
  });

  it('should handle a phrase with non-empty groups', () => {
    expect(selectAlternative('(type|script) is fun', 0)).toEqual('type is fun');
    expect(selectAlternative('(type|script) is fun', 1)).toEqual('script is fun');
  });

  it('should handle a phrase with parentheses inside groups', () => {
    expect(selectAlternative('((type)|(script)) is fun', 0)).toEqual('(type) is fun');
    expect(selectAlternative('((type)|(script)) is fun', 1)).toEqual('(script) is fun');
  });

  it('should handle a phrase with multiple groups', () => {
    expect(selectAlternative('(type|script) (is|fun)', 0)).toEqual('type is');
    expect(selectAlternative('(type|script) (is|fun)', 1)).toEqual('script fun');
  });

  it('should handle a phrase with parentheses after a group', () => {
    expect(selectAlternative('(type|script) (is fun)', 0)).toEqual('type (is fun)');
    expect(selectAlternative('(type|script) (is fun)', 1)).toEqual('script (is fun)');
  });
});

describe('isTrue', () => {
  it('should return false on zero', () => {
    expect(isTrue('  ')).toBeFalsy();
    expect(isTrue(' 00 ')).toBeFalsy();
    expect(isTrue(' +0.0 ')).toBeFalsy();
  });

  it('should return true on non-zero and NaN', () => {
    expect(isTrue(' 0.1 ')).toBeTruthy();
    expect(isTrue(' -1 ')).toBeTruthy();
    expect(isTrue(' abc ')).toBeTruthy();
  });

  it('should return true on matched truth names', () => {
    const flags = { truthNames: ['true', 'yes', 'on'] };
    expect(isTrue(' TruE ', flags)).toBeTruthy();
    expect(isTrue(' yES ', flags)).toBeTruthy();
    expect(isTrue(' ON ', flags)).toBeTruthy();
    expect(isTrue(' abc ', flags)).toBeFalsy();
    expect(isTrue(' True ', { ...flags, caseSensitive: true })).toBeFalsy();
  });

  it('should return false on matched falsity names', () => {
    const flags = { falsityNames: ['false', 'no', 'off'] };
    expect(isTrue(' FalsE ', flags)).toBeFalsy();
    expect(isTrue(' No ', flags)).toBeFalsy();
    expect(isTrue(' oFF ', flags)).toBeFalsy();
    expect(isTrue(' abc ', flags)).toBeTruthy();
    expect(isTrue(' False ', { ...flags, caseSensitive: true })).toBeTruthy();
  });

  it('should return undefined on unmatched truth and falsity names', () => {
    const flags = {
      truthNames: ['true', 'yes', 'on'],
      falsityNames: ['false', 'no', 'off'],
    };
    expect(isTrue(' abc ', flags)).toBeUndefined();
    expect(isTrue(' True ', { ...flags, caseSensitive: true })).toBeUndefined();
    expect(isTrue(' False ', { ...flags, caseSensitive: true })).toBeUndefined();
  });
});

describe('matchNamingRules', () => {
  it('should match the first name against each rule', () => {
    const rules = {
      ruleset: {
        rule1: vi.fn().mockImplementation((name) => name.startsWith('Match')),
        rule2: vi.fn().mockImplementation(() => false),
      },
    } as const satisfies NamingRules;
    const match = matchNamingRules(['Match1', 'Non-match', 'Match2'], rules);
    expect(match).toEqual({ ruleset: { rule1: 'Match1' } });
    expect(rules.ruleset.rule1).toHaveBeenCalledWith('Match1', 'match1', 'MATCH1');
    expect(rules.ruleset.rule1).not.toHaveBeenCalledWith(
      'Non-match',
      expect.anything(),
      expect.anything(),
    );
    expect(rules.ruleset.rule1).not.toHaveBeenCalledWith(
      'Match2',
      expect.anything(),
      expect.anything(),
    );
    expect(rules.ruleset.rule1).toHaveBeenCalledTimes(1);
    expect(rules.ruleset.rule2).toHaveBeenCalledTimes(3);
  });
});

describe('escapeRegExp', () => {
  it('should escape the regex symbols', () => {
    expect(escapeRegExp('\\^$.*+?()[]{}|')).toEqual('\\\\\\^\\$\\.\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|');
  });
});

describe('combineRegExp', () => {
  it('should combine the patterns', () => {
    expect(
      combineRegExp(['\\', '^', '$', '.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '|']),
    ).toEqual('(\\\\|\\^|\\$|\\.|\\*|\\+|\\?|\\(|\\)|\\[|\\]|\\{|\\}|\\|)');
  });
});

describe('findInObject', () => {
  it('should return undefined on no match', () => {
    expect(findInObject({}, () => true)).toBeUndefined();
    expect(findInObject({ a: 1, b: 'a' }, () => false)).toBeUndefined();
  });

  it('should return the first match', () => {
    expect(findInObject({ a: 1, b: 'a' }, () => true)).toEqual(1);
    expect(findInObject({ a: 1, b: 'a' }, (val) => val === 'a')).toEqual('a');
  });
});
