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
import { assert, checkRequiredArray, gestaltSimilarity, getArgs } from './utils';
import { OptionValidator, defaultConfig, formatFunctions, ErrorItem } from './validator';

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
        [argKind, current, value] = this.parseOption(arg, comp !== undefined, current);
        if (argKind !== ArgKind.param) {
          this.specifiedKeys.add(current.key);
          if (isArray(current.option)) {
            this.resetValue(current.key, current.option);
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
        this.handleCompletion(option, value);
        if (suggestName(option)) {
          this.handleNameCompletion(value);
        }
        throw ''; // use default completion
      } else if (value !== undefined) {
        try {
          this.parseValue(key, option, name, value);
        } catch (err) {
          // do not propagate errors during completion
          if (!this.completing) {
            if (suggestName(option)) {
              this.handleUnknown(value, err as ErrorMessage);
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
   * Parses an option from a command-line argument.
   * @param arg The current argument
   * @param comp True if completing at the current iteration
   * @param current The current option information, if any
   * @returns A tuple of [ArgKind, current, value]
   */
  private parseOption(
    arg: string,
    comp: boolean,
    current?: Positional,
  ): [ArgKind, Positional, string | undefined] {
    const [name, value] = arg.split(/=(.*)/, 2);
    const key = this.validator.names.get(name);
    if (key) {
      if (comp && value === undefined) {
        throw name;
      }
      if (this.validator.positional && name === this.validator.positional.marker) {
        if (comp) {
          throw ''; // use default completion
        }
        if (value !== undefined) {
          throw this.validator.error(ErrorItem.positionalInlineValue, { o: name });
        }
        return [ArgKind.marker, this.validator.positional, undefined];
      }
      current = { key, name, option: this.validator.options[key] };
      return [ArgKind.inline, current, value];
    }
    if (!current) {
      if (!this.validator.positional) {
        if (comp) {
          this.handleNameCompletion(arg);
        }
        this.handleUnknown(name);
      }
      return [ArgKind.positional, this.validator.positional, arg];
    }
    return [ArgKind.param, current, arg];
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
      this.handleHelp(option);
    } else if (option.version) {
      throw option.version;
    } else if (option.resolve) {
      this.promises.push(this.resolveVersion(option.resolve));
    }
    return true;
  }

  /**
   * Resolve a package version using a module-resolve function.
   * @param resolve The resolve callback
   */
  private async resolveVersion(resolve: ResolveCallback): Promise<never> {
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
    throw this.validator.error(ErrorItem.missingPackageJson);
  }

  /**
   * Handles the completion of an option with a parameter.
   * @param option The option definition
   * @param param The option parameter
   */
  private handleCompletion(option: ParamOption, param?: string) {
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
   * Handles an unknown option.
   * @param name The unknown option name
   * @param msg The previous error message, if any
   */
  private handleUnknown(name: string, err?: ErrorMessage): never {
    const similar = this.findSimilarNames(name);
    if (err) {
      if (similar.length) {
        throw this.validator.error(ErrorItem.parseErrorWithSimilar, {
          o1: name,
          o2: similar,
          t: err.str,
        });
      }
      throw this.validator.error(ErrorItem.parseError, { o: name, t: err.str });
    }
    if (similar.length) {
      throw this.validator.error(ErrorItem.unknownOptionWithSimilar, { o1: name, o2: similar });
    }
    throw this.validator.error(ErrorItem.unknownOption, { o: name });
  }

  /**
   * Handles the completion of an option name.
   * @param prefix The name prefix, if any
   */
  private handleNameCompletion(prefix?: string): never {
    const names = [...this.validator.names.keys()];
    const prefixedNames = prefix ? names.filter((name) => name.startsWith(prefix)) : names;
    throw prefixedNames.join('\n');
  }

  /**
   * Handles the special "help" option.
   * @param option The option definition
   */
  private handleHelp(option: HelpOption): never {
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
    const groups = new HelpFormatter(this.validator, option.format).formatGroups();
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
   * Set options' values to their default value, if not previously set.
   */
  private setDefaultValues() {
    for (const key in this.validator.options) {
      const option = this.validator.options[key];
      if ('default' in option && !this.specifiedKeys.has(key)) {
        this.setDefaultValue(key, option);
      }
    }
  }

  /**
   * Sets the normalized default value of an option.
   * @param name The option key
   * @param option The option definition
   */
  private setDefaultValue(key: string, option: ValuedOption) {
    if (option.default === undefined) {
      this.values[key] = undefined;
      return;
    }
    const value =
      typeof option.default === 'function' ? option.default(this.values) : option.default;
    switch (option.type) {
      case 'flag':
      case 'boolean': {
        this.values[key] = value;
        break;
      }
      case 'string':
        return this.setSingle(key, option, key, value as string, this.normalizeString);
      case 'number':
        return this.setSingle(key, option, key, value as number, this.normalizeNumber);
      case 'strings':
        return this.setArray(key, option, key, value as Array<string>, this.normalizeString);
      case 'numbers':
        return this.setArray(key, option, key, value as Array<number>, this.normalizeNumber);
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
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
    return [...this.validator.names.keys()]
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
    return this.checkRequiredValue(option, negate, key, value, error);
  }

  /**
   * Checks an option's required value against a specified value.
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param key The required option key (to get the specified value)
   * @param value The required value
   * @param error The terminal string error
   * @returns True if the requirement was satisfied
   */
  private checkRequiredValue(
    option: ParamOption,
    negate: boolean,
    key: string,
    value: Exclude<RequiresVal[string], undefined | null>,
    error: TerminalString,
  ): boolean {
    const [ns, nn] = [this.normalizeString, this.normalizeNumber];
    switch (option.type) {
      case 'boolean':
        return this.checkSingle(option, negate, key, value as boolean, error, formatFunctions.b);
      case 'string':
        return this.checkSingle(option, negate, key, value as string, error, formatFunctions.s, ns);
      case 'number':
        return this.checkSingle(option, negate, key, value as number, error, formatFunctions.n, nn);
      case 'strings':
        return this.checkArray(
          option,
          negate,
          key,
          value as ReadonlyArray<string>,
          error,
          formatFunctions.s,
          ns,
        );
      case 'numbers':
        return this.checkArray(
          option,
          negate,
          key,
          value as ReadonlyArray<number>,
          error,
          formatFunctions.n,
          nn,
        );
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Checks the required value of a single-parameter option against a specified value.
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param key The required option key
   * @param value The required value
   * @param error The terminal string error
   * @param formatFn The function to convert to string
   * @param normalizeFn The function to normalize the required value
   * @returns True if the requirement was satisfied
   */
  private checkSingle<O extends SingleOption, T extends Exclude<O['example'], undefined>>(
    option: O,
    negate: boolean,
    key: string,
    value: T,
    error: TerminalString,
    formatFn: (value: T, styles: ConcreteStyles, style: Style, result: TerminalString) => void,
    normalizeFn?: (option: O, name: string, value: T) => T,
  ): boolean {
    const actual = this.values[key] as T | Promise<T>;
    if (actual instanceof Promise) {
      return true; // ignore promises during requirement checking
    }
    const name = option.preferredName ?? '';
    const expected = normalizeFn ? normalizeFn(option, name, value) : value;
    if ((actual === expected) !== negate) {
      return true;
    }
    formatFunctions.o(name, this.styles, this.styles.text, error);
    error.addWord(negate ? '!=' : '=');
    formatFn(expected, this.styles, this.styles.text, error);
    return false;
  }

  /**
   * Checks the required value of an array option against a specified value.
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param key The required option key
   * @param value The required value
   * @param error The terminal string error
   * @param formatFn The function to convert to string
   * @param normalizeFn The function to normalize the required value
   * @returns True if the requirement was satisfied
   */
  private checkArray<O extends ArrayOption, T extends Exclude<O['example'], undefined>[number]>(
    option: O,
    negate: boolean,
    key: string,
    value: ReadonlyArray<T>,
    error: TerminalString,
    formatFn: (value: T, styles: ConcreteStyles, style: Style, result: TerminalString) => void,
    normalizeFn: (option: O, name: string, value: T) => T,
  ): boolean {
    const actual = this.values[key] as Array<T> | Promise<Array<T>>;
    if (actual instanceof Promise) {
      return true; // ignore promises during requirement checking
    }
    const name = option.preferredName ?? '';
    const expected = value.map((val) => normalizeFn(option, name, val));
    if (checkRequiredArray(actual, expected, negate, option.unique === true)) {
      return true;
    }
    formatFunctions.o(name, this.styles, this.styles.text, error);
    error.addWord(negate ? '!=' : '=').addOpening('[');
    expected.forEach((val, i) => {
      formatFn(val, this.styles, this.styles.text, error);
      if (i < expected.length - 1) {
        error.addClosing(',');
      }
    });
    error.addClosing(']');
    return false;
  }

  /**
   * Resets the value of an array option.
   * @param key The option key
   * @param option The option definition
   */
  private resetValue(key: string, option: ArrayOption) {
    type ArrayVal =
      | Array<string>
      | Array<number>
      | Promise<Array<string>>
      | Promise<Array<number>>
      | undefined;
    const previous = this.values[key] as ArrayVal;
    if (!previous) {
      this.values[key] = [];
    } else if (!option.append) {
      if (previous instanceof Promise) {
        const promise = previous.then((val) => {
          val.length = 0;
          return val;
        });
        this.values[key] = promise;
      } else {
        previous.length = 0;
      }
    }
  }

  /**
   * Parses the value of an option parameter.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The parameter value
   */
  private parseValue(key: string, option: ParamOption, name: string, value: string) {
    switch (option.type) {
      case 'boolean': {
        const convertFn = (str: string) =>
          !(Number(str) == 0 || str.trim().match(/^\s*false\s*$/i));
        return this.parseSingle(key, option, name, value, convertFn);
      }
      case 'string':
        return this.parseSingle(key, option, name, value, (str) => str, this.normalizeString);
      case 'number':
        return this.parseSingle(key, option, name, value, Number, this.normalizeNumber);
      case 'strings':
        return this.parseArray(key, option, name, value, (str) => str, this.normalizeString);
      case 'numbers':
        return this.parseArray(key, option, name, value, Number, this.normalizeNumber);
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Parses the value of a single-valued option parameter.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The parameter value
   * @param convertFn The function to convert from string
   * @param normalizeFn The function to normalize the value after conversion
   */
  private parseSingle<O extends SingleOption, T extends Exclude<O['example'], undefined>>(
    key: string,
    option: O,
    name: string,
    value: string,
    convertFn: (value: string) => T,
    normalizeFn?: (option: O, name: string, value: T) => T,
  ) {
    const result = 'parse' in option && option.parse ? option.parse(name, value) : convertFn(value);
    this.setSingle(key, option, name, result as T | Promise<T>, normalizeFn);
  }

  /**
   * Gets the value of a single-valued option parameter.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The parameter value
   * @param normalizeFn The function to normalize the value after conversion
   */
  private setSingle<O extends SingleOption, T extends Exclude<O['example'], undefined>>(
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
    this.values[key] = value;
  }

  /**
   * Gets the value of an array-valued option parameter.
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The parameter value
   * @param normalizeFn The function to normalize the value after conversion
   */
  private setArray<O extends ArrayOption, T extends Exclude<O['example'], undefined>[number]>(
    key: string,
    option: O,
    name: string,
    value: ReadonlyArray<T> | Promise<ReadonlyArray<T>>,
    normalizeFn: (option: O, name: string, value: T) => T,
  ) {
    let result: Array<T> | Promise<Array<T>>;
    if (value instanceof Promise) {
      result = value.then((vals) => {
        const normalized = vals.map((val) => normalizeFn(option, name, val));
        this.validator.normalizeArray(option, name, normalized);
        return normalized;
      });
    } else {
      result = value.map((val) => normalizeFn(option, name, val));
      this.validator.normalizeArray(option, name, result);
    }
    this.values[key] = result;
  }

  /**
   * Parses the value of an array option parameter.
   * @template O The type of the option
   * @template T The type of the parsed array element
   * @param key The option key
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The parameter value
   * @param convertFn The function to convert from string
   * @param normalizeFn The function to normalize the value after conversion
   */
  private parseArray<O extends ArrayOption, T extends Exclude<O['example'], undefined>[number]>(
    key: string,
    option: O,
    name: string,
    value: string,
    convertFn: (value: string) => T,
    normalizeFn: (option: O, name: string, value: T) => T,
  ) {
    let result: Array<T> | Promise<Array<T>>;
    const previous = this.values[key] as typeof result;
    if ('parse' in option && option.parse) {
      const res = option.parse(name, value);
      if (res instanceof Promise) {
        result = res.then(async (val) => {
          const prev = await previous;
          prev.push(normalizeFn(option, name, val as T));
          this.validator.normalizeArray(option, name, prev);
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
          this.validator.normalizeArray(option, name, prev);
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
      this.values[key] = result;
    } else if (previous instanceof Promise) {
      const res = result;
      this.values[key] = previous.then((vals) => {
        vals.push(...res);
        this.validator.normalizeArray(option, name, vals);
        return vals;
      });
    } else {
      previous.push(...result);
      this.validator.normalizeArray(option, name, previous);
    }
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
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
