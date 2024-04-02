import { describe, expect, it, vi } from 'vitest';
import {
  overrides,
  checkRequiredArray,
  gestaltSimilarity,
  findSimilarNames,
  getArgs,
  selectAlternative,
  isTrue,
  matchNamingRules,
  type NamingRules,
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

describe('findSimilarNames', () => {
  it('should handle empty names', () => {
    expect(findSimilarNames('', ['abc'])).toHaveLength(1);
    expect(findSimilarNames('abc', [])).toHaveLength(0);
  });

  it('should return names in decreasing order of similarity ', () => {
    const similar = findSimilarNames('abc', ['a', 'ab', 'abc', 'abcd']);
    expect(similar).toEqual(['abcd', 'ab', 'a']);
  });

  it('should filter names by similarity threshold', () => {
    const similar = findSimilarNames('abc', ['a', 'ab', 'abc', 'abcd'], 0.6);
    expect(similar).toEqual(['abcd', 'ab']);
  });
});

describe('splitPhrase', () => {
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
    expect(isTrue('')).toBeFalsy();
    expect(isTrue('00')).toBeFalsy();
    expect(isTrue(' +0.0 ')).toBeFalsy();
  });

  it('should return false on false', () => {
    expect(isTrue('false')).toBeFalsy();
    expect(isTrue(' FalsE ')).toBeFalsy();
  });

  it('should return false on no', () => {
    expect(isTrue('no')).toBeFalsy();
    expect(isTrue(' No ')).toBeFalsy();
  });

  it('should return false on off', () => {
    expect(isTrue('off')).toBeFalsy();
    expect(isTrue(' oFF ')).toBeFalsy();
  });

  it('should return true on any other string', () => {
    expect(isTrue('/0.0')).toBeTruthy();
    expect(isTrue('/false')).toBeTruthy();
    expect(isTrue('/no')).toBeTruthy();
    expect(isTrue('/off')).toBeTruthy();
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
