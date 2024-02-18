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
  RequiresVal,
  ValuedOption,
  SpecialOption,
  FunctionOption,
  NiladicOption,
  CompletionCallback,
} from './options';

import { HelpFormatter } from './formatter';
import {
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

/**
 * Information regarding a positional option.
 */
type Positional = {
  key: string;
  name: string;
  option: Option;
  marker?: string;
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements parsing of command-line arguments into option values.
 * @template T The type of the options' definitions
 */
class ArgumentParser<T extends Options> {
  private readonly nameToKey = new Map<string, string>();
  private readonly required = new Array<string>();
  private readonly positional: Positional | undefined;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The option definitions
   */
  constructor(private readonly options: T) {
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option);
      if (!isNiladic(option)) {
        if (option.positional) {
          if (this.positional) {
            throw Error(`Duplicate positional option '${key}'.`);
          }
          const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
          const marker = typeof option.positional === 'string' ? option.positional : undefined;
          this.positional = { key, name, option, marker };
        }
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
   * Registers the option's names.
   * @param key The option key
   * @param option The option definition
   */
  private registerNames(key: string, option: Option) {
    const names = option.names.filter((name): name is string => name !== null && name !== '');
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
      if (name.match(/[\s=]+/)) {
        throw Error(`Invalid option name '${name}'.`);
      }
      if (this.nameToKey.has(name)) {
        throw Error(`Duplicate option name '${name}'.`);
      }
      this.nameToKey.set(name, key);
    }
  }

  /**
   * Validates the options' definitions
   */
  validate() {
    for (const key in this.options) {
      const option = this.options[key];
      if (!isNiladic(option)) {
        validateEnums(key, option);
        validateValue(key, option, option.default);
        validateValue(key, option, option.example);
      }
      if (option.requires) {
        this.validateRequirements(key, option.requires);
      }
    }
  }

  /**
   * Checks the sanity of an option's requirements.
   * @param key The option key
   * @param requires The option requirements
   */
  private validateRequirements(key: string, requires: Requires) {
    if (typeof requires === 'string') {
      this.validateRequirement(key, requires);
    } else if (requires instanceof RequiresNot) {
      this.validateRequirements(key, requires.item);
    } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
      for (const item of requires.items) {
        this.validateRequirements(key, item);
      }
    } else {
      for (const requiredKey in requires) {
        this.validateRequirement(key, requiredKey, requires[requiredKey]);
      }
    }
  }

  /**
   * Checks the sanity of an option requirement.
   * @param key The requiring option key
   * @param requiredKey The required option key
   * @param requiredValue The required value, if any
   */
  private validateRequirement(
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
      validateValue(requiredKey, option, requiredValue);
    }
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
    for (const key in this.options) {
      if (isValued(this.options[key])) {
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
    const loop = new ParserLoop(
      this.options,
      this.nameToKey,
      this.required,
      this.positional,
      values,
      args,
      config.compIndex !== undefined && config.compIndex >= 0,
      config.width,
    );
    return loop.loop();
  }
}

/**
 * Implements the parsing loop.
 */
class ParserLoop {
  private readonly promises = new Array<Promise<void>>();
  private readonly specifiedKeys = new Set<string>();

  /**
   * Constructs a parser loop.
   */
  constructor(
    private readonly options: Options,
    private readonly nameToKey: Map<string, string>,
    private readonly required: Array<string>,
    private readonly positional: Positional | undefined,
    private readonly values: OptionValues,
    private readonly args: Array<string>,
    private readonly completing: boolean,
    private readonly width?: number,
  ) {}

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
    let current: typeof this.positional;

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
          throw Error(`Option '${name}' does not accept inline values.`);
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
            // do not propagate user errors during completion
            if (!this.completing) {
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
          throw Error(`Missing parameter to '${name}'.`);
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
   * @param comp Undefined if not completing
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
    const key = this.nameToKey.get(name);
    if (key) {
      if (comp !== undefined && value === undefined) {
        throw name;
      }
      if (this.positional && name === this.positional.marker) {
        if (comp !== undefined) {
          throw ''; // use default completion
        }
        if (value !== undefined) {
          throw Error(`Positional marker '${name}' does not accept inline values.`);
        }
        if (index + 1 == this.args.length && !isArray(this.positional.option)) {
          throw Error(`Missing parameter after positional marker '${name}'.`);
        }
        return [true, true, false, this.positional, undefined];
      }
      current = { key, name, option: this.options[key] };
      return [true, false, true, current, value];
    }
    if (!current) {
      if (!this.positional) {
        if (comp !== undefined) {
          this.handleNameCompletion(arg);
        }
        this.handleUnknown(name);
      }
      return [true, false, false, this.positional, arg];
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
      // do not propagate user errors during completion
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
      // do not propagate user errors during completion
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
        // do not propagate user errors during completion
        console.error(err);
        throw '';
      },
    );
    this.promises.push(promise);
  }

  /**
   * Handles an unknown option.
   * @param name The unknown option name
   */
  private handleUnknown(name: string): never {
    const error = `Unknown option '${name}'.`;
    const similarNames = this.findSimilarNames(name);
    if (similarNames.length) {
      throw Error(`${error}\nSimilar names are: ${similarNames.join(', ')}.`);
    }
    throw Error(error);
  }

  /**
   * Handles the completion of an option name.
   * @param prefix The name prefix
   */
  private handleNameCompletion(prefix?: string): never {
    const names = [...this.nameToKey.keys()];
    const prefixedNames = prefix ? names.filter((name) => name.startsWith(prefix)) : names;
    throw prefixedNames.join('\n');
  }

  /**
   * Handles the special "help" option.
   * @param option The option definition
   */
  private handleHelp(option: HelpOption): never {
    const help = option.usage ? [option.usage] : [];
    const groups = new HelpFormatter(this.options, option.format).formatGroups(this.width);
    for (const [group, message] of groups.entries()) {
      const header = group ? group + ' options' : 'Options';
      help.push(`${sgr('1')}${header}:`, message);
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
    for (const key in this.options) {
      const option = this.options[key];
      if ('default' in option && !this.specifiedKeys.has(key)) {
        const value = getDefaultValue(key, option);
        (this.values as Record<string, typeof value>)[key] = value;
      }
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
    return [...this.nameToKey.keys()]
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
    for (const key of this.required) {
      if (!this.specifiedKeys.has(key)) {
        const option = this.options[key];
        const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
        throw Error(`Option '${name}' is required.`);
      }
    }
    for (const key of this.specifiedKeys) {
      const option = this.options[key];
      if (option.requires) {
        const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
        const error = this.checkRequires(option.requires);
        if (error) {
          throw Error(`Option '${name}' requires ${error}.`);
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
   * Checks the entries of a map of key-value pairs.
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
   * @param specifiedKeys The set of specified option keys
   * @param negate True if the requirement should be negated
   * @param requiredKey The required key
   * @param requiredValue The required value, if any
   * @returns An error reason or null if no error
   */
  private checkRequirement(
    negate: boolean,
    requiredKey: string,
    requiredValue?: RequiresVal[string],
  ): string | null {
    function checkPresence(): string | null {
      return specified
        ? required == negate
          ? `no ${name}`
          : null
        : withValue || required != negate
          ? name
          : null;
    }
    const option = this.options[requiredKey];
    const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
    const specified = this.specifiedKeys.has(requiredKey);
    const required = requiredValue !== null;
    const withValue = required && requiredValue !== undefined;
    if (isNiladic(option) || !specified || !required || !withValue) {
      return checkPresence();
    }
    return this.checkRequiredValue(name, option, negate, requiredKey, requiredValue);
  }

  /**
   * Checks an option's required value against a specified value.
   * @param name The option name
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param requiredValue The required option key
   * @param requiredValue The required value
   * @returns An error reason or null if no error
   */
  private checkRequiredValue(
    name: string,
    option: ParamOption,
    negate: boolean,
    requiredKey: string,
    requiredValue: Exclude<ParamOption['default'], undefined>,
  ): string | null {
    function assert(_condition: unknown): asserts _condition {}
    switch (option.type) {
      case 'boolean': {
        assert(typeof requiredValue == 'boolean');
        const actual = (this.values as Record<string, boolean | Promise<boolean>>)[requiredKey];
        if (actual instanceof Promise) {
          return null; // ignore promises during requirement checking
        }
        if ((actual === requiredValue) !== negate) {
          return null;
        }
        return negate ? `${name} != ${requiredValue}` : `${name} = ${requiredValue}`;
      }
      case 'string': {
        assert(typeof requiredValue === 'string');
        const actual = (this.values as Record<string, string | Promise<string>>)[requiredKey];
        if (actual instanceof Promise) {
          return null; // ignore promises during requirement checking
        }
        const expected = normalizeString(option, name, requiredValue);
        if ((actual === expected) !== negate) {
          return null;
        }
        return negate ? `${name} != '${expected}'` : `${name} = '${expected}'`;
      }
      case 'number': {
        assert(typeof requiredValue === 'number');
        const actual = (this.values as Record<string, number | Promise<number>>)[requiredKey];
        if (actual instanceof Promise) {
          return null; // ignore promises during requirement checking
        }
        const expected = normalizeNumber(option, name, requiredValue);
        if ((actual === expected) !== negate) {
          return null;
        }
        return negate ? `${name} != ${expected}` : `${name} = ${expected}`;
      }
      case 'strings': {
        assert(typeof requiredValue === 'object');
        type ArrayVal = Array<string> | Promise<Array<string>>;
        const actual = (this.values as Record<string, ArrayVal>)[requiredKey];
        if (actual instanceof Promise) {
          return null; // ignore promises during requirement checking
        }
        const expected = (requiredValue as Array<string>).map((val) =>
          normalizeString(option, name, val),
        );
        if (checkRequiredArray(actual, expected, negate, option.unique === true)) {
          return null;
        }
        const error = expected.map((el) => `'${el}'`).join(',');
        return negate ? `${name} != [${error}]` : `${name} = [${error}]`;
      }
      case 'numbers': {
        assert(typeof requiredValue === 'object');
        type ArrayVal = Array<number> | Promise<Array<number>>;
        const actual = (this.values as Record<string, ArrayVal>)[requiredKey];
        if (actual instanceof Promise) {
          return null; // ignore promises during requirement checking
        }
        const expected = (requiredValue as Array<number>).map((val) =>
          normalizeNumber(option, name, val),
        );
        if (checkRequiredArray(actual, expected, negate, option.unique === true)) {
          return null;
        }
        const error = expected.map((el) => el.toString()).join(',');
        return negate ? `${name} != [${error}]` : `${name} = [${error}]`;
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
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
      case 'boolean':
        this.parseBoolean(key, option, name, value);
        break;
      case 'string':
        this.parseString(key, option, name, value);
        break;
      case 'number':
        this.parseNumber(key, option, name, value);
        break;
      case 'strings':
        this.parseStrings(key, option, name, value);
        break;
      case 'numbers':
        this.parseNumbers(key, option, name, value);
        break;
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Parses the value of a boolean option.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseBoolean(key: string, option: BooleanOption, name: string, value: string) {
    const result =
      'parse' in option ? option.parse(name, value) : !value.trim().match(/^([0]*|false)$/i);
    (this.values as Record<string, typeof result>)[key] = result;
  }

  /**
   * Parses the value of a string option.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseString(key: string, option: StringOption, name: string, value: string) {
    let result;
    if ('parse' in option) {
      result = option.parse(name, value);
      if (result instanceof Promise) {
        result = result.then((val) => normalizeString(option, name, val));
      } else {
        result = normalizeString(option, name, result);
      }
    } else {
      result = normalizeString(option, name, value);
    }
    (this.values as Record<string, typeof result>)[key] = result;
  }

  /**
   * Parses the value of a number option.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumber(key: string, option: NumberOption, name: string, value: string) {
    let result;
    if ('parse' in option) {
      result = option.parse(name, value);
      if (result instanceof Promise) {
        result = result.then((val) => normalizeNumber(option, name, val));
      } else {
        result = normalizeNumber(option, name, result);
      }
    } else {
      result = normalizeNumber(option, name, Number(value));
    }
    (this.values as Record<string, typeof result>)[key] = result;
  }

  /**
   * Parses the value of a strings option.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseStrings(key: string, option: StringsOption, name: string, value: string) {
    type ArrayVal = Array<string> | Promise<Array<string>>;
    let result: ArrayVal;
    if ('parse' in option && option.parse) {
      const previous = (this.values as Record<string, ArrayVal>)[key];
      const res = option.parse(name, value);
      if (res instanceof Promise) {
        result = res.then(async (val) => {
          const prev = await previous;
          prev.push(normalizeString(option, name, val));
          normalizeArray(option, name, prev);
          return prev;
        });
      } else if (previous instanceof Promise) {
        result = previous.then((val) => {
          val.push(normalizeString(option, name, res));
          normalizeArray(option, name, val);
          return val;
        });
      } else {
        result = previous;
        previous.push(normalizeString(option, name, res));
        normalizeArray(option, name, result);
      }
    } else if ('parseDelimited' in option && option.parseDelimited) {
      const previous = (this.values as Record<string, ArrayVal>)[key];
      const res = option.parseDelimited(name, value);
      if (res instanceof Promise) {
        result = res.then(async (vals) => {
          const prev = await previous;
          prev.push(...vals.map((val) => normalizeString(option, name, val)));
          normalizeArray(option, name, prev);
          return prev;
        });
      } else {
        const normalized = res.map((val) => normalizeString(option, name, val));
        if (previous instanceof Promise) {
          result = previous.then((val) => {
            val.push(...normalized);
            normalizeArray(option, name, val);
            return val;
          });
        } else {
          result = previous;
          result.push(...normalized);
          normalizeArray(option, name, result);
        }
      }
    } else {
      const previous = (this.values as Record<string, Array<string>>)[key];
      const vals = option.separator ? value.split(option.separator) : [value];
      const normalized = vals.map((val) => normalizeString(option, name, val));
      result = previous;
      result.push(...normalized);
      normalizeArray(option, name, result);
    }
    (this.values as Record<string, typeof result>)[key] = result;
  }

  /**
   * Parses the value of a numbers option.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseNumbers(key: string, option: NumbersOption, name: string, value: string) {
    type ArrayVal = Array<number> | Promise<Array<number>>;
    let result: ArrayVal;
    if ('parse' in option && option.parse) {
      const previous = (this.values as Record<string, ArrayVal>)[key];
      const res = option.parse(name, value);
      if (res instanceof Promise) {
        result = res.then(async (val) => {
          const prev = await previous;
          prev.push(normalizeNumber(option, name, val));
          normalizeArray(option, name, prev);
          return prev;
        });
      } else if (previous instanceof Promise) {
        result = previous.then((val) => {
          val.push(normalizeNumber(option, name, res));
          normalizeArray(option, name, val);
          return val;
        });
      } else {
        result = previous;
        previous.push(normalizeNumber(option, name, res));
        normalizeArray(option, name, result);
      }
    } else if ('parseDelimited' in option && option.parseDelimited) {
      const previous = (this.values as Record<string, ArrayVal>)[key];
      const res = option.parseDelimited(name, value);
      if (res instanceof Promise) {
        result = res.then(async (vals) => {
          const prev = await previous;
          prev.push(...vals.map((val) => normalizeNumber(option, name, val)));
          normalizeArray(option, name, prev);
          return prev;
        });
      } else {
        const normalized = res.map((val) => normalizeNumber(option, name, val));
        if (previous instanceof Promise) {
          result = previous.then((val) => {
            val.push(...normalized);
            normalizeArray(option, name, val);
            return val;
          });
        } else {
          result = previous;
          result.push(...normalized);
          normalizeArray(option, name, result);
        }
      }
    } else {
      const previous = (this.values as Record<string, Array<number>>)[key];
      const vals = option.separator
        ? value.split(option.separator).map((val) => Number(val))
        : [Number(value)];
      const normalized = vals.map((val) => normalizeNumber(option, name, val));
      result = previous;
      result.push(...normalized);
      normalizeArray(option, name, result);
    }
    (this.values as Record<string, typeof result>)[key] = result;
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
 * Checks the sanity of the option's enumerated values.
 * @param key The option key
 * @param option The option definition
 */
function validateEnums(key: string, option: ParamOption) {
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
function validateValue(key: string, option: ParamOption, value: ParamOption['default']) {
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
      normalizeString(option, key, value);
      break;
    case 'number':
      assert(typeof value === 'number', 'number');
      normalizeNumber(option, key, value);
      break;
    case 'strings': {
      assert(typeof value === 'object', 'string[]');
      value = value.map((val) => {
        assert(typeof val === 'string', 'string[]');
        return normalizeString(option, key, val);
      });
      normalizeArray(option, key, value);
      break;
    }
    case 'numbers': {
      assert(typeof value === 'object', 'number[]');
      value = value.map((val) => {
        assert(typeof val === 'number', 'number[]');
        return normalizeNumber(option, key, val);
      });
      normalizeArray(option, key, value);
      break;
    }
    default: {
      const _exhaustiveCheck: never = option;
      return _exhaustiveCheck;
    }
  }
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
 * Gets the normalized default value of an option.
 * @param name The option name
 * @param option The option definition
 * @returns The default value
 */
function getDefaultValue(name: string, option: ValuedOption): ValuedOption['default'] {
  if (option.default === undefined) {
    return undefined;
  }
  switch (option.type) {
    case 'string':
      return normalizeString(option, name, option.default);
    case 'number':
      return normalizeNumber(option, name, option.default);
    case 'strings': {
      const vals = option.default.map((val) => normalizeString(option, name, val));
      normalizeArray(option, name, vals);
      return vals;
    }
    case 'numbers': {
      const vals = option.default.map((val) => normalizeNumber(option, name, val));
      normalizeArray(option, name, vals);
      return vals;
    }
    default:
      return option.default;
  }
}

/**
 * Normalizes the value of a string option and checks its validity against any constraint.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 */
function normalizeString(
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
    const error = option.enums.map((val) => `'${val}'`).join(',');
    throw Error(`Invalid parameter to '${name}': '${value}'. Possible values are [${error}].`);
  }
  if ('regex' in option && option.regex && !option.regex.test(value)) {
    throw Error(
      `Invalid parameter to '${name}': '${value}'. ` +
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
function normalizeNumber(
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
    throw Error(`Invalid parameter to '${name}': ${value}. Possible values are [${option.enums}].`);
  }
  if ('range' in option && option.range && (value < option.range[0] || value > option.range[1])) {
    throw Error(
      `Invalid parameter to '${name}': ${value}. Value must be in the range [${option.range}].`,
    );
  }
  return value;
}

/**
 * Normalizes the value of an array option and checks its validity against any constraint.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 */
function normalizeArray(
  option: StringsOption | NumbersOption,
  name: string,
  value: Array<string | number>,
) {
  if (option.unique) {
    const unique = [...new Set(value)];
    value.length = 0;
    value.push(...unique);
  }
  if (option.limit !== undefined && value.length > option.limit) {
    throw Error(
      `Option '${name}' has too many values (${value.length}). ` +
        `Should have at most ${option.limit}.`,
    );
  }
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

/**
 * Checks the required value of an array option against a specified value.
 * @param actual The specified value
 * @param expected The expected value
 * @param negate True if the requirement should be negated
 * @param unique True if array elements should are unique
 * @returns An error reason or null if no error
 */
function checkRequiredArray(
  actual: Array<string> | Array<number>,
  expected: Array<string> | Array<number>,
  negate: boolean,
  unique: boolean,
): boolean {
  if (actual.length !== expected.length) {
    return negate;
  }
  if (unique) {
    const set = new Set<string | number>(expected);
    for (const element of actual) {
      if (!set.delete(element)) {
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
