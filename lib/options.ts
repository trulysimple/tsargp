//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { HelpFormat } from './formatter';
import type { Style } from './styles';
import { sgr } from './styles';

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
  ArrayOption,
  NiladicOption,
  ParamOption,
  ValuedOption,
  Requires,
  RequiresExp,
  RequiresVal,
  Registry,
  ConcreteStyles,
  Positional,
};

export {
  req,
  defaultStyles,
  RequiresAll,
  RequiresOne,
  RequiresNot,
  OptionRegistry,
  isNiladic,
  isArray,
  isValued,
  isMultivalued,
  normalizeString,
  normalizeNumber,
  normalizeArray,
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
  regex: sgr('31'),
  boolean: sgr('33'),
  string: sgr('32'),
  number: sgr('33'),
  option: sgr('35'),
  whitespace: sgr('0'),
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
 * A map of key-value pairs.
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
   * The (closed) numeric range.
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
 * The data type of an option.
 * @template T The option definition type
 * @template D The option value data type
 * @template E The effective data type
 */
type DataType<T extends Option, D, E> = T extends
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
type SingleDataType<T extends Option, D> =
  | DataType<T, D, T extends { enums: Array<D> } ? T['enums'][number] : D>
  | (T extends { default: D } ? never : undefined);

/**
 * The data type of an array option.
 * @template T The option definition type
 * @template D The option value data type
 */
type ArrayDataType<T extends Option, D> =
  | DataType<T, D, T extends { enums: Array<D> } ? Array<T['enums'][number]> : Array<D>>
  | (T extends Record<'separator' | 'parseDelimited', unknown> ? never : [])
  | (T extends { default: Array<D> } ? never : undefined);

/**
 * The data type of an option.
 * @template T The option definition type
 */
type OptionDataType<T extends Option = Option> = T extends { type: 'flag' | 'boolean' }
  ? SingleDataType<T, boolean>
  : T extends { type: 'string' }
    ? SingleDataType<T, string>
    : T extends { type: 'number' }
      ? SingleDataType<T, number>
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
 * The option registry interface.
 */
interface Registry {
  readonly names: Map<string, string>;
  readonly required: Array<string>;
  readonly positional: Positional | undefined;
}

type Concrete<T> = {
  [K in keyof T]-?: T[K];
};
type ConcreteStyles = Concrete<OtherStyles>;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements a compilation of option definitions.
 */
class OptionRegistry implements Registry {
  readonly names = new Map<string, string>();
  readonly required = new Array<string>();
  readonly positional: Positional | undefined;

  /**
   * Creates an option registry based on a set of option definitions.
   * @param options The option definitions
   */
  constructor(readonly options: Options) {
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option);
      if (!isNiladic(option)) {
        if (option.positional) {
          if (this.positional) {
            const optName = `${defaultStyles.option}${key}${defaultStyles.whitespace}`;
            throw Error(`Duplicate positional option ${optName}.`);
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
        const optName = `${defaultStyles.option}${key}${defaultStyles.whitespace}`;
        throw Error(`Option ${optName} contains no version or resolve function.`);
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
      const optName = `${defaultStyles.option}${key}${defaultStyles.whitespace}`;
      throw Error(`Option ${optName} has no name.`);
    }
    if (option.type === 'flag' && option.negationNames) {
      names.push(...option.negationNames.filter((name) => name));
    }
    if ('positional' in option && typeof option.positional === 'string') {
      if (!option.positional) {
        const optName = `${defaultStyles.option}${key}${defaultStyles.whitespace}`;
        throw Error(`Option ${optName} has empty positional marker.`);
      }
      names.push(option.positional);
    }
    for (const name of names) {
      if (name.match(/[\s=]+/)) {
        const optName = `${defaultStyles.option}${name}${defaultStyles.whitespace}`;
        throw Error(`Invalid option name ${optName}.`);
      }
      if (this.names.has(name)) {
        const optName = `${defaultStyles.option}${name}${defaultStyles.whitespace}`;
        throw Error(`Duplicate option name ${optName}.`);
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
        validateEnums(key, option, defaultStyles);
        validateValue(key, option, option.default, defaultStyles);
        validateValue(key, option, option.example, defaultStyles);
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
      const optName = `${defaultStyles.option}${key}${defaultStyles.whitespace}`;
      throw Error(`Option ${optName} requires itself.`);
    }
    if (!(requiredKey in this.options)) {
      const optName = `${defaultStyles.option}${requiredKey}${defaultStyles.whitespace}`;
      throw Error(`Unknown required option ${optName}.`);
    }
    if (requiredValue !== undefined && requiredValue !== null) {
      const option = this.options[requiredKey];
      if (isNiladic(option)) {
        throw Error(`Required option '${requiredKey}' does not accept values.`);
      }
      validateValue(requiredKey, option, requiredValue, defaultStyles);
    }
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

/**
 * Checks the sanity of the option's enumerated values.
 * @param key The option key
 * @param option The option definition
 * @param styles The error message styles
 */
function validateEnums(key: string, option: ParamOption, styles: ConcreteStyles) {
  if ('enums' in option && option.enums) {
    if (!option.enums.length) {
      const optName = `${styles.option}${key}${styles.whitespace}`;
      throw Error(`Option ${optName} has zero enum values.`);
    }
    const set = new Set<string | number>(option.enums);
    if (set.size !== option.enums.length) {
      for (const value of option.enums) {
        if (!set.delete(value)) {
          const optName = `${styles.option}${key}${styles.whitespace}`;
          const optVal =
            option.type === 'string' || option.type === 'strings'
              ? `${styles.string}'${value}'${styles.whitespace}`
              : `${styles.number}${value}${styles.whitespace}`;
          throw Error(`Option ${optName} has duplicate enum ${optVal}.`);
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
 * @param styles The error message styles
 */
function validateValue(
  key: string,
  option: ParamOption,
  value: ParamOption['default'],
  styles: ConcreteStyles,
) {
  if (value === undefined) {
    return;
  }
  function assert(condition: unknown, type: string): asserts condition {
    if (!condition) {
      const optName = `${styles.option}${key}${styles.whitespace}`;
      const valType = `${styles.string}'${type}'${styles.whitespace}`;
      throw Error(
        `Option ${optName} has incompatible value <${value}>. Should be of type ${valType}.`,
      );
    }
  }
  switch (option.type) {
    case 'boolean':
      assert(typeof value == 'boolean', 'boolean');
      break;
    case 'string':
      assert(typeof value === 'string', 'string');
      normalizeString(option, key, value, styles);
      break;
    case 'number':
      assert(typeof value === 'number', 'number');
      normalizeNumber(option, key, value, styles);
      break;
    case 'strings': {
      assert(typeof value === 'object', 'string[]');
      value = value.map((val) => {
        assert(typeof val === 'string', 'string[]');
        return normalizeString(option, key, val, styles);
      });
      normalizeArray(option, key, value, styles);
      break;
    }
    case 'numbers': {
      assert(typeof value === 'object', 'number[]');
      value = value.map((val) => {
        assert(typeof val === 'number', 'number[]');
        return normalizeNumber(option, key, val, styles);
      });
      normalizeArray(option, key, value, styles);
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
 * @param styles The error message styles
 */
function normalizeString(
  option: StringOption | StringsOption,
  name: string,
  value: string,
  styles: ConcreteStyles,
): string {
  if (option.trim) {
    value = value.trim();
  }
  if (option.case) {
    value = option.case === 'lower' ? value.toLowerCase() : value.toLocaleUpperCase();
  }
  if ('enums' in option && option.enums && !option.enums.includes(value)) {
    const optName = `${styles.option}${name}${styles.whitespace}`;
    const optVal = `${styles.string}'${value}'${styles?.whitespace}`;
    const optEnums = option.enums
      .map((val) => `${styles.string}'${val}'${styles.whitespace}`)
      .join(', ');
    throw Error(`Invalid parameter to ${optName}: ${optVal}. Possible values are [${optEnums}].`);
  }
  if ('regex' in option && option.regex && !option.regex.test(value)) {
    const optName = `${styles.option}${name}${styles.whitespace}`;
    const optVal = `${styles.string}'${value}'${styles.whitespace}`;
    const optRegex = `${styles.regex}${String(option.regex)}${styles.whitespace}`;
    throw Error(
      `Invalid parameter to ${optName}: ${optVal}. Value must match the regex ${optRegex}.`,
    );
  }
  return value;
}

/**
 * Normalizes the value of a number option and checks its validity against any constraint.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 * @param styles The error message styles
 */
function normalizeNumber(
  option: NumberOption | NumbersOption,
  name: string,
  value: number,
  styles: ConcreteStyles,
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
    const optName = `${styles.option}${name}${styles.whitespace}`;
    const optVal = `${styles.number}${value}${styles.whitespace}`;
    const optEnums = option.enums
      .map((val) => `${styles.number}${val}${styles.whitespace}`)
      .join(', ');
    throw Error(`Invalid parameter to ${optName}: ${optVal}. Possible values are [${optEnums}].`);
  }
  if ('range' in option && option.range && (value < option.range[0] || value > option.range[1])) {
    const optName = `${styles.option}${name}${styles.whitespace}`;
    const optVal = `${styles.number}${value}${styles.whitespace}`;
    const optRange = option.range
      .map((val) => `${styles.number}${val}${styles.whitespace}`)
      .join(', ');
    throw Error(
      `Invalid parameter to ${optName}: ${optVal}. Value must be in the range [${optRange}].`,
    );
  }
  return value;
}

/**
 * Normalizes the value of an array option and checks its validity against any constraint.
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 * @param styles The error message styles
 */
function normalizeArray(
  option: StringsOption | NumbersOption,
  name: string,
  value: Array<string | number>,
  styles: ConcreteStyles,
) {
  if (option.unique) {
    const unique = [...new Set(value)];
    value.length = 0;
    value.push(...unique);
  }
  if (option.limit !== undefined && value.length > option.limit) {
    const optName = `${styles.option}${name}${styles.whitespace}`;
    const optCount = `${styles.number}${value.length}${styles.whitespace}`;
    const optLimit = `${styles.number}${option.limit}${styles.whitespace}`;
    throw Error(
      `Option ${optName} has too many values (${optCount}). Should have at most ${optLimit}.`,
    );
  }
}
