//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Style } from './styles.js';

export type {
  Callback,
  Option,
  Options,
  OptionDataType,
  OptionValues,
  OptionStyles,
  StringOption,
  NumberOption,
  BooleanOption,
  StringsOption,
  NumbersOption,
  FunctionOption,
  ArrayOption,
  NiladicOption,
  ParamOption,
  ValuedOption,
  Requires,
  RequireExp,
};

export { req, isNiladic, isArray };

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
   * @returns The combined requirement
   */
  and(...items: Array<Requires>): RequireExp {
    return { items, op: 'and' };
  },

  /**
   * Creates a requirement expression that is satisfied when at least one item is satisfied.
   * @param items The requirement items
   * @returns The combined requirement
   */
  or(...items: Array<Requires>): RequireExp {
    return { items, op: 'or' };
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
  names?: Style;
  /**
   * The style of the option type.
   */
  type?: Style;
  /**
   * The style of the option description.
   */
  desc?: Style;
};

/**
 * A requirement expression.
 */
type RequireExp = {
  /**
   * The list of requirements.
   */
  readonly items: Array<Requires>;
  /**
   * The logical operator.
   */
  readonly op: 'and' | 'or';
};

/**
 * An option requirement: can be a key-value pair or a requirement expression.
 */
type Requires = string | RequireExp;

/**
 * A callback for function options.
 * @param values The values parsed so far (should be cast to `OptionValues<typeof _your_options_>`)
 * @param args The remaining arguments
 */
type Callback = (values: OptionValues<Options>, args: Array<string>) => void | Promise<void>;

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
   * Names cannot contain spaces or the equals sign (`=`), as it may be used for passing values in
   * the command-line. Empty names may be specified in order to skip the respective "slot" in the
   * help message name column. There must be at least one valid name.
   */
  readonly names: Array<string>;
  /**
   * A name to be displayed in error and help messages when evaluating option requirements. If not
   * specified, the first name in the `names` array will be used.
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
 * @template D The parameter data type
 */
type WithParam<D> = {
  /**
   * The option default value.
   */
  readonly default?: D;
  /**
   * The option example value.
   */
  readonly example?: D;
  /**
   * Allows positional arguments. There may be at most one option with this setting.
   */
  readonly positional?: true;
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
 * Defines attributes for a callback function.
 */
type WithCallback = {
  /**
   * The callback function.
   */
  readonly exec: Callback;
  /**
   * True to break the parsing loop.
   */
  readonly break?: true;
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
   * The kind of case normalization to apply.
   */
  readonly case?: 'lower' | 'upper';
};

/**
 * Defines attributes common to all options that accept number parameters.
 */
type WithNumber = Optional<WithEnums<number> | WithRange>;

/**
 * An option which is enabled if specified. Always defaults to false.
 */
type BooleanOption = WithType<'boolean'>;

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
 * An option that executes a callback function.
 */
type FunctionOption = WithType<'function'> & WithCallback;

/**
 * An option that accepts no parameters.
 */
type NiladicOption = BooleanOption | FunctionOption;

/**
 * An option that accepts a list of parameters.
 */
type ArrayOption = StringsOption | NumbersOption;

/**
 * An option that accepts any kind of parameter.
 */
type ParamOption = StringOption | NumberOption | ArrayOption;

/**
 * An option that has a value.
 */
type ValuedOption = BooleanOption | ParamOption;

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
type OptionDataType<T extends Option> = T extends { type: 'boolean' }
  ? boolean
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
type OptionValues<T extends Options> = {
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
  return option.type === 'boolean' || option.type === 'function';
}

/**
 * Tests if an option is an array option (i.e., accepts a list of parameters).
 * @param option The option definition
 * @returns True if the option is an array option
 */
function isArray(option: Option): option is ArrayOption {
  return option.type === 'strings' || option.type === 'numbers';
}
