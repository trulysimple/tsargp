//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { HelpFormat } from './formatter';
import type { Style } from './styles';
import { fg, style } from './styles';

export type {
  ParseCallback,
  ResolveCallback,
  FunctionCallback,
  CompletionCallback,
  Option,
  Options,
  OptionDataType,
  OptionValues,
  OptionStyles,
  OtherStyles,
  StringOption,
  NumberOption,
  FlagOption,
  BooleanOption,
  StringsOption,
  NumbersOption,
  FunctionOption,
  HelpOption,
  VersionOption,
  SpecialOption,
  SingleOption,
  ArrayOption,
  NiladicOption,
  ParamOption,
  ValuedOption,
  Requires,
  RequiresExp,
  RequiresVal,
  Positional,
  Concrete,
};

export {
  req,
  RequiresAll,
  RequiresOne,
  RequiresNot,
  OptionRegistry,
  isNiladic,
  isArray,
  isValued,
  isMultivalued,
};

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * A helper to create option requirement expressions.
 */
const req = {
  /**
   * Creates a requirement expression that is satisfied only when all items are satisfied.
   * @param items The requirement items
   * @returns The requirement expression
   */
  and(...items: Array<Requires>): RequiresAll {
    return new RequiresAll(items);
  },

  /**
   * Creates a requirement expression that is satisfied when at least one item is satisfied.
   * @param items The requirement items
   * @returns The requirement expression
   */
  or(...items: Array<Requires>): RequiresOne {
    return new RequiresOne(items);
  },

  /**
   * Creates a requirement expression that is satisfied when the item is not satisfied.
   * @param item The requirement item
   * @returns The requirement expression
   */
  not(item: Requires): RequiresNot {
    return new RequiresNot(item);
  },
} as const;

/**
 * The default styles of error messages
 */
const defaultStyles: ConcreteStyles = {
  regex: style(fg.red),
  boolean: style(fg.yellow),
  string: style(fg.green),
  number: style(fg.yellow),
  option: style(fg.magenta),
  whitespace: style(fg.default),
};

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * A set of styles for displaying an option on the console.
 */
type OptionStyles = {
  /**
   * The style of the option names.
   */
  readonly names?: Style;
  /**
   * The style of the option paramater.
   */
  readonly param?: Style;
  /**
   * The style of the option description.
   */
  readonly desc?: Style;
};

/**
 * A set of styles for displaying text on the console.
 */
type OtherStyles = {
  /**
   * The style of booleans.
   */
  readonly boolean?: Style;
  /**
   * The style of strings.
   */
  readonly string?: Style;
  /**
   * The style of numbers.
   */
  readonly number?: Style;
  /**
   * The style of regular expressions.
   */
  readonly regex?: Style;
  /**
   * The style of option names
   */
  readonly option?: Style;
  /**
   * The style of whitespace or error messages.
   */
  readonly whitespace?: Style;
};

/**
 * A requirement expression that is satisfied only when all items are satisfied.
 */
class RequiresAll {
  constructor(readonly items: Array<Requires>) {}
}

/**
 * A requirement expression that is satisfied when at least one item is satisfied.
 */
class RequiresOne {
  constructor(readonly items: Array<Requires>) {}
}

/**
 * A requirement expression that is satisfied when the item is not satisfied.
 */
class RequiresNot {
  constructor(readonly item: Requires) {}
}

/**
 * A requirement expression.
 */
type RequiresExp = RequiresNot | RequiresAll | RequiresOne;

/**
 * A map of option keys to required values.
 *
 * Values can be `undefined` to indicate presence and `null` to indicate absence.
 */
type RequiresVal = { [key: string]: ValuedOption['default'] | null };

/**
 * An option requirement can be either:
 *
 * - an option key;
 * - a map of option keys to required values; or
 * - a requirement expression.
 */
type Requires = string | RequiresVal | RequiresExp;

/**
 * A callback to parse the value of options that accept parameters. Any specified normalization or
 * constraint will be applied to the returned value.
 * @template T The return data type
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @returns The parsed value
 */
type ParseCallback<T> = (name: string, value: string) => T | Promise<T>;

/**
 * A module-relative resolution function scoped to each module. Non-Web environments only.
 */
type ResolveCallback = (specifier: string) => string;

/**
 * A callback for function options.
 * @param values The values parsed so far (should be cast to `OptionValues<typeof _your_options_>`
 * or to your values class)
 * @param rest The remaining command-line arguments
 * @param completing True if performing completion (but not in the current iteration)
 */
type FunctionCallback = (
  values: OptionValues,
  rest: Array<string>,
  completing: boolean,
) => void | Promise<void>;

/**
 * A callback for option completion.
 * @param values The values parsed so far (should be cast to `OptionValues<typeof _your_options_>`
 * or to your values class)
 * @param rest The remaining command-line arguments. The first element is the one triggering the
 * completion (it may be an empty string).
 * @returns The list of completion words
 */
type CompletionCallback = (
  values: OptionValues,
  rest: Array<string>,
) => Array<string> | Promise<Array<string>>;

/**
 * Defines attributes common to all options.
 * @template T The option type
 */
type WithType<T extends string> = {
  /**
   * The option type. Booleans always default to false.
   */
  readonly type: T;
  /**
   * The option names, as they appear on the command-line (e.g. `-h` or `--help`).
   *
   * Names cannot contain whitespace or the equals sign `=` (since it may act as option-value
   * separator). Empty names or `null`s can be specified in order to skip the respective "slot" in
   * the help message name column, although there must be at least one non-empty name.
   */
  readonly names: Array<string | null>;
  /**
   * A name to be displayed in error and help messages in cases where one is not available (e.g.,
   * when evaluating option requirements or processing positional arguments). It is not validated
   * and can be anything.
   *
   * If not specified, the first name in the {@link WithType.names} array will be used.
   */
  readonly preferredName?: string;
  /**
   * The option description.
   */
  readonly desc?: string;
  /**
   * The option group to display in the help message.
   */
  readonly group?: string;
  /**
   * True if the option should be hidden from the help message.
   */
  readonly hide?: true;
  /**
   * The option display styles.
   */
  readonly styles?: OptionStyles;
  /**
   * The option deprecation reason.
   */
  readonly deprecated?: string;
  /**
   * The option requirements.
   */
  readonly requires?: Requires;
  /**
   * True if the option is always required.
   */
  readonly required?: true;
};

/**
 * Defines attributes common to all options that accept parameters.
 * @template T The parameter data type
 */
type WithParam<T> = {
  /**
   * The element separator. If not specified, the option is multivalued.
   */
  readonly separator?: string;
  /**
   * The option default value.
   */
  readonly default?: T;
  /**
   * The option example value. Replaces the option type.
   */
  readonly example?: T;
  /**
   * The option parameter name. Replaces the option type.
   */
  readonly paramName?: string;
  /**
   * Allows positional arguments. There may be at most one option with this setting.
   *
   * If set, then any argument not recognized as an option name will be considered positional.
   * Additionally, if a string is specified as marker, then all arguments beyond this marker will
   * be considered positional.
   *
   * We recommend also setting {@link WithType.preferredName} to some explanatory name.
   */
  readonly positional?: true | string;
  /**
   * A custom completion callback. It should not throw. If asynchronous, you should call
   * `ArgumentParser.parseAsync` and await its result.
   */
  readonly complete?: CompletionCallback;
};

type WithParse<T> = {
  /**
   * A custom function to parse the option parameter.
   */
  readonly parse: ParseCallback<T>;
  /**
   * @deprecated mutually exclusive property
   */
  readonly separator?: never;
  /**
   * @deprecated mutually exclusive property
   */
  readonly parseDelimited?: never;
};

type WithParseDelimited<T> = {
  /**
   * A custom function to parse the option parameter.
   */
  readonly parseDelimited: ParseCallback<Array<T>>;
  /**
   * @deprecated mutually exclusive property
   */
  readonly parse?: never;
  /**
   * @deprecated mutually exclusive property
   */
  readonly separator?: never;
};

type WithDelimited = {
  /**
   * The array element separator.
   */
  readonly separator: string | RegExp;
  /**
   * @deprecated mutually exclusive property
   */
  readonly parse?: never;
  /**
   * @deprecated mutually exclusive property
   */
  readonly parseDelimited?: never;
};

/**
 * Defines attributes common to all options that accept array parameters.
 */
type WithArray = {
  /**
   * True if duplicate elements should be removed.
   */
  readonly unique?: true;
  /**
   * Allows appending elements if specified multiple times.
   */
  readonly append?: true;
  /**
   * The maximum number of elements.
   */
  readonly limit?: number;
};

/**
 * Defines attributes for an enumeration constraint.
 * @template T The enumeration data type
 */
type WithEnums<T> = {
  /**
   * The enumerated values.
   */
  readonly enums: Array<T>;
  /**
   * @deprecated mutually exclusive property
   */
  readonly regex?: never;
  /**
   * @deprecated mutually exclusive property
   */
  readonly range?: never;
};

/**
 * Defines attributes for a regex constraint.
 */
type WithRegex = {
  /**
   * The regular expression.
   */
  readonly regex: RegExp;
  /**
   * @deprecated mutually exclusive property
   */
  readonly enums?: never;
};

/**
 * Defines attributes for a range constraint.
 */
type WithRange = {
  /**
   * The (closed) numeric range. You may want to use [-Infinity, Infinity] to disallow NaN.
   */
  readonly range: [floor: number, ceiling: number];
  /**
   * @deprecated mutually exclusive property
   */
  readonly enums?: never;
};

/**
 * Defines the version attribute of a version option.
 */
type WithVersion = {
  /**
   * The semantic version.
   */
  readonly version: string;
  /**
   * @deprecated mutually exclusive property
   */
  readonly resolve?: never;
};

/**
 * Defines the resolve attribute of a version option.
 */
type WithResolve = {
  /**
   * A resolution function scoped to the module where a `package.json` file should be searched. Use
   * `import.meta.resolve`. Use in non-browser environments only. This is an asynchronous operation,
   * so you should call `ArgumentParser.parseAsync` and await its result.
   */
  readonly resolve: ResolveCallback;
  /**
   * @deprecated mutually exclusive property
   */
  readonly version?: never;
};

/**
 * Defines attributes common to all options that accept string parameters.
 */
type WithString = Optional<WithEnums<string> | WithRegex> & {
  /**
   * True if the values should be trimmed.
   */
  readonly trim?: true;
  /**
   * The kind of case conversion to apply.
   */
  readonly case?: 'lower' | 'upper';
};

/**
 * Defines attributes common to all options that accept number parameters.
 */
type WithNumber = Optional<WithEnums<number> | WithRange> & {
  /**
   * The kind of rounding to apply.
   */
  readonly round?: 'trunc' | 'ceil' | 'floor' | 'nearest';
};

/**
 * An option that accepts a single boolean parameter.
 */
type BooleanOption = WithType<'boolean'> & WithParam<boolean> & Optional<WithParse<boolean>>;

/**
 * An option that accepts a single string parameter.
 */
type StringOption = WithType<'string'> &
  WithParam<string> &
  WithString &
  Optional<WithParse<string>>;

/**
 * An option that accepts a single number parameter.
 */
type NumberOption = WithType<'number'> &
  WithParam<number> &
  WithNumber &
  Optional<WithParse<number>>;

/**
 * An option that accepts a list of string parameters.
 */
type StringsOption = WithType<'strings'> &
  WithParam<Array<string>> &
  WithString &
  WithArray &
  Optional<WithParse<string> | WithParseDelimited<string> | WithDelimited>;

/**
 * An option that accepts a list of number parameters.
 */
type NumbersOption = WithType<'numbers'> &
  WithParam<Array<number>> &
  WithNumber &
  WithArray &
  Optional<WithParse<number> | WithParseDelimited<number> | WithDelimited>;

/**
 * An option which is enabled if specified.
 */
type FlagOption = WithType<'flag'> & {
  /**
   * The default value.
   */
  readonly default?: boolean;
  /**
   * The names used for negation (e.g., '--no-flag').
   */
  readonly negationNames?: Array<string>;
};

/**
 * An option that executes a callback function.
 */
type FunctionOption = WithType<'function'> & {
  /**
   * The callback function. If asynchronous, you should call `ArgumentParser.parseAsync` and await
   * its result.
   */
  readonly exec: FunctionCallback;
  /**
   * True to break the parsing loop.
   */
  readonly break?: true;
};

/**
 * An option that throws a help message.
 */
type HelpOption = WithType<'help'> & {
  /**
   * The usage message.
   */
  readonly usage?: string;
  /**
   * The footer message.
   */
  readonly footer?: string;
  /**
   * The help format.
   */
  readonly format?: HelpFormat;
  /**
   * The style of option headings.
   */
  readonly headingStyle?: Style;
};

/**
 * An option that throws a semantic version.
 */
type VersionOption = WithType<'version'> & (WithVersion | WithResolve);

/**
 * An option that performs some predefined action.
 */
type SpecialOption = HelpOption | VersionOption;

/**
 * An option that accepts no parameters.
 */
type NiladicOption = FlagOption | FunctionOption | SpecialOption;

/**
 * An option that accepts a single parameter.
 */
type SingleOption = BooleanOption | StringOption | NumberOption;

/**
 * An option that accepts a list of parameters.
 */
type ArrayOption = StringsOption | NumbersOption;

/**
 * An option that accepts any kind of parameter.
 */
type ParamOption = SingleOption | ArrayOption;

/**
 * An option that has a value.
 */
type ValuedOption = FlagOption | ParamOption;

/**
 * An option definition. (finally)
 */
type Option = NiladicOption | ParamOption;

/**
 * A collection of option definitions.
 */
type Options = Readonly<Record<string, Option>>;

/**
 * The data type of an option that has a value.
 * @template T The option definition type
 * @template D The option value data type
 * @template E The effective data type
 */
type DataType<T extends ValuedOption, D, E = D> = Resolve<
  E | (T extends { default: D } ? never : undefined)
>;

/**
 * The data type of an option that accepts parameters.
 * @template T The option definition type
 * @template D The option value data type
 * @template E The effective data type
 */
type ParamDataType<T extends ParamOption, D, E> = T extends
  | { parse: (name: string, value: string) => D }
  | { parseDelimited: (name: string, value: string) => Array<D> }
  ? E
  : T extends
        | { parse: (name: string, value: string) => Promise<D> }
        | { parseDelimited: (name: string, value: string) => Promise<Array<D>> }
    ? Promise<E>
    : T extends { parse: ParseCallback<D> } | { parseDelimited: ParseCallback<Array<D>> }
      ? E | Promise<E>
      : E;

/**
 * The data type of a non-array option.
 * @template T The option definition type
 * @template D The option value data type
 */
type SingleDataType<T extends SingleOption, D> = Resolve<
  DataType<T, D, ParamDataType<T, D, T extends { enums: Array<D> } ? T['enums'][number] : D>>
>;

/**
 * The data type of an array option.
 * @template T The option definition type
 * @template D The option value data type
 */
type ArrayDataType<T extends ArrayOption, D> = Resolve<
  DataType<
    T,
    Array<D>,
    | ParamDataType<T, D, T extends { enums: Array<D> } ? Array<T['enums'][number]> : Array<D>>
    | (T extends { separator: string } | { parseDelimited: ParseCallback<Array<D>> } ? never : [])
  >
>;

/**
 * The data type of an option.
 * @template T The option definition type
 */
type OptionDataType<T extends Option = Option> = T extends FlagOption | BooleanOption
  ? DataType<T, boolean>
  : T extends StringOption
    ? SingleDataType<T, string>
    : T extends NumberOption
      ? SingleDataType<T, number>
      : T extends StringsOption
        ? ArrayDataType<T, string>
        : T extends NumbersOption
          ? ArrayDataType<T, number>
          : never;

/**
 * A collection of option values.
 * @template T The type of the option definitions
 */
type OptionValues<T extends Options = Options> = Resolve<{
  -readonly [key in keyof T as T[key] extends ValuedOption ? key : never]: OptionDataType<T[key]>;
}>;

/**
 * Information regarding a positional option.
 */
type Positional = {
  key: string;
  name: string;
  option: Option;
  marker?: string;
};

/**
 * A helper type for optional objects.
 * @template T The actual object type
 */
type Optional<T extends object> = T | Record<never, never>;

/**
 * A helper type to resolve types in IntelliSense.
 * @template T The actual type
 */
type Resolve<T> = T & unknown;

/**
 * A helper type to remove optionality from types and properties.
 * @template T The actual type
 */
type Concrete<T> = Exclude<
  {
    [K in keyof T]-?: Concrete<T[K]>;
  },
  undefined
>;

/**
 * A concrete version of the error message styles.
 */
type ConcreteStyles = Concrete<OtherStyles>;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements a compilation of option definitions.
 */
class OptionRegistry {
  private readonly styles: ConcreteStyles;
  readonly names = new Map<string, string>();
  readonly required = new Array<string>();
  readonly positional: Positional | undefined;

  /**
   * Creates an option registry based on a set of option definitions.
   * @param options The option definitions
   * @param styles The error message styles
   */
  constructor(
    readonly options: Options,
    styles?: OtherStyles,
  ) {
    this.styles = Object.assign({}, defaultStyles, styles);
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option);
      if (!isNiladic(option)) {
        if (option.positional) {
          if (this.positional) {
            throw this.error(`Duplicate positional option ${this.formatOption(key)}.`);
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
        throw this.error(
          `Option ${this.formatOption(key)} contains no version or resolve function.`,
        );
      }
    }
  }

  /**
   * Registers an option's names.
   * @param key The option key
   * @param option The option definition
   */
  private registerNames(key: string, option: Option) {
    const names = option.names.filter((name): name is string => name !== null && name !== '');
    if (!names.length) {
      throw this.error(`Option ${this.formatOption(key)} has no name.`);
    }
    if (option.type === 'flag' && option.negationNames) {
      names.push(...option.negationNames.filter((name) => name));
    }
    if ('positional' in option && typeof option.positional === 'string') {
      if (!option.positional) {
        throw this.error(`Option ${this.formatOption(key)} has empty positional marker.`);
      }
      names.push(option.positional);
    }
    for (const name of names) {
      if (name.match(/[\s=]+/)) {
        throw this.error(`Invalid option name ${this.formatOption(name)}.`);
      }
      if (this.names.has(name)) {
        throw this.error(`Duplicate option name ${this.formatOption(name)}.`);
      }
      this.names.set(name, key);
    }
  }

  /**
   * Validates all options' definitions
   */
  validate() {
    for (const key in this.options) {
      const option = this.options[key];
      if (!isNiladic(option)) {
        this.validateEnums(key, option);
        this.validateValue(key, option, option.default);
        this.validateValue(key, option, option.example);
      }
      if (option.requires) {
        this.validateRequirements(key, option.requires);
      }
    }
  }

  /**
   * Validates an option's requirements.
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
   * Validates an option requirement.
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
      throw this.error(`Option ${this.formatOption(key)} requires itself.`);
    }
    if (!(requiredKey in this.options)) {
      throw this.error(`Unknown required option ${this.formatOption(requiredKey)}.`);
    }
    if (requiredValue !== undefined && requiredValue !== null) {
      const option = this.options[requiredKey];
      if (isNiladic(option)) {
        throw this.error(
          `Required option ${this.formatOption(requiredKey)} does not accept values.`,
        );
      }
      this.validateValue(requiredKey, option, requiredValue);
    }
  }

  /**
   * Checks the sanity of the option's enumerated values.
   * @param key The option key
   * @param option The option definition
   */
  private validateEnums(key: string, option: ParamOption) {
    if ('enums' in option && option.enums) {
      if (!option.enums.length) {
        throw this.error(`Option ${this.formatOption(key)} has zero enum values.`);
      }
      const set = new Set<string | number>(option.enums);
      if (set.size !== option.enums.length) {
        for (const value of option.enums) {
          if (!set.delete(value)) {
            const optVal =
              option.type === 'string' || option.type === 'strings'
                ? this.formatString(value as string)
                : this.formatNumber(value as number);
            throw this.error(`Option ${this.formatOption(key)} has duplicate enum ${optVal}.`);
          }
        }
      }
    }
  }

  /**
   * Asserts that an option value conforms to a type.
   * @param value The option value
   * @param key The option key
   * @param type The data type name
   */
  private assertType<T>(value: unknown, key: string, type: string): asserts value is T {
    if (typeof value !== type) {
      const valType = `${this.styles.string}'${type}'${this.styles.whitespace}`;
      throw this.error(
        `Option ${this.formatOption(key)} has incompatible value <${value}>. ` +
          `Should be of type ${valType}.`,
      );
    }
  }

  /**
   * Checks the sanity of the option's value (default, example or required).
   * @param key The option key
   * @param option The option definition
   * @param value The option value
   */
  private validateValue(key: string, option: ParamOption, value: ParamOption['default']) {
    if (value === undefined) {
      return;
    }
    switch (option.type) {
      case 'boolean':
        this.assertType<boolean>(value, key, 'boolean');
        break;
      case 'string':
        this.assertType<string>(value, key, 'string');
        this.normalizeString(option, key, value);
        break;
      case 'number':
        this.assertType<number>(value, key, 'number');
        this.normalizeNumber(option, key, value);
        break;
      case 'strings': {
        this.assertType<object>(value, key, 'object');
        value = value.map((val) => {
          this.assertType<string>(val, key, 'string');
          return this.normalizeString(option, key, val);
        });
        this.normalizeArray(option, key, value);
        break;
      }
      case 'numbers': {
        this.assertType<object>(value, key, 'object');
        value = value.map((val) => {
          this.assertType<number>(val, key, 'number');
          return this.normalizeNumber(option, key, val);
        });
        this.normalizeArray(option, key, value);
        break;
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Normalizes the value of a string option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   */
  normalizeString(option: StringOption | StringsOption, name: string, value: string): string {
    if (option.trim) {
      value = value.trim();
    }
    if (option.case) {
      value = option.case === 'lower' ? value.toLowerCase() : value.toLocaleUpperCase();
    }
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      const optEnums = option.enums.map((val) => this.formatString(val));
      throw this.error(
        `Invalid parameter to ${this.formatOption(name)}: ${this.formatString(value)}. ` +
          `Possible values are [${optEnums.join(', ')}].`,
      );
    }
    if ('regex' in option && option.regex && !option.regex.test(value)) {
      throw this.error(
        `Invalid parameter to ${this.formatOption(name)}: ${this.formatString(value)}. ` +
          `Value must match the regex ${this.formatRegex(option.regex)}.`,
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
  normalizeNumber(option: NumberOption | NumbersOption, name: string, value: number): number {
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
      const optEnums = option.enums.map((val) => this.formatNumber(val));
      throw this.error(
        `Invalid parameter to ${this.formatOption(name)}: ${this.formatNumber(value)}. ` +
          `Possible values are [${optEnums.join(', ')}].`,
      );
    }
    if (
      'range' in option &&
      option.range &&
      !(value >= option.range[0] && value <= option.range[1]) // handles NaN as well
    ) {
      const optRange = option.range.map((val) => this.formatNumber(val));
      throw this.error(
        `Invalid parameter to ${this.formatOption(name)}: ${this.formatNumber(value)}. ` +
          `Value must be in the range [${optRange.join(', ')}].`,
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
  normalizeArray(
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
      throw this.error(
        `Option ${this.formatOption(name)} has too many values (${this.formatNumber(value.length)}). ` +
          `Should have at most ${this.formatNumber(option.limit)}.`,
      );
    }
  }

  /**
   * Formats an option name to be printed on the console.
   * @param name The option name
   * @returns The formatted option name
   */
  formatOption(name: string) {
    return `${this.styles.option}${name}${this.styles.whitespace}`;
  }

  /**
   * Formats a boolean value to be printed on the console.
   * @param value The boolean value
   * @returns The formatted boolean value
   */
  formatBoolean(value: boolean) {
    return `${this.styles.boolean}${value}${this.styles.whitespace}`;
  }

  /**
   * Formats a string value to be printed on the console.
   * @param value The string value
   * @returns The formatted string value
   */
  formatString(value: string) {
    return `${this.styles.string}'${value}'${this.styles.whitespace}`;
  }

  /**
   * Formats a number value to be printed on the console.
   * @param value The number value
   * @returns The formatted number value
   */
  formatNumber(value: number) {
    return `${this.styles.number}${value}${this.styles.whitespace}`;
  }

  /**
   * Formats a regex value to be printed on the console.
   * @param value The regex value
   * @returns The formatted regex value
   */
  formatRegex(value: RegExp) {
    return `${this.styles.regex}${String(value)}${this.styles.whitespace}`;
  }

  /**
   * Creates an error from a message with style.
   * @param msg The error message
   * @returns The error
   */
  error(msg: string): Error {
    return Error(`${this.styles.whitespace}${msg}`);
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Tests if an option is niladic (i.e., accepts no parameter).
 * @param option The option definition
 * @returns True if the option is niladic
 */
function isNiladic(option: Option): option is NiladicOption {
  return ['flag', 'function', 'help', 'version'].includes(option.type);
}

/**
 * Tests if an option is an array option (i.e., accepts a list of parameters).
 * @param option The option definition
 * @returns True if the option is an array option
 */
function isArray(option: Option): option is ArrayOption {
  return option.type === 'strings' || option.type === 'numbers';
}

/**
 * Tests if an option is valued.
 * @param option The option definition
 * @returns True if the option is niladic
 */
function isValued(option: Option): option is ValuedOption {
  return !['function', 'help', 'version'].includes(option.type);
}

/**
 * Tests if an array option is multivalued.
 * @param option The option definition
 * @returns True if the option is multivalued
 */
function isMultivalued(option: ArrayOption): boolean {
  return (
    !('separator' in option && option.separator) &&
    !('parseDelimited' in option && option.parseDelimited)
  );
}
