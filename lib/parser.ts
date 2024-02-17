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
  SpecialOption,
  FunctionOption,
  NiladicOption,
  CompletionCallback,
} from './options';

import { HelpFormatter } from './formatter';
import { RequiresAll, RequiresNot, RequiresOne, isArray, isNiladic, isValued } from './options';
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
   * @param validate True if the options should be validated (can be disabled in production)
   */
  constructor(
    private readonly options: T,
    validate = true,
  ) {
    for (const key in this.options) {
      const option = this.options[key];
      this.checkNamesSanity(key, option, validate);
      if (!isNiladic(option)) {
        if (option.positional) {
          if (validate && this.positional) {
            throw Error(`Duplicate positional option '${key}'.`);
          }
          const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
          const marker = typeof option.positional === 'string' ? option.positional : undefined;
          this.positional = { key, name, option, marker };
        }
        if (validate) {
          checkEnumsSanity(key, option);
          checkValueSanity(key, option, option.default);
          checkValueSanity(key, option, option.example);
        }
      }
      if (option.required) {
        this.required.push(key);
      }
      if (validate && option.requires) {
        this.checkRequiresSanity(key, option.requires);
      }
      if (validate && option.type === 'version' && !option.version && !option.resolve) {
        throw Error(`Option '${key}' contains no version or resolve function.`);
      }
    }
  }

  /**
   * Checks the sanity of the option's names.
   * @param key The option key
   * @param option The option definition
   * @param validate True if the options should be validated
   */
  private checkNamesSanity(key: string, option: Option, validate: boolean) {
    const names = option.names.filter((name): name is string => name !== null && name !== '');
    if (validate && !names.length) {
      throw Error(`Option '${key}' has no name.`);
    }
    if (option.type === 'flag' && option.negationNames) {
      names.push(...option.negationNames.filter((name) => name));
    }
    if ('positional' in option && typeof option.positional === 'string') {
      if (validate && !option.positional) {
        throw Error(`Option '${key}' has empty positional marker.`);
      }
      names.push(option.positional);
    }
    for (const name of names) {
      if (validate && name.match(/[\s=]+/)) {
        throw Error(`Invalid option name '${name}'.`);
      }
      if (validate && this.nameToKey.has(name)) {
        throw Error(`Duplicate option name '${name}'.`);
      }
      this.nameToKey.set(name, key);
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
      checkValueSanity(requiredKey, option, requiredValue);
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

    let marker = false;
    let singleParam = false;
    let value: string | undefined;
    let delimited: string | undefined;
    let current: typeof this.positional;

    for (let i = 0; i < this.args.length; ++i) {
      const [arg, comp] = this.args[i].split('\0', 2);
      if (marker || singleParam) {
        value = arg;
      } else {
        let addKey;
        [addKey, marker, current, value] = this.parseOption(arg, i, comp, delimited, current);
        if (addKey) {
          if (
            isArray(current.option) &&
            (!current.option.append || !this.specifiedKeys.has(current.key))
          ) {
            (this.values as Record<string, []>)[current.key as string] = [];
          }
          this.specifiedKeys.add(current.key);
        }
        delimited = undefined;
      }
      assert(current);
      const { key, name, option } = current;
      if (isNiladic(option)) {
        if (comp !== undefined) {
          throw this.findPrefixedNames().join('\n');
        } else if (this.completing && option.type !== 'flag') {
          continue;
        } else if (value !== undefined) {
          throw Error(`Option '${name}' does not accept inline values.`);
        } else if (this.handleNiladic(key, option, name, i)) {
          return Promise.all(this.promises);
        }
        current = undefined;
      } else if (comp !== undefined) {
        if (option.complete) {
          this.handleComplete(option.complete, i, value);
          return Promise.all(this.promises);
        }
        this.handleCompletion(option, value);
      } else if (value !== undefined) {
        this.parseValue(key, option, name, value);
        if (singleParam) {
          singleParam = false;
          current = undefined;
        }
      } else if (marker || (isArray(option) && !option.separator)) {
        continue;
      } else if (i + 1 == this.args.length) {
        throw Error(`Missing parameter to '${name}'.`);
      } else {
        if (isArray(option)) {
          delimited = name; // save for recommendation
        }
        singleParam = true;
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
   * @param delimited Undefined if previous option is not delimited
   * @param current The current option information
   * @returns A tuple of [addKey, marker, current, value]
   */
  private parseOption(
    arg: string,
    index: number,
    comp?: string,
    delimited?: string,
    current?: Positional,
  ): [boolean, boolean, Positional, string | undefined] {
    const [name, value] = arg.split(/=(.*)/, 2);
    if (this.positional && name === this.positional.marker) {
      if (comp !== undefined) {
        if (value === undefined) {
          throw name;
        }
        throw ''; // use default completion
      }
      if (value !== undefined) {
        throw Error(`Positional marker '${name}' does not accept inline values.`);
      }
      if (index + 1 == this.args.length && !isArray(this.positional.option)) {
        throw Error(`Missing parameter after positional marker '${name}'.`);
      }
      return [true, true, this.positional, undefined];
    }
    const key = this.nameToKey.get(name);
    if (key) {
      if (comp !== undefined && value === undefined) {
        throw name;
      }
      current = { key, name, option: this.options[key] };
      return [true, false, current, value];
    }
    if (!current) {
      if (!this.positional) {
        this.handleUnknown(arg, name, comp, delimited);
      }
      return [true, false, this.positional, arg];
    }
    return [false, false, current, arg];
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
    if (option.break) {
      this.checkRequired();
    }
    const result = option.exec(this.values, this.args.slice(index + 1));
    if (typeof result === 'object') {
      this.promises.push(result);
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
   * Handles the completion of an option that has a completion callback.
   * @param complete The completion callback
   * @param index The current argument index
   * @param param The option parameter
   */
  private handleComplete(complete: CompletionCallback, index: number, param: string = '') {
    const result = complete(this.values, [param, ...this.args.slice(index + 1)]);
    if (Array.isArray(result)) {
      throw result.join('\n');
    }
    const promise = result.then((words) => {
      throw words.join('\n');
    });
    this.promises.push(promise);
  }

  /**
   * Handles the completion of an option with a parameter.
   * @param option The option definition
   * @param param The option parameter
   * @returns never
   */
  private handleCompletion(option: ParamOption, param: string = ''): never {
    if ('enums' in option && option.enums) {
      let words = option.enums.map((val) => val.toString());
      if (param) {
        words = words.filter((word) => word.startsWith(param));
      }
      if (words.length) {
        throw words.join('\n');
      }
    }
    if (isArray(option) && !option.separator) {
      const prefixedNames = this.findPrefixedNames(param);
      if (prefixedNames.length) {
        throw prefixedNames.join('\n');
      }
    }
    throw ''; // use default completion
  }

  /**
   * Handles an unknown option.
   * @param arg The command-line argument
   * @param name The unknown option name
   * @param comp Undefined if not completing
   * @param delimited Undefined if previous option is not delimited
   * @returns never
   */
  private handleUnknown(arg: string, name: string, comp?: string, delimited?: string): never {
    if (comp !== undefined) {
      const prefixedNames = this.findPrefixedNames(arg);
      if (prefixedNames.length) {
        throw prefixedNames.join('\n');
      }
      throw ''; // use default completion
    }
    const error = `Unknown option '${name}'.`;
    if (delimited) {
      throw Error(`${error} Did you forget to delimit values for '${delimited}'?`);
    }
    const similarNames = this.findSimilarNames(name);
    if (similarNames.length) {
      throw Error(`${error} Similar names: ${similarNames.join(', ')}.`);
    }
    throw Error(error);
  }

  /**
   * Handles the special "help" option.
   * @param option The option definition
   * @returns never
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
   * Gets a list of option names that begin with a given prefix.
   * @param prefix The name prefix
   * @returns The list of prefixed names
   */
  private findPrefixedNames(prefix: string = ''): Array<string> {
    const names = [...this.nameToKey.keys()];
    return prefix ? names.filter((name) => name.startsWith(prefix)) : names;
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
   * @param values The options' values
   * @param keys The set of specified option keys
   * @param requires The option requirements
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
   * @param values The options' values
   * @param keys The set of specified option keys
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
   * @param values The options' values
   * @param keys The set of specified option keys
   * @param items The list of requirements
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
   * @param values The options' values
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
    const actualValue = this.values[requiredKey as keyof OptionValues];
    return checkRequiredValue(name, option, negate, requiredValue, actualValue);
  }

  /**
   * Parses the value of an option parameter.
   * @param values The options' values to parse into
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  private parseValue(key: string, option: ParamOption, name: string, value: string) {
    let parsed;
    switch (option.type) {
      case 'boolean':
        parsed = parseBoolean(option, name, value);
        break;
      case 'string':
        parsed = parseString(option, name, value);
        break;
      case 'number':
        parsed = parseNumber(option, name, value);
        break;
      case 'strings': {
        const previous = (this.values as Record<string, Array<string> | undefined>)[key as string];
        parsed = parseStrings(option, name, value, previous);
        break;
      }
      case 'numbers': {
        const previous = (this.values as Record<string, Array<number> | undefined>)[key as string];
        parsed = parseNumbers(option, name, value, previous);
        break;
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
    (this.values as Record<string, typeof parsed>)[key as string] = parsed;
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
function checkEnumsSanity(key: string, option: ParamOption) {
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
function checkValueSanity(key: string, option: ParamOption, value: OptionDataType) {
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
    case 'strings':
      assert(typeof value === 'object', 'string[]');
      for (const element of value) {
        assert(typeof element === 'string', 'string[]');
        normalizeString(option, key, element);
      }
      break;
    case 'numbers':
      assert(typeof value === 'object', 'number[]');
      for (const element of value) {
        assert(typeof element === 'number', 'number[]');
        normalizeNumber(option, key, element);
      }
      break;
    default: {
      const _exhaustiveCheck: never = option;
      return _exhaustiveCheck;
    }
  }
}

/**
 * Handles the special "version" option with a module-resolve function.
 * @param option The option definition
 * @returns never
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
function getDefaultValue(name: string, option: ValuedOption): OptionDataType {
  if (option.default === undefined) {
    return undefined;
  }
  switch (option.type) {
    case 'string':
      return normalizeString(option, name, option.default);
    case 'number':
      return normalizeNumber(option, name, option.default);
    case 'strings':
      return normalizeStrings(option, name, option.default);
    case 'numbers':
      return normalizeNumbers(option, name, option.default);
    default:
      return option.default;
  }
}

/**
 * Parses the value of a boolean option.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 */
function parseBoolean(option: BooleanOption, name: string, value: string): boolean {
  return option.parse ? option.parse(name, value) : !value.trim().match(/^([0]*|false)$/i);
}

/**
 * Parses the value of a string option.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 */
function parseString(option: StringOption, name: string, value: string): string {
  const string = option.parse ? option.parse(name, value) : value;
  return normalizeString(option, name, string);
}

/**
 * Parses the value of a number option.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 */
function parseNumber(option: NumberOption, name: string, value: string): number {
  const number = option.parse ? option.parse(name, value) : Number(value);
  return normalizeNumber(option, name, number);
}

/**
 * Parses the value of a strings option.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 * @param previous The previous value, if any
 */
function parseStrings(
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
  return normalizeStrings(option, name, strings, previous);
}

/**
 * Parses the value of a numbers option.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 * @param previous The previous value, if any
 */
function parseNumbers(
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
  return normalizeNumbers(option, name, numbers, previous);
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
    throw Error(`Invalid parameter to '${name}': ${value}. Possible values are [${option.enums}].`);
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
 * Normalizes the value of a strings option and checks its validity against any constraint.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 * @param previous The previous value, if any
 */
function normalizeStrings(
  option: StringsOption,
  name: string,
  value: Array<string>,
  previous: Array<string> = [],
): Array<string> {
  value = value.map((val) => normalizeString(option, name, val));
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
function normalizeNumbers(
  option: NumbersOption,
  name: string,
  value: Array<number>,
  previous: Array<number> = [],
): Array<number> {
  value = value.map((val) => normalizeNumber(option, name, val));
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
 * Checks an option's required value against a specified value.
 * @param name The option name
 * @param option The option definition
 * @param negate True if the requirement should be negated
 * @param requiredValue The required value
 * @param actualValue The specified value
 * @returns An error reason or null if no error
 */
function checkRequiredValue(
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
      return checkRequiredSingle(name, actualValue, requiredValue, negate, false);
    }
    case 'string': {
      assert(typeof actualValue == 'string' && typeof requiredValue === 'string');
      const expected = normalizeString(option, name, requiredValue);
      return checkRequiredSingle(name, actualValue, expected, negate, true);
    }
    case 'number': {
      assert(typeof actualValue == 'number' && typeof requiredValue === 'number');
      const expected = normalizeNumber(option, name, requiredValue);
      return checkRequiredSingle(name, actualValue, expected, negate, false);
    }
    case 'strings': {
      assert(typeof actualValue == 'object' && typeof requiredValue === 'object');
      const actual = actualValue as Array<string>;
      const expected = normalizeStrings(option, name, requiredValue as Array<string>);
      const unique = 'unique' in option && option.unique === true;
      return checkRequiredArray(name, actual, expected, negate, unique, true);
    }
    case 'numbers': {
      assert(typeof actualValue == 'object' && typeof requiredValue === 'object');
      const actual = actualValue as Array<number>;
      const expected = normalizeNumbers(option, name, requiredValue as Array<number>);
      const unique = 'unique' in option && option.unique === true;
      return checkRequiredArray(name, actual, expected, negate, unique, false);
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
 * @param actual The specified value
 * @param expected The expected value
 * @param negate True if the requirement should be negated
 * @param quote True if the value should be quoted in the error
 * @returns An error reason or null if no error
 */
function checkRequiredSingle(
  name: string,
  actual: boolean | string | number,
  expected: boolean | string | number,
  negate: boolean,
  quote: boolean,
): string | null {
  const error = quote ? `'${expected}'` : expected.toString();
  if (actual !== expected) {
    return negate ? null : `${name} = ${error}`;
  }
  return negate ? `${name} != ${error}` : null;
}

/**
 * Checks the required value of an array option against a specified value.
 * @param name The option name
 * @param actual The specified value
 * @param expected The expected value
 * @param negate True if the requirement should be negated
 * @param unique True if array elements should are unique
 * @param quote True if array elements should be quoted in the error
 * @returns An error reason or null if no error
 */
function checkRequiredArray(
  name: string,
  actual: Array<string> | Array<number>,
  expected: Array<string> | Array<number>,
  negate: boolean,
  unique: boolean,
  quote: boolean,
): string | null {
  const error = expected.map((el) => (quote ? `'${el}'` : el.toString())).join(',');
  if (actual.length !== expected.length) {
    return negate ? null : `${name} = [${error}]`;
  }
  if (unique) {
    const set = new Set<string | number>(expected);
    for (const element of actual) {
      if (!set.delete(element)) {
        return negate ? null : `${name} = [${error}]`;
      }
    }
    if (set.size > 0) {
      return negate ? null : `${name} = [${error}]`;
    }
  } else {
    for (let i = 0; i < actual.length; ++i) {
      if (actual[i] !== expected[i]) {
        return negate ? null : `${name} = [${error}]`;
      }
    }
  }
  return negate ? `${name} != [${error}]` : null;
}
