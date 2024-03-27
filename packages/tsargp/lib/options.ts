//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type { FormatterConfig, HelpSections } from './formatter';
import type { Style } from './styles';
import type { Resolve, URL, Flatten, KeyHaving, Range } from './utils';

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * A helper object to create option requirement expressions.
 */
export const req = {
  /**
   * Creates a requirement expression that is satisfied only when all items are satisfied.
   * @param items The requirement items
   * @returns The requirement expression
   */
  all(...items: Array<Requires>): RequiresAll {
    return new RequiresAll(items);
  },

  /**
   * Creates a requirement expression that is satisfied when at least one item is satisfied.
   * @param items The requirement items
   * @returns The requirement expression
   */
  one(...items: Array<Requires>): RequiresOne {
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
 * A set of styles for displaying an option on the terminal.
 */
export type OptionStyles = {
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
  readonly descr?: Style;
};

/**
 * A requirement expression that is satisfied only when all items are satisfied.
 */
export class RequiresAll {
  constructor(readonly items: Array<Requires>) {}
}

/**
 * A requirement expression that is satisfied when at least one item is satisfied.
 */
export class RequiresOne {
  constructor(readonly items: Array<Requires>) {}
}

/**
 * A requirement expression that is satisfied when the item is not satisfied.
 */
export class RequiresNot {
  constructor(readonly item: Requires) {}
}

/**
 * A requirement expression.
 */
export type RequiresExp = RequiresNot | RequiresAll | RequiresOne;

/**
 * The type of an option value.
 */
export type OptionValue = boolean | string | number | Array<string> | Array<number>;

/**
 * An object that maps option keys to required values.
 *
 * Values can be `undefined` to indicate presence, or `null` to indicate absence.
 */
export type RequiresVal = { [key: string]: OptionValue | undefined | null };

/**
 * An option requirement can be either:
 *
 * - an option key;
 * - an object that maps option keys to required values;
 * - a requirement expression; or
 * - a requirement callback
 */
export type Requires = string | RequiresVal | RequiresExp | RequiresCallback;

/**
 * A callback to check option requirements.
 * @param values The option values
 * @returns True if the requirements were satisfied
 */
export type RequiresCallback = (values: InternalOptionValues) => boolean;

/**
 * A callback to parse the value of option parameters. Any specified normalization or constraint
 * will be applied to the returned value.
 * @template T The return data type
 * @param values The values parsed so far
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @returns The parsed value
 */
export type ParseCallback<T> = (
  values: InternalOptionValues,
  name: string,
  value: string,
) => T | Promise<T>;

/**
 * A module-relative resolution function (i.e., scoped to a module).
 * To be used in non-browser environments only.
 * @param specifier The path specifier
 * @returns The resolved path
 */
export type ResolveCallback = (specifier: string) => string;

/**
 * A callback for default values.
 * @template T The return data type
 * @param values The values parsed so far
 * @returns The default value
 */
export type DefaultCallback<T> = (values: InternalOptionValues) => T | Promise<T>;

/**
 * A callback for function options.
 * @param values The values parsed so far
 * @param comp True if performing completion (but not in the current iteration)
 * @param rest The remaining command-line arguments
 * @returns The option value
 */
export type ExecuteCallback = (
  values: InternalOptionValues,
  comp: boolean,
  rest: Array<string>,
) => unknown;

/**
 * A callback for command options.
 * @param prev The values parsed for the parent command
 * @param values The values parsed for the command
 * @returns The option value
 */
export type CommandCallback = (prev: InternalOptionValues, values: InternalOptionValues) => unknown;

/**
 * A callback for option completion.
 * @param values The values parsed so far
 * @param comp The word being completed (it may be an empty string)
 * @param rest The remaining command-line arguments
 * @returns The list of completion words
 */
export type CompleteCallback = (
  values: InternalOptionValues,
  comp: string,
  rest: Array<string>,
) => Array<string> | Promise<Array<string>>;

//--------------------------------------------------------------------------------------------------
// Internal types
//--------------------------------------------------------------------------------------------------
/**
 * Defines attributes common to all options.
 * @template T The option type
 */
export type WithBasic<T extends string> = {
  /**
   * The option type.
   */
  readonly type: T;
  /**
   * The option names, as they appear on the command-line (e.g. `-h` or `--help`).
   *
   * Names cannot contain whitespace or the equals sign `=` (since it may act as option-parameter
   * separator). Empty names or `null`s can be specified in order to skip the respective "slot" in
   * the help message names column.
   */
  readonly names?: ReadonlyArray<string | null>;
  /**
   * A name to be displayed in error and help messages in cases where one is not available (e.g.,
   * when evaluating option requirements or processing positional arguments). It is not validated
   * and can be anything.
   *
   * If not specified, the first name in the {@link WithBasic.names} array will be used.
   */
  preferredName?: string;
  /**
   * The option synopsis. It may contain inline styles.
   */
  readonly desc?: string;
  /**
   * The option deprecation reason. It may contain inline styles.
   */
  readonly deprecated?: string;
  /**
   * The option group in the help message.
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
   * A reference to an external resource.
   */
  readonly link?: URL;
};

/**
 * Defines attributes common to options with values.
 * @template T The data type
 */
export type WithValue<T> = {
  /**
   * True if the option is always required.
   */
  readonly required?: true;
  /**
   * The option default value or a callback that returns the default value.
   *
   * The default value is set at the end of the parsing loop if the option was not specified on the
   * command-line. You may use a callback to inspect parsed values and determine the default value
   * based on those values.
   */
  readonly default?: Readonly<T> | DefaultCallback<T>;
  /**
   * The option requirements.
   */
  readonly requires?: Requires;
  /**
   * The conditional requirements.
   */
  readonly requiredIf?: Requires;
  /**
   * The letters used for clustering in short-option style (e.g., 'fF').
   */
  readonly clusterLetters?: string;
};

/**
 * Defines attributes common to options with parameters.
 * @template T The option value data type
 */
export type WithParam<T> = {
  /**
   * The option example value. Replaces the option type in the help message parameter column.
   */
  readonly example?: Readonly<T>;
  /**
   * The option parameter name. Replaces the option type in the help message parameter column.
   */
  readonly paramName?: string;
  /**
   * Allows positional arguments. There may be at most one option with this setting.
   *
   * If set, then any argument not recognized as an option name will be considered positional.
   * Additionally, if a string is specified as positional marker, then all arguments beyond this
   * marker will be considered positional.
   *
   * We recommend also setting {@link WithBasic.preferredName} to some explanatory name.
   */
  readonly positional?: true | string;
  /**
   * A custom completion callback. It should not throw. If asynchronous, you should call
   * `ArgumentParser.parseAsync` and await its result.
   */
  readonly complete?: CompleteCallback;
  /**
   * A custom function to parse the value of the option parameter.
   */
  readonly parse?: ParseCallback<Flatten<T>>;
  /**
   * The enumerated values.
   */
  readonly enums?: ReadonlyArray<Flatten<T>>;
};

/**
 * Defines attributes common to string-valued options.
 */
export type WithString = {
  /**
   * The regular expression.
   */
  readonly regex?: RegExp;
  /**
   * True if the values should be trimmed (remove leading and trailing whitespace).
   */
  readonly trim?: true;
  /**
   * The kind of case-conversion to apply.
   */
  readonly case?: 'lower' | 'upper';
};

/**
 * Defines attributes common to number-valued options.
 */
export type WithNumber = {
  /**
   * The numeric range. You may want to use `[-Infinity, Infinity]` to disallow `NaN`.
   */
  readonly range?: Range;
  /**
   * The kind of math conversion to apply.
   */
  readonly conv?: KeyHaving<Math, (x: number) => number>;
};

/**
 * Defines attributes common to array-valued options.
 */
export type WithArray = {
  /**
   * Allows appending elements if specified multiple times.
   */
  readonly append?: true;
  /**
   * The parameter value separator. If specified, the option accepts a single parameter.
   */
  readonly separator?: string | RegExp;
  /**
   * True if duplicate elements should be removed.
   */
  readonly unique?: true;
  /**
   * The maximum allowed number of elements.
   */
  readonly limit?: number;
};

/**
 * Defines miscellaneous attributes.
 */
export type WithMisc = {
  /**
   * The name of an environment variable to read from, if the option is not specified in the
   * command-line.
   */
  readonly envVar?: string;
};

/**
 * Defines attributes for the help option.
 */
export type WithHelp = {
  /**
   * The formatter configuration.
   */
  readonly format?: FormatterConfig;
  /**
   * The help sections to be rendered.
   */
  readonly sections?: HelpSections;
  /**
   * Opt-in feature: set this to true to allow the remaining arguments to be used as option filters.
   */
  readonly useFilters?: true;
};

/**
 * Defines attributes for the version option.
 */
export type WithVersion = {
  /**
   * The semantic version (e.g., 0.1.0) or version information. It is not validated, but cannot be
   * empty. It may contain inline styles.
   */
  readonly version?: string;
  /**
   * A resolution function scoped to the module where a `package.json` file should be searched. Use
   * `import.meta.resolve`. Use in non-browser environments only. This results in an asynchronous
   * operation, so you should call `ArgumentParser.parseAsync` and await its result.
   */
  readonly resolve?: ResolveCallback;
};

/**
 * Defines attributes for the function option.
 */
export type WithFunction = {
  /**
   * The callback function. If asynchronous, you should call `ArgumentParser.parseAsync` and await
   * its result.
   */
  readonly exec: ExecuteCallback;
  /**
   * True to break the parsing loop.
   */
  readonly break?: true;
  /**
   * The number of remaining arguments to skip. You may change this value inside a synchronous
   * callback. Otherwise, you should leave it unchanged. The parser does not alter this value.
   * During bash completion, it is ignored.
   */
  skipCount?: number;
};

/**
 * Defines attributes for the command option.
 */
export type WithCommand = {
  /**
   * The callback function. If asynchronous, you should call `ArgumentParser.parseAsync` and await
   * its result.
   */
  readonly cmd: CommandCallback;
  /**
   * The command options or a callback that returns the options (for use with recursive commands).
   */
  readonly options: Options | (() => Options);
  /**
   * True if the first argument is expected to be an option cluster (i.e., short-option style).
   */
  readonly shortStyle?: true;
};

/**
 * Defines attributes for the flag option.
 */
export type WithFlag = {
  /**
   * The names used for negation (e.g., '--no-flag').
   */
  readonly negationNames?: ReadonlyArray<string>;
};

/**
 * The option types.
 */
type OptionTypes =
  | 'help'
  | 'version'
  | 'function'
  | 'command'
  | 'flag'
  | 'boolean'
  | 'string'
  | 'number'
  | 'strings'
  | 'numbers';

/**
 * An internal option definition.
 */
export type Option = WithBasic<OptionTypes> &
  WithValue<unknown> &
  WithParam<unknown> &
  WithMisc &
  WithHelp &
  WithVersion &
  WithFunction &
  WithCommand &
  WithFlag &
  WithString &
  WithNumber &
  WithArray;

/**
 * A collection of internal option definitions.
 */
export type InternalOptions = Readonly<Record<string, Option>>;

/**
 * A collection of internal option values.
 */
export type InternalOptionValues = Record<string, unknown>;

//--------------------------------------------------------------------------------------------------
// Public types
//--------------------------------------------------------------------------------------------------
/**
 * Defines attributes for a required option.
 */
type WithRequired = {
  /**
   * @deprecated mutually exclusive with {@link WithValue.required}
   */
  readonly default?: never;
  /**
   * @deprecated mutually exclusive with {@link WithValue.required}
   */
  readonly requiredIf?: never;
};

/**
 * Defines attributes for a default value.
 */
type WithDefault = {
  /**
   * @deprecated mutually exclusive with {@link WithValue.default} and {@link WithValue.requiredIf}
   */
  readonly required?: never;
};

/**
 * Defines attributes for an example value.
 */
type WithExample = {
  /**
   * @deprecated mutually exclusive with {@link WithParam.example}
   */
  readonly paramName?: never;
};

/**
 * Defines attributes for a parameter name.
 */
type WithParamName = {
  /**
   * @deprecated mutually exclusive with {@link WithParam.paramName}
   */
  readonly example?: never;
};

/**
 * Defines attributes for an enumeration constraint.
 */
type WithEnums = {
  /**
   * @deprecated mutually exclusive with {@link WithParam.enums}
   */
  readonly regex?: never;
  /**
   * @deprecated mutually exclusive with {@link WithParam.enums}
   */
  readonly range?: never;
};

/**
 * Defines attributes for a regex constraint.
 */
type WithRegex = {
  /**
   * @deprecated mutually exclusive with {@link WithString.regex}
   */
  readonly enums?: never;
};

/**
 * Defines attributes for a range constraint.
 */
type WithRange = {
  /**
   * @deprecated mutually exclusive with {@link WithNumber.range}
   */
  readonly enums?: never;
};

/**
 * Defines the version attribute of a version option.
 */
type WithVerInfo = {
  /**
   * @deprecated mutually exclusive with {@link WithVersion.version}
   */
  readonly resolve?: never;
};

/**
 * Defines the resolve attribute of a version option.
 */
type WithResolve = {
  /**
   * @deprecated mutually exclusive with {@link WithVersion.resolve}
   */
  readonly version?: never;
};

/**
 * An option that throws a help message.
 */
type HelpOption = WithBasic<'help'> & WithHelp;

/**
 * An option that throws a version information.
 */
type VersionOption = WithBasic<'version'> & WithVersion & (WithVerInfo | WithResolve);

/**
 * An option that executes a callback function.
 */
type FunctionOption = WithBasic<'function'> &
  WithFunction &
  WithValue<unknown> &
  WithParam<unknown> &
  (WithDefault | WithRequired) &
  (WithExample | WithParamName);

/**
 * An option that executes a command.
 */
type CommandOption = WithBasic<'command'> &
  WithCommand &
  WithValue<unknown> &
  (WithDefault | WithRequired);

/**
 * An option that has a boolean value and is enabled if specified (or disabled if negated).
 */
type FlagOption = WithBasic<'flag'> &
  WithMisc &
  WithFlag &
  WithValue<boolean> &
  (WithDefault | WithRequired);

/**
 * An option that has a boolean value (accepts a single boolean parameter).
 */
type BooleanOption = WithBasic<'boolean'> &
  WithMisc &
  WithValue<boolean> &
  WithParam<boolean> &
  (WithDefault | WithRequired) &
  (WithExample | WithParamName);

/**
 * An option that has a string value (accepts a single string parameter).
 */
type StringOption = WithBasic<'string'> &
  WithMisc &
  WithString &
  WithValue<string> &
  WithParam<string> &
  (WithDefault | WithRequired) &
  (WithExample | WithParamName) &
  (WithEnums | WithRegex);

/**
 * An option that has a number value (accepts a single number parameter).
 */
type NumberOption = WithBasic<'number'> &
  WithMisc &
  WithNumber &
  WithValue<number> &
  WithParam<number> &
  (WithDefault | WithRequired) &
  (WithExample | WithParamName) &
  (WithEnums | WithRange);

/**
 * An option that has a string array value (may accept single or multiple parameters).
 */
type StringsOption = WithBasic<'strings'> &
  WithMisc &
  WithString &
  WithArray &
  WithValue<Array<string>> &
  WithParam<Array<string>> &
  (WithDefault | WithRequired) &
  (WithExample | WithParamName) &
  (WithEnums | WithRegex);

/**
 * An option that has a number array value (may accept single or multiple parameters).
 */
type NumbersOption = WithBasic<'numbers'> &
  WithMisc &
  WithNumber &
  WithArray &
  WithValue<Array<number>> &
  WithParam<Array<number>> &
  (WithDefault | WithRequired) &
  (WithExample | WithParamName) &
  (WithEnums | WithRange);

/**
 * The public option types.
 */
type PublicOption =
  | HelpOption
  | VersionOption
  | FunctionOption
  | CommandOption
  | FlagOption
  | BooleanOption
  | StringOption
  | NumberOption
  | StringsOption
  | NumbersOption;

/**
 * A collection of public option definitions.
 */
export type Options = Readonly<Record<string, PublicOption>>;

/**
 * The data type of an option that may have a default value.
 * @template T The option definition type
 */
type DefaultDataType<T extends PublicOption> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { default: (...args: any) => infer R }
    ? R
    : T extends { default: infer D }
      ? D extends undefined
        ? never
        : D
      : T extends { required: true }
        ? never
        : undefined;

/**
 * The data type of an option that has parameters.
 * @template T The option definition type
 * @template D The option value data type
 * @template E The effective data type
 */
type ParamDataType<T extends PublicOption, D, E> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { parse: (...args: any) => infer R }
    ? R extends D
      ? E
      : R extends Promise<D>
        ? Promise<E>
        : R extends D | Promise<D>
          ? E | Promise<E>
          : E
    : E;

/**
 * The data type of an option with enumerated values.
 * @template T The option definition type
 * @template D The option value data type
 */
type EnumsDataType<T extends PublicOption, D> = T extends { enums: ReadonlyArray<infer E> } ? E : D;

/**
 * The data type of a (possibly) delimited array-valued option.
 * @template T The option definition type
 */
type DelimitedDataType<T extends PublicOption> = T extends { separator: string } ? never : [];

/**
 * The data type of a single-valued option.
 * @template T The option definition type
 * @template D The option value data type
 */
type SingleDataType<T extends PublicOption, D> = ParamDataType<T, D, EnumsDataType<T, D>>;

/**
 * The data type of an array-valued option.
 * @template T The option definition type
 * @template D The option value data type
 */
type ArrayDataType<T extends PublicOption, D> = ParamDataType<T, D, Array<EnumsDataType<T, D>>>;

/**
 * The data type of an option value.
 * @template T The option definition type
 */
type OptionDataType<T extends PublicOption> =
  T extends WithBasic<'function'>
    ? ReturnType<T['exec']> | DefaultDataType<T>
    : T extends WithBasic<'command'>
      ? ReturnType<T['cmd']> | DefaultDataType<T>
      : T extends WithBasic<'flag'>
        ? boolean | DefaultDataType<T>
        : T extends WithBasic<'boolean'>
          ? SingleDataType<T, boolean> | DefaultDataType<T>
          : T extends WithBasic<'string'>
            ? SingleDataType<T, string> | DefaultDataType<T>
            : T extends WithBasic<'number'>
              ? SingleDataType<T, number> | DefaultDataType<T>
              : T extends WithBasic<'strings'>
                ? ArrayDataType<T, string> | DelimitedDataType<T> | DefaultDataType<T>
                : T extends WithBasic<'numbers'>
                  ? ArrayDataType<T, number> | DelimitedDataType<T> | DefaultDataType<T>
                  : never;

/**
 * The non-valued option types.
 */
type NonValued = WithBasic<'help' | 'version'>;

/**
 * A generic collection of option values.
 * @template T The type of the option definitions
 */
export type OptionValues<T extends Options = Options> = Resolve<{
  -readonly [key in keyof T as T[key] extends NonValued ? never : key]: OptionDataType<T[key]>;
}>;

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Tests if an option is niladic (i.e., accepts no parameter).
 * @param option The option definition
 * @returns True if the option is niladic
 * @internal
 */
export function isNiladic(option: Option): boolean {
  return ['help', 'function', 'version', 'command', 'flag'].includes(option.type);
}

/**
 * Tests if an option is variadic (i.e., it accepts a variable number of parameters).
 * @param option The option definition
 * @returns True if the option is variadic
 * @internal
 */
export function isVariadic(option: Option): boolean {
  return isArray(option) && !option.separator;
}

/**
 * Tests if an option is an array option (i.e., has an array value).
 * @param option The option definition
 * @returns True if the option is an array option
 * @internal
 */
export function isArray(option: Option): boolean {
  return option.type === 'strings' || option.type === 'numbers';
}

/**
 * Tests if an option is a valued option (i.e., has a value).
 * @param option The option definition
 * @returns True if the option is a valued option
 * @internal
 */
export function isSpecial(option: Option): boolean {
  return option.type === 'help' || option.type === 'version';
}

/**
 * Tests if an option has unknown values.
 * @param option The option definition
 * @returns True if the option is unknown-valued
 * @internal
 */
export function isUnknown(option: Option): boolean {
  return option.type === 'function' || option.type === 'command';
}

/**
 * Tests if an option has a boolean value.
 * @param option The option definition
 * @returns True if the option is boolean-valued
 * @internal
 */
export function isBoolean(option: Option): boolean {
  return option.type === 'flag' || option.type === 'boolean';
}

/**
 * Tests if an option has string values.
 * @param option The option definition
 * @returns True if the option is string-valued
 * @internal
 */
export function isString(option: Option): boolean {
  return option.type === 'string' || option.type === 'strings';
}

/**
 * Tests if an option has number values.
 * @param option The option definition
 * @returns True if the option is number-valued
 * @internal
 */
export function isNumber(option: Option): boolean {
  return option.type === 'number' || option.type === 'numbers';
}
