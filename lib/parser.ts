//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  MonadicOption,
  NumberOption,
  NumbersOption,
  Option,
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
  private readonly nameToKey = new Map<string, keyof T>();

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The predefined options
   */
  constructor(private readonly options: T) {
    this.initialize();
  }

  /**
   * Initializes the parser internal state.
   */
  private initialize() {
    for (const key in this.options) {
      const option = this.options[key];
      const names = option.names.filter((name) => name);
      if (names.length == 0) {
        throw Error(`Option '${key}' has no valid name.`);
      }
      for (const name of names) {
        if (this.nameToKey.has(name)) {
          throw Error(`Duplicate option name '${name}'.`);
        }
        this.nameToKey.set(name, key);
      }
      const requiredKeys = [
        ...('requiresAll' in option ? option.requiresAll ?? [] : []),
        ...('requiresOne' in option ? option.requiresOne ?? [] : []),
      ];
      for (const requiredKey of requiredKeys) {
        if (requiredKey === key) {
          throw Error(`Option '${key}' requires itself.`);
        }
        if (!(requiredKey in this.options)) {
          throw Error(`Unknown required option '${requiredKey}'.`);
        }
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
        const name = opt.names.find((name) => name)!;
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
        const name = opt.names.find((name) => name)!;
        result.push(name, opt.default.toString());
      }
    }
    return result;
  }

  /**
   * @see parseInto
   */
  private internalParseInto(values: OptionValues<T>, args: Array<string>) {
    for (let i = 0; i < args.length; ++i) {
      const name = args[i];
      const key = this.nameToKey.get(name);
      if (!key) {
        throw Error(`Unknown option '${name}'.`);
      }
      const option = this.options[key];
      this.checkRequired(name, option, args);
      switch (option.type) {
        case 'function':
          if (option.default) {
            const result = option.default(values, args.slice(i + 1));
            if (result === null) {
              return; // requirements cannot be verified when exiting early
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
          this.parseValue(values, key, option, name, args[++i]);
      }
    }
  }

  /**
   * Checks if the options required by an option were specified.
   * @param name The option
   * @param option The option name
   * @param args The command-line arguments
   */
  private checkRequired(name: string, option: Option, args: Array<string>) {
    if ('requiresAll' in option && option.requiresAll) {
      for (const requiredKey of option.requiresAll) {
        const required = this.options[requiredKey];
        const names = required.names.filter((name) => name);
        if (names.find((name) => args.includes(name)) === undefined) {
          throw Error(`Option '${name}' requires option '${names[0]}'.`);
        }
      }
    }
    if ('requiresOne' in option && option.requiresOne) {
      let found = false;
      const requiredNames = [];
      for (const requiredKey of option.requiresOne) {
        const required = this.options[requiredKey];
        const names = required.names.filter((name) => name);
        if (names.find((name) => args.includes(name)) !== undefined) {
          found = true;
          break;
        } else {
          requiredNames.push(names[0]);
        }
      }
      if (!found) {
        throw Error(`Option '${name}' requires one of [${requiredNames}].`);
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
      const option = this.options[key];
      this.checkRequired(name, option, args);
      switch (option.type) {
        case 'function':
          if (option.default) {
            const result = option.default(values, args.slice(i + 1));
            if (result === null || (typeof result === 'object' && (await result) === null)) {
              return; // requirements cannot be verified when exiting early
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
          this.parseValue(values, key, option, name, args[++i]);
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
