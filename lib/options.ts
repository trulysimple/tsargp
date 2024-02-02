//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Style } from './styles.js';

export type {
  Option,
  Options,
  OptionValues,
  StringOption,
  NumberOption,
  BooleanOption,
  StringsOption,
  NumbersOption,
  FunctionOption,
  NiladicOption,
  MonadicOption,
  ValuedOption,
  Styles,
};

export { isNiladic, isArray, setValue };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * A set of styles for displaying an option on the terminal.
 */
type Styles = {
  name?: Style;
  type?: Style;
  desc?: Style;
};

/**
 * An option with basic attributes.
 * @template T The option type
 */
type WithAttributes<T> = {
  /**
   * The option names, as they appear on the command-line (e.g. `-h` or `--help`).
   */
  readonly names: Array<string>;
  /**
   * The option description.
   */
  readonly desc: string;
  /**
   * The option type. Booleans always default to false.
   */
  readonly type: T;
  /**
   * The option styles.
   */
  readonly styles?: Styles;
  /**
   * The option deprecation reason.
   */
  readonly deprecated?: string;
};

/**
 * An option with a default value.
 * @template T The default value data type
 */
type WithDefault<T> = {
  /**
   * The option default value.
   */
  readonly default: T;
};

/**
 * An option with an example value.
 * @template T The example value data type
 */
type WithExample<T> = {
  /**
   * The option example value.
   */
  readonly example: T;
};

/**
 * An option with enumeration values.
 * @template T The enumeration data type
 */
type WithEnums<T> = {
  /**
   * The option enumeration values.
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
 * An option with a regex constraint.
 */
type WithRegex = {
  /**
   * The option regex.
   */
  readonly regex: RegExp;
  /**
   * @deprecated mutually exclusive property
   */
  readonly enums?: never;
};

/**
 * An option with a range constraint.
 */
type WithRange = {
  /**
   * The option regex.
   */
  readonly range: [number, number];
  /**
   * @deprecated mutually exclusive property
   */
  readonly enums?: never;
};

/**
 * An flag which is enabled if specified. Always defaults to false.
 */
type BooleanOption = WithAttributes<'boolean'>;

/**
 * A helper type for optional objects.
 * @template T The actual object type
 */
type Optional<T extends object> = T | Record<never, never>;

/**
 * An option that accepts a single string value.
 */
type StringOption = WithAttributes<'string'> &
  Optional<WithDefault<string>> &
  Optional<WithExample<string>> &
  Optional<WithEnums<string> | WithRegex>;

/**
 * An option that accepts a single number value.
 */
type NumberOption = WithAttributes<'number'> &
  Optional<WithDefault<number>> &
  Optional<WithExample<number>> &
  Optional<WithEnums<number> | WithRange>;

/**
 * An option that accepts a comma-separated list of strings.
 */
type StringsOption = WithAttributes<'strings'> &
  Optional<WithDefault<Array<string>>> &
  Optional<WithExample<Array<string>>> &
  Optional<WithEnums<string> | WithRegex>;

/**
 * An option that accepts a comma-separated list of numbers.
 */
type NumbersOption = WithAttributes<'numbers'> &
  Optional<WithDefault<Array<number>>> &
  Optional<WithExample<Array<number>>> &
  Optional<WithEnums<number> | WithRange>;

/**
 * A callback for function options.
 * @template R The return type
 * @param values The values parsed so far (should be cast to `OptionValues<typeof _your_options_>`)
 * @param args The remaining arguments
 */
type Callback<R> = (values: OptionValues<Options>, args: Array<string>) => R;

/**
 * An option that executes a function. Return `null` to break the parsing loop.
 */
type FunctionOption = WithAttributes<'function'> & WithDefault<Callback<void | null>>;

/**
 * An option that executes an asynchronous function. Return `null` to break the parsing loop.
 */
type AsyncFunctionOption = WithAttributes<'function'> & WithDefault<Callback<Promise<void | null>>>;

/**
 * An option that accepts no parameters.
 */
type NiladicOption = BooleanOption | FunctionOption | AsyncFunctionOption;

/**
 * An option that accepts a single parameter.
 */
type MonadicOption = StringOption | NumberOption | StringsOption | NumbersOption;

/**
 * An option that has a value.
 */
type ValuedOption = BooleanOption | MonadicOption;

/**
 * An option definition.
 */
type Option = NiladicOption | MonadicOption;

/**
 * A collection of option definitions.
 */
type Options = Readonly<Record<string, Option>>;

/**
 * Checks if an option value is allowed to be undefined.
 * This is to support cases where a zero value means something to the application.
 * @template T The actual type of the option
 * @template D The default value data type
 */
type MaybeUndefined<T extends Option, D> = T extends WithDefault<D> ? never : undefined;

/**
 * The data type of a string option.
 * @template T The actual type of the option
 */
type StringDataType<T extends StringOption> =
  | (T extends WithEnums<string> ? T['enums'][number] : string)
  | MaybeUndefined<T, string>;

/**
 * The data type of a number option.
 * @template T The actual type of the option
 */
type NumberDataType<T extends NumberOption> =
  | (T extends WithEnums<number> ? T['enums'][number] : number)
  | MaybeUndefined<T, number>;

/**
 * The data type of a strings option.
 * @template T The actual type of the option
 */
type StringsDataType<T extends StringsOption> =
  | (T extends WithEnums<string> ? Array<T['enums'][number]> : Array<string>)
  | MaybeUndefined<T, Array<string>>;

/**
 * The data type of a numbers option.
 * @template T The actual type of the option
 */
type NumbersDataType<T extends NumbersOption> =
  | (T extends WithEnums<number> ? Array<T['enums'][number]> : Array<number>)
  | MaybeUndefined<T, Array<number>>;

/**
 * The data type of an option that has a value.
 * @template T The actual type of the option
 */
type OptionDataType<T extends Option = ValuedOption> = T extends BooleanOption
  ? boolean
  : T extends StringOption
    ? StringDataType<T>
    : T extends NumberOption
      ? NumberDataType<T>
      : T extends StringsOption
        ? StringsDataType<T>
        : T extends NumbersOption
          ? NumbersDataType<T>
          : never;

/**
 * A collection of option values.
 * @template T The actual type of the option
 */
type OptionValues<T extends Options> = {
  -readonly [key in keyof T as T[key] extends ValuedOption ? key : never]: OptionDataType<T[key]>;
};

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
function isNiladic(option: Option): option is NiladicOption {
  return option.type === 'boolean' || option.type === 'function';
}

function isArray(option: Option): option is StringsOption | NumbersOption {
  return option.type === 'strings' || option.type === 'numbers';
}

function setValue<T extends Options>(values: OptionValues<T>, key: keyof T, value: OptionDataType) {
  type Values = OptionValues<Readonly<Record<string, ValuedOption>>>;
  (values as Values)[key as keyof Values] = value;
}
