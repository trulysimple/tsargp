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
} from './options.js';

import { isArray, isNiladic } from './options.js';

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
  private readonly positional:
    | {
        key: keyof T;
        option: ParamOption;
      }
    | undefined;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The option definitions
   */
  constructor(private readonly options: T) {
    for (const key in this.options) {
      const option = this.options[key];
      this.checkNames(key, option);
      if (!isNiladic(option)) {
        if (option.positional) {
          if (this.positional) {
            throw Error(`Duplicate positional option '${key}'.`);
          }
          this.positional = { key, option };
        }
        if (isArray(option) && !option.separator && !option.multivalued) {
          throw Error(`Option '${key}' should either be multivalued or have a separator.`);
        }
        this.checkEnums(key, option);
        this.checkValue(key, option, 'default');
        this.checkValue(key, option, 'example');
      }
      if (option.requires) {
        this.checkRequires(key, option.requires);
      }
    }
  }

  /**
   * Checks the sanity of the option names.
   * @param key The option key
   * @param option The option definition
   */
  private checkNames(key: string, option: Option) {
    const names = option.names.filter((name) => name);
    if (!names.length) {
      throw Error(`Option '${key}' has no name.`);
    }
    for (const name of names) {
      if (name.match(/[=\s]/)) {
        throw Error(`Invalid option name '${name}'.`);
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
  private checkEnums(key: string, option: ParamOption) {
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
  private checkValue(key: string, option: ParamOption, prop: 'default' | 'example') {
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
  private checkRequires(key: string, requires: Requires) {
    if (typeof requires === 'string') {
      this.checkRequired(key, requires);
    } else {
      for (const item of requires.items) {
        this.checkRequires(key, item);
      }
    }
  }

  /**
   * Checks the sanity of an option requirement.
   * @param key The option key
   * @param required The requirement specification
   */
  private checkRequired(key: string, required: string) {
    const [requiredKey, requiredValue] = required.split(/=(.*)/, 2);
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
  async asyncParse(args = process.argv.slice(2)): Promise<OptionValues<T>> {
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
   * Reset option values to false, undefined or the default value.
   * @param values The options' values
   */
  private resetValues(values: OptionValues<T>) {
    for (const key in this.options) {
      const option = this.options[key];
      if (option.type === 'boolean') {
        (values as Record<string, false>)[key] = false;
      } else if ('default' in option && option.default) {
        (values as Record<string, typeof option.default>)[key] = option.default;
      } else if (option.type !== 'function') {
        (values as Record<string, undefined>)[key] = undefined;
      }
    }
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
    const multi: {
      key?: keyof T;
      name?: string;
      option?: ArrayOption;
    } = {};
    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      const [name, value] = arg.split(/=(.*)/, 2);
      const key = this.nameToKey.get(name);
      if (!key) {
        if (multi.key) {
          this.parseValue(values, multi.key, multi.option!, multi.name!, value ?? arg);
          continue;
        }
        if (this.positional) {
          const { key, option } = this.positional;
          specifiedKeys.add(key);
          const preferredName = option.preferredName ?? option.names.find((name) => name)!;
          for (const arg of args.slice(i)) {
            this.parseValue(values, key, option, preferredName, arg);
          }
          break;
        }
        throw Error(`Unknown option '${name}'.`);
      }
      delete multi.key;
      const option = this.options[key];
      if (isNiladic(option)) {
        if (value !== undefined) {
          throw Error(`Option '${name}' does not accept any value.`);
        }
        if (option.type === 'boolean') {
          (values as Record<string, true>)[key as string] = true;
        } else {
          if (option.break) {
            specifiedKeys.add(key);
            this.checkAllRequires(values, specifiedKeys);
          }
          const result = option.exec(values, args.slice(i + 1));
          if (typeof result === 'object') {
            promises.push(result);
          }
          if (option.break) {
            return Promise.all(promises);
          }
        }
      } else {
        if (isArray(option) && !(option.append && specifiedKeys.has(key))) {
          (values as Record<string, []>)[key as string] = [];
        }
        if (value !== undefined) {
          this.parseValue(values, key, option, name, value);
        } else if ('multivalued' in option && option.multivalued) {
          multi.key = key;
          multi.name = name;
          multi.option = option;
        } else {
          if (i + 1 == args.length) {
            throw Error(`Missing parameter to '${name}'.`);
          }
          this.parseValue(values, key, option, name, args[++i]);
        }
      }
      specifiedKeys.add(key);
    }
    this.checkAllRequires(values, specifiedKeys);
    return Promise.all(promises);
  }

  /**
   * Checks the requirements of the options that were specified.
   * @param values The options' values
   * @param keys The set of specified option keys
   */
  private checkAllRequires(values: OptionValues<T>, keys: Set<keyof T>) {
    for (const key of keys) {
      const option = this.options[key];
      if (option.requires) {
        const preferredName = option.preferredName ?? option.names.find((name) => name)!;
        const error = this.checkOneRequires(values, option.requires, preferredName, keys);
        if (error) {
          throw Error(`Option '${preferredName}' requires ${error}.`);
        }
      }
    }
  }

  /**
   * Checks the requirements of single option that was specified.
   * @param values The options' values
   * @param requires The option requirements
   * @param name The option name
   * @param keys The set of specified option keys
   * @returns An error reason or null if no error
   */
  private checkOneRequires(
    values: OptionValues<T>,
    requires: Requires,
    name: string,
    keys: Set<keyof T>,
  ): string | null {
    if (typeof requires === 'string') {
      return this.checkOneRequired(values, requires, name, keys);
    }
    if (requires.op === 'and') {
      for (const item of requires.items) {
        const error = this.checkOneRequires(values, item, name, keys);
        if (error) {
          return error;
        }
      }
      return null;
    }
    const errors = new Set<string>();
    for (const item of requires.items) {
      const error = this.checkOneRequires(values, item, name, keys);
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
   * @param required The required option
   * @param name The option name
   * @param keys The set of specified option keys
   * @returns An error reason or null if no error
   */
  private checkOneRequired(
    values: OptionValues<T>,
    required: string,
    name: string,
    keys: Set<keyof T>,
  ): string | null {
    const [requiredKey, requiredValue] = required.split(/=(.*)/, 2);
    const requiredOpt = this.options[requiredKey];
    const requiredNames = requiredOpt.names.filter((name) => name);
    const preferredName = requiredOpt.preferredName ?? requiredNames[0];
    let error = `'${preferredName}'`;
    if (requiredOpt.type === 'function') {
      return requiredNames.find((name) => keys.has(name)) ? null : error;
    }
    const actualValue = values[requiredKey as keyof OptionValues<T>];
    if (actualValue === undefined || actualValue === false) {
      return error;
    }
    if (requiredOpt.type !== 'boolean' && requiredValue !== undefined) {
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
      case 'string': {
        (values as Record<string, string>)[key as string] = this.parseString(option, name, value);
        break;
      }
      case 'number': {
        (values as Record<string, number>)[key as string] = this.parseNumber(option, name, value);
        break;
      }
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
    if (option.append || option.multivalued) {
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

  /**
   * Parses the value of a string option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseString(option: StringOption | StringsOption, name: string, value: string): string {
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
   * Parses the value of a number option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumber(option: NumberOption | NumbersOption, name: string, value: string): number {
    const val = Number(value);
    if ('enums' in option && option.enums && !option.enums.includes(val)) {
      throw Error(
        `Invalid parameter to '${name}': ${value}. Possible values are [${option.enums}].`,
      );
    }
    if ('range' in option && option.range && (val < option.range[0] || val > option.range[1])) {
      throw Error(
        `Invalid parameter to '${name}': ${value}. Value must be in the range [${option.range}].`,
      );
    }
    return val;
  }

  /**
   * Parses the value of a strings option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseStrings(option: StringsOption, name: string, value: string): Array<string> {
    if ('separator' in option && option.separator) {
      return value.split(option.separator).map((val) => this.parseString(option, name, val));
    }
    return [value];
  }

  /**
   * Parses the value of a numbers option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumbers(option: NumbersOption, name: string, value: string): Array<number> {
    if ('separator' in option && option.separator) {
      return value.split(option.separator).map((val) => this.parseNumber(option, name, val));
    }
    return [Number(value)];
  }
}
