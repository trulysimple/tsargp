//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import { type FormatConfig } from './formatter';
import { type Style, fg, tf, style, TerminalString, ErrorMessage } from './styles';

export type {
  ParseCallback,
  ResolveCallback,
  ExecuteCallback,
  CompleteCallback,
  Option,
  Options,
  OptionDataType,
  OptionValues,
  CastToOptionValues,
  OptionStyles,
  OtherStyles,
  StringOption,
  NumberOption,
  FlagOption,
  BooleanOption,
  StringsOption,
  NumbersOption,
  FunctionOption,
  CommandOption,
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
  ConcreteStyles,
  ConcreteError,
  ErrorConfig,
};

export {
  req,
  defaultStyles,
  emptyStyles,
  defaultConfig,
  RequiresAll,
  RequiresOne,
  RequiresNot,
  OptionRegistry,
  ErrorItem,
  isNiladic,
  isArray,
  isVariadic,
  formatBoolean,
  formatString,
  formatNumber,
  formatRegExp,
  formatURL,
  formatOption,
  formatParam,
};

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * A helper object to create option requirement expressions.
 */
const req = {
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

/**
 * The kind of items that can be thrown as error messages.
 */
// Internal note: this needs to be defined before `defaultConfig`, otherwise bun chokes.
const enum ErrorItem {
  parseError,
  parseErrorWithSimilar,
  unknownOption,
  unknownOptionWithSimilar,
  optionRequires,
  missingRequiredOption,
  missingParameter,
  missingPackageJson,
  positionalInlineValue,
  optionInlineValue,
  emptyPositionalMarker,
  invalidOptionName,
  optionEmptyVersion,
  optionRequiresItself,
  unknownRequiredOption,
  niladicOptionRequiredValue,
  optionZeroEnum,
  duplicateOptionName,
  duplicatePositionalOption,
  duplicateStringOptionEnum,
  duplicateNumberOptionEnum,
  optionValueIncompatible,
  stringOptionEnums,
  stringOptionRegex,
  numberOptionEnums,
  numberOptionRange,
  arrayOptionLimit,
}

/**
 * The default styles of error messages.
 */
const defaultStyles: ConcreteStyles = {
  boolean: style(fg.yellow),
  string: style(fg.green),
  number: style(fg.yellow),
  regex: style(fg.red),
  option: style(fg.brightMagenta),
  param: style(fg.brightBlack),
  url: style(fg.brightBlack),
  text: style(tf.clear),
};

/**
 * A set of empty styles for error messages.
 */
const emptyStyles: ConcreteStyles = {
  boolean: '',
  string: '',
  number: '',
  regex: '',
  option: '',
  param: '',
  url: '',
  text: '',
};

/**
 * The default error messages configuration.
 */
const defaultConfig: ConcreteError = {
  styles: defaultStyles,
  phrases: {
    [ErrorItem.parseError]: '%t\n\nDid you mean to specify an option name instead of %o?',
    [ErrorItem.parseErrorWithSimilar]:
      '%t\n\n Did you mean to specify an option name instead of %o1?\n\nSimilar names are %o2.',
    [ErrorItem.unknownOption]: 'Unknown option %o.',
    [ErrorItem.unknownOptionWithSimilar]: 'Unknown option %o1.\n\nSimilar names are %o2.',
    [ErrorItem.optionRequires]: 'Option %o requires %t.',
    [ErrorItem.missingRequiredOption]: 'Option %o is required.',
    [ErrorItem.missingParameter]: 'Missing parameter to %o.',
    [ErrorItem.missingPackageJson]: 'Could not find a "package.json" file.',
    [ErrorItem.positionalInlineValue]: 'Positional marker %o does not accept inline values.',
    [ErrorItem.optionInlineValue]: 'Option %o does not accept inline values.',
    [ErrorItem.emptyPositionalMarker]: 'Option %o contains empty positional marker.',
    [ErrorItem.invalidOptionName]: 'Invalid option name %o.',
    [ErrorItem.optionEmptyVersion]: 'Option %o contains empty version.',
    [ErrorItem.optionRequiresItself]: 'Option %o requires itself.',
    [ErrorItem.unknownRequiredOption]: 'Unknown required option %o.',
    [ErrorItem.niladicOptionRequiredValue]: 'Required option %o does not accept values.',
    [ErrorItem.optionZeroEnum]: 'Option %o has zero enum values.',
    [ErrorItem.duplicateOptionName]: 'Duplicate option name %o.',
    [ErrorItem.duplicatePositionalOption]: 'Duplicate positional option %o.',
    [ErrorItem.duplicateStringOptionEnum]: 'Option %o has duplicate enum %s.',
    [ErrorItem.duplicateNumberOptionEnum]: 'Option %o has duplicate enum %n.',
    [ErrorItem.optionValueIncompatible]:
      'Option %o has incompatible value %p. Should be of type %s.',
    [ErrorItem.stringOptionEnums]: 'Invalid parameter to %o: %s1. Possible values are %s2.',
    [ErrorItem.stringOptionRegex]: 'Invalid parameter to %o: %s. Value must match the regex %r.',
    [ErrorItem.numberOptionEnums]: 'Invalid parameter to %o: %n1. Possible values are %n2.',
    [ErrorItem.numberOptionRange]: 'Invalid parameter to %o: %n1. Value must be in the range %n2.',
    [ErrorItem.arrayOptionLimit]: `Option %o has too many values (%n1). Should have at most %n2.`,
  },
};

/**
 * The error formatting functions.
 */
const formatFunctions: Readonly<Record<string, FormatFunction>> = {
  b: formatBoolean,
  s: formatString,
  n: formatNumber,
  r: formatRegExp,
  o: formatOption,
  p: formatParam,
  u: formatURL,
  t: formatTerm,
};

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * A set of styles for displaying an option on the terminal.
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
  readonly descr?: Style;
};

/**
 * A set of styles for displaying text on the terminal.
 */
type OtherStyles = {
  /**
   * The style of boolean values.
   */
  readonly boolean?: Style;
  /**
   * The style of string values.
   */
  readonly string?: Style;
  /**
   * The style of number values.
   */
  readonly number?: Style;
  /**
   * The style of regular expressions.
   */
  readonly regex?: Style;
  /**
   * The style of option names.
   */
  readonly option?: Style;
  /**
   * The style of option parameters.
   */
  readonly param?: Style;
  /**
   * The style of URLs.
   */
  readonly url?: Style;
  /**
   * The style of general text.
   */
  readonly text?: Style;
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
 * An object that maps option keys to required values.
 *
 * Values can be `undefined` to indicate presence, or `null` to indicate absence.
 */
type RequiresVal = { [key: string]: ParamOption['example'] | null };

/**
 * An option requirement can be either:
 *
 * - an option key;
 * - an object that maps option keys to required values; or
 * - a requirement expression.
 */
type Requires = string | RequiresVal | RequiresExp;

/**
 * A callback to parse the value of option parameters. Any specified normalization or * constraint
 * will be applied to the returned value.
 * @template T The return data type
 * @param name The option name (as specified on the command-line)
 * @param value The parameter value
 * @returns The parsed value
 */
type ParseCallback<T> = (name: string, value: string) => T;

/**
 * A module-relative resolution function (i.e., scoped to a module). To be used in non-browser
 * environments only.
 */
type ResolveCallback = (specifier: string) => string;

/**
 * A callback for default values.
 * @template T The return data type
 * @param values The values parsed so far
 * @returns The default value
 */
type DefaultCallback<T> = (values: CastToOptionValues) => T | Promise<T>;

/**
 * A callback for function options.
 * @param values The values parsed so far
 * @param comp True if performing completion (but not in the current iteration)
 * @param rest The remaining command-line arguments
 * @returns The option value
 */
type ExecuteCallback = (values: CastToOptionValues, comp: boolean, rest: Array<string>) => unknown;

/**
 * A callback for command options.
 * @param values The values parsed before the command
 * @param cmdValues The values parsed after the command
 * @returns The option value
 */
type CommandCallback = (values: CastToOptionValues, cmdValues: CastToOptionValues) => unknown;

/**
 * A callback for option completion.
 * @param values The values parsed so far
 * @param comp The word being completed (it may be an empty string)
 * @param rest The remaining command-line arguments
 * @returns The list of completion words
 */
type CompleteCallback = (
  values: CastToOptionValues,
  comp: string,
  rest: Array<string>,
) => Array<string> | Promise<Array<string>>;

/**
 * Defines attributes common to all options.
 * @template T The option type
 */
type WithType<T extends string> = {
  /**
   * The option type.
   */
  readonly type: T;
  /**
   * The option names, as they appear on the command-line (e.g. `-h` or `--help`).
   *
   * Names cannot contain whitespace or the equals sign `=` (since it may act as option-value
   * separator). Empty names or `null`s can be specified in order to skip the respective "slot" in
   * the help message names column.
   */
  readonly names?: ReadonlyArray<string | null>;
  /**
   * A name to be displayed in error and help messages in cases where one is not available (e.g.,
   * when evaluating option requirements or processing positional arguments). It is not validated
   * and can be anything.
   *
   * If not specified, the first name in the {@link WithType.names} array will be used.
   */
  readonly preferredName?: string;
  /**
   * The option synopsis. It may contain inline styles.
   */
  readonly desc?: string;
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
   * The option deprecation reason. It may contain inline styles.
   */
  readonly deprecated?: string;
  /**
   * The option requirements.
   */
  readonly requires?: Requires;
  /**
   * A reference to an external resource.
   */
  readonly link?: URL;
};

/**
 * Defines attributes for a required option.
 */
type WithRequired = {
  /**
   * True if the option is always required.
   */
  readonly required?: true;
  /**
   * @deprecated mutually exclusive with {@link WithRequired.required}
   */
  readonly default?: never;
};

/**
 * Defines attributes for a default value.
 * @template T The default data type
 */
type WithDefault<T> = {
  /**
   * The option default value or a callback that returns the default value.
   *
   * The default value is set at the end of the parsing loop if the option was not specified on the
   * command-line. You may use a callback to inspect parsed values and determine the default value
   * based on those values.
   */
  readonly default?: T | DefaultCallback<T>;
  /**
   * @deprecated mutually exclusive with {@link WithDefault.default}
   */
  readonly required?: never;
};

/**
 * Defines attributes common to all options that accept parameters.
 */
type WithParam = {
  /**
   * Allows positional arguments. There may be at most one option with this setting.
   *
   * If set, then any argument not recognized as an option name will be considered positional.
   * Additionally, if a string is specified as positional marker, then all arguments beyond this
   * marker will be considered positional.
   *
   * We recommend also setting {@link WithType.preferredName} to some explanatory name.
   */
  readonly positional?: true | string;
  /**
   * A custom completion callback. It should not throw. If asynchronous, you should call
   * `ArgumentParser.parseAsync` and await its result.
   */
  readonly complete?: CompleteCallback;
};

/**
 * Defines attributes for an example value.
 * @template T The example data type
 */
type WithExample<T> = {
  /**
   * The option example value. Replaces the option type in the help message parameter column.
   */
  readonly example?: T;
  /**
   * @deprecated mutually exclusive with {@link WithExample.example}
   */
  readonly paramName?: never;
};

/**
 * Defines attributes for a parameter name.
 */
type WithParamName = {
  /**
   * The option parameter name. Replaces the option type in the help message parameter column.
   */
  readonly paramName?: string;
  /**
   * @deprecated mutually exclusive with {@link WithParamName.paramName}
   */
  readonly example?: never;
};

/**
 * Defines attributes for a custom callback that parses single-value parameters.
 */
type WithParse<T> = {
  /**
   * A custom function to parse the value of the option parameter.
   */
  readonly parse?: ParseCallback<T | Promise<T>>;
  /**
   * @deprecated mutually exclusive with {@link WithParse.parse}
   */
  readonly separator?: never;
  /**
   * @deprecated mutually exclusive with {@link WithParse.parse}
   */
  readonly parseDelimited?: never;
};

/**
 * Defines attributes for a custom callback that parses delimited-value parameters.
 */
type WithParseDelimited<T> = {
  /**
   * A custom function to parse the delimited values of the option parameter. If specified, the
   * option accepts a single parameter.
   */
  readonly parseDelimited?: ParseCallback<Array<T> | Promise<Array<T>>>;
  /**
   * @deprecated mutually exclusive with {@link WithParseDelimited.parseDelimited}
   */
  readonly parse?: never;
  /**
   * @deprecated mutually exclusive with {@link WithParseDelimited.parseDelimited}
   */
  readonly separator?: never;
};

/**
 * Defines attributes for an option that accepts delimited-value parameters.
 */
type WithDelimited = {
  /**
   * The parameter value separator. If specified, the option accepts a single parameter.
   */
  readonly separator?: string | RegExp;
  /**
   * @deprecated mutually exclusive with {@link WithDelimited.separator}
   */
  readonly parse?: never;
  /**
   * @deprecated mutually exclusive with {@link WithDelimited.separator}
   */
  readonly parseDelimited?: never;
};

/**
 * Defines attributes common to all options that have array values.
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
   * The maximum allowed number of elements.
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
  readonly enums?: ReadonlyArray<T>;
  /**
   * @deprecated mutually exclusive with {@link WithEnums.enums}
   */
  readonly regex?: never;
  /**
   * @deprecated mutually exclusive with {@link WithEnums.enums}
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
  readonly regex?: RegExp;
  /**
   * @deprecated mutually exclusive with {@link WithRegex.regex}
   */
  readonly enums?: never;
};

/**
 * Defines attributes for a range constraint.
 */
type WithRange = {
  /**
   * The (closed) numeric range. You may want to use `[-Infinity, Infinity]` to disallow `NaN`.
   */
  readonly range?: [floor: number, ceiling: number];
  /**
   * @deprecated mutually exclusive with {@link WithRange.range}
   */
  readonly enums?: never;
};

/**
 * Defines the version attribute of a version option.
 */
type WithVersion = {
  /**
   * The semantic version (e.g., 0.1.0) or version information. It is not validated, but cannot be
   * empty. It may contain inline styles.
   */
  readonly version: string;
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
   * A resolution function scoped to the module where a `package.json` file should be searched. Use
   * `import.meta.resolve`. Use in non-browser environments only. This results in an asynchronous
   * operation, so you should call `ArgumentParser.parseAsync` and await its result.
   */
  readonly resolve: ResolveCallback;
  /**
   * @deprecated mutually exclusive with {@link WithResolve.resolve}
   */
  readonly version?: never;
};

/**
 * Defines attributes common to all options that accept string parameters.
 */
type WithString = (WithEnums<string> | WithRegex) & {
  /**
   * True if the values should be trimmed (remove leading and trailing whitespace).
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
type WithNumber = (WithEnums<number> | WithRange) & {
  /**
   * The kind of rounding to apply.
   */
  readonly round?: 'trunc' | 'floor' | 'ceil' | 'round';
};

/**
 * Defines attributes for a flag option with negation.
 */
type WithNegation = {
  /**
   * The names used for negation (e.g., '--no-flag').
   */
  readonly negationNames?: ReadonlyArray<string>;
};

/**
 * An option that has a boolean value (accepts a single boolean parameter).
 */
type BooleanOption = WithType<'boolean'> &
  WithParam &
  (WithDefault<boolean> | WithRequired) &
  (WithExample<boolean> | WithParamName) &
  WithParse<boolean>;

/**
 * An option that has a string value (accepts a single string parameter).
 */
type StringOption = WithType<'string'> &
  WithParam &
  (WithDefault<string> | WithRequired) &
  (WithExample<string> | WithParamName) &
  WithString &
  WithParse<string>;

/**
 * An option that has a number value (accepts a single number parameter).
 */
type NumberOption = WithType<'number'> &
  WithParam &
  (WithDefault<number> | WithRequired) &
  (WithExample<number> | WithParamName) &
  WithNumber &
  WithParse<number>;

/**
 * An option that has a string array value (may accept single or multiple parameters).
 */
type StringsOption = WithType<'strings'> &
  WithParam &
  (WithDefault<ReadonlyArray<string>> | WithRequired) &
  (WithExample<ReadonlyArray<string>> | WithParamName) &
  WithString &
  WithArray &
  (WithParse<string> | WithParseDelimited<string> | WithDelimited);

/**
 * An option that has a number array value (may accept single or multiple parameters).
 */
type NumbersOption = WithType<'numbers'> &
  WithParam &
  (WithDefault<ReadonlyArray<number>> | WithRequired) &
  (WithExample<ReadonlyArray<number>> | WithParamName) &
  WithNumber &
  WithArray &
  (WithParse<number> | WithParseDelimited<number> | WithDelimited);

/**
 * An option that has a boolean value and is enabled if specified (or disabled if negated).
 */
type FlagOption = WithType<'flag'> & (WithDefault<boolean> | WithRequired) & WithNegation;

/**
 * An option that executes a callback function.
 */
type FunctionOption = WithType<'function'> & {
  /**
   * The callback function. If asynchronous, you should call `ArgumentParser.parseAsync` and await
   * its result.
   */
  readonly exec: ExecuteCallback;
  /**
   * True to break the parsing loop.
   */
  readonly break?: true;
};

/**
 * An option that executes a command.
 */
type CommandOption = WithType<'command'> & {
  /**
   * The callback function. If asynchronous, you should call `ArgumentParser.parseAsync` and await
   * its result.
   */
  readonly cmd: CommandCallback;
  /**
   * The command options or a callback that returns the options (for use with recursive commands).
   */
  readonly options: Options | (() => Options);
};

/**
 * An option that throws a help message.
 */
type HelpOption = WithType<'help'> & {
  /**
   * The usage message. This goes before everything else.
   */
  readonly usage?: string;
  /**
   * The footer message. This goes after everything else.
   */
  readonly footer?: string;
  /**
   * The help format configuration.
   */
  readonly format?: FormatConfig;
  /**
   * The style of option group headings.
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
 * An option that performs a user-defined action.
 */
type ExecutingOption = FunctionOption | CommandOption;

/**
 * An option that accepts no parameters.
 */
type NiladicOption = FlagOption | ExecutingOption | SpecialOption;

/**
 * A single-valued option that accepts a single parameter.
 */
type SingleOption = BooleanOption | StringOption | NumberOption;

/**
 * An array-valued option that may accept multiple parameters.
 */
type ArrayOption = StringsOption | NumbersOption;

/**
 * An option that accepts any kind of parameter.
 */
type ParamOption = SingleOption | ArrayOption;

/**
 * An option that has a default value.
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
 * The data type of an option with a default value.
 * @template T The option definition type
 */
type DefaultDataType<T extends ValuedOption> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { default: (...args: any) => infer R }
    ? Writable<R>
    : T extends { default: infer D }
      ? Writable<D>
      : undefined;

/**
 * The data type of a non-niladic option.
 * @template T The option definition type
 * @template D The option value data type
 * @template E The effective data type
 */
type ParamDataType<T extends ParamOption, D, E> = T extends
  | { parse: ParseCallback<D> }
  | { parseDelimited: ParseCallback<Array<D>> }
  ? E
  : T extends
        | { parse: ParseCallback<Promise<D>> }
        | { parseDelimited: ParseCallback<Promise<Array<D>>> }
    ? Promise<E>
    : T extends
          | { parse: ParseCallback<D | Promise<D>> }
          | { parseDelimited: ParseCallback<Array<D> | Promise<Array<D>>> }
      ? E | Promise<E>
      : E;

/**
 * The data type of an option with enumerated values.
 * @template T The option definition type
 * @template D The option value data type
 */
type EnumsDataType<T extends ParamOption, D> = T extends { enums: Array<infer E> } ? E : D;

/**
 * The data type of a (possibly) delimited array-valued option.
 * @template T The option definition type
 */
type DelimitedDataType<T extends ArrayOption> = T extends
  | { separator: string }
  | { parseDelimited: NonNullable<unknown> }
  ? never
  : [];

/**
 * The data type of a single-valued option.
 * @template T The option definition type
 * @template D The option value data type
 */
type SingleDataType<T extends SingleOption, D> = ParamDataType<T, D, EnumsDataType<T, D>>;

/**
 * The data type of an array-valued option.
 * @template T The option definition type
 * @template D The option value data type
 */
type ArrayDataType<T extends ArrayOption, D> = ParamDataType<T, D, Array<EnumsDataType<T, D>>>;

/**
 * The data type of an option value.
 * @template T The option definition type
 */
type OptionDataType<T extends Option> = T extends FunctionOption
  ? ReturnType<T['exec']> | undefined
  : T extends CommandOption
    ? ReturnType<T['cmd']> | undefined
    : T extends FlagOption
      ? boolean | DefaultDataType<T>
      : T extends BooleanOption
        ? SingleDataType<T, boolean> | DefaultDataType<T>
        : T extends StringOption
          ? SingleDataType<T, string> | DefaultDataType<T>
          : T extends NumberOption
            ? SingleDataType<T, number> | DefaultDataType<T>
            : T extends StringsOption
              ? ArrayDataType<T, string> | DelimitedDataType<T> | DefaultDataType<T>
              : T extends NumbersOption
                ? ArrayDataType<T, number> | DelimitedDataType<T> | DefaultDataType<T>
                : never;

/**
 * A generic collection of option values.
 * @template T The type of the option definitions
 */
type OptionValues<T extends Options> = Resolve<{
  -readonly [key in keyof T as T[key] extends SpecialOption ? never : key]: OptionDataType<T[key]>;
}>;

/**
 * A collection of option values that should be cast to {@link OptionValues}`<typeof _your_options_>`
 * or to the type of your values class.
 */
type CastToOptionValues = Record<string, unknown>;

/**
 * Information regarding a positional option. Used internally.
 */
type Positional = {
  key: string;
  name: string;
  option: Option;
  marker?: string;
};

/**
 * A helper type to resolve types in IntelliSense.
 * @template T The type to be resolved
 */
type Resolve<T> = T & unknown;

/**
 * A helper type to remove the readonly attribute from a type.
 * @template T The source type
 */
type Writable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * A helper type to remove optionality from types and properties.
 * @template T The source type
 */
type Concrete<T> = Exclude<
  {
    [K in keyof T]-?: Concrete<T[K]>;
  },
  undefined
>;

/**
 * The error messages configuration.
 */
type ErrorConfig = {
  /**
   * The error message styles
   */
  readonly styles?: OtherStyles;
  /**
   * The error message phrases
   */
  readonly phrases?: Readonly<Partial<Record<ErrorItem, string>>>;
};

/**
 * A concrete version of the error messages configuration.
 */
type ConcreteError = Concrete<ErrorConfig>;

/**
 * A concrete version of the error message styles.
 */
type ConcreteStyles = ConcreteError['styles'];

/**
 * A set of formatting functions for error messages.
 */
type FormatFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) => void;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements a compilation of option definitions.
 */
class OptionRegistry {
  readonly names = new Map<string, string>();
  readonly required = new Array<string>();
  readonly positional: Positional | undefined;

  /**
   * Creates an option registry based on a set of option definitions.
   * @param options The option definitions
   * @param config The error messages configuration
   * @throws On duplicate option names and duplicate positional options
   */
  constructor(
    readonly options: Options,
    readonly config: ConcreteError = defaultConfig,
  ) {
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option);
      if ('positional' in option && option.positional) {
        if (this.positional) {
          throw this.error(ErrorItem.duplicatePositionalOption, { o: key });
        }
        const name = option.preferredName ?? option.names?.find((name) => name) ?? 'unnamed';
        const marker = typeof option.positional === 'string' ? option.positional : undefined;
        this.positional = { key, name, option, marker };
      }
      if ('required' in option && option.required) {
        this.required.push(key);
      }
    }
  }

  /**
   * Registers or validates an option's names.
   * @param key The option key
   * @param option The option definition
   * @param validate True if performing validation
   * @throws On invalid name, duplicate name or empty positional marker
   */
  private registerNames(key: string, option: Option, validate = false) {
    const names = option.names ? option.names.slice() : [];
    if (option.type === 'flag' && option.negationNames) {
      names.push(...option.negationNames);
    }
    if ('positional' in option && typeof option.positional === 'string') {
      if (validate && !option.positional) {
        throw this.error(ErrorItem.emptyPositionalMarker, { o: key });
      }
      names.push(option.positional);
    }
    for (const name of names) {
      if (!name) {
        continue;
      }
      if (!validate) {
        if (this.names.has(name)) {
          throw this.error(ErrorItem.duplicateOptionName, { o: name });
        }
        this.names.set(name, key);
      } else if (name.match(/[\s=]+/)) {
        throw this.error(ErrorItem.invalidOptionName, { o: name });
      }
    }
  }

  /**
   * Validates all options' definitions
   * @throws On options with no name, invalid name, empty positional marker, invalid enum values,
   * invalid default value, invalid example value, invalid requirements, invalid required values,
   * version option with empty version and module-resolve function
   */
  validate() {
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option, true);
      if (!isNiladic(option)) {
        this.validateEnums(key, option);
        if (typeof option.default !== 'function') {
          this.validateValue(key, option, option.default);
        }
        this.validateValue(key, option, option.example);
      }
      // no need to verify flag option default value
      if (option.requires) {
        this.validateRequirements(key, option.requires);
      }
      if (option.type === 'version' && option.version === '') {
        throw this.error(ErrorItem.optionEmptyVersion, { o: key });
      }
    }
  }

  /**
   * Validates an option's requirements.
   * @param key The option key
   * @param requires The option requirements
   * @throws On invalid requirements or invalid required values
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
   * @throws On option requiring itself, unknown required option, niladic option required with value
   * or invalid required values for non-niladic options
   */
  private validateRequirement(
    key: string,
    requiredKey: string,
    requiredValue?: RequiresVal[string],
  ) {
    if (requiredKey === key) {
      throw this.error(ErrorItem.optionRequiresItself, { o: requiredKey });
    }
    if (!(requiredKey in this.options)) {
      throw this.error(ErrorItem.unknownRequiredOption, { o: requiredKey });
    }
    if (requiredValue !== undefined && requiredValue !== null) {
      const option = this.options[requiredKey];
      if (isNiladic(option)) {
        throw this.error(ErrorItem.niladicOptionRequiredValue, { o: requiredKey });
      }
      this.validateValue(requiredKey, option, requiredValue);
    }
  }

  /**
   * Checks the sanity of the option's enumerated values.
   * @param key The option key
   * @param option The option definition
   * @throws On zero or duplicate enumerated values or values not satisfying specified constraints
   */
  private validateEnums(key: string, option: ParamOption) {
    if ('enums' in option && option.enums) {
      if (!option.enums.length) {
        throw this.error(ErrorItem.optionZeroEnum, { o: key });
      }
      const set = new Set<string | number>(option.enums);
      if (set.size !== option.enums.length) {
        for (const value of option.enums) {
          if (!set.delete(value)) {
            if (option.type === 'string' || option.type === 'strings') {
              throw this.error(ErrorItem.duplicateStringOptionEnum, { o: key, s: value });
            }
            throw this.error(ErrorItem.duplicateNumberOptionEnum, { o: key, n: value });
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
   * @throws On value not conforming to the given type
   */
  private assertType<T>(value: unknown, key: string, type: string): asserts value is T {
    if (typeof value !== type) {
      throw this.error(ErrorItem.optionValueIncompatible, { o: key, p: value, s: type });
    }
  }

  /**
   * Checks the sanity of the option's value (default, example or required).
   * @param key The option key
   * @param option The option definition
   * @param value The option value
   * @throws On value not satisfying specified constraints
   */
  private validateValue(key: string, option: ParamOption, value: ParamOption['example']) {
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
        const normalized = value.map((val) => {
          this.assertType<string>(val, key, 'string');
          return this.normalizeString(option, key, val);
        });
        this.normalizeArray(option, key, normalized);
        break;
      }
      case 'numbers': {
        this.assertType<object>(value, key, 'object');
        const normalized = value.map((val) => {
          this.assertType<number>(val, key, 'number');
          return this.normalizeNumber(option, key, val);
        });
        this.normalizeArray(option, key, normalized);
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
   * @throws On value not satisfying the specified enumeration or regex constraint
   */
  normalizeString(option: StringOption | StringsOption, name: string, value: string): string {
    if (option.trim) {
      value = value.trim();
    }
    if (option.case) {
      value = option.case === 'lower' ? value.toLowerCase() : value.toLocaleUpperCase();
    }
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      throw this.error(ErrorItem.stringOptionEnums, { o: name, s1: value, s2: option.enums });
    }
    if ('regex' in option && option.regex && !option.regex.test(value)) {
      throw this.error(ErrorItem.stringOptionRegex, { o: name, s: value, r: option.regex });
    }
    return value;
  }

  /**
   * Normalizes the value of a number option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @throws On value not satisfying the specified enumeration or range constraint
   */
  normalizeNumber(option: NumberOption | NumbersOption, name: string, value: number): number {
    if (option.round) {
      value = Math[option.round](value);
    }
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      throw this.error(ErrorItem.numberOptionEnums, { o: name, n1: value, n2: option.enums });
    }
    if (
      'range' in option &&
      option.range &&
      !(value >= option.range[0] && value <= option.range[1]) // handles NaN as well
    ) {
      throw this.error(ErrorItem.numberOptionRange, { o: name, n1: value, n2: option.range });
    }
    return value;
  }

  /**
   * Normalizes the value of an array option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @throws On value not satisfying the specified limit constraint
   */
  normalizeArray(option: ArrayOption, name: string, value: Array<string | number>) {
    if (option.unique) {
      const unique = [...new Set(value)];
      value.length = 0;
      value.push(...unique);
    }
    if (option.limit !== undefined && value.length > option.limit) {
      throw this.error(ErrorItem.arrayOptionLimit, {
        o: name,
        n1: value.length,
        n2: option.limit,
      });
    }
  }

  /**
   * Creates an error with a formatted message.
   * @param kind The kind of error message
   * @param args The error arguments
   * @returns The formatted error
   */
  error(kind: ErrorItem, args?: Record<string, unknown>): Error {
    const str = new TerminalString().addSequence(this.config.styles.text);
    const phrase = this.config.phrases[kind];
    if (args) {
      str.splitText(phrase, (spec) => {
        const arg = spec.slice(1);
        const fmt = arg[0];
        if (fmt in formatFunctions && arg in args) {
          const value = args[arg];
          const format = formatFunctions[fmt];
          if (Array.isArray(value)) {
            str.addOpening('[');
            value.forEach((val, i) => {
              format(val, this.config.styles, this.config.styles.text, str);
              if (i < value.length - 1) {
                str.addClosing(',');
              }
            });
            str.addClosing(']');
          } else {
            format(value, this.config.styles, this.config.styles.text, str);
          }
        }
      });
    } else {
      str.splitText(phrase);
    }
    return new ErrorMessage(str.addSequence(style(tf.clear)));
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
  return ['flag', 'function', 'help', 'version', 'command'].includes(option.type);
}

/**
 * Tests if an option is an array option (i.e., has an array value).
 * @param option The option definition
 * @returns True if the option is an array option
 */
function isArray(option: Option): option is ArrayOption {
  return option.type === 'strings' || option.type === 'numbers';
}

/**
 * Tests if an array option is variadic (i.e., accepts multiple parameters).
 * @param option The option definition
 * @returns True if the option is variadic
 */
function isVariadic(option: ArrayOption): boolean {
  return (
    !('separator' in option && option.separator) &&
    !('parseDelimited' in option && option.parseDelimited)
  );
}

/**
 * Formats a boolean value to be printed on the terminal.
 * @param value The boolean value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatBoolean(
  value: boolean,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  result.addAndRevert(styles.boolean, value.toString(), style);
}

/**
 * Formats a string value to be printed on the terminal.
 * @param value The string value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatString(value: string, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.string, `'${value}'`, style);
}

/**
 * Formats a number value to be printed on the terminal.
 * @param value The number value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatNumber(value: number, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.number, value.toString(), style);
}

/**
 * Formats a regex value to be printed on the terminal.
 * @param value The regex value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatRegExp(value: RegExp, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.regex, value.toString(), style);
}

/**
 * Formats a URL value to be printed on the terminal.
 * @param value The URL value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatURL(value: URL, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.url, value.href, style);
}

/**
 * Formats an option name to be printed on the terminal.
 * @param name The option name
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatOption(name: string, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.option, name, style);
}

/**
 * Formats an option parameter to be printed on the terminal.
 * @param value The parameter value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatParam(value: unknown, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.param, `<${value}>`, style);
}

/**
 * Formats a previously formatted terminal string.
 * @param str The terminal string
 * @param result The resulting string
 */
function formatTerm(str: TerminalString, _1: ConcreteStyles, _2: Style, result: TerminalString) {
  result.addOther(str);
}
