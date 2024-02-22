//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  Positional,
  ParamOption,
  Options,
  OptionValues,
  Requires,
  HelpOption,
  VersionOption,
  RequiresVal,
  ValuedOption,
  SpecialOption,
  FunctionOption,
  NiladicOption,
  CompletionCallback,
  OtherStyles,
  ArrayOption,
  SingleOption,
} from './options';

import { HelpFormatter } from './formatter';
import {
  OptionRegistry,
  RequiresAll,
  RequiresNot,
  RequiresOne,
  isArray,
  isMultivalued,
  isNiladic,
  isValued,
} from './options';
import { sgr } from './styles';

export { ArgumentParser, type ParseConfig };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * The parse configuration.
 */
type ParseConfig = {
  /**
   * The desired console width (to print the help message).
   */
  width?: number;
  /**
   * The completion index (only applicable to raw command lines).
   */
  compIndex?: number;
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements parsing of command-line arguments into option values.
 * @template T The type of the options' definitions
 */
class ArgumentParser<T extends Options> {
  private readonly registry: OptionRegistry;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The option definitions
   * @param styles The error message styles
   */
  constructor(options: T, styles?: OtherStyles) {
    this.registry = new OptionRegistry(options, styles);
  }

  /**
   * Validates the options' definitions
   * @returns The parser instance
   */
  validate(): this {
    this.registry.validate();
    return this;
  }

  /**
   * Convenience method to parse command-line arguments into option values.
   * @param command The command line or command-line arguments
   * @param config The parse configuration
   * @returns The option values
   */
  parse(command?: string | Array<string>, config?: ParseConfig): OptionValues<T> {
    const result = this.createValues();
    this.parseInto(result, command, config);
    return result;
  }

  /**
   * Create option values initialized with undefined.
   * @returns The option values
   */
  private createValues(): OptionValues<T> {
    const result = {} as OptionValues<T>;
    for (const key in this.registry.options) {
      if (isValued(this.registry.options[key])) {
        (result as Record<string, undefined>)[key] = undefined;
      }
    }
    return result;
  }

  /**
   * Async version
   * @returns A promise that resolves to the option values
   * @see parse
   */
  async parseAsync(
    command?: string | Array<string>,
    config?: ParseConfig,
  ): Promise<OptionValues<T>> {
    const result = this.createValues();
    await this.parseInto(result, command, config);
    return result;
  }

  /**
   * Parses command-line arguments into option values.
   * @param values The options' values to parse into
   * @param command The command line or command-line arguments
   * @param config The parse configuration
   * @returns A promise that can be awaited in order to await any async callbacks
   */
  parseInto(
    values: OptionValues<T>,
    command: string | Array<string> = process.env['COMP_LINE'] ?? process.argv.slice(2),
    config: ParseConfig = { compIndex: Number(process.env['COMP_POINT']) },
  ): Promise<Array<void>> {
    const args =
      typeof command === 'string' ? getArgs(command, config.compIndex).slice(1) : command;
    return new ParserLoop(this.registry, values, args, config).loop();
  }
}

/**
 * Implements the parsing loop.
 */
class ParserLoop {
  private readonly promises = new Array<Promise<void>>();
  private readonly specifiedKeys = new Set<string>();
  private readonly completing: boolean;
  private readonly width?: number;

  /**
   * Constructs a parser loop.
   * @param registry The option registry
   * @param values The option values
   * @param args The command-line arguments
   * @param config The parse configuration
   */
  constructor(
    private readonly registry: OptionRegistry,
    private readonly values: OptionValues,
    private readonly args: Array<string>,
    config: ParseConfig,
  ) {
    this.completing = config.compIndex !== undefined && config.compIndex >= 0;
    this.width = config.width;
  }

  /**
   * Loops through the command-line arguments.
   * @returns A promise that can be awaited in order to await any async callbacks
   */
  loop(): Promise<Array<void>> {
    function assert(_condition: unknown): asserts _condition {}

    let inline = false;
    let marker = false;
    let addKey = false;
    let singleParam = false;
    let value: string | undefined;
    let current: OptionRegistry['positional'];

    for (let i = 0; i < this.args.length; ++i) {
      const [arg, comp] = this.args[i].split('\0', 2);
      if (marker || singleParam) {
        value = arg;
        [addKey, inline] = [false, false];
      } else {
        const result = this.parseOption(arg, i, comp, current);
        [addKey, marker, inline, current, value] = result;
        if (addKey) {
          this.specifiedKeys.add(current.key);
        }
      }
      assert(current);
      const { key, name, option } = current;
      if (isNiladic(option)) {
        if (comp !== undefined) {
          throw ''; // use default completion (value !== undefined)
        } else if (!this.completing && value !== undefined) {
          throw this.registry.error(
            `Option ${this.registry.formatOption(name)} does not accept inline values.`,
          );
        } else if (this.handleNiladic(key, option, name, i)) {
          return Promise.all(this.promises);
        }
        current = undefined;
      } else if (comp !== undefined) {
        if (this.handleCompletion(option, i, value)) {
          return Promise.all(this.promises);
        }
        if (!inline && !marker && (addKey || (isArray(option) && isMultivalued(option)))) {
          this.handleNameCompletion(value);
        }
        throw ''; // use default completion
      } else {
        if (addKey) {
          this.resetValue(key, option);
        }
        if (value !== undefined) {
          try {
            this.parseValue(key, option, name, value);
          } catch (err) {
            // do not propagate errors during completion
            if (!this.completing) {
              if (!inline && !marker && isArray(option) && isMultivalued(option)) {
                const error = err as Error;
                error.message += `\nDid you mean to specify an option name instead of ${this.registry.formatOption(value)}?`;
                this.handleUnknown(value, error);
              }
              throw err;
            }
          }
          if (singleParam) {
            singleParam = false;
            current = undefined;
          }
        } else if (marker || (isArray(option) && isMultivalued(option))) {
          continue;
        } else if (i + 1 == this.args.length) {
          throw this.registry.error(`Missing parameter to ${this.registry.formatOption(name)}.`);
        } else {
          singleParam = true;
        }
      }
    }
    this.checkRequired();
    this.setDefaultValues();
    return Promise.all(this.promises);
  }

  /**
   * Parses an option from a command-line argument.
   * @param arg The current argument
   * @param index The current argument index
   * @param comp Undefined if not completing at the current iteration
   * @param current The current option information
   * @returns A tuple of [addKey, marker, inline, current, value]
   */
  private parseOption(
    arg: string,
    index: number,
    comp?: string,
    current?: Positional,
  ): [boolean, boolean, boolean, Positional, string | undefined] {
    const [name, value] = arg.split(/=(.*)/, 2);
    const key = this.registry.names.get(name);
    if (key) {
      if (comp !== undefined && value === undefined) {
        throw name;
      }
      if (this.registry.positional && name === this.registry.positional.marker) {
        if (comp !== undefined) {
          throw ''; // use default completion
        }
        if (value !== undefined) {
          throw this.registry.error(
            `Positional marker ${this.registry.formatOption(name)} does not accept inline values.`,
          );
        }
        if (
          index + 1 == this.args.length &&
          (!isArray(this.registry.positional.option) ||
            !isMultivalued(this.registry.positional.option))
        ) {
          throw this.registry.error(
            `Missing parameter after positional marker ${this.registry.formatOption(name)}.`,
          );
        }
        return [true, true, false, this.registry.positional, undefined];
      }
      current = { key, name, option: this.registry.options[key] };
      return [true, false, true, current, value];
    }
    if (!current) {
      if (!this.registry.positional) {
        if (comp !== undefined) {
          this.handleNameCompletion(arg);
        }
        this.handleUnknown(name);
      }
      return [true, false, false, this.registry.positional, arg];
    }
    return [false, false, false, current, arg];
  }

  /**
   * Handles a niladic option.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified in the command-line)
   * @param index The current argument index
   * @returns True if the parsing loop should be broken
   */
  private handleNiladic(key: string, option: NiladicOption, name: string, index: number): boolean {
    if (option.type === 'flag') {
      (this.values as Record<string, boolean>)[key] = !option.negationNames?.includes(name);
      return false;
    }
    if (option.type === 'function') {
      return this.handleFunction(option, index);
    }
    if (this.completing) {
      return false; // skip special options during completion
    }
    this.handleSpecial(option);
    return true;
  }

  /**
   * Handles a function option.
   * @param option The option definition
   * @param index The current argument index
   * @returns True if the parsing loop should be broken
   */
  private handleFunction(option: FunctionOption, index: number): boolean {
    if (option.break && !this.completing) {
      this.checkRequired();
    }
    try {
      const result = option.exec(this.values, this.args.slice(index + 1), this.completing);
      if (typeof result === 'object') {
        this.promises.push(result);
      }
    } catch (err) {
      // do not propagate errors during completion
      if (!this.completing) {
        throw err;
      }
    }
    return option.break === true;
  }

  /**
   * Handles a special option.
   * @param option The option definition
   */
  private handleSpecial(option: SpecialOption) {
    this.checkRequired();
    if (option.type === 'help') {
      this.handleHelp(option);
    } else if (option.version) {
      throw option.version;
    }
    this.promises.push(resolveVersion(option));
  }

  /**
   * Handles the completion of an option with a parameter.
   * @param option The option definition
   * @param index The current argument index
   * @param param The option parameter
   * @returns True if the parsing loop should be broken
   */
  private handleCompletion(option: ParamOption, index: number, param?: string): boolean {
    if (option.complete) {
      this.handleComplete(option.complete, index, param);
      return true;
    }
    let words =
      option.type === 'boolean'
        ? ['true', 'false']
        : 'enums' in option && option.enums
          ? option.enums.map((val) => val.toString())
          : [];
    if (words.length && param) {
      words = words.filter((word) => word.startsWith(param));
    }
    if (words.length) {
      throw words.join('\n');
    }
    return false;
  }

  /**
   * Handles the completion of an option that has a completion callback.
   * @param complete The completion callback
   * @param index The current argument index
   * @param param The option parameter
   */
  private handleComplete(complete: CompletionCallback, index: number, param: string = '') {
    let result;
    try {
      result = complete(this.values, [param, ...this.args.slice(index + 1)]);
    } catch (err) {
      // do not propagate errors during completion
      console.error(err);
      throw '';
    }
    if (Array.isArray(result)) {
      throw result.join('\n');
    }
    const promise = result.then(
      (words) => {
        throw words.join('\n');
      },
      (err) => {
        // do not propagate errors during completion
        console.error(err);
        throw '';
      },
    );
    this.promises.push(promise);
  }

  /**
   * Handles an unknown option.
   * @param name The unknown option name
   * @param error The previous error, if any
   */
  private handleUnknown(name: string, error?: Error): never {
    if (!error) {
      error = this.registry.error(`Unknown option ${this.registry.formatOption(name)}.`);
    }
    const similar = this.findSimilarNames(name);
    if (similar.length) {
      const optNames = similar.map((str) => this.registry.formatOption(str));
      error.message += `\nSimilar names are: ${optNames.join(', ')}.`;
    }
    throw error;
  }

  /**
   * Handles the completion of an option name.
   * @param prefix The name prefix
   */
  private handleNameCompletion(prefix?: string): never {
    const names = [...this.registry.names.keys()];
    const prefixedNames = prefix ? names.filter((name) => name.startsWith(prefix)) : names;
    throw prefixedNames.join('\n');
  }

  /**
   * Handles the special "help" option.
   * @param option The option definition
   */
  private handleHelp(option: HelpOption): never {
    const help = option.usage ? [option.usage] : [];
    const groups = new HelpFormatter(this.registry.options, option.format).formatGroups(this.width);
    const headingStyle = option.headingStyle ?? sgr('0', '1');
    for (const [group, message] of groups.entries()) {
      const heading = group ? group + ' options' : 'Options';
      help.push(`${headingStyle}${heading}:`, message);
    }
    if (option.footer) {
      help.push(option.footer);
    }
    throw help.join('\n\n');
  }

  /**
   * Set options' values to their default value, if not set.
   */
  private setDefaultValues() {
    for (const key in this.registry.options) {
      const option = this.registry.options[key];
      if ('default' in option && !this.specifiedKeys.has(key)) {
        const value = this.getDefaultValue(key, option);
        (this.values as Record<string, typeof value>)[key] = value;
      }
    }
  }

  /**
   * Gets the normalized default value of an option.
   * @param name The option name
   * @param option The option definition
   * @returns The default value
   */
  private getDefaultValue(name: string, option: ValuedOption): ValuedOption['default'] {
    if (option.default === undefined) {
      return undefined;
    }
    switch (option.type) {
      case 'string':
        return this.registry.normalizeString(option, name, option.default);
      case 'number':
        return this.registry.normalizeNumber(option, name, option.default);
      case 'strings': {
        const vals = option.default.map((val) => this.registry.normalizeString(option, name, val));
        this.registry.normalizeArray(option, name, vals);
        return vals;
      }
      case 'numbers': {
        const vals = option.default.map((val) => this.registry.normalizeNumber(option, name, val));
        this.registry.normalizeArray(option, name, vals);
        return vals;
      }
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
  private findSimilarNames(name: string, threshold = 0.6): Array<string> {
    const searchName = name.replace(/\p{P}/gu, '').toLowerCase();
    return [...this.registry.names.keys()]
      .reduce((acc, name) => {
        const candidateName = name.replace(/\p{P}/gu, '').toLowerCase();
        const sim = gestaltPatternMatching(searchName, candidateName);
        if (sim >= threshold) {
          acc.push([name, sim]);
        }
        return acc;
      }, new Array<[string, number]>())
      .sort(([, as], [, bs]) => bs - as)
      .map(([str]) => str);
  }

  /**
   * Checks if required options were correctly specified.
   */
  private checkRequired() {
    for (const key of this.registry.required) {
      if (!this.specifiedKeys.has(key)) {
        const option = this.registry.options[key];
        const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
        throw this.registry.error(`Option ${this.registry.formatOption(name)} is required.`);
      }
    }
    for (const key of this.specifiedKeys) {
      const option = this.registry.options[key];
      if (option.requires) {
        const error = this.checkRequires(option.requires);
        if (error) {
          const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
          throw this.registry.error(
            `Option ${this.registry.formatOption(name)} requires ${error}.`,
          );
        }
      }
    }
  }

  /**
   * Checks the requirements of an option that was specified.
   * @param requires The option requirements
   * @param negate True if the requirements should be negated
   * @returns An error reason or null if no error
   */
  private checkRequires(requires: Requires, negate = false): string | null {
    if (typeof requires === 'string') {
      return this.checkRequirement(negate, requires);
    }
    if (requires instanceof RequiresNot) {
      return this.checkRequires(requires.item, !negate);
    }
    if (requires instanceof RequiresAll) {
      return negate
        ? this.checkRequiresExp(requires.items, negate)
        : this.checkRequiresExp(requires.items, negate, null);
    }
    if (requires instanceof RequiresOne) {
      return negate
        ? this.checkRequiresExp(requires.items, negate, null)
        : this.checkRequiresExp(requires.items, negate);
    }
    return negate
      ? this.checkRequiresVal(requires, negate)
      : this.checkRequiresVal(requires, negate, null);
  }

  /**
   * Checks the items of a requirement expression.
   * @param items The list of requirements
   * @param negate True if the requirement should be negated
   * @param errors If null, return on the first error; else return on the first success
   * @returns An error reason or null if no error
   */
  private checkRequiresExp(
    items: Array<Requires>,
    negate: boolean,
    errors: null | Set<string> = new Set<string>(),
  ): string | null {
    for (const item of items) {
      const error = this.checkRequires(item, negate);
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
   * Checks the entries of a map of requirements.
   * @param requires The map of option keys to required values
   * @param negate True if the requirement should be negated
   * @param errors If null, return on the first error; else return on the first success
   * @returns An error reason or null if no error
   */
  private checkRequiresVal(
    requires: RequiresVal,
    negate: boolean,
    errors: null | Set<string> = new Set<string>(),
  ): string | null {
    for (const requiredKey in requires) {
      const error = this.checkRequirement(negate, requiredKey, requires[requiredKey]);
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
   * @param negate True if the requirement should be negated
   * @param key The required option key
   * @param value The required value, if any
   * @returns An error reason or null if no error
   */
  private checkRequirement(
    negate: boolean,
    key: string,
    value?: RequiresVal[string],
  ): string | null {
    const option = this.registry.options[key];
    const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
    const specified = this.specifiedKeys.has(key);
    const required = value !== null;
    const withValue = required && value !== undefined;
    if (isNiladic(option) || !specified || !required || !withValue) {
      return specified
        ? required == negate
          ? `no ${this.registry.formatOption(name)}`
          : null
        : withValue || required != negate
          ? this.registry.formatOption(name)
          : null;
    }
    return this.checkRequiredValue(name, option, negate, key, value);
  }

  /**
   * Checks an option's required value against a specified value.
   * @param name The option name
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param key The required option key
   * @param value The required value
   * @returns An error reason or null if no error
   */
  private checkRequiredValue(
    name: string,
    option: ParamOption,
    negate: boolean,
    key: string,
    value: Exclude<ParamOption['default'], undefined>,
  ): string | null {
    function assert(_condition: unknown): asserts _condition {}
    switch (option.type) {
      case 'boolean': {
        assert(typeof value == 'boolean');
        const formatFn = this.registry.formatBoolean.bind(this.registry);
        return this.checkRequiredSingle(name, option, negate, key, value, formatFn);
      }
      case 'string': {
        assert(typeof value === 'string');
        const formatFn = this.registry.formatString.bind(this.registry);
        const normalizeFn = this.registry.normalizeString.bind(this.registry);
        return this.checkRequiredSingle(name, option, negate, key, value, formatFn, normalizeFn);
      }
      case 'number': {
        assert(typeof value === 'number');
        const formatFn = this.registry.formatNumber.bind(this.registry);
        const normalizeFn = this.registry.normalizeNumber.bind(this.registry);
        return this.checkRequiredSingle(name, option, negate, key, value, formatFn, normalizeFn);
      }
      case 'strings': {
        assert(typeof value === 'object');
        value = value as Array<string>;
        const formatFn = this.registry.formatString.bind(this.registry);
        const normalizeFn = this.registry.normalizeString.bind(this.registry);
        return this.checkRequiredArray(name, option, negate, key, value, formatFn, normalizeFn);
      }
      case 'numbers': {
        assert(typeof value === 'object');
        value = value as Array<number>;
        const formatFn = this.registry.formatNumber.bind(this.registry);
        const normalizeFn = this.registry.normalizeNumber.bind(this.registry);
        return this.checkRequiredArray(name, option, negate, key, value, formatFn, normalizeFn);
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Checks the required value of a single-parameter option against a specified value.
   * @param name The option name
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param key The required option key
   * @param value The required value
   * @param formatFn The function to convert to string
   * @param normalizeFn The function to normalize the required value
   * @returns An error reason or null if no error
   */
  private checkRequiredSingle<O extends SingleOption, T extends boolean | string | number>(
    name: string,
    option: O,
    negate: boolean,
    key: string,
    value: T,
    formatFn: (value: T) => string,
    normalizeFn?: (option: O, name: string, value: T) => T,
  ): string | null {
    const actual = (this.values as Record<string, T | Promise<T>>)[key];
    if (actual instanceof Promise) {
      return null; // ignore promises during requirement checking
    }
    const expected = normalizeFn ? normalizeFn(option, name, value) : value;
    if ((actual === expected) !== negate) {
      return null;
    }
    const optName = this.registry.formatOption(name);
    return negate ? `${optName} != ${formatFn(expected)}` : `${optName} = ${formatFn(expected)}`;
  }

  /**
   * Checks the required value of an array option against a specified value.
   * @param name The option name
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param key The required option key
   * @param value The required value
   * @param formatFn The function to convert to string
   * @param normalizeFn The function to normalize the required value
   * @returns An error reason or null if no error
   */
  private checkRequiredArray<O extends ArrayOption, T extends string | number>(
    name: string,
    option: O,
    negate: boolean,
    key: string,
    value: Array<T>,
    formatFn: (value: T) => string,
    normalizeFn: (option: O, name: string, value: T) => T,
  ): string | null {
    const actual = (this.values as Record<string, Array<T> | Promise<Array<T>>>)[key];
    if (actual instanceof Promise) {
      return null; // ignore promises during requirement checking
    }
    const expected = value.map((val) => normalizeFn(option, name, val));
    if (checkRequiredArray(actual, expected, negate, option.unique === true)) {
      return null;
    }
    const optName = this.registry.formatOption(name);
    const optVal = expected.map((val) => formatFn(val)).join(', ');
    return negate ? `${optName} != [${optVal}]` : `${optName} = [${optVal}]`;
  }

  /**
   * Resets the value of an option.
   * @param key The option key
   * @param option The option definition
   */
  private resetValue(key: string, option: ParamOption) {
    if (isArray(option)) {
      type ArrayVal =
        | Array<string>
        | Array<number>
        | Promise<Array<string>>
        | Promise<Array<number>>
        | undefined;
      const previous = (this.values as Record<string, ArrayVal>)[key];
      if (!previous) {
        (this.values as Record<string, []>)[key] = [];
      } else if (!option.append) {
        if (previous instanceof Promise) {
          const promise = previous.then((val) => {
            val.length = 0;
            return val;
          });
          (this.values as Record<string, typeof promise>)[key] = promise;
        } else {
          previous.length = 0;
        }
      }
    }
  }

  /**
   * Parses the value of an option parameter.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseValue(key: string, option: ParamOption, name: string, value: string) {
    switch (option.type) {
      case 'boolean': {
        const convertFn = (str: string) =>
          !(Number(str) == 0 || str.trim().match(/^\s*false\s*$/i));
        this.parseSingle(key, option, name, value, convertFn);
        break;
      }
      case 'string': {
        const normalizeFn = this.registry.normalizeString.bind(this.registry);
        this.parseSingle(key, option, name, value, (str) => str, normalizeFn);
        break;
      }
      case 'number': {
        const normalizeFn = this.registry.normalizeNumber.bind(this.registry);
        this.parseSingle(key, option, name, value, Number, normalizeFn);
        break;
      }
      case 'strings': {
        const normalizeFn = this.registry.normalizeString.bind(this.registry);
        this.parseArray(key, option, name, value, (str) => str, normalizeFn);
        break;
      }
      case 'numbers': {
        const normalizeFn = this.registry.normalizeNumber.bind(this.registry);
        this.parseArray(key, option, name, value, Number, normalizeFn);
        break;
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Parses the value of a single-valued option (except boolean).
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @param convertFn The function to convert from string
   * @param normalizeFn The function to normalize the value after conversion
   */
  private parseSingle<O extends SingleOption, T extends boolean | string | number>(
    key: string,
    option: O,
    name: string,
    value: string,
    convertFn: (value: string) => T,
    normalizeFn?: (option: O, name: string, value: T) => T,
  ) {
    let result: T;
    if ('parse' in option) {
      const res = option.parse(name, value);
      if (res instanceof Promise) {
        const promise = normalizeFn ? res.then((val) => normalizeFn(option, name, val as T)) : res;
        (this.values as Record<string, typeof promise>)[key] = promise;
        return;
      } else {
        result = normalizeFn ? normalizeFn(option, name, res as T) : (res as T);
      }
    } else {
      result = normalizeFn ? normalizeFn(option, name, convertFn(value)) : convertFn(value);
    }
    (this.values as Record<string, typeof result>)[key] = result;
  }

  /**
   * Parses the value of an array option.
   * @template O The type of the option
   * @template T The type of the parsed array element
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @param convertFn The function to convert from string
   * @param normalizeFn The function to normalize the value after conversion
   */
  private parseArray<O extends ArrayOption, T extends string | number>(
    key: string,
    option: O,
    name: string,
    value: string,
    convertFn: (value: string) => T,
    normalizeFn: (option: O, name: string, value: T) => T,
  ) {
    let result: Array<T>;
    const previous = (this.values as Record<string, Array<T> | Promise<Array<T>>>)[key];
    if ('parse' in option && option.parse) {
      const res = option.parse(name, value);
      if (res instanceof Promise) {
        const promise = res.then(async (val) => {
          const prev = await previous;
          prev.push(normalizeFn(option, name, val as T));
          this.registry.normalizeArray(option, name, prev);
          return prev;
        });
        (this.values as Record<string, typeof promise>)[key] = promise;
        return;
      } else {
        result = [normalizeFn(option, name, res as T)];
      }
    } else if ('parseDelimited' in option && option.parseDelimited) {
      const res = option.parseDelimited(name, value);
      if (res instanceof Promise) {
        const promise = res.then(async (vals) => {
          const prev = await previous;
          prev.push(...vals.map((val) => normalizeFn(option, name, val as T)));
          this.registry.normalizeArray(option, name, prev);
          return prev;
        });
        (this.values as Record<string, typeof promise>)[key] = promise;
        return;
      } else {
        result = res.map((val) => normalizeFn(option, name, val as T));
      }
    } else {
      const vals = option.separator
        ? value.split(option.separator).map((val) => convertFn(val))
        : [convertFn(value)];
      result = vals.map((val) => normalizeFn(option, name, val as T));
    }
    if (previous instanceof Promise) {
      const promise = previous.then((val) => {
        val.push(...result);
        this.registry.normalizeArray(option, name, val);
        return val;
      });
      (this.values as Record<string, typeof promise>)[key] = promise;
    } else {
      previous.push(...result);
      this.registry.normalizeArray(option, name, previous);
    }
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Gets a list of command arguments from a command line.
 * @param line The command line
 * @param compIndex The completion index, if any
 * @returns The list of arguments
 */
function getArgs(line: string, compIndex: number = NaN): Array<string> {
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
 * Handles the special "version" option with a module-resolve function.
 * @param option The option definition
 */
async function resolveVersion(option: VersionOption): Promise<never> {
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
 * Checks the required value of an array option against a specified value.
 * @param actual The specified value
 * @param expected The expected value
 * @param negate True if the requirement should be negated
 * @param unique True if array elements should are unique
 * @returns An error reason or null if no error
 */
function checkRequiredArray(
  actual: Array<string | number>,
  expected: Array<string | number>,
  negate: boolean,
  unique: boolean,
): boolean {
  if (actual.length !== expected.length) {
    return negate;
  }
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
 */
function gestaltPatternMatching(S: string, T: string): number {
  return (2 * matchingCharacters(S, T)) / (S.length + T.length);
}
