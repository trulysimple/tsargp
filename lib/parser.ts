//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  ArrayOption,
  ParamOption,
  NumberOption,
  NumbersOption,
  Option,
  Options,
  OptionValues,
  Requires,
  StringOption,
  StringsOption,
  HelpOption,
  VersionOption,
  BooleanOption,
} from './options.js';

import { HelpFormatter } from './formatter.js';
import { isArray, isNiladic, isValued } from './options.js';
import { tf } from './styles.js';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

export { ArgumentParser };

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements parsing of command-line arguments into option values.
 * @template T The type of the options' definitions
 */
class ArgumentParser<T extends Options> {
  private readonly nameToKey = new Map<string, keyof T>();
  private readonly required = new Array<keyof T>();
  private readonly positional:
    | undefined
    | {
        key: keyof T;
        name: string;
        option: ParamOption;
      };

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The option definitions
   */
  constructor(private readonly options: T) {
    for (const key in this.options) {
      const option = this.options[key];
      this.checkNamesSanity(key, option);
      if (!isNiladic(option)) {
        if (option.positional) {
          if (this.positional) {
            throw Error(`Duplicate positional option '${key}'.`);
          }
          const name = option.preferredName ?? option.names.find((name) => name)!;
          this.positional = { key, name, option };
        }
        this.checkEnumsSanity(key, option);
        this.checkValueSanity(key, option, 'default');
        this.checkValueSanity(key, option, 'example');
      }
      if (option.requires) {
        this.checkRequiresSanity(key, option.requires);
      }
      if (option.required) {
        this.required.push(key);
      }
    }
  }

  /**
   * Checks the sanity of the option names.
   * @param key The option key
   * @param option The option definition
   */
  private checkNamesSanity(key: string, option: Option) {
    const names = option.names.filter((name) => name);
    if (!names.length) {
      throw Error(`Option '${key}' has no name.`);
    }
    if (option.type === 'flag' && option.negationNames) {
      names.push(...option.negationNames);
    }
    for (const name of names) {
      const invalid = name.match(/[~$^&=|<>\s]+/);
      if (invalid) {
        throw Error(`Option name '${name}' contains invalid characters: '${invalid[0]}'.`);
      }
      if (this.nameToKey.has(name)) {
        throw Error(`Duplicate option name '${name}'.`);
      }
      this.nameToKey.set(name, key);
    }
  }

  /**
   * Checks the sanity of the option's enumerated values.
   * @param key The option key
   * @param option The option definition
   */
  private checkEnumsSanity(key: string, option: ParamOption) {
    if ('enums' in option && option.enums) {
      if (!option.enums.length) {
        throw Error(`Option '${key}' has zero enum values.`);
      }
      const set = new Set<string | number>(option.enums);
      if (set.size !== option.enums.length) {
        for (const value of option.enums) {
          if (!set.delete(value)) {
            throw Error(`Option '${key}' has duplicate enum '${value}'.`);
          }
        }
      }
    }
  }

  /**
   * Checks the sanity of the option's default or example value.
   * @param key The option key
   * @param option The option definition
   * @param prop The option property
   */
  private checkValueSanity(key: string, option: ParamOption, prop: 'default' | 'example') {
    if (prop in option && option[prop] !== undefined) {
      const test = {} as OptionValues<T>;
      if (isArray(option)) {
        if (!option[prop]!.length) {
          throw Error(`Option '${key}' has zero ${prop} values.`);
        }
        for (const value of option[prop]!) {
          this.parseValue(test, key, option, key, value.toString());
        }
      } else {
        this.parseValue(test, key, option, key, option[prop]!.toString());
      }
    }
  }

  /**
   * Checks the sanity of the option requirements.
   * @param key The option key
   * @param requires The option requirements
   */
  private checkRequiresSanity(key: string, requires: Requires) {
    if (typeof requires === 'string') {
      this.checkRequirementSanity(key, requires);
    } else {
      for (const item of requires.items) {
        this.checkRequiresSanity(key, item);
      }
    }
  }

  /**
   * Checks the sanity of an option requirement.
   * @param key The option key
   * @param requirement The requirement specification
   */
  private checkRequirementSanity(key: string, requirement: string) {
    const [requiredKey, requiredValue] = requirement.split(/=(.*)/, 2);
    if (requiredKey === key) {
      throw Error(`Option '${key}' requires itself.`);
    }
    if (!(requiredKey in this.options)) {
      throw Error(`Unknown required option '${requiredKey}'.`);
    }
    if (requiredValue) {
      const option = this.options[requiredKey];
      if (isNiladic(option)) {
        throw Error(`Required option '${requiredKey}' does not accept values.`);
      }
      this.parseValue({} as OptionValues<T>, requiredKey, option, requiredKey, requiredValue);
    }
  }

  /**
   * Convenience method to parse command-line arguments into option values.
   * @param args The command-line arguments
   * @returns The option values
   */
  parse(args = process.argv.slice(2)): OptionValues<T> {
    const result = {} as OptionValues<T>;
    this.parseInto(result, args);
    return result;
  }

  /**
   * Async version
   * @returns A promise that resolves to the option values
   * @see parse
   */
  async parseAsync(args = process.argv.slice(2)): Promise<OptionValues<T>> {
    const result = {} as OptionValues<T>;
    await this.parseInto(result, args);
    return result;
  }

  /**
   * Parses command-line arguments into option values.
   * @param values The options' values to parse into
   * @param args The command-line arguments
   * @returns A promise that can be awaited in order to await any async callbacks
   */
  parseInto(values: OptionValues<T>, args = process.argv.slice(2)): Promise<Array<void>> {
    this.resetValues(values);
    return this.parseLoop(values, args);
  }

  /**
   * Reset option values to their default value.
   * @param values The options' values
   */
  private resetValues(values: OptionValues<T>) {
    for (const key in this.options) {
      const option = this.options[key];
      if (isValued(option)) {
        if (option.default === undefined) {
          (values as Record<string, undefined>)[key] = undefined;
        } else if (option.type === 'string') {
          (values as Record<string, string>)[key] = this.normalizeString(option, option.default);
        } else if (option.type === 'number') {
          (values as Record<string, number>)[key] = this.normalizeNumber(option, option.default);
        } else if (option.type === 'strings') {
          (values as Record<string, Array<string>>)[key] = option.default.map((val) =>
            this.normalizeString(option, val),
          );
        } else if (option.type === 'numbers') {
          (values as Record<string, Array<number>>)[key] = option.default.map((val) =>
            this.normalizeNumber(option, val),
          );
        } else {
          (values as Record<string, boolean>)[key] = option.default;
        }
      }
    }
  }

  /**
   * Gets a list of option names that are similar to a given name.
   * @param name The option name
   * @param threshold The similarity threshold
   * @returns The list of similar names in decreasing order of similarity
   */
  private getSimilarNames(name: string, threshold = 0.6): Array<string> {
    const searchName = name.replace(/\p{P}/gu, '').toLowerCase();
    return [...this.nameToKey.keys()]
      .reduce((acc, name) => {
        const sim = gestaltPatternMatching(searchName, name.replace(/\p{P}/gu, '').toLowerCase());
        if (sim >= threshold) {
          acc.push([name, sim]);
        }
        return acc;
      }, new Array<[string, number]>())
      .sort(([, as], [, bs]) => bs - as)
      .map(([str]) => str);
  }

  /**
   * The main parser loop.
   * @param values The options' values
   * @param args The command-line arguments
   * @returns A promise that can be awaited in order to await any async callbacks
   */
  private parseLoop(values: OptionValues<T>, args: Array<string>): Promise<Array<void>> {
    const promises = new Array<Promise<void>>();
    const specifiedKeys = new Set<keyof T>();
    let multi: typeof this.positional;
    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      const [name, value] = arg.split(/=(.*)/, 2);
      const key = this.nameToKey.get(name);
      if (!key) {
        if (!multi && this.positional) {
          multi = this.positional;
          if (isArray(multi.option) && (!multi.option.append || !specifiedKeys.has(multi.key))) {
            (values as Record<string, []>)[multi.key as string] = [];
          }
          specifiedKeys.add(multi.key);
        }
        if (multi) {
          this.parseValue(values, multi.key, multi.option, multi.name, arg);
          continue;
        }
        const similarNames = this.getSimilarNames(name);
        if (similarNames.length) {
          throw Error(`Unknown option '${name}'. Similar names: ${similarNames.join(', ')}.`);
        }
        throw Error(`Unknown option '${name}'.`);
      }
      multi = undefined;
      const option = this.options[key];
      if (isNiladic(option)) {
        if (value !== undefined) {
          throw Error(`Option '${name}' does not accept any value.`);
        }
        if (option.type === 'flag') {
          const val = !option.negationNames?.includes(name);
          (values as Record<string, boolean>)[key as string] = val;
        } else if (option.type === 'function') {
          if (option.break) {
            specifiedKeys.add(key);
            this.checkRequired(values, specifiedKeys);
          }
          const result = option.exec(values, args.slice(i + 1));
          if (typeof result === 'object') {
            promises.push(result);
          }
          if (option.break) {
            return Promise.all(promises);
          }
        } else {
          specifiedKeys.add(key);
          this.checkRequired(values, specifiedKeys);
          if (option.type === 'help') {
            this.handleHelpOption(option);
          } else {
            this.handleVersionOption(option);
          }
        }
      } else {
        if (isArray(option) && (!option.append || !specifiedKeys.has(key))) {
          (values as Record<string, []>)[key as string] = [];
        }
        if (value !== undefined) {
          this.parseValue(values, key, option, name, value);
        } else if (isArray(option) && !option.separator) {
          multi = { key, name, option };
        } else if (i + 1 == args.length) {
          throw Error(`Missing parameter to '${name}'.`);
        } else {
          this.parseValue(values, key, option, name, args[++i]);
        }
      }
      specifiedKeys.add(key);
    }
    this.checkRequired(values, specifiedKeys);
    return Promise.all(promises);
  }

  /**
   * Handles the special "help" option and never returns.
   * @param option The option definition
   */
  private handleHelpOption(option: HelpOption): never {
    const help = option.usage ? [option.usage] : [];
    const groups = new HelpFormatter(this.options, option.format).formatGroups();
    for (const [group, message] of groups.entries()) {
      const header = group ? group + ' options' : 'Options';
      help.push(`${tf.bold}${header}:`, message);
    }
    if (option.footer) {
      help.push(option.footer);
    }
    throw help.join('\n\n');
  }

  /**
   * Handles the special "version" option and never returns.
   * @param option The option definition
   */
  private handleVersionOption(option: VersionOption): never {
    if (option.version) {
      throw option.version;
    }
    for (let dir = import.meta.dirname; dir != '/'; dir = dirname(dir)) {
      try {
        const jsonData = readFileSync(join(dir, 'package.json'));
        const { version } = JSON.parse(jsonData.toString());
        throw version;
      } catch (err) {
        if ((err as ErrnoException).code != 'ENOENT') {
          throw err;
        }
      }
    }
    throw 'unknown';
  }

  /**
   * Checks if required options were correctly specified.
   * @param values The options' values
   * @param keys The set of specified option keys
   */
  private checkRequired(values: OptionValues<T>, keys: Set<keyof T>) {
    for (const key of this.required) {
      if (!keys.has(key)) {
        const option = this.options[key];
        const preferredName = option.preferredName ?? option.names.find((name) => name)!;
        throw Error(`Option '${preferredName}' is required.`);
      }
    }
    for (const key of keys) {
      const option = this.options[key];
      if (option.requires) {
        const preferredName = option.preferredName ?? option.names.find((name) => name)!;
        const error = this.checkRequires(values, option.requires, preferredName, keys);
        if (error) {
          throw Error(`Option '${preferredName}' requires ${error}.`);
        }
      }
    }
  }

  /**
   * Checks the requirements of an option that was specified.
   * @param values The options' values
   * @param requires The option requirements
   * @param name The option name
   * @param keys The set of specified option keys
   * @returns An error reason or null if no error
   */
  private checkRequires(
    values: OptionValues<T>,
    requires: Requires,
    name: string,
    keys: Set<keyof T>,
  ): string | null {
    if (typeof requires === 'string') {
      return this.checkRequirement(values, requires, name, keys);
    }
    if (requires.op === 'and') {
      for (const item of requires.items) {
        const error = this.checkRequires(values, item, name, keys);
        if (error) {
          return error;
        }
      }
      return null;
    }
    const errors = new Set<string>();
    for (const item of requires.items) {
      const error = this.checkRequires(values, item, name, keys);
      if (!error) {
        return null;
      }
      errors.add(error);
    }
    return `(${[...errors].join(' or ')})`;
  }

  /**
   * Checks if a required option was specified with correct values.
   * @param values The options' values
   * @param requirement The requirement specification
   * @param name The option name
   * @param keys The set of specified option keys
   * @returns An error reason or null if no error
   */
  private checkRequirement(
    values: OptionValues<T>,
    requirement: string,
    name: string,
    keys: Set<keyof T>,
  ): string | null {
    const [requiredKey, requiredValue] = requirement.split(/=(.*)/, 2);
    const requiredOpt = this.options[requiredKey];
    const preferredName = requiredOpt.preferredName ?? requiredOpt.names.find((name) => name)!;
    let error = `'${preferredName}'`;
    if (isNiladic(requiredOpt)) {
      return keys.has(requiredKey) ? null : error;
    }
    const actualValue = values[requiredKey as keyof OptionValues<T>];
    if (actualValue === undefined) {
      return error;
    }
    if (requiredValue !== undefined) {
      error += `='${requiredValue}'`;
      const test = {} as OptionValues<T>;
      this.parseValue(test, requiredKey, requiredOpt, name, requiredValue);
      const expectedValue = test[requiredKey as keyof OptionValues<T>]!;
      if (typeof actualValue === 'object' && typeof expectedValue === 'object') {
        if (actualValue.length !== expectedValue.length) {
          return error;
        }
        if ('unique' in requiredOpt && requiredOpt.unique) {
          const actualSet = new Set<string | number>(actualValue);
          const expectedSet = new Set<string | number>(expectedValue);
          for (const actual of actualSet) {
            if (!expectedSet.delete(actual)) {
              return error;
            }
          }
          if (expectedSet.size > 0) {
            return error;
          }
        } else {
          for (let i = 0; i < actualValue.length; ++i) {
            if (actualValue[i] !== expectedValue[i]) {
              return error;
            }
          }
        }
      } else if (actualValue !== expectedValue) {
        return error;
      }
    }
    return null;
  }

  /**
   * Parses the value of an option parameter.
   * @param values The options' values to parse into
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseValue(
    values: OptionValues<T>,
    key: keyof T,
    option: ParamOption,
    name: string,
    value: string,
  ) {
    switch (option.type) {
      case 'boolean':
        (values as Record<string, boolean>)[key as string] = this.parseBoolean(option, name, value);
        break;
      case 'string':
        (values as Record<string, string>)[key as string] = this.parseString(option, name, value);
        break;
      case 'number':
        (values as Record<string, number>)[key as string] = this.parseNumber(option, name, value);
        break;
      case 'strings':
        this.setArrayValue(values, key, option, name, this.parseStrings(option, name, value));
        break;
      case 'numbers':
        this.setArrayValue(values, key, option, name, this.parseNumbers(option, name, value));
        break;
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Parses the value of a boolean option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseBoolean(option: BooleanOption, name: string, value: string): boolean {
    return option.parse ? option.parse(name, value) : !value.trim().match(/^([0]*|false)$/i);
  }

  /**
   * Parses the value of a string option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseString(option: StringOption, name: string, value: string): string {
    const string = option.parse ? option.parse(name, value) : value;
    const result = this.normalizeString(option, string);
    this.validateString(option, name, result);
    return result;
  }

  /**
   * Parses the value of a number option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumber(option: NumberOption, name: string, value: string): number {
    const number = option.parse ? option.parse(name, value) : Number(value);
    const result = this.normalizeNumber(option, number);
    this.validateNumber(option, name, result);
    return result;
  }

  /**
   * Parses the value of a strings option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseStrings(option: StringsOption, name: string, value: string): Array<string> {
    const strings = option.parse
      ? option.parse(name, value)
      : option.separator
        ? value.split(option.separator)
        : [value];
    const result = strings.map((val) => this.normalizeString(option, val));
    result.forEach((val) => this.validateString(option, name, val));
    return result;
  }

  /**
   * Parses the value of a numbers option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumbers(option: NumbersOption, name: string, value: string): Array<number> {
    const numbers = option.parse
      ? option.parse(name, value)
      : option.separator
        ? value.split(option.separator).map((val) => Number(val))
        : [Number(value)];
    const result = numbers.map((val) => this.normalizeNumber(option, val));
    result.forEach((val) => this.validateNumber(option, name, val));
    return result;
  }

  /**
   * Normalizes the value of a string option.
   * @param option The option definition
   * @param value The option value
   */
  private normalizeString(option: StringOption | StringsOption, value: string): string {
    if (option.trim) {
      value = value.trim();
    }
    if (option.case) {
      value = option.case === 'lower' ? value.toLowerCase() : value.toLocaleUpperCase();
    }
    return value;
  }

  /**
   * Validates the value of a string option against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private validateString(option: StringOption | StringsOption, name: string, value: string) {
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      throw Error(
        `Invalid parameter to '${name}': ${value}. Possible values are [${option.enums}].`,
      );
    }
    if ('regex' in option && option.regex && !option.regex.test(value)) {
      throw Error(
        `Invalid parameter to '${name}': ${value}. ` +
          `Value must match the regex ${String(option.regex)}.`,
      );
    }
  }

  /**
   * Normalizes and checks the value of a number option.
   * @param option The option definition
   * @param value The option value
   */
  private normalizeNumber(option: NumberOption | NumbersOption, value: number): number {
    switch (option.round) {
      case 'trunc':
        value = Math.trunc(value);
        break;
      case 'ceil':
        value = Math.ceil(value);
        break;
      case 'floor':
        value = Math.floor(value);
        break;
      case 'nearest':
        value = Math.round(value);
        break;
    }
    return value;
  }

  /**
   * Validates the value of a number option against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private validateNumber(option: NumberOption | NumbersOption, name: string, value: number) {
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      throw Error(
        `Invalid parameter to '${name}': ${value}. Possible values are [${option.enums}].`,
      );
    }
    if ('range' in option && option.range && (value < option.range[0] || value > option.range[1])) {
      throw Error(
        `Invalid parameter to '${name}': ${value}. Value must be in the range [${option.range}].`,
      );
    }
  }

  /**
   * Sets the value of an array option.
   * @param values The options' values to parse into
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private setArrayValue(
    values: OptionValues<T>,
    key: keyof T,
    option: ArrayOption,
    name: string,
    value: Array<string | number>,
  ) {
    if (option.append || !option.separator) {
      const previous = (values as Record<string, typeof value | undefined>)[key as string];
      if (previous) {
        previous.push(...value);
        value = previous;
      }
    }
    if (option.unique) {
      value = [...new Set(value)];
    }
    if (option.limit !== undefined && value.length > option.limit) {
      throw Error(
        `Option '${name}' has too many values (${value.length}). ` +
          `Should have at most ${option.limit}.`,
      );
    }
    (values as Record<string, typeof value>)[key as string] = value;
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
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
 */
function gestaltPatternMatching(S: string, T: string): number {
  return (2 * matchingCharacters(S, T)) / (S.length + T.length);
}
