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
  RequiresVal,
  ValuedOption,
  SpecialOption,
  FunctionOption,
  NiladicOption,
  CompleteCallback,
  OtherStyles,
  ArrayOption,
  SingleOption,
  ResolveCallback,
  CommandOption,
  CastToOptionValues,
} from './options';

import {
  OptionRegistry,
  RequiresAll,
  RequiresNot,
  RequiresOne,
  defaultStyles,
  isArray,
  isVariadic,
  isNiladic,
} from './options';
import { HelpFormatter } from './formatter';
import { HelpMessage, TerminalString, style, tf } from './styles';

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
  private readonly registry: OptionRegistry;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The option definitions
   * @param styles The error message styles
   */
  constructor(options: Options, styles?: OtherStyles) {
    const concreteStyles = Object.assign({}, defaultStyles, styles);
    this.registry = new OptionRegistry(options, concreteStyles);
  }

  /**
   * Validates the option definitions. This should only be called during development and in unit
   * tests, but should be skipped in production.
   * @returns The parser instance
   */
  validate(): this {
    this.registry.validate();
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
    const loop = new ParserLoop(this.registry, values, args, completing);
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
   * @param styles The error message styles
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(options: T, styles?: OtherStyles) {
    super(options, styles);
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
  private readonly formatOption: OptionRegistry['formatOption'];
  private readonly formatBoolean: OptionRegistry['formatBoolean'];
  private readonly formatString: OptionRegistry['formatString'];
  private readonly formatNumber: OptionRegistry['formatNumber'];
  private readonly normalizeString: OptionRegistry['normalizeString'];
  private readonly normalizeNumber: OptionRegistry['normalizeNumber'];

  /**
   * Creates a parser loop.
   * @param registry The option registry
   * @param values The option values
   * @param args The command-line arguments
   * @param completing True if performing completion
   */
  constructor(
    private readonly registry: OptionRegistry,
    private readonly values: CastToOptionValues,
    private readonly args: Array<string>,
    private readonly completing: boolean,
  ) {
    for (const key in registry.options) {
      const option = registry.options[key];
      if (option.type !== 'help' && option.type !== 'version' && !(key in values)) {
        values[key] = undefined;
      }
    }
    this.formatOption = registry.formatOption.bind(registry);
    this.formatBoolean = registry.formatBoolean.bind(registry);
    this.formatString = registry.formatString.bind(registry);
    this.formatNumber = registry.formatNumber.bind(registry);
    this.normalizeString = registry.normalizeString.bind(registry);
    this.normalizeNumber = registry.normalizeNumber.bind(registry);
  }

  /**
   * Loops through the command-line arguments.
   * @returns The list of async callback promises. Can be ignored if empty.
   */
  loop(): Array<Promise<void>> {
    function assert(_condition: unknown): asserts _condition {}
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
          throw this.registry.error(
            `Option ${this.formatOption(name)} does not accept inline values.`,
          );
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
              const msg =
                (err as Error).message.replace(/^(?:\x9b[\d;]+m)+|\x9b0m$/g, '') +
                `\nDid you mean to specify an option name instead of ${this.formatOption(value)}?`;
              this.handleUnknown(value, msg);
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
        throw this.registry.error(`Missing parameter to ${this.formatOption(name)}.`);
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
    const key = this.registry.names.get(name);
    if (key) {
      if (comp && value === undefined) {
        throw name;
      }
      if (this.registry.positional && name === this.registry.positional.marker) {
        if (comp) {
          throw ''; // use default completion
        }
        if (value !== undefined) {
          throw this.registry.error(
            `Positional marker ${this.formatOption(name)} does not accept inline values.`,
          );
        }
        return [ArgKind.marker, this.registry.positional, undefined];
      }
      current = { key, name, option: this.registry.options[key] };
      return [ArgKind.inline, current, value];
    }
    if (!current) {
      if (!this.registry.positional) {
        if (comp) {
          this.handleNameCompletion(arg);
        }
        this.handleUnknown(name);
      }
      return [ArgKind.positional, this.registry.positional, arg];
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
    const registry = new OptionRegistry(options, this.registry.styles);
    const args = this.args.slice(index + 1);
    const loop = new ParserLoop(registry, values, args, this.completing);
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
    throw this.registry.error(`Could not find a 'package.json' file.`);
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
   * @param msg The error message, if any
   */
  private handleUnknown(name: string, msg?: string): never {
    if (!msg) {
      msg = `Unknown option ${this.formatOption(name)}.`;
    }
    const similar = this.findSimilarNames(name);
    if (similar.length) {
      const optNames = similar.map((str) => this.formatOption(str));
      msg += `\nSimilar names are: ${optNames.join(', ')}.`;
    }
    throw this.registry.error(msg);
  }

  /**
   * Handles the completion of an option name.
   * @param prefix The name prefix, if any
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
    const groups = new HelpFormatter(this.registry.options, option.format).formatGroups();
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
    for (const key in this.registry.options) {
      const option = this.registry.options[key];
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
    switch (option.type) {
      case 'flag':
      case 'boolean': {
        const value =
          typeof option.default === 'function' ? option.default(this.values) : option.default;
        this.values[key] = value;
        break;
      }
      case 'string': {
        const value =
          typeof option.default === 'function' ? option.default(this.values) : option.default;
        this.setSingle(key, option, key, value, this.normalizeString);
        break;
      }
      case 'number': {
        const value =
          typeof option.default === 'function' ? option.default(this.values) : option.default;
        this.setSingle(key, option, key, value, this.normalizeNumber);
        break;
      }
      case 'strings': {
        const value =
          typeof option.default === 'function' ? option.default(this.values) : option.default;
        this.setArray(key, option, key, value, this.normalizeString);
        break;
      }
      case 'numbers': {
        const value =
          typeof option.default === 'function' ? option.default(this.values) : option.default;
        this.setArray(key, option, key, value, this.normalizeNumber);
        break;
      }
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
        const name = option.preferredName ?? option.names?.find((name) => name) ?? 'unnamed';
        throw this.registry.error(`Option ${this.formatOption(name)} is required.`);
      }
    }
    for (const key of this.specifiedKeys) {
      const option = this.registry.options[key];
      if (option.requires) {
        const error = this.checkRequires(option.requires);
        if (error) {
          const name = option.preferredName ?? option.names?.find((name) => name) ?? 'unnamed';
          throw this.registry.error(`Option ${this.formatOption(name)} requires ${error}.`);
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
      return this.checkRequirement([requires, undefined], negate);
    }
    if (requires instanceof RequiresNot) {
      return this.checkRequires(requires.item, !negate);
    }
    if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
      const errors = requires instanceof RequiresAll === negate ? undefined : null;
      return checkRequireItems(requires.items, this.checkRequires.bind(this), negate, errors);
    }
    const entries = Object.entries(requires);
    const errors = negate ? undefined : null;
    return checkRequireItems(entries, this.checkRequirement.bind(this), negate, errors);
  }

  /**
   * Checks if a required option was specified with correct values.
   * @param kvp The required option key and value
   * @param negate True if the requirement should be negated
   * @returns An error reason or null if no error
   */
  private checkRequirement(
    kvp: [key: string, value: RequiresVal[string]],
    negate: boolean,
  ): string | null {
    const [key, value] = kvp;
    const option = this.registry.options[key];
    const name = option.preferredName ?? option.names?.find((name) => name) ?? 'unnamed';
    const specified = this.specifiedKeys.has(key);
    const required = value !== null;
    const withValue = required && value !== undefined;
    if (isNiladic(option) || !specified || !required || !withValue) {
      return specified
        ? required == negate
          ? `no ${this.formatOption(name)}`
          : null
        : withValue || required != negate
          ? this.formatOption(name)
          : null;
    }
    return this.checkRequiredValue(name, option, negate, key, value);
  }

  /**
   * Checks an option's required value against a specified value.
   * @param name The option name
   * @param option The option definition
   * @param negate True if the requirement should be negated
   * @param key The required option key (to get the specified value)
   * @param value The required value
   * @returns An error reason or null if no error
   */
  private checkRequiredValue(
    name: string,
    option: ParamOption,
    negate: boolean,
    key: string,
    value: Exclude<RequiresVal[string], undefined | null>,
  ): string | null {
    function assert(_condition: unknown): asserts _condition {}
    switch (option.type) {
      case 'boolean': {
        assert(typeof value == 'boolean');
        return this.checkRequiredSingle(name, option, negate, key, value, this.formatBoolean);
      }
      case 'string': {
        assert(typeof value === 'string');
        return this.checkRequiredSingle(
          name,
          option,
          negate,
          key,
          value,
          this.formatString,
          this.normalizeString,
        );
      }
      case 'number': {
        assert(typeof value === 'number');
        return this.checkRequiredSingle(
          name,
          option,
          negate,
          key,
          value,
          this.formatNumber,
          this.normalizeNumber,
        );
      }
      case 'strings': {
        assert(typeof value === 'object');
        return this.checkRequiredArray(
          name,
          option,
          negate,
          key,
          value as Array<string>,
          this.formatString,
          this.normalizeString,
        );
      }
      case 'numbers': {
        assert(typeof value === 'object');
        return this.checkRequiredArray(
          name,
          option,
          negate,
          key,
          value as Array<number>,
          this.formatNumber,
          this.normalizeNumber,
        );
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
    const actual = this.values[key] as T | Promise<T>;
    if (actual instanceof Promise) {
      return null; // ignore promises during requirement checking
    }
    const expected = normalizeFn ? normalizeFn(option, name, value) : value;
    if ((actual === expected) !== negate) {
      return null;
    }
    const optName = this.formatOption(name);
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
    const actual = this.values[key] as Array<T> | Promise<Array<T>>;
    if (actual instanceof Promise) {
      return null; // ignore promises during requirement checking
    }
    const expected = value.map((val) => normalizeFn(option, name, val));
    if (checkRequiredArray(actual, expected, negate, option.unique === true)) {
      return null;
    }
    const optName = this.formatOption(name);
    const optVal = expected.map((val) => formatFn(val)).join(', ');
    return negate ? `${optName} != [${optVal}]` : `${optName} = [${optVal}]`;
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
        this.parseSingle(key, option, name, value, convertFn);
        break;
      }
      case 'string': {
        this.parseSingle(key, option, name, value, (str) => str, this.normalizeString);
        break;
      }
      case 'number': {
        this.parseSingle(key, option, name, value, Number, this.normalizeNumber);
        break;
      }
      case 'strings': {
        this.parseArray(key, option, name, value, (str) => str, this.normalizeString);
        break;
      }
      case 'numbers': {
        this.parseArray(key, option, name, value, Number, this.normalizeNumber);
        break;
      }
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
        this.registry.normalizeArray(option, name, normalized);
        return normalized;
      });
    } else {
      result = value.map((val) => normalizeFn(option, name, val));
      this.registry.normalizeArray(option, name, result);
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
          this.registry.normalizeArray(option, name, prev);
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
          this.registry.normalizeArray(option, name, prev);
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
        this.registry.normalizeArray(option, name, vals);
        return vals;
      });
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
 * Gets a list of command arguments from a raw command line.
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
 * Checks the required value of an array option against a specified value.
 * @param actual The specified value
 * @param expected The expected value
 * @param negate True if the requirement should be negated
 * @param unique True if array elements should be unique
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
 * Checks the items of a requirement expression or object.
 * @param items The list of requirement items
 * @param itemFn The callback to execute on each item
 * @param negate True if the requirement should be negated
 * @param errors If null, return on the first error; else return on the first success
 * @returns An error reason or null if no error
 */
function checkRequireItems<T>(
  items: Iterable<T>,
  itemFn: (item: T, negate: boolean) => string | null,
  negate: boolean,
  errors: null | Set<string> = new Set<string>(),
): string | null {
  for (const item of items) {
    const error = itemFn(item, negate);
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
