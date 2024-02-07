//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  ArrayOption,
  ParamsOption,
  NumberOption,
  NumbersOption,
  Options,
  OptionValues,
  Requires,
  StringOption,
  StringsOption,
} from './options.js';

import { appendValue, isNiladic, setValue } from './options.js';

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
  private readonly positionalKey: string | undefined;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The predefined options
   */
  constructor(private readonly options: T) {
    for (const key in this.options) {
      const option = this.options[key];
      if (option.type === 'positional') {
        if (this.positionalKey) {
          throw Error(`Duplicate positional option '${key}'.`);
        }
        this.positionalKey = key;
        continue;
      }
      this.checkNames(key, option.names);
      if ('enums' in option && option.enums) {
        this.checkEnums(key, option.enums);
      }
      if (option.requires) {
        this.checkRequires(key, option.requires);
      }
    }
  }

  /**
   * Checks the sanity of the option names.
   * @param key The option key
   * @param names The option names
   */
  private checkNames(key: string, names: Array<string>) {
    names = names.filter((name) => name);
    if (names.length == 0) {
      throw Error(`Option '${key}' has no valid name.`);
    }
    for (const name of names) {
      if (this.nameToKey.has(name)) {
        throw Error(`Duplicate option name '${name}'.`);
      }
      this.nameToKey.set(name, key);
    }
  }

  /**
   * Checks the sanity of the option enumerations.
   * @param key The option key
   * @param enums The option enumerations
   */
  private checkEnums(key: string, enums: Array<string | number>) {
    if (enums.length == 0) {
      throw Error(`Option '${key}' has zero enum values.`);
    }
    const set = new Set(enums);
    if (set.size !== enums.length) {
      for (const value of enums) {
        if (!set.delete(value)) {
          throw Error(`Option '${key}' has duplicate enum '${value}'.`);
        }
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
   * @param requires The required option
   */
  private checkRequired(key: string, required: string) {
    const [requiredKey, requiredValue] = required.split(/=(.*)/, 2);
    if (requiredKey === key) {
      throw Error(`Option '${key}' requires itself.`);
    }
    if (!(requiredKey in this.options)) {
      throw Error(`Unknown required option '${requiredKey}'.`);
    }
    if (requiredValue && isNiladic(this.options[requiredKey])) {
      throw Error(`Required option '${requiredKey}' does not accept values.`);
    }
  }

  /**
   * Convenience method to parse command-line arguments into option values.
   * @param args The command-line arguments
   */
  parse(args = process.argv.slice(2)): OptionValues<T> {
    const result = {} as OptionValues<T>;
    this.parseInto(result, args);
    return result;
  }

  /**
   * Parses command-line arguments into option values.
   * @param values The options' values to parse into
   * @param args The command-line arguments
   */
  parseInto(values: OptionValues<T>, args = process.argv.slice(2)) {
    this.internalParseInto(values, this.getExampleArgs());
    this.resetValues(values);
    this.internalParseInto(values, this.getDefaultArgs());
    const required = this.internalParseInto(values, args);
    this.checkAllRequired(values, args, required);
  }

  /**
   * Reset option values to either false or undefined.
   * @param values The options' values
   */
  private resetValues(values: OptionValues<T>) {
    for (const key in this.options) {
      const option = this.options[key];
      if (option.type === 'boolean') {
        setValue(values, key, false);
      } else if (option.type !== 'function') {
        setValue(values, key, undefined);
      }
    }
  }

  /**
   * @returns A list of arguments that can be used to set option values to their example value.
   */
  private getExampleArgs(): Array<string> {
    const result = new Array<string>();
    for (const key in this.options) {
      const option = this.options[key];
      if ('example' in option) {
        const name = option.names.find((name) => name)!;
        result.push(name, option.example.toString());
      }
    }
    return result;
  }

  /**
   * @returns A list of arguments that can be used to set option values to their default value.
   */
  private getDefaultArgs(): Array<string> {
    const result = new Array<string>();
    for (const key in this.options) {
      const option = this.options[key];
      if (option.type !== 'function' && 'default' in option) {
        const name = option.names.find((name) => name)!;
        result.push(name, option.default.toString());
      }
    }
    return result;
  }

  /**
   * @see parseInto
   */
  private internalParseInto(values: OptionValues<T>, args: Array<string>): Set<keyof T> {
    const required = new Set<keyof T>();
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
        if (this.positionalKey) {
          setValue(values, this.positionalKey, args.slice(i));
          return required;
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
          setValue(values, key, true);
        } else if (option.default) {
          const result = option.default(values, args.slice(i + 1));
          if (result === null) {
            return required;
          } else if (typeof result === 'object') {
            throw Error('Use `asyncParse` to handle async functions.');
          }
        }
      } else if ('multi' in option && option.multi) {
        multi.key = key;
        multi.name = name;
        multi.option = option;
        if (!('append' in option) || !option.append) {
          setValue(values, key, []);
        }
      } else {
        if (value === undefined && i + 1 == args.length) {
          throw Error(`Missing parameter to '${name}'.`);
        }
        assert(option.type !== 'positional');
        this.parseValue(values, key, option, name, value ?? args[++i]);
      }
      if (option.requires) {
        required.add(key);
      }
    }
    return required;
  }

  private checkAllRequired(values: OptionValues<T>, args: Array<string>, required: Set<keyof T>) {
    for (const key of required) {
      const option = this.options[key];
      assert(option.type !== 'positional');
      const name = option.names.find((name) => name)!;
      const error = this.checkOneRequires(values, option.requires!, name, args);
      if (error) {
        throw Error(`Option '${name}' requires ${error}.`);
      }
    }
  }

  private checkOneRequires(
    values: OptionValues<T>,
    requires: Requires,
    name: string,
    args: Array<string>,
  ): string | null {
    if (typeof requires === 'string') {
      return this.checkOneRequired(values, requires, name, args);
    }
    if (requires.op === 'and') {
      for (const item of requires.items) {
        const error = this.checkOneRequires(values, item, name, args);
        if (error) {
          return error;
        }
      }
      return null;
    }
    const errors = new Set<string>();
    for (const item of requires.items) {
      const error = this.checkOneRequires(values, item, name, args);
      if (!error) {
        return null;
      }
      errors.add(error);
    }
    return [...errors].join(' or ');
  }

  private checkOneRequired(
    values: OptionValues<T>,
    required: string,
    name: string,
    args: Array<string>,
  ): string | null {
    const [requiredKey, requiredValue] = required.split(/=(.*)/, 2);
    const requiredOpt = this.options[requiredKey];
    assert(requiredOpt.type !== 'positional');
    const requiredNames = requiredOpt.names.filter((name) => name);
    if (requiredOpt.type === 'function') {
      return requiredNames.find((name) => args.includes(name)) ? null : requiredNames[0];
    }
    const actualValue = values[requiredKey as keyof OptionValues<T>];
    if (actualValue === undefined || actualValue === false) {
      return requiredNames[0];
    }
    if (requiredOpt.type !== 'boolean' && requiredValue !== undefined) {
      const test = {} as OptionValues<T>;
      this.parseValue(test, requiredKey, requiredOpt, name, requiredValue);
      const testValue = test[requiredKey as keyof OptionValues<T>]!;
      if (actualValue.toString() !== testValue.toString()) {
        return `${requiredNames[0]}='${testValue}' (was '${actualValue}')`;
      }
    }
    return null;
  }

  /**
   * Parses the value of a monadic option.
   * @param values The options' values to parse into
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseValue(
    values: OptionValues<T>,
    key: keyof T,
    option: ParamsOption,
    name: string,
    value: string,
  ) {
    switch (option.type) {
      case 'string':
        setValue(values, key, this.parseString(option, name, value));
        break;
      case 'number':
        setValue(values, key, this.parseNumber(option, name, value));
        break;
      case 'strings':
        if (('append' in option && option.append) || ('multi' in option && option.multi)) {
          appendValue(values, key, this.parseStrings(option, name, value));
        } else {
          setValue(values, key, this.parseStrings(option, name, value));
        }
        break;
      case 'numbers':
        if (('append' in option && option.append) || ('multi' in option && option.multi)) {
          appendValue(values, key, this.parseNumbers(option, name, value));
        } else {
          setValue(values, key, this.parseNumbers(option, name, value));
        }
        break;
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Parses the value of a string option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseString(option: StringOption | StringsOption, name: string, value: string): string {
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
    return value.trim().length > 0
      ? value.split(',').map((val) => this.parseString(option, name, val.trim()))
      : [];
  }

  /**
   * Parses the value of a numbers option.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumbers(option: NumbersOption, name: string, value: string): Array<number> {
    return value.trim().length > 0
      ? value.split(',').map((val) => this.parseNumber(option, name, val.trim()))
      : [];
  }

  /**
   * Async version
   * @see parse
   */
  async asyncParse(args = process.argv.slice(2)): Promise<OptionValues<T>> {
    const result = {} as OptionValues<T>;
    await this.asyncParseInto(result, args);
    return result;
  }

  /**
   * Async version
   * @see parseInto
   */
  async asyncParseInto(values: OptionValues<T>, args = process.argv.slice(2)) {
    this.parseInto(values, []);
    const required = await this.asyncInternalParseInto(values, args);
    this.checkAllRequired(values, args, required);
  }

  /**
   * Async version
   * @see internalParseInto
   */
  private async asyncInternalParseInto(
    values: OptionValues<T>,
    args: Array<string>,
  ): Promise<Set<keyof T>> {
    const required = new Set<keyof T>();
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
        if (this.positionalKey) {
          setValue(values, this.positionalKey, args.slice(i));
          return required;
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
          setValue(values, key, true);
        } else if (option.default) {
          const result = option.default(values, args.slice(i + 1));
          if (result === null || (typeof result === 'object' && (await result) === null)) {
            return required;
          }
        }
      } else if ('multi' in option && option.multi) {
        multi.key = key;
        multi.name = name;
        multi.option = option;
        if (!('append' in option) || !option.append) {
          setValue(values, key, []);
        }
      } else {
        if (value === undefined && i + 1 == args.length) {
          throw Error(`Missing parameter to '${name}'.`);
        }
        assert(option.type !== 'positional');
        this.parseValue(values, key, option, name, value ?? args[++i]);
      }
      if (option.requires) {
        required.add(key);
      }
    }
    return required;
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
function assert(condition: unknown): asserts condition {}
