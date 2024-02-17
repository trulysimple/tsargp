//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { HelpFormat } from './formatter';
import type { Style } from './styles';

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
  ArrayOption,
  NiladicOption,
  ParamOption,
  ValuedOption,
  Requires,
  RequiresExp,
  RequiresVal,
};

export { req, RequiresAll, RequiresOne, RequiresNot, isNiladic, isArray, isValued };

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
 * A map of key-value pairs.
 *
 * Values can be `undefined` to indicate presence and `null` to indicate absence.
 */
type RequiresVal = { [key: string]: OptionDataType | null };

/**
 * An option requirement can be either:
 *
 * - an option key;
 * - a map of option keys to required values; or
 * - a requirement expression.
 */
type Requires = string | RequiresVal | RequiresExp;

/**
 * A generic callback.
 * @template T The return data type
 * @param values The values parsed so far (should be cast to `OptionValues<typeof _your_options_>`)
 * @param args The remaining arguments
 * @returns The return value
 */
type Callback<T> = (values: OptionValues<Options>, args: Array<string>) => T;

/**
 * A callback for options that accept parameters.
 * @template T The return data type
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @returns The parsed value
 */
type ParseCallback<T> = (name: string, value: string) => T;

/**
 * A module-relative resolution function scoped to each module. Non-Web environments only.
 */
type ResolveCallback = (specifier: string) => string;

/**
 * A callback for function options.
 * @see Callback
 */
type FunctionCallback = Callback<void | Promise<void>>;

/**
 * A callback for option completion. The first argument in `args` is the one that triggered the
 * completion (it may be an empty string).
 * @see Callback
 */
type CompletionCallback = Callback<Array<string> | Promise<Array<string>>>;

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
   * A custom function to parse the option parameter. It is allowed to throw an error to indicate
   * parsing or validation failure. Otherwise, all specified normalization and constraints will be
   * applied to the returned value.
   */
  readonly parse?: ParseCallback<T>;
  /**
   * A custom completion callback. It should not throw. If asynchronous, you should call
   * `ArgumentParser.parseAsync` and await its result.
   */
  readonly complete?: CompletionCallback;
};

/**
 * Defines attributes common to all options that accept array parameters.
 */
type WithArray = {
  /**
   * The element separator. If not specified, the option is multivalued.
   */
  readonly separator?: string;
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
   * The (closed) numeric range.
   */
  readonly range: [number, number];
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
 * A helper type for optional objects.
 * @template T The actual object type
 */
type Optional<T extends object> = T | Record<never, never>;

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
type BooleanOption = WithType<'boolean'> & WithParam<boolean>;

/**
 * An option that accepts a single string parameter.
 */
type StringOption = WithType<'string'> & WithParam<string> & WithString;

/**
 * An option that accepts a single number parameter.
 */
type NumberOption = WithType<'number'> & WithParam<number> & WithNumber;

/**
 * An option that accepts a list of string parameters.
 */
type StringsOption = WithType<'strings'> & WithParam<Array<string>> & WithString & WithArray;

/**
 * An option that accepts a list of number parameters.
 */
type NumbersOption = WithType<'numbers'> & WithParam<Array<number>> & WithNumber & WithArray;

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
 * The data type of a non-array option.
 * @template T The option definition type
 * @template D The option value data type
 */
type DataType<T extends Option, D> =
  | (T extends { enums: Array<D> } ? T['enums'][number] : D)
  | (T extends { default: D } ? never : undefined);

/**
 * The data type of an array option.
 * @template T The option definition type
 * @template D The option value data type
 */
type ArrayDataType<T extends Option, D> =
  | (T extends { enums: Array<D> } ? Array<T['enums'][number]> : Array<D>)
  | (T extends { default: Array<D> } ? never : undefined);

/**
 * The data type of an option.
 * @template T The option definition type
 */
type OptionDataType<T extends Option = Option> = T extends { type: 'flag' | 'boolean' }
  ? DataType<T, boolean>
  : T extends { type: 'string' }
    ? DataType<T, string>
    : T extends { type: 'number' }
      ? DataType<T, number>
      : T extends { type: 'strings' }
        ? ArrayDataType<T, string>
        : T extends { type: 'numbers' }
          ? ArrayDataType<T, number>
          : never;

/**
 * A collection of option values.
 * @template T The type of the option definitions
 */
type OptionValues<T extends Options = Options> = {
  -readonly [key in keyof T as T[key] extends ValuedOption ? key : never]: OptionDataType<T[key]>;
};

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
