//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  ParamOption,
  Options,
  OptionValues,
  Requires,
  HelpOption,
  RequiresVal,
  ValuedOption,
  SpecialOption,
  FunctionOption,
  NiladicOption,
  CompleteCallback,
  ArrayOption,
  SingleOption,
  ResolveCallback,
  CommandOption,
  CastToOptionValues,
} from './options';
import type { Positional, ConcreteError, ErrorConfig, ConcreteStyles } from './validator';

import { HelpFormatter } from './formatter';
import { RequiresAll, RequiresNot, RequiresOne, isArray, isVariadic, isNiladic } from './options';
import { ErrorMessage, HelpMessage, Style, TerminalString, style, tf } from './styles';
import { OptionValidator, defaultConfig, formatFunctions, ErrorItem } from './validator';
import { assert, checkRequiredArray, gestaltSimilarity, getArgs } from './utils';

export { ArgumentParser, OpaqueArgumentParser, type ParseConfig };

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The kind of current argument in the parser loop.
 */
const enum ArgKind {
  marker,
  positional,
  inline,
  param,
}

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * The parse configuration.
 */
type ParseConfig = {
  /**
   * The completion index of a raw command line.
   */
  compIndex?: number;
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements parsing of command-line arguments into option values.
 */
class OpaqueArgumentParser {
  private readonly validator: OptionValidator;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The option definitions
   * @param config The error messages configuration
   */
  constructor(options: Options, config: ErrorConfig = {}) {
    const concreteConfig: ConcreteError = {
      styles: Object.assign({}, defaultConfig.styles, config.styles),
      phrases: Object.assign({}, defaultConfig.phrases, config.phrases),
    };
    this.validator = new OptionValidator(options, concreteConfig);
  }

  /**
   * Validates the option definitions. This should only be called during development and in unit
   * tests, but should be skipped in production.
   * @returns The parser instance
   */
  validate(): this {
    this.validator.validate();
    return this;
  }

  /**
   * Parses command-line arguments into option values.
   * @param values The options' values to parse into
   * @param command The raw command line or command-line arguments
   * @param config The parse configuration
   * @returns A promise that can be awaited in order to resolve async callbacks.
   */
  parseInto(
    values: CastToOptionValues,
    command: string | Array<string> = process.env['COMP_LINE'] ?? process.argv.slice(2),
    config: ParseConfig = { compIndex: Number(process.env['COMP_POINT']) },
  ): Promise<Array<void>> {
    const args =
      typeof command === 'string' ? getArgs(command, config.compIndex).slice(1) : command;
    const completing = (config.compIndex ?? -1) >= 0;
    const loop = new ParserLoop(this.validator, values, args, completing);
    return Promise.all(loop.loop());
  }
}

/**
 * Implements parsing of command-line arguments into option values.
 * @template T The type of the option definitions
 */
class ArgumentParser<T extends Options> extends OpaqueArgumentParser {
  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The option definitions
   * @param config The error messages configuration
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(options: T, config?: ErrorConfig) {
    super(options, config);
  }

  /**
   * Convenience method to parse command-line arguments into option values.
   * @param command The raw command line or command-line arguments
   * @param config The parse configuration
   * @returns The options' values
   */
  parse(command?: string | Array<string>, config?: ParseConfig): OptionValues<T> {
    const result = {} as OptionValues<T>;
    super.parseInto(result, command, config);
    return result;
  }

  /**
   * Async version. Use this if the option definitions contain async callbacks.
   * @returns A promise that resolves to the options' values
   * @see parse
   */
  async parseAsync(
    command?: string | Array<string>,
    config?: ParseConfig,
  ): Promise<OptionValues<T>> {
    const result = {} as OptionValues<T>;
    await super.parseInto(result, command, config);
    return result;
  }

  /**
   * Parses command-line arguments into option values.
   * @param values The options' values to parse into
   * @param command The raw command line or command-line arguments
   * @param config The parse configuration
   * @returns A promise that can be awaited in order to resolve async callbacks.
   */
  parseInto(
    values: OptionValues<T>,
    command?: string | Array<string>,
    config?: ParseConfig,
  ): Promise<Array<void>> {
    return super.parseInto(values, command, config);
  }
}

/**
 * Implements the parsing loop.
 */
class ParserLoop {
  private readonly promises = new Array<Promise<void>>();
  private readonly specifiedKeys = new Set<string>();
  private readonly styles: ConcreteStyles;
  private readonly normalizeString: OptionValidator['normalizeString'];
  private readonly normalizeNumber: OptionValidator['normalizeNumber'];
  private readonly normalizeArray: OptionValidator['normalizeArray'];

  /**
   * Creates a parser loop.
   * @param validator The option validator
   * @param values The option values
   * @param args The command-line arguments
   * @param completing True if performing completion
   */
  constructor(
    private readonly validator: OptionValidator,
    private readonly values: CastToOptionValues,
    private readonly args: Array<string>,
    private readonly completing: boolean,
  ) {
    this.styles = validator.config.styles;
    for (const key in validator.options) {
      const option = validator.options[key];
      if (option.type !== 'help' && option.type !== 'version' && !(key in values)) {
        values[key] = undefined;
      }
    }
    this.normalizeString = validator.normalizeString.bind(validator);
    this.normalizeNumber = validator.normalizeNumber.bind(validator);
    this.normalizeArray = validator.normalizeArray.bind(validator);
  }

  /**
   * Loops through the command-line arguments.
   * @returns The list of async callback promises. Can be ignored if empty.
   */
  loop(): Array<Promise<void>> {
    function suggestName(option: ParamOption): boolean {
      return (
        argKind === ArgKind.positional ||
        (argKind === ArgKind.param && isArray(option) && isVariadic(option))
      );
    }

    let argKind: ArgKind | undefined;
    let singleParam = false;
    let value: string | undefined;
    let current: Positional | undefined;

    for (let i = 0; i < this.args.length; ++i) {
      const [arg, comp] = this.args[i].split('\0', 2);
      if (argKind === ArgKind.marker || singleParam) {
        value = arg;
      } else {
        [argKind, current, value] = parseOption(this.validator, arg, comp !== undefined, current);
        if (argKind !== ArgKind.param) {
          this.specifiedKeys.add(current.key);
          if (isArray(current.option)) {
            resetValue(this.values, current.key, current.option);
          }
        }
      }
      assert(current);
      const { key, name, option } = current;
      if (isNiladic(option)) {
        if (comp !== undefined) {
          throw ''; // use default completion (value !== undefined)
        } else if (!this.completing && value !== undefined) {
          throw this.validator.error(ErrorItem.optionInlineValue, { o: name });
        } else if (this.handleNiladic(key, option, name, i)) {
          return this.promises;
        }
        current = undefined;
      } else if (comp !== undefined) {
        if (option.complete) {
          this.handleComplete(option.complete, i, value);
          return this.promises;
        }
        handleCompletion(option, value);
        if (suggestName(option)) {
          handleNameCompletion(this.validator, value);
        }
        throw ''; // use default completion
      } else if (value !== undefined) {
        try {
          parseValue(
            this.values,
            key,
            option,
            name,
            value,
            this.normalizeString,
            this.normalizeNumber,
            this.normalizeArray,
          );
        } catch (err) {
          // do not propagate errors during completion
          if (!this.completing) {
            if (suggestName(option)) {
              handleUnknown(this.validator, value, err as ErrorMessage);
            }
            throw err;
          }
        }
        if (singleParam) {
          singleParam = false;
          current = undefined;
        }
      } else if (isArray(option) && isVariadic(option)) {
        continue;
      } else if (i + 1 == this.args.length) {
        throw this.validator.error(ErrorItem.missingParameter, { o: name });
      } else if (argKind !== ArgKind.marker) {
        singleParam = true;
      }
    }
    this.checkRequired();
    this.setDefaultValues();
    return this.promises;
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
    switch (option.type) {
      case 'flag':
        this.values[key] = !option.negationNames?.includes(name);
        return false;
      case 'function':
        return this.handleFunction(key, option, index);
      case 'command':
        return this.handleCommand(key, option, index);
      default:
        return this.handleSpecial(option);
    }
  }

  /**
   * Handles a function option.
   * @param key The option key
   * @param option The option definition
   * @param index The current argument index
   * @returns True if the parsing loop should be broken
   */
  private handleFunction(key: string, option: FunctionOption, index: number): boolean {
    if (option.break && !this.completing) {
      this.checkRequired();
    }
    try {
      const result = option.exec(this.values, this.completing, this.args.slice(index + 1));
      if (result instanceof Promise) {
        this.promises.push(
          result.then((val) => {
            this.values[key] = val;
          }),
        );
      } else {
        this.values[key] = result;
      }
    } catch (err) {
      if (this.completing) {
        // do not propagate errors during completion
        console.error(err);
        throw '';
      }
      throw err;
    }
    if (option.break && !this.completing) {
      this.setDefaultValues();
      return true;
    }
    return false;
  }

  /**
   * Handles a command option.
   * @param key The option key
   * @param option The option definition
   * @param index The current argument index
   * @returns True to break parsing loop (always)
   */
  private handleCommand(key: string, option: CommandOption, index: number): true {
    if (!this.completing) {
      this.checkRequired();
      this.setDefaultValues();
    }
    const values: CastToOptionValues = {};
    const options = typeof option.options === 'function' ? option.options() : option.options;
    const validator = new OptionValidator(options, this.validator.config);
    const args = this.args.slice(index + 1);
    const loop = new ParserLoop(validator, values, args, this.completing);
    this.promises.push(...loop.loop());
    if (!this.completing) {
      const result = option.cmd(this.values, values);
      if (result instanceof Promise) {
        this.promises.push(
          result.then((val) => {
            this.values[key] = val;
          }),
        );
      } else {
        this.values[key] = result;
      }
    }
    return true;
  }

  /**
   * Handles a special option.
   * @param option The option definition
   * @returns True if the parsing loop should be broken
   */
  private handleSpecial(option: SpecialOption): boolean {
    if (this.completing) {
      return false; // skip special options during completion
    }
    this.checkRequired();
    if (option.type === 'help') {
      handleHelp(this.validator, option);
    } else if (option.version) {
      throw option.version;
    } else if (option.resolve) {
      const promise = resolveVersion(this.validator, option.resolve);
      this.promises.push(promise);
    }
    return true;
  }

  /**
   * Handles the completion of an option that has a completion callback.
   * @param complete The completion callback
   * @param index The current argument index
   * @param param The option parameter, if any
   */
  private handleComplete(complete: CompleteCallback, index: number, param: string = '') {
    let result;
    try {
      result = complete(this.values, param, this.args.slice(index + 1));
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
   * Set options' values to their default value, if not previously set.
   */
  private setDefaultValues() {
    for (const key in this.validator.options) {
      const option = this.validator.options[key];
      if ('default' in option && !this.specifiedKeys.has(key)) {
        setDefaultValue(
          this.values,
          key,
          option,
          this.normalizeString,
          this.normalizeNumber,
          this.normalizeArray,
        );
      }
    }
  }

  /**
   * Checks if required options were correctly specified.
   */
  private checkRequired() {
    for (const key of this.validator.required) {
      if (!this.specifiedKeys.has(key)) {
        const option = this.validator.options[key];
        const name = option.preferredName ?? '';
        throw this.validator.error(ErrorItem.missingRequiredOption, { o: name });
      }
    }
    for (const key of this.specifiedKeys) {
      const option = this.validator.options[key];
      if (option.requires) {
        const error = new TerminalString();
        if (!this.checkRequires(option.requires, error)) {
          const name = option.preferredName ?? '';
          throw this.validator.error(ErrorItem.optionRequires, { o: name, t: error });
        }
      }
    }
  }

  /**
   * Checks the requirements of an option that was specified.
   * @param requires The option requirements
   * @param error The terminal string error
   * @param negate True if the requirements should be negated
   * @returns True if the requirement was satisfied
   */
  private checkRequires(requires: Requires, error: TerminalString, negate = false): boolean {
    if (typeof requires === 'string') {
      return this.checkRequirement([requires, undefined], error, negate);
    }
    if (requires instanceof RequiresNot) {
      return this.checkRequires(requires.item, error, !negate);
    }
    if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
      const and = requires instanceof RequiresAll !== negate;
      const itemFn = this.checkRequires.bind(this);
      return checkRequireItems(requires.items, itemFn, error, negate, and);
    }
    const entries = Object.entries(requires);
    const itemFn = this.checkRequirement.bind(this);
    return checkRequireItems(entries, itemFn, error, negate, !negate);
  }

  /**
   * Checks if a required option was specified with correct values.
   * @param kvp The required option key and value
   * @param error The terminal string error
   * @param negate True if the requirement should be negated
   * @returns True if the requirement was satisfied
   */
  private checkRequirement(
    kvp: [key: string, value: RequiresVal[string]],
    error: TerminalString,
    negate: boolean,
  ): boolean {
    const [key, value] = kvp;
    const option = this.validator.options[key];
    const specified = this.specifiedKeys.has(key);
    const required = value !== null;
    const withValue = required && value !== undefined;
    if (isNiladic(option) || !specified || !required || !withValue) {
      if ((specified && required != negate) || (!specified && required == negate && !withValue)) {
        return true;
      }
      if (specified) {
        error.addWord('no');
      }
      const name = option.preferredName ?? '';
      formatFunctions.o(name, this.styles, this.styles.text, error);
      return false;
    }
    return checkRequiredValue(
      this.values,
      option,
      negate,
      key,
      value,
      error,
      this.styles,
      this.normalizeString,
      this.normalizeNumber,
    );
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Parses an option from a command-line argument.
 * @param validator The option validator
 * @param arg The current argument
 * @param comp True if completing at the current iteration
 * @param current The current option information, if any
 * @returns A tuple of [ArgKind, current, value]
 */
function parseOption(
  validator: OptionValidator,
  arg: string,
  comp: boolean,
  current?: Positional,
): [ArgKind, Positional, string | undefined] {
  const [name, value] = arg.split(/=(.*)/, 2);
  const key = validator.names.get(name);
  if (key) {
    if (comp && value === undefined) {
      throw name;
    }
    if (validator.positional && name === validator.positional.marker) {
      if (comp) {
        throw ''; // use default completion
      }
      if (value !== undefined) {
        throw validator.error(ErrorItem.positionalInlineValue, { o: name });
      }
      return [ArgKind.marker, validator.positional, undefined];
    }
    current = { key, name, option: validator.options[key] };
    return [ArgKind.inline, current, value];
  }
  if (!current) {
    if (!validator.positional) {
      if (comp) {
        handleNameCompletion(validator, arg);
      }
      handleUnknown(validator, name);
    }
    return [ArgKind.positional, validator.positional, arg];
  }
  return [ArgKind.param, current, arg];
}

/**
 * Resolve a package version using a module-resolve function.
 * @param validator The option validator
 * @param resolve The resolve callback
 */
async function resolveVersion(
  validator: OptionValidator,
  resolve: ResolveCallback,
): Promise<never> {
  const { promises } = await import('fs');
  for (
    let path = './package.json', lastResolved = '', resolved = resolve(path);
    resolved != lastResolved;
    path = '../' + path, lastResolved = resolved, resolved = resolve(path)
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
  throw validator.error(ErrorItem.missingPackageJson);
}

/**
 * Handles the completion of an option with a parameter.
 * @param option The option definition
 * @param param The option parameter
 */
function handleCompletion(option: ParamOption, param?: string) {
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
}

/**
 * Handles an unknown option.
 * @param validator The option validator
 * @param name The unknown option name
 * @param msg The previous error message, if any
 */
function handleUnknown(validator: OptionValidator, name: string, err?: ErrorMessage): never {
  const similar = findSimilarNames(validator, name);
  if (err) {
    if (similar.length) {
      throw validator.error(ErrorItem.parseErrorWithSimilar, {
        o1: name,
        o2: similar,
        t: err.str,
      });
    }
    throw validator.error(ErrorItem.parseError, { o: name, t: err.str });
  }
  if (similar.length) {
    throw validator.error(ErrorItem.unknownOptionWithSimilar, { o1: name, o2: similar });
  }
  throw validator.error(ErrorItem.unknownOption, { o: name });
}

/**
 * Handles the special "help" option.
 * @param validator The option validator
 * @param option The option definition
 */
function handleHelp(validator: OptionValidator, option: HelpOption): never {
  function formatHeading(group: string): TerminalString {
    const heading = new TerminalString().addBreaks(1).addSequence(headingStyle);
    if (group) {
      heading.splitText(group).addWord('options:');
    } else {
      heading.addWord('Options:');
    }
    return heading.addBreaks(2).addSequence(style(tf.clear));
  }
  const help = new HelpMessage();
  if (option.usage) {
    help.push(new TerminalString().splitText(option.usage).addBreaks(1));
  }
  const groups = new HelpFormatter(validator, option.format).formatGroups();
  const headingStyle = option.headingStyle ?? style(tf.clear, tf.bold);
  for (const [group, message] of groups.entries()) {
    help.push(formatHeading(group), ...message);
  }
  if (option.footer) {
    help.push(new TerminalString().addBreaks(1).splitText(option.footer).addBreaks(1));
  }
  throw help;
}

/**
 * Gets a list of option names that are similar to a given name.
 * @param validator The option validator
 * @param name The option name
 * @param threshold The similarity threshold
 * @returns The list of similar names in decreasing order of similarity
 */
function findSimilarNames(
  validator: OptionValidator,
  name: string,
  threshold = 0.6,
): Array<string> {
  const names = [...validator.names.keys()];
  const searchName = name.replace(/\p{P}/gu, '').toLowerCase();
  return names
    .reduce((acc, name) => {
      const candidateName = name.replace(/\p{P}/gu, '').toLowerCase();
      const sim = gestaltSimilarity(searchName, candidateName);
      if (sim >= threshold) {
        acc.push([name, sim]);
      }
      return acc;
    }, new Array<[string, number]>())
    .sort(([, as], [, bs]) => bs - as)
    .map(([str]) => str);
}

/**
 * Handles the completion of an option name.
 * @param validator The option validator
 * @param prefix The name prefix, if any
 */
function handleNameCompletion(validator: OptionValidator, prefix?: string): never {
  const names = [...validator.names.keys()];
  const prefixedNames = prefix ? names.filter((name) => name.startsWith(prefix)) : names;
  throw prefixedNames.join('\n');
}

/**
 * Checks the items of a requirement expression or object.
 * @param items The list of requirement items
 * @param itemFn The callback to execute on each item
 * @param negate True if the requirement should be negated
 * @param and If true, return on the first error; else return on the first success
 * @returns True if the requirement was satisfied
 */
function checkRequireItems<T>(
  items: Array<T>,
  itemFn: (item: T, error: TerminalString, negate: boolean) => boolean,
  error: TerminalString,
  negate: boolean,
  and: boolean,
): boolean {
  if (!and && items.length > 1) {
    error.addOpening('(');
  }
  let first = true;
  for (const item of items) {
    if (and || first) {
      first = false;
    } else {
      error.addWord('or');
    }
    const success = itemFn(item, error, negate);
    if (success !== and) {
      return success;
    }
  }
  if (and) {
    return true;
  }
  if (items.length > 1) {
    error.addClosing(')');
  }
  return false;
}

/**
 * Parses the value of an array option parameter.
 * @template O The type of the option
 * @template T The type of the parsed array element
 * @param values The option values
 * @param key The option key
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @param convertFn The function to convert from string
 * @param normalizeFn The function to normalize the value after conversion
 */
function parseArray<O extends ArrayOption, T extends Exclude<O['example'], undefined>[number]>(
  values: CastToOptionValues,
  key: string,
  option: O,
  name: string,
  value: string,
  convertFn: (value: string) => T,
  normalizeFn: (option: O, name: string, value: T) => T,
  normalizeArrayFn: (option: O, name: string, value: Array<T>) => void,
) {
  let result: Array<T> | Promise<Array<T>>;
  const previous = values[key] as typeof result;
  if ('parse' in option && option.parse) {
    const res = option.parse(name, value);
    if (res instanceof Promise) {
      result = res.then(async (val) => {
        const prev = await previous;
        prev.push(normalizeFn(option, name, val as T));
        normalizeArrayFn(option, name, prev);
        return prev;
      });
    } else {
      result = [normalizeFn(option, name, res as T)];
    }
  } else if ('parseDelimited' in option && option.parseDelimited) {
    const res = option.parseDelimited(name, value);
    if (res instanceof Promise) {
      result = res.then(async (vals) => {
        const prev = await previous;
        prev.push(...vals.map((val) => normalizeFn(option, name, val as T)));
        normalizeArrayFn(option, name, prev);
        return prev;
      });
    } else {
      result = res.map((val) => normalizeFn(option, name, val as T));
    }
  } else {
    const vals =
      'separator' in option && option.separator
        ? value.split(option.separator).map((val) => convertFn(val))
        : [convertFn(value)];
    result = vals.map((val) => normalizeFn(option, name, val as T));
  }
  if (result instanceof Promise) {
    values[key] = result;
  } else if (previous instanceof Promise) {
    const res = result;
    values[key] = previous.then((vals) => {
      vals.push(...res);
      normalizeArrayFn(option, name, vals);
      return vals;
    });
  } else {
    previous.push(...result);
    normalizeArrayFn(option, name, previous);
  }
}

/**
 * Parses the value of a single-valued option parameter.
 * @param values The option values
 * @param key The option key
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @param convertFn The function to convert from string
 * @param normalizeFn The function to normalize the value after conversion
 */
function parseSingle<O extends SingleOption, T extends Exclude<O['example'], undefined>>(
  values: CastToOptionValues,
  key: string,
  option: O,
  name: string,
  value: string,
  convertFn: (value: string) => T,
  normalizeFn?: (option: O, name: string, value: T) => T,
) {
  const result = 'parse' in option && option.parse ? option.parse(name, value) : convertFn(value);
  setSingle(values, key, option, name, result as T | Promise<T>, normalizeFn);
}

/**
 * Gets the value of a single-valued option parameter.
 * @param values The option values
 * @param key The option key
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @param normalizeFn The function to normalize the value after conversion
 */
function setSingle<O extends SingleOption, T extends Exclude<O['example'], undefined>>(
  values: CastToOptionValues,
  key: string,
  option: O,
  name: string,
  value: T | Promise<T>,
  normalizeFn?: (option: O, name: string, value: T) => T,
) {
  if (normalizeFn) {
    if (value instanceof Promise) {
      value = value.then((val) => normalizeFn(option, name, val));
    } else {
      value = normalizeFn(option, name, value);
    }
  }
  values[key] = value;
}

/**
 * Gets the value of an array-valued option parameter.
 * @param values The option values
 * @param key The option key
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @param normalizeFn The function to normalize the value after conversion
 */
function setArray<O extends ArrayOption, T extends Exclude<O['example'], undefined>[number]>(
  values: CastToOptionValues,
  key: string,
  option: O,
  name: string,
  value: ReadonlyArray<T> | Promise<ReadonlyArray<T>>,
  normalizeFn: (option: O, name: string, value: T) => T,
  normalizeArrayFn: (option: O, name: string, value: Array<T>) => void,
) {
  let result: Array<T> | Promise<Array<T>>;
  if (value instanceof Promise) {
    result = value.then((vals) => {
      const normalized = vals.map((val) => normalizeFn(option, name, val));
      normalizeArrayFn(option, name, normalized);
      return normalized;
    });
  } else {
    result = value.map((val) => normalizeFn(option, name, val));
    normalizeArrayFn(option, name, result);
  }
  values[key] = result;
}

/**
 * Parses the value of an option parameter.
 * @param values The option values
 * @param key The option key
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @param normalizeStr The normalization function for strings
 * @param normalizeNum The normalization function for numbers
 * @param normalizeArr The normalization function for arrays
 */
function parseValue(
  values: CastToOptionValues,
  key: string,
  option: ParamOption,
  name: string,
  value: string,
  normalizeStr: OptionValidator['normalizeString'],
  normalizeNum: OptionValidator['normalizeNumber'],
  normalizeArr: OptionValidator['normalizeArray'],
) {
  switch (option.type) {
    case 'boolean': {
      const convertFn = (str: string) => !(Number(str) == 0 || str.trim().match(/^\s*false\s*$/i));
      return parseSingle(values, key, option, name, value, convertFn);
    }
    case 'string':
      return parseSingle(values, key, option, name, value, (str) => str, normalizeStr);
    case 'number':
      return parseSingle(values, key, option, name, value, Number, normalizeNum);
    case 'strings':
      return parseArray(values, key, option, name, value, (str) => str, normalizeStr, normalizeArr);
    case 'numbers':
      return parseArray(values, key, option, name, value, Number, normalizeNum, normalizeArr);
    default: {
      const _exhaustiveCheck: never = option;
      return _exhaustiveCheck;
    }
  }
}

/**
 * Resets the value of an array option.
 * @param values The option values
 * @param key The option key
 * @param option The option definition
 */
function resetValue(values: CastToOptionValues, key: string, option: ArrayOption) {
  type ArrayVal =
    | Array<string>
    | Array<number>
    | Promise<Array<string>>
    | Promise<Array<number>>
    | undefined;
  const previous = values[key] as ArrayVal;
  if (!previous) {
    values[key] = [];
  } else if (!option.append) {
    if (previous instanceof Promise) {
      const promise = previous.then((val) => {
        val.length = 0;
        return val;
      });
      values[key] = promise;
    } else {
      previous.length = 0;
    }
  }
}

/**
 * Checks the required value of a single-parameter option against a specified value.
 * @param values The option values
 * @param option The option definition
 * @param negate True if the requirement should be negated
 * @param key The required option key
 * @param value The required value
 * @param error The terminal string error
 * @param styles The error message styles
 * @param formatFn The function to convert to string
 * @param normalizeFn The function to normalize the required value
 * @returns True if the requirement was satisfied
 */
function checkSingle<O extends SingleOption, T extends Exclude<O['example'], undefined>>(
  values: CastToOptionValues,
  option: O,
  negate: boolean,
  key: string,
  value: T,
  error: TerminalString,
  styles: ConcreteStyles,
  formatFn: (value: T, styles: ConcreteStyles, style: Style, result: TerminalString) => void,
  normalizeFn?: (option: O, name: string, value: T) => T,
): boolean {
  const actual = values[key] as T | Promise<T>;
  if (actual instanceof Promise) {
    return true; // ignore promises during requirement checking
  }
  const name = option.preferredName ?? '';
  const expected = normalizeFn ? normalizeFn(option, name, value) : value;
  if ((actual === expected) !== negate) {
    return true;
  }
  formatFunctions.o(name, styles, styles.text, error);
  error.addWord(negate ? '!=' : '=');
  formatFn(expected, styles, styles.text, error);
  return false;
}

/**
 * Checks the required value of an array option against a specified value.
 * @param values The option values
 * @param option The option definition
 * @param negate True if the requirement should be negated
 * @param key The required option key
 * @param value The required value
 * @param error The terminal string error
 * @param styles The error message styles
 * @param formatFn The function to convert to string
 * @param normalizeFn The function to normalize the required value
 * @returns True if the requirement was satisfied
 */
function checkArray<O extends ArrayOption, T extends Exclude<O['example'], undefined>[number]>(
  values: CastToOptionValues,
  option: O,
  negate: boolean,
  key: string,
  value: ReadonlyArray<T>,
  error: TerminalString,
  styles: ConcreteStyles,
  formatFn: (value: T, styles: ConcreteStyles, style: Style, result: TerminalString) => void,
  normalizeFn: (option: O, name: string, value: T) => T,
): boolean {
  const actual = values[key] as Array<T> | Promise<Array<T>>;
  if (actual instanceof Promise) {
    return true; // ignore promises during requirement checking
  }
  const name = option.preferredName ?? '';
  const expected = value.map((val) => normalizeFn(option, name, val));
  if (checkRequiredArray(actual, expected, negate, option.unique === true)) {
    return true;
  }
  formatFunctions.o(name, styles, styles.text, error);
  error.addWord(negate ? '!=' : '=').addOpening('[');
  expected.forEach((val, i) => {
    formatFn(val, styles, styles.text, error);
    if (i < expected.length - 1) {
      error.addClosing(',');
    }
  });
  error.addClosing(']');
  return false;
}

/**
 * Checks an option's required value against a specified value.
 * @param values The option values
 * @param option The option definition
 * @param negate True if the requirement should be negated
 * @param key The required option key (to get the specified value)
 * @param value The required value
 * @param error The terminal string error
 * @param styles The error message styles
 * @param normalizeStr The normalization function for strings
 * @param normalizeNum The normalization function for numbers
 * @returns True if the requirement was satisfied
 */
function checkRequiredValue(
  values: CastToOptionValues,
  option: ParamOption,
  negate: boolean,
  key: string,
  value: Exclude<RequiresVal[string], undefined | null>,
  error: TerminalString,
  styles: ConcreteStyles,
  normalizeStr: OptionValidator['normalizeString'],
  normalizeNum: OptionValidator['normalizeNumber'],
): boolean {
  switch (option.type) {
    case 'boolean':
      return checkSingle(
        values,
        option,
        negate,
        key,
        value as boolean,
        error,
        styles,
        formatFunctions.b,
      );
    case 'string':
      return checkSingle(
        values,
        option,
        negate,
        key,
        value as string,
        error,
        styles,
        formatFunctions.s,
        normalizeStr,
      );
    case 'number':
      return checkSingle(
        values,
        option,
        negate,
        key,
        value as number,
        error,
        styles,
        formatFunctions.n,
        normalizeNum,
      );
    case 'strings':
      return checkArray(
        values,
        option,
        negate,
        key,
        value as ReadonlyArray<string>,
        error,
        styles,
        formatFunctions.s,
        normalizeStr,
      );
    case 'numbers':
      return checkArray(
        values,
        option,
        negate,
        key,
        value as ReadonlyArray<number>,
        error,
        styles,
        formatFunctions.n,
        normalizeNum,
      );
    default: {
      const _exhaustiveCheck: never = option;
      return _exhaustiveCheck;
    }
  }
}

/**
 * Sets the normalized default value of an option.
 * @param values The option values
 * @param name The option key
 * @param option The option definition
 * @param normalizeStr The normalization function for strings
 * @param normalizeNum The normalization function for numbers
 * @param normalizeArr The normalization function for arrays
 */
function setDefaultValue(
  values: CastToOptionValues,
  key: string,
  option: ValuedOption,
  normalizeStr: OptionValidator['normalizeString'],
  normalizeNum: OptionValidator['normalizeNumber'],
  normalizeArr: OptionValidator['normalizeArray'],
) {
  if (option.default === undefined) {
    values[key] = undefined;
    return;
  }
  const value = typeof option.default === 'function' ? option.default(values) : option.default;
  switch (option.type) {
    case 'flag':
    case 'boolean': {
      values[key] = value;
      break;
    }
    case 'string':
      return setSingle(values, key, option, key, value as string, normalizeStr);
    case 'number':
      return setSingle(values, key, option, key, value as number, normalizeNum);
    case 'strings':
      return setArray(values, key, option, key, value as Array<string>, normalizeStr, normalizeArr);
    case 'numbers':
      return setArray(values, key, option, key, value as Array<number>, normalizeNum, normalizeArr);
    default: {
      const _exhaustiveCheck: never = option;
      return _exhaustiveCheck;
    }
  }
}
