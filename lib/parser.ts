//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  MonadicOption,
  NumberOption,
  NumbersOption,
  Options,
  OptionValues,
  StringOption,
  StringsOption,
} from './options.js';

import { setValue } from './options.js';

export { ArgumentParser };

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements parsing of command-line arguments into option values.
 * @template T The type of the options' definitions
 */
class ArgumentParser<T extends Options> {
  private nameToKey = new Map<string, keyof T>();
  private options: T;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The predefined options
   */
  constructor(options: T) {
    this.options = options;
    this.initializeKeyMap();
  }

  /**
   * Initializes the map of options names to option keys
   */
  private initializeKeyMap() {
    for (const key in this.options) {
      let hasName = false;
      for (const name of this.options[key].names) {
        if (name.length == 0) {
          continue; // ignore empty names
        }
        if (this.nameToKey.has(name)) {
          throw Error(`Duplicate option name '${name}'.`);
        }
        this.nameToKey.set(name, key);
        hasName = true;
      }
      if (!hasName) {
        throw Error(`Option '${key}' has no name.`);
      }
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
    this.internalParseInto(values, args);
  }

  /**
   * Reset option values to either false or undefined.
   * @param values The options' values
   */
  private resetValues(values: OptionValues<T>) {
    for (const key in this.options) {
      const opt = this.options[key];
      if (opt.type === 'boolean') {
        setValue(values, key, false);
      } else if (opt.type !== 'function') {
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
      const opt = this.options[key];
      if ('example' in opt) {
        const name = opt.names.find((name) => name.length > 0)!;
        result.push(name, opt.example.toString());
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
      const opt = this.options[key];
      if (opt.type !== 'function' && 'default' in opt) {
        const name = opt.names.find((name) => name.length > 0)!;
        result.push(name, opt.default.toString());
      }
    }
    return result;
  }

  private internalParseInto(values: OptionValues<T>, args: Array<string>) {
    for (let i = 0; i < args.length; ++i) {
      const name = args[i];
      const key = this.nameToKey.get(name);
      if (!key) {
        throw Error(`Unknown option '${name}'.`);
      }
      const opt = this.options[key];
      switch (opt.type) {
        case 'function':
          if (opt.default) {
            const result = opt.default(values, args.slice(i + 1));
            if (result === null) {
              return;
            } else if (typeof result === 'object') {
              throw Error('Use `asyncParse` to handle async functions.');
            }
          }
          break;
        case 'boolean':
          setValue(values, key, true);
          break;
        default:
          if (i + 1 == args.length) {
            throw Error(`Missing parameter to '${name}'.`);
          }
          this.parseValue(values, key, opt, name, args[++i]);
      }
    }
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
    await this.asyncInternalParseInto(values, args);
  }

  /**
   * Async version
   * @see internalParseInto
   */
  private async asyncInternalParseInto(values: OptionValues<T>, args: Array<string>) {
    for (let i = 0; i < args.length; ++i) {
      const name = args[i];
      const key = this.nameToKey.get(name);
      if (!key) {
        throw Error(`Unknown option '${name}'.`);
      }
      const opt = this.options[key];
      switch (opt.type) {
        case 'function':
          if (opt.default) {
            const result = opt.default(values, args.slice(i + 1));
            if (result === null || (typeof result === 'object' && (await result) === null)) {
              return;
            }
          }
          break;
        case 'boolean':
          setValue(values, key, true);
          break;
        default:
          if (i + 1 == args.length) {
            throw Error(`Missing parameter to '${name}'.`);
          }
          this.parseValue(values, key, opt, name, args[++i]);
      }
    }
  }

  /**
   * Parses the value of a monadic option.
   * @param values The options' values to parse into
   * @param key The option key
   * @param opt The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseValue(
    values: OptionValues<T>,
    key: keyof T,
    opt: MonadicOption,
    name: string,
    value: string,
  ) {
    switch (opt.type) {
      case 'string':
        setValue(values, key, this.parseString(opt, name, value));
        break;
      case 'number':
        setValue(values, key, this.parseNumber(opt, name, value));
        break;
      case 'strings':
        setValue(values, key, this.parseStrings(opt, name, value));
        break;
      case 'numbers':
        setValue(values, key, this.parseNumbers(opt, name, value));
        break;
      default: {
        const _exhaustiveCheck: never = opt;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Parses the value of a string option.
   * @param opt The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseString(opt: StringOption | StringsOption, name: string, value: string): string {
    if ('enums' in opt && opt.enums && !opt.enums.includes(value)) {
      throw Error(`Invalid parameter to '${name}': ${value}. Possible values are [${opt.enums}].`);
    }
    if ('regex' in opt && opt.regex && !opt.regex.test(value)) {
      throw Error(
        `Invalid parameter to '${name}': ${value}. ` +
          `Value must match the regex ${String(opt.regex)}.`,
      );
    }
    return value;
  }

  /**
   * Parses the value of a number option.
   * @param opt The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumber(opt: NumberOption | NumbersOption, name: string, value: string): number {
    const val = Number(value);
    if ('enums' in opt && opt.enums && !opt.enums.includes(val)) {
      throw Error(`Invalid parameter to '${name}': ${value}. Possible values are [${opt.enums}].`);
    }
    if ('range' in opt && opt.range && (val < opt.range[0] || val > opt.range[1])) {
      throw Error(
        `Invalid parameter to '${name}': ${value}. Value must be in the range [${opt.range}].`,
      );
    }
    return val;
  }

  /**
   * Parses the value of a strings option.
   * @param opt The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseStrings(opt: StringsOption, name: string, value: string): Array<string> {
    return value.trim().length > 0
      ? value.split(',').map((val) => this.parseString(opt, name, val.trim()))
      : [];
  }

  /**
   * Parses the value of a numbers option.
   * @param opt The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumbers(opt: NumbersOption, name: string, value: string): Array<number> {
    return value.trim().length > 0
      ? value.split(',').map((val) => this.parseNumber(opt, name, val.trim()))
      : [];
  }
}
