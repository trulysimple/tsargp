//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
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
  BooleanOption,
  VersionOption,
  OptionDataType,
  RequiresVal,
  ValuedOption,
} from './options';

import { HelpFormatter, doubleBreak } from './formatter';
import { RequiresAll, RequiresNot, RequiresOne, isArray, isNiladic, isValued } from './options';
import { tf } from './styles';

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
        marker?: string;
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
          const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
          const marker = typeof option.positional === 'string' ? option.positional : undefined;
          this.positional = { key, name, option, marker };
        }
        ArgumentParser.checkEnumsSanity(key, option);
        ArgumentParser.checkValueSanity(key, option, option.default);
        ArgumentParser.checkValueSanity(key, option, option.example);
      }
      if (option.requires) {
        this.checkRequiresSanity(key, option.requires);
      }
      if (option.required) {
        this.required.push(key);
      }
      if (option.type === 'version' && !option.version && !option.resolve) {
        throw Error(`Option '${key}' contains no version or resolve function.`);
      }
    }
  }

  /**
   * Checks the sanity of the option's names.
   * @param key The option key
   * @param option The option definition
   */
  private checkNamesSanity(key: string, option: Option) {
    const names = option.names.filter((name) => name);
    if (!names.length) {
      throw Error(`Option '${key}' has no name.`);
    }
    if (option.type === 'flag' && option.negationNames) {
      names.push(...option.negationNames.filter((name) => name));
    }
    if ('positional' in option && typeof option.positional === 'string') {
      if (!option.positional) {
        throw Error(`Option '${key}' has empty positional marker.`);
      }
      names.push(option.positional);
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
  private static checkEnumsSanity(key: string, option: ParamOption) {
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
   * Checks the sanity of the option's value (default, example or required).
   * @param key The option key
   * @param option The option definition
   * @param value The option value
   */
  private static checkValueSanity(key: string, option: ParamOption, value: OptionDataType) {
    if (value === undefined) {
      return;
    }
    function assert(condition: unknown, type: string): asserts condition {
      if (!condition) {
        throw Error(
          `Option '${key}' has incompatible value '${value}'. Should be of type '${type}'.`,
        );
      }
    }
    switch (option.type) {
      case 'boolean':
        assert(typeof value == 'boolean', 'boolean');
        break;
      case 'string':
        assert(typeof value === 'string', 'string');
        this.normalizeString(option, key, value);
        break;
      case 'number':
        assert(typeof value === 'number', 'number');
        this.normalizeNumber(option, key, value);
        break;
      case 'strings':
        assert(typeof value === 'object', 'string[]');
        for (const element of value) {
          assert(typeof element === 'string', 'string[]');
          this.normalizeString(option, key, element);
        }
        break;
      case 'numbers':
        assert(typeof value === 'object', 'number[]');
        for (const element of value) {
          assert(typeof element === 'number', 'number[]');
          this.normalizeNumber(option, key, element);
        }
        break;
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
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
    } else if (requires instanceof RequiresNot) {
      this.checkRequiresSanity(key, requires.item);
    } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
      for (const item of requires.items) {
        this.checkRequiresSanity(key, item);
      }
    } else {
      for (const requiredKey in requires) {
        this.checkRequirementSanity(key, requiredKey, requires[requiredKey]);
      }
    }
  }

  /**
   * Checks the sanity of an option requirement.
   * @param key The requiring option key
   * @param requiredKey The required option key
   * @param requiredValue The required value, if any
   */
  private checkRequirementSanity(
    key: string,
    requiredKey: string,
    requiredValue?: RequiresVal[string],
  ) {
    if (requiredKey === key) {
      throw Error(`Option '${key}' requires itself.`);
    }
    if (!(requiredKey in this.options)) {
      throw Error(`Unknown required option '${requiredKey}'.`);
    }
    if (requiredValue !== undefined && requiredValue !== null) {
      const option = this.options[requiredKey];
      if (isNiladic(option)) {
        throw Error(`Required option '${requiredKey}' does not accept values.`);
      }
      ArgumentParser.checkValueSanity(requiredKey, option, requiredValue);
    }
  }

  /**
   * Convenience method to parse command-line arguments into option values.
   * @param args The command-line arguments
   * @param width The desired console width (to print help messages)
   * @returns The option values
   */
  parse(args?: Array<string>, width?: number): OptionValues<T> {
    const result = {} as OptionValues<T>;
    this.parseInto(result, args, width);
    return result;
  }

  /**
   * Async version
   * @returns A promise that resolves to the option values
   * @see parse
   */
  async parseAsync(args?: Array<string>, width?: number): Promise<OptionValues<T>> {
    const result = {} as OptionValues<T>;
    await this.parseInto(result, args, width);
    return result;
  }

  /**
   * Parses command-line arguments into option values.
   * @param values The options' values to parse into
   * @param args The command-line arguments
   * @param width The desired console width (to print help messages)
   * @returns A promise that can be awaited in order to await any async callbacks
   */
  parseInto(values: OptionValues<T>, args?: Array<string>, width?: number): Promise<Array<void>> {
    this.resetValues(values);
    return this.parseLoop(values, args, width);
  }

  /**
   * Reset options' values to their default value.
   * @param values The options' values
   */
  private resetValues(values: OptionValues<T>) {
    for (const key in this.options) {
      const option = this.options[key];
      if (isValued(option)) {
        const value = ArgumentParser.getDefaultValue(key, option);
        (values as Record<string, typeof value>)[key] = value;
      }
    }
  }

  /**
   * Gets the normalized default value of an option.
   * @param name The option name
   * @param option The option definition
   * @returns The default value
   */
  private static getDefaultValue(name: string, option: ValuedOption): OptionDataType {
    if (option.default === undefined) {
      return undefined;
    }
    switch (option.type) {
      case 'string':
        return this.normalizeString(option, name, option.default);
      case 'number':
        return this.normalizeNumber(option, name, option.default);
      case 'strings':
        return this.normalizeStrings(option, name, option.default);
      case 'numbers':
        return this.normalizeNumbers(option, name, option.default);
      default:
        return option.default;
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
        const candidateName = name.replace(/\p{P}/gu, '').toLowerCase();
        const sim = ArgumentParser.gestaltPatternMatching(searchName, candidateName);
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
   * @param width The desired console width (to print help messages)
   * @returns A promise that can be awaited in order to await any async callbacks
   */
  private parseLoop(
    values: OptionValues<T>,
    args = process.argv.slice(2),
    width?: number,
  ): Promise<Array<void>> {
    const promises = new Array<Promise<void>>();
    const specifiedKeys = new Set<keyof T>();
    let delimited: string | undefined;
    let multivalued: typeof this.positional;
    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      if (this.positional && arg === this.positional.marker) {
        const option = this.positional.option;
        if (isArray(option) && (!option.append || !specifiedKeys.has(this.positional.key))) {
          (values as Record<string, []>)[this.positional.key as string] = [];
        }
        specifiedKeys.add(this.positional.key);
        for (const arg of args.slice(i + 1)) {
          this.parseValue(values, this.positional.key, option, this.positional.name, arg);
        }
        break;
      }
      const [name, value] = arg.split(/=(.*)/, 2);
      const key = this.nameToKey.get(name);
      if (!key) {
        if (!multivalued && this.positional && !this.positional.marker) {
          const option = this.positional.option;
          if (isArray(option) && (!option.append || !specifiedKeys.has(this.positional.key))) {
            (values as Record<string, []>)[this.positional.key as string] = [];
          }
          specifiedKeys.add(this.positional.key);
          multivalued = this.positional; // not necessarily multivalued, but that's fine
        }
        if (multivalued) {
          this.parseValue(values, multivalued.key, multivalued.option, multivalued.name, arg);
          continue;
        }
        // either there's no positional option or the argument is not a positional marker
        const error = `Unknown option '${name}'.`;
        if (delimited) {
          throw Error(`${error} Did you forget to delimit values for '${delimited}'.`);
        }
        const similarNames = this.getSimilarNames(name);
        if (similarNames.length) {
          throw Error(`${error} Similar names: ${similarNames.join(', ')}.`);
        }
        throw Error(error);
      }
      delimited = undefined;
      multivalued = undefined;
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
            this.handleHelpOption(option, width);
          } else if (option.version) {
            throw option.version;
          } else {
            const promise = ArgumentParser.handleVersionOption(option);
            promises.push(promise);
            return Promise.all(promises);
          }
        }
      } else {
        const isarray = isArray(option);
        if (isarray && (!option.append || !specifiedKeys.has(key))) {
          (values as Record<string, []>)[key as string] = [];
        }
        if (value !== undefined) {
          this.parseValue(values, key, option, name, value);
        } else if (isarray && !option.separator) {
          multivalued = { key, name, option };
        } else if (i + 1 == args.length) {
          throw Error(`Missing parameter to '${name}'.`);
        } else {
          if (isarray && option.separator) {
            delimited = name; // save for recommendation
          }
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
   * @param width The desired console width (to print the help message)
   */
  private handleHelpOption(option: HelpOption, width?: number): never {
    const help = option.usage ? [option.usage] : [];
    const groups = new HelpFormatter(this.options, option.format).formatGroups(width);
    for (const [group, message] of groups.entries()) {
      const header = group ? group + ' options' : 'Options';
      help.push(`${tf.bold}${header}:`, message);
    }
    if (option.footer) {
      help.push(option.footer);
    }
    throw help.join(doubleBreak);
  }

  /**
   * Handles the special "version" option and never returns.
   * @param option The option definition
   */
  private static async handleVersionOption(option: VersionOption): Promise<never> {
    function assert(_condition: unknown): asserts _condition {}
    assert(option.resolve);
    const { promises } = await import('fs');
    for (
      let path = './package.json', lastResolved = '', resolved = option.resolve(path);
      resolved != lastResolved;
      path = '../' + path, lastResolved = resolved, resolved = option.resolve(path)
    ) {
      try {
        const jsonData = await promises.readFile(new URL(resolved));
        throw JSON.parse(jsonData.toString()).version;
      } catch (err) {
        if ((err as ErrnoException).code != 'ENOENT') {
          throw err;
        }
      }
    }
    throw `Could not find a 'package.json' file.`;
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
        const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
        throw Error(`Option '${name}' is required.`);
      }
    }
    for (const key of keys) {
      const option = this.options[key];
      if (option.requires) {
        const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
        const error = this.checkRequires(values, keys, option.requires);
        if (error) {
          throw Error(`Option '${name}' requires ${error}.`);
        }
      }
    }
  }

  /**
   * Checks the requirements of an option that was specified.
   * @param values The options' values
   * @param keys The set of specified option keys
   * @param requires The option requirements
   * @returns An error reason or null if no error
   */
  private checkRequires(
    values: OptionValues<T>,
    keys: Set<keyof T>,
    requires: Requires,
    negate = false,
  ): string | null {
    if (typeof requires === 'string') {
      return this.checkRequirement(values, keys, negate, requires);
    }
    if (requires instanceof RequiresNot) {
      return this.checkRequires(values, keys, requires.item, !negate);
    }
    if (requires instanceof RequiresAll) {
      return negate
        ? this.checkRequiresExp(values, keys, requires.items, negate)
        : this.checkRequiresExp(values, keys, requires.items, negate, null);
    }
    if (requires instanceof RequiresOne) {
      return negate
        ? this.checkRequiresExp(values, keys, requires.items, negate, null)
        : this.checkRequiresExp(values, keys, requires.items, negate);
    }
    return negate
      ? this.checkRequiresVal(values, keys, requires, negate)
      : this.checkRequiresVal(values, keys, requires, negate, null);
  }

  /**
   * Checks the items of a requirement expression.
   * @param values The options' values
   * @param keys The set of specified option keys
   * @param items The list of requirements
   * @param negate True if the requirement should be negated
   * @param errors If null, return on the first error; else return on the first success
   * @returns An error reason or null if no error
   */
  private checkRequiresExp(
    values: OptionValues<T>,
    keys: Set<keyof T>,
    items: Array<Requires>,
    negate: boolean,
    errors: null | Set<string> = new Set<string>(),
  ): string | null {
    for (const item of items) {
      const error = this.checkRequires(values, keys, item, negate);
      if (error) {
        if (!errors) {
          return error;
        }
        errors.add(error);
      } else if (errors) {
        return null;
      }
    }
    if (!errors) {
      return null;
    }
    const error = [...errors].join(' or ');
    return errors.size == 1 ? error : `(${error})`;
  }

  /**
   * Checks the entries of a map of key-value pairs.
   * @param values The options' values
   * @param keys The set of specified option keys
   * @param items The list of requirements
   * @param negate True if the requirement should be negated
   * @param errors If null, return on the first error; else return on the first success
   * @returns An error reason or null if no error
   */
  private checkRequiresVal(
    values: OptionValues<T>,
    keys: Set<keyof T>,
    requires: RequiresVal,
    negate: boolean,
    errors: null | Set<string> = new Set<string>(),
  ): string | null {
    for (const requiredKey in requires) {
      const error = this.checkRequirement(values, keys, negate, requiredKey, requires[requiredKey]);
      if (error) {
        if (!errors) {
          return error;
        }
        errors.add(error);
      } else if (errors) {
        return null;
      }
    }
    if (!errors) {
      return null;
    }
    const error = [...errors].join(' or ');
    return errors.size == 1 ? error : `(${error})`;
  }

  /**
   * Checks if a required option was specified with correct values.
   * @param values The options' values
   * @param specifiedKeys The set of specified option keys
   * @param negate True if the requirement should be negated
   * @param requiredKey The required key
   * @param requiredValue The required value, if any
   * @returns An error reason or null if no error
   */
  private checkRequirement(
    values: OptionValues<T>,
    specifiedKeys: Set<keyof T>,
    negate: boolean,
    requiredKey: string,
    requiredValue?: RequiresVal[string],
  ): string | null {
    const option = this.options[requiredKey];
    const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
    const required = requiredValue !== null;
    const withValue = required && requiredValue !== undefined;
    if (isNiladic(option)) {
      const specified = specifiedKeys.has(requiredKey);
      return ArgumentParser.checkRequiredPresence(name, negate, specified, required, withValue);
    }
    const actualValue = values[requiredKey as keyof OptionValues<T>];
    const specified = actualValue !== undefined;
    if (!specified || !required || !withValue) {
      return ArgumentParser.checkRequiredPresence(name, negate, specified, required, withValue);
    }
    return ArgumentParser.checkRequiredValue(name, option, negate, requiredValue, actualValue);
  }

  /**
   * Checks an option's required presence or absence.
   * @param name The option name
   * @param negate True if the requirement should be negated
   * @param specified True if the option was specified
   * @param required True if the option is required
   * @param withValue True if the option is required with a value
   * @returns An error reason or null if no error
   */
  private static checkRequiredPresence(
    name: string,
    negate: boolean,
    specified: boolean,
    required: boolean,
    withValue: boolean,
  ): string | null {
    return specified
      ? required == negate
        ? `no ${name}`
        : null
      : withValue || required != negate
        ? name
        : null;
  }

  /**
   * Checks an option's required value against a specified value.
   * @param name The option name
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param requiredValue The required value
   * @param actualValue The specified value
   * @returns An error reason or null if no error
   */
  private static checkRequiredValue(
    name: string,
    option: ParamOption,
    negate: boolean,
    requiredValue: Exclude<RequiresVal[string], undefined | null>,
    actualValue: Exclude<RequiresVal[string], undefined | null>,
  ): string | null {
    function assert(_condition: unknown): asserts _condition {}
    switch (option.type) {
      case 'boolean': {
        assert(typeof actualValue == 'boolean' && typeof requiredValue == 'boolean');
        if (actualValue !== requiredValue) {
          return negate ? null : `${name} = ${requiredValue}`;
        }
        return negate ? `${name} != ${requiredValue}` : null;
      }
      case 'string': {
        assert(typeof actualValue == 'string' && typeof requiredValue === 'string');
        const expected = this.normalizeString(option, name, requiredValue);
        if (actualValue !== expected) {
          return negate ? null : `${name} = '${expected}'`;
        }
        return negate ? `${name} != '${expected}'` : null;
      }
      case 'number': {
        assert(typeof actualValue == 'number' && typeof requiredValue === 'number');
        const expected = this.normalizeNumber(option, name, requiredValue);
        if (actualValue !== expected) {
          return negate ? null : `${name} = ${expected}`;
        }
        return negate ? `${name} != ${expected}` : null;
      }
      case 'strings': {
        assert(typeof actualValue == 'object' && typeof requiredValue === 'object');
        const expected = this.normalizeStrings(option, name, requiredValue as Array<string>);
        const errorVal = expected.map((el) => `'${el}'`).join(',');
        if (actualValue.length !== expected.length) {
          return negate ? null : `${name} = [${errorVal}]`;
        }
        if ('unique' in option && option.unique) {
          const expectedSet = new Set(expected);
          for (const actual of actualValue as Array<string>) {
            if (!expectedSet.delete(actual)) {
              return negate ? null : `${name} = [${errorVal}]`;
            }
          }
          if (expectedSet.size > 0) {
            return negate ? null : `${name} = [${errorVal}]`;
          }
        } else {
          for (let i = 0; i < actualValue.length; ++i) {
            if (actualValue[i] !== requiredValue[i]) {
              return negate ? null : `${name} = [${errorVal}]`;
            }
          }
        }
        return negate ? `${name} != [${errorVal}]` : null;
      }
      case 'numbers': {
        assert(typeof actualValue == 'object' && typeof requiredValue === 'object');
        const expected = this.normalizeNumbers(option, name, requiredValue as Array<number>);
        const errorVal = expected.map((el) => el.toString()).join(',');
        if (actualValue.length !== expected.length) {
          return negate ? null : `${name} = [${errorVal}]`;
        }
        if ('unique' in option && option.unique) {
          const expectedSet = new Set(expected);
          for (const actual of actualValue as Array<number>) {
            if (!expectedSet.delete(actual)) {
              return negate ? null : `${name} = [${errorVal}]`;
            }
          }
          if (expectedSet.size > 0) {
            return negate ? null : `${name} = [${errorVal}]`;
          }
        } else {
          for (let i = 0; i < actualValue.length; ++i) {
            if (actualValue[i] !== requiredValue[i]) {
              return negate ? null : `${name} = [${errorVal}]`;
            }
          }
        }
        return negate ? `${name} != [${errorVal}]` : null;
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
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
    let parsed;
    switch (option.type) {
      case 'boolean':
        parsed = ArgumentParser.parseBoolean(option, name, value);
        break;
      case 'string':
        parsed = ArgumentParser.parseString(option, name, value);
        break;
      case 'number':
        parsed = ArgumentParser.parseNumber(option, name, value);
        break;
      case 'strings': {
        const previous = (values as Record<string, Array<string> | undefined>)[key as string];
        parsed = ArgumentParser.parseStrings(option, name, value, previous);
        break;
      }
      case 'numbers': {
        const previous = (values as Record<string, Array<number> | undefined>)[key as string];
        parsed = ArgumentParser.parseNumbers(option, name, value, previous);
        break;
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
    (values as Record<string, typeof parsed>)[key as string] = parsed;
  }

  /**
   * Parses the value of a boolean option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private static parseBoolean(option: BooleanOption, name: string, value: string): boolean {
    return option.parse ? option.parse(name, value) : !value.trim().match(/^([0]*|false)$/i);
  }

  /**
   * Parses the value of a string option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private static parseString(option: StringOption, name: string, value: string): string {
    const string = option.parse ? option.parse(name, value) : value;
    return this.normalizeString(option, name, string);
  }

  /**
   * Parses the value of a number option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private static parseNumber(option: NumberOption, name: string, value: string): number {
    const number = option.parse ? option.parse(name, value) : Number(value);
    return this.normalizeNumber(option, name, number);
  }

  /**
   * Parses the value of a strings option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @param previous The previous value, if any
   */
  private static parseStrings(
    option: StringsOption,
    name: string,
    value: string,
    previous?: Array<string>,
  ): Array<string> {
    const strings = option.parse
      ? option.parse(name, value)
      : option.separator
        ? value.split(option.separator)
        : [value];
    return this.normalizeStrings(option, name, strings, previous);
  }

  /**
   * Parses the value of a numbers option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @param previous The previous value, if any
   */
  private static parseNumbers(
    option: NumbersOption,
    name: string,
    value: string,
    previous?: Array<number>,
  ): Array<number> {
    const numbers = option.parse
      ? option.parse(name, value)
      : option.separator
        ? value.split(option.separator).map((val) => Number(val))
        : [Number(value)];
    return this.normalizeNumbers(option, name, numbers, previous);
  }

  /**
   * Normalizes the value of a string option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private static normalizeString(
    option: StringOption | StringsOption,
    name: string,
    value: string,
  ): string {
    if (option.trim) {
      value = value.trim();
    }
    if (option.case) {
      value = option.case === 'lower' ? value.toLowerCase() : value.toLocaleUpperCase();
    }
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
    return value;
  }

  /**
   * Normalizes the value of a number option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private static normalizeNumber(
    option: NumberOption | NumbersOption,
    name: string,
    value: number,
  ): number {
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
    return value;
  }

  /**
   * Normalizes the value of a strings option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @param previous The previous value, if any
   */
  private static normalizeStrings(
    option: StringsOption,
    name: string,
    value: Array<string>,
    previous: Array<string> = [],
  ): Array<string> {
    value = value.map((val) => this.normalizeString(option, name, val));
    if (option.append || !option.separator) {
      previous.push(...value);
      value = previous;
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
    return value;
  }

  /**
   * Normalizes the value of a numbers option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @param previous The previous value, if any
   */
  private static normalizeNumbers(
    option: NumbersOption,
    name: string,
    value: Array<number>,
    previous: Array<number> = [],
  ): Array<number> {
    value = value.map((val) => this.normalizeNumber(option, name, val));
    if (option.append || !option.separator) {
      previous.push(...value);
      value = previous;
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
    return value;
  }

  /**
   * The longest strings that are substrings of both strings.
   * @param S The source string
   * @param T The target string
   * @returns The length of the largest substrings and their indices in both strings
   * @see https://www.wikiwand.com/en/Longest_common_substring
   */
  private static longestCommonSubstrings(S: string, T: string): [number, Array<[number, number]>] {
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
  private static matchingCharacters(S: string, T: string): number {
    const [z, indices] = this.longestCommonSubstrings(S, T);
    return indices.reduce((acc, [i, j]) => {
      const l = this.matchingCharacters(S.slice(0, i), T.slice(0, j));
      const r = this.matchingCharacters(S.slice(i + z), T.slice(j + z));
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
  private static gestaltPatternMatching(S: string, T: string): number {
    return (2 * this.matchingCharacters(S, T)) / (S.length + T.length);
  }
}
